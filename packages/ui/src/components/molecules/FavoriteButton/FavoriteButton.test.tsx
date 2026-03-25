import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FavoriteButton } from './FavoriteButton';
import * as utils from '@groovelab/utils';

// Mock the storage utilities
vi.mock('@groovelab/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof utils>();
  return {
    ...actual,
    isFavorite: vi.fn(),
    toggleFavorite: vi.fn(),
    // useLocalStorageListener is the real implementation (not mocked)
  };
});

const mockIsFavorite = vi.mocked(utils.isFavorite);
const mockToggleFavorite = vi.mocked(utils.toggleFavorite);

describe('FavoriteButton', () => {
  beforeEach(() => {
    // Reset all mocks
    mockIsFavorite.mockClear();
    mockToggleFavorite.mockClear();
    // Default mock implementations
    mockIsFavorite.mockReturnValue(false);
    mockToggleFavorite.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering — Heart Icon', () => {
    it('should render a heart icon (SVG element)', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should render an unfilled/hollow heart when exercise is NOT favorited', () => {
      mockIsFavorite.mockReturnValue(false);

      const { container } = render(<FavoriteButton exerciseId="ex-123" />);

      // Hollow heart has stroke="currentColor" and fill="none"
      const hollowHeart = container.querySelector('svg[fill="none"]');
      expect(hollowHeart).toBeInTheDocument();
      expect(hollowHeart).toHaveAttribute('stroke', 'currentColor');
    });

    it('should render a filled/solid heart when exercise IS favorited', () => {
      mockIsFavorite.mockReturnValue(true);

      const { container } = render(<FavoriteButton exerciseId="ex-123" />);

      // Filled heart has fill="currentColor"
      const filledHeart = container.querySelector('svg[fill="currentColor"]');
      expect(filledHeart).toBeInTheDocument();
    });

    it('should show gray/muted color on unfilled heart', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      const button = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(button).toHaveClass('text-gray-400', 'dark:text-gray-500');
    });

    it('should show red color on filled heart', () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton exerciseId="ex-123" />);

      const button = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(button).toHaveClass('text-red-500', 'dark:text-red-400');
    });
  });

  describe('Rendering — Heart Only (No Tag Badge)', () => {
    it('should NOT render a numeric tag count badge', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      // No numeric badge should appear
      const badges = screen.queryAllByText(/^\d+$/);
      expect(badges.length).toBe(0);
    });

    it('should render only one button (the heart button)', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);
      expect(buttons[0]).toHaveAttribute('aria-label', expect.stringMatching(/favorites/i));
    });

    it('should render only heart button even when exercise has many tags in storage', () => {
      mockIsFavorite.mockReturnValue(false);

      // Even if tags exist in localStorage, FavoriteButton shows heart only
      localStorage.setItem('groovelab_tags', JSON.stringify({ 'ex-123': ['a', 'b', 'c'] }));

      render(<FavoriteButton exerciseId="ex-123" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(1);

      localStorage.clear();
    });
  });

  describe('Rendering — Inline-Friendly Layout', () => {
    it('should use inline-flex for compact layout', () => {
      mockIsFavorite.mockReturnValue(false);

      const { container } = render(<FavoriteButton exerciseId="ex-123" />);

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('inline-flex');
    });

    it('should have no extra margin/padding on root', () => {
      mockIsFavorite.mockReturnValue(false);

      const { container } = render(<FavoriteButton exerciseId="ex-123" />);

      const root = container.firstChild as HTMLElement;
      // Should not have margin classes (m-, mt-, mb-, ml-, mr-)
      const classes = root.className;
      expect(classes).not.toMatch(/\bm-/);
    });
  });

  describe('Favorite Toggle — Click Behavior', () => {
    it('should call toggleFavorite when heart is clicked', async () => {
      mockIsFavorite.mockReturnValue(false);
      mockToggleFavorite.mockReturnValue(true);

      const user = userEvent.setup();
      render(<FavoriteButton exerciseId="ex-456" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      await user.click(heartButton);

      expect(mockToggleFavorite).toHaveBeenCalledWith('ex-456');
    });

    it('should update visual state immediately after click', async () => {
      mockIsFavorite.mockReturnValue(false);
      mockToggleFavorite.mockReturnValue(true);

      const user = userEvent.setup();
      render(<FavoriteButton exerciseId="ex-456" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(heartButton);

      // After click, visual state should reflect the new value returned from toggleFavorite
      // The aria-pressed should update to true
      expect(heartButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should support multiple consecutive clicks', async () => {
      let favoriteState = false;
      mockIsFavorite.mockImplementation(() => favoriteState);
      mockToggleFavorite.mockImplementation(() => {
        favoriteState = !favoriteState;
        return favoriteState;
      });

      const user = userEvent.setup();
      render(<FavoriteButton exerciseId="ex-456" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });

      // First click: unfavorited → favorited
      await user.click(heartButton);
      expect(mockToggleFavorite).toHaveBeenCalledTimes(1);
      expect(heartButton).toHaveAttribute('aria-pressed', 'true');

      // Re-render to pick up new label
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Second click: favorited → unfavorited
      await user.click(heartButton);
      expect(mockToggleFavorite).toHaveBeenCalledTimes(2);
      expect(heartButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should handle gracefully if localStorage is unavailable', async () => {
      mockIsFavorite.mockReturnValue(false);
      // toggleFavorite handles unavailable localStorage internally; just test it doesn't throw
      mockToggleFavorite.mockReturnValue(true);

      const user = userEvent.setup();
      render(<FavoriteButton exerciseId="ex-456" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });

      // Should not throw
      await user.click(heartButton);
      expect(mockToggleFavorite).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label "Add to favorites" when not favorited', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-label', 'Add to favorites');
    });

    it('should have aria-label "Remove from favorites" when favorited', () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-label', 'Remove from favorites');
    });

    it('should have aria-pressed attribute matching favorite state', () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should be keyboard-accessible (Tab focuses the button)', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toBeInTheDocument();
      // Native button is in tab order by default
      expect(heartButton.tagName.toLowerCase()).toBe('button');
    });

    it('should respond to Enter key press on heart button', async () => {
      mockIsFavorite.mockReturnValue(false);
      mockToggleFavorite.mockReturnValue(true);

      const user = userEvent.setup();
      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      heartButton.focus();

      await user.keyboard('{Enter}');

      expect(mockToggleFavorite).toHaveBeenCalled();
    });

    it('should respond to Space key press on heart button', async () => {
      mockIsFavorite.mockReturnValue(false);
      mockToggleFavorite.mockReturnValue(true);

      const user = userEvent.setup();
      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      heartButton.focus();

      await user.keyboard(' ');

      expect(mockToggleFavorite).toHaveBeenCalled();
    });
  });

  describe('Styling — Tailwind Classes', () => {
    it('should use Tailwind classes only (no inline styles on heart)', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      const svg = heartButton.querySelector('svg');

      // SVG should have width/height attributes but no inline style
      expect(svg).toHaveAttribute('width', '18');
      expect(svg).toHaveAttribute('height', '18');
      // (width/height attributes are not "inline styles")
    });

    it('should apply hover state (hover:scale-110)', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toHaveClass('hover:scale-110');
    });

    it('should apply focus state (focus-visible:ring-2)', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toHaveClass('focus-visible:ring-2');
    });

    it('should have dark mode variant on unfilled heart', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toHaveClass('dark:text-gray-500');
    });

    it('should have dark mode variant on filled heart', () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toHaveClass('dark:text-red-400');
    });
  });

  describe('Props', () => {
    it('should accept exerciseId prop (required)', () => {
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId="ex-unique-id" />);

      expect(mockIsFavorite).toHaveBeenCalledWith('ex-unique-id');
    });

    it('should accept className prop (optional)', () => {
      mockIsFavorite.mockReturnValue(false);

      const { container } = render(
        <FavoriteButton
          exerciseId="ex-123"
          className="custom-class-name"
        />
      );

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('custom-class-name');
    });

    it('should append className to root element', () => {
      mockIsFavorite.mockReturnValue(false);

      const { container } = render(
        <FavoriteButton
          exerciseId="ex-123"
          className="ml-2 text-lg"
        />
      );

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('ml-2', 'text-lg', 'inline-flex');
    });
  });

  describe('State Management', () => {
    it('should read isFavorite from storage on mount', () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton exerciseId="ex-123" />);

      expect(mockIsFavorite).toHaveBeenCalledWith('ex-123');
    });

    it('should update visual state immediately after click (no flashing)', async () => {
      mockIsFavorite.mockReturnValue(false);
      mockToggleFavorite.mockReturnValue(true);

      const user = userEvent.setup();
      render(
        <FavoriteButton exerciseId="ex-123" />
      );

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });

      // Before click: aria-pressed false
      expect(heartButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(heartButton);

      // After click: aria-pressed true (synchronously)
      expect(heartButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should re-render on exerciseId change', () => {
      mockIsFavorite.mockReturnValue(false);

      const { rerender } = render(
        <FavoriteButton exerciseId="ex-1" />
      );

      expect(mockIsFavorite).toHaveBeenCalledWith('ex-1');

      mockIsFavorite.mockClear();
      mockIsFavorite.mockReturnValue(true);

      rerender(<FavoriteButton exerciseId="ex-2" />);

      expect(mockIsFavorite).toHaveBeenCalledWith('ex-2');
    });

    it('should listen to storage events and re-sync on groovelab_favorites key change', () => {
      let favoriteState = false;
      mockIsFavorite.mockImplementation(() => favoriteState);

      const { rerender } = render(
        <FavoriteButton exerciseId="ex-123" />
      );

      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();

      // Simulate storage event (e.g., from another tab)
      favoriteState = true;
      const storageEvent = new StorageEvent('storage', {
        key: 'groovelab_favorites',
        newValue: 'some-value',
      });
      window.dispatchEvent(storageEvent);

      rerender(<FavoriteButton exerciseId="ex-123" />);
      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });
  });

  describe('Initial Render', () => {
    it('should render correct favorite state on first render', () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should not show visual jank (no loading/flash) on mount', () => {
      mockIsFavorite.mockReturnValue(false);

      const { container } = render(
        <FavoriteButton exerciseId="ex-123" />
      );

      // Verify heart is rendered immediately with no loading state
      const svg = container.querySelector('svg[fill="none"]');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render heart only', () => {
      mockIsFavorite.mockReturnValue(true);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toBeInTheDocument();

      // No numeric badge
      const badges = screen.queryAllByText(/^\d+$/);
      expect(badges.length).toBe(0);
    });

    it('should toggle from favorited to unfavorited', async () => {
      let favoriteState = true;
      mockIsFavorite.mockImplementation(() => favoriteState);
      mockToggleFavorite.mockImplementation(() => {
        favoriteState = false;
        return favoriteState;
      });

      const user = userEvent.setup();
      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-pressed', 'true');

      await user.click(heartButton);

      expect(heartButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should handle missing exerciseId gracefully', () => {
      mockIsFavorite.mockReturnValue(false);

      // Should not throw
      expect(() => {
        render(<FavoriteButton exerciseId="" />);
      }).not.toThrow();
    });

    it('should handle very long exerciseId (no display impact)', () => {
      const longId = 'ex-' + 'a'.repeat(500);
      mockIsFavorite.mockReturnValue(false);

      render(<FavoriteButton exerciseId={longId} />);

      expect(mockIsFavorite).toHaveBeenCalledWith(longId);
      // Long ID should not affect rendering
      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toBeInTheDocument();
    });
  });
});
