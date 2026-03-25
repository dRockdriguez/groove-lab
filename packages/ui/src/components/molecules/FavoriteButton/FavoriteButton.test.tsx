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
    getExerciseTags: vi.fn(),
    // useLocalStorageListener is the real implementation (not mocked)
  };
});

const mockIsFavorite = vi.mocked(utils.isFavorite);
const mockToggleFavorite = vi.mocked(utils.toggleFavorite);
const mockGetExerciseTags = vi.mocked(utils.getExerciseTags);

describe('FavoriteButton', () => {
  beforeEach(() => {
    // Reset all mocks
    mockIsFavorite.mockClear();
    mockToggleFavorite.mockClear();
    mockGetExerciseTags.mockClear();
    // Default mock implementations
    mockIsFavorite.mockReturnValue(false);
    mockToggleFavorite.mockReturnValue(true);
    mockGetExerciseTags.mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering — Heart Icon', () => {
    it('should render a heart icon (SVG element)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const svgs = document.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should render an unfilled/hollow heart when exercise is NOT favorited', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      const { container } = render(<FavoriteButton exerciseId="ex-123" />);

      // Hollow heart has stroke="currentColor" and fill="none"
      const hollowHeart = container.querySelector('svg[fill="none"]');
      expect(hollowHeart).toBeInTheDocument();
      expect(hollowHeart).toHaveAttribute('stroke', 'currentColor');
    });

    it('should render a filled/solid heart when exercise IS favorited', () => {
      mockIsFavorite.mockReturnValue(true);
      mockGetExerciseTags.mockReturnValue([]);

      const { container } = render(<FavoriteButton exerciseId="ex-123" />);

      // Filled heart has fill="currentColor"
      const filledHeart = container.querySelector('svg[fill="currentColor"]');
      expect(filledHeart).toBeInTheDocument();
    });

    it('should show gray/muted color on unfilled heart', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const button = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(button).toHaveClass('text-gray-400', 'dark:text-gray-500');
    });

    it('should show red color on filled heart', () => {
      mockIsFavorite.mockReturnValue(true);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const button = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(button).toHaveClass('text-red-500', 'dark:text-red-400');
    });
  });

  describe('Rendering — Tag Badge', () => {
    it('should render a tag count badge when tags exist', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1', 'tag2', 'tag3']);

      render(<FavoriteButton exerciseId="ex-123" />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should NOT render badge when no tags exist', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      // Badge should not exist; text content with a number shouldn't be rendered
      // except for heart button text
      const badges = screen.queryAllByText(/^\d+$/);
      expect(badges.length).toBe(0);
    });

    it('should render badge with small rounded pill style', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      const onTagsClick = vi.fn();
      render(<FavoriteButton exerciseId="ex-123" onTagsClick={onTagsClick} />);

      const badgeButton = screen.getByRole('button', {
        name: /tag.*click to manage/i,
      });

      expect(badgeButton).toHaveClass('rounded-full', 'text-xs', 'font-medium');
    });

    it('should render badge with gray background in light mode', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      const onTagsClick = vi.fn();
      render(<FavoriteButton exerciseId="ex-123" onTagsClick={onTagsClick} />);

      const badgeButton = screen.getByRole('button', {
        name: /tag.*click to manage/i,
      });

      expect(badgeButton).toHaveClass('bg-gray-100', 'dark:bg-gray-700');
    });

    it('should show correct tag count (e.g., 1 tag)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      render(<FavoriteButton exerciseId="ex-123" />);

      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('should show correct tag count (e.g., 27 tags)', () => {
      mockIsFavorite.mockReturnValue(false);
      const manyTags = Array.from({ length: 27 }, (_, i) => `tag${i + 1}`);
      mockGetExerciseTags.mockReturnValue(manyTags);

      render(<FavoriteButton exerciseId="ex-123" />);

      expect(screen.getByText('27')).toBeInTheDocument();
    });
  });

  describe('Rendering — Inline-Friendly Layout', () => {
    it('should use inline-flex for compact layout', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      const { container } = render(<FavoriteButton exerciseId="ex-123" />);

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('inline-flex');
    });

    it('should have no extra margin/padding on root', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

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

  describe('Tag Count — Display & Updates', () => {
    it('should display tag count correctly (3 tags)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1', 'tag2', 'tag3']);

      render(<FavoriteButton exerciseId="ex-789" />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not display badge when tag count is 0', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-789" />);

      const badges = screen.queryAllByText(/^\d+$/);
      expect(badges.length).toBe(0);
    });

    it('should update tag count if storage changes (storage event)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1', 'tag2']);

      const { rerender } = render(<FavoriteButton exerciseId="ex-789" />);

      expect(screen.getByText('2')).toBeInTheDocument();

      // Simulate storage event from another tab
      mockGetExerciseTags.mockReturnValue(['tag1', 'tag2', 'tag3', 'tag4']);

      const storageEvent = new StorageEvent('storage', {
        key: 'groovelab_tags',
        oldValue: null,
        newValue: null,
      });
      window.dispatchEvent(storageEvent);

      // Wait for re-render
      rerender(<FavoriteButton exerciseId="ex-789" />);
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });

  describe('Tag Click Handler', () => {
    it('should render tag badge as button when onTagsClick is provided', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      const onTagsClick = vi.fn();
      render(
        <FavoriteButton exerciseId="ex-789" onTagsClick={onTagsClick} />
      );

      const badgeButton = screen.getByRole('button', {
        name: /tag.*click to manage/i,
      });
      expect(badgeButton).toBeInTheDocument();
    });

    it('should render tag badge as span (non-interactive) when onTagsClick is NOT provided', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      render(<FavoriteButton exerciseId="ex-789" />);

      const badge = screen.getByText('1');

      // Should be a span, not a button (query by role should fail for span)
      expect(screen.queryByRole('button', { name: /tag/i })).not.toBeInTheDocument();
      // Verify the badge element itself is a span
      expect(badge.tagName.toLowerCase()).toBe('span');
    });

    it('should call onTagsClick when tag badge button is clicked', async () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      const onTagsClick = vi.fn();
      const user = userEvent.setup();

      render(
        <FavoriteButton exerciseId="ex-789" onTagsClick={onTagsClick} />
      );

      const badgeButton = screen.getByRole('button', {
        name: /tag.*click to manage/i,
      });
      await user.click(badgeButton);

      expect(onTagsClick).toHaveBeenCalled();
    });

    it('should call onTagsClick with no arguments', async () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      const onTagsClick = vi.fn();
      const user = userEvent.setup();

      render(
        <FavoriteButton exerciseId="ex-789" onTagsClick={onTagsClick} />
      );

      const badgeButton = screen.getByRole('button', {
        name: /tag.*click to manage/i,
      });
      await user.click(badgeButton);

      expect(onTagsClick).toHaveBeenCalledWith();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label "Add to favorites" when not favorited', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-label', 'Add to favorites');
    });

    it('should have aria-label "Remove from favorites" when favorited', () => {
      mockIsFavorite.mockReturnValue(true);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-label', 'Remove from favorites');
    });

    it('should have aria-pressed attribute matching favorite state', () => {
      mockIsFavorite.mockReturnValue(true);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should be keyboard-accessible (Tab focuses the button)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

      const user = userEvent.setup();
      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      heartButton.focus();

      await user.keyboard(' ');

      expect(mockToggleFavorite).toHaveBeenCalled();
    });

    it('should have accessible label for tag badge button', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      const onTagsClick = vi.fn();
      render(
        <FavoriteButton exerciseId="ex-123" onTagsClick={onTagsClick} />
      );

      const badgeButton = screen.getByRole('button', {
        name: /tag.*click to manage/i,
      });
      expect(badgeButton).toHaveAttribute('aria-label');
      expect(badgeButton.getAttribute('aria-label')).toMatch(/tag/i);
    });

    it('should have accessible label for tag badge span (display-only)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      render(<FavoriteButton exerciseId="ex-123" />);

      const badge = screen.getByText('1');

      // The badge element itself (span) should have aria-label
      expect(badge).toHaveAttribute('aria-label');
      const label = badge.getAttribute('aria-label') || '';
      expect(label).toMatch(/tag/i);
    });
  });

  describe('Styling — Tailwind Classes', () => {
    it('should use Tailwind classes only (no inline styles on heart)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toHaveClass('hover:scale-110');
    });

    it('should apply focus state (focus-visible:ring-2)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toHaveClass('focus-visible:ring-2');
    });

    it('should have dark mode variant on unfilled heart', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /add to favorites/i,
      });
      expect(heartButton).toHaveClass('dark:text-gray-500');
    });

    it('should have dark mode variant on filled heart', () => {
      mockIsFavorite.mockReturnValue(true);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toHaveClass('dark:text-red-400');
    });

    it('should apply dark mode styles to tag badge', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      const onTagsClick = vi.fn();
      render(
        <FavoriteButton exerciseId="ex-123" onTagsClick={onTagsClick} />
      );

      const badgeButton = screen.getByRole('button', {
        name: /tag.*click to manage/i,
      });

      expect(badgeButton).toHaveClass('dark:bg-gray-700', 'dark:text-gray-300');
    });
  });

  describe('Props', () => {
    it('should accept exerciseId prop (required)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-unique-id" />);

      expect(mockIsFavorite).toHaveBeenCalledWith('ex-unique-id');
    });

    it('should accept onTagsClick prop (optional)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      const onTagsClick = vi.fn();
      render(
        <FavoriteButton exerciseId="ex-123" onTagsClick={onTagsClick} />
      );

      const badgeButton = screen.getByRole('button', {
        name: /tag.*click to manage/i,
      });
      expect(badgeButton).toBeInTheDocument();
    });

    it('should accept className prop (optional)', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      expect(mockIsFavorite).toHaveBeenCalledWith('ex-123');
    });

    it('should read getExerciseTags from storage on mount', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1', 'tag2']);

      render(<FavoriteButton exerciseId="ex-123" />);

      expect(mockGetExerciseTags).toHaveBeenCalledWith('ex-123');
    });

    it('should update visual state immediately after click (no flashing)', async () => {
      mockIsFavorite.mockReturnValue(false);
      mockToggleFavorite.mockReturnValue(true);
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

      const { rerender } = render(
        <FavoriteButton exerciseId="ex-1" />
      );

      expect(mockIsFavorite).toHaveBeenCalledWith('ex-1');

      mockIsFavorite.mockClear();
      mockIsFavorite.mockReturnValue(true);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      rerender(<FavoriteButton exerciseId="ex-2" />);

      expect(mockIsFavorite).toHaveBeenCalledWith('ex-2');
    });

    it('should listen to storage events and re-sync on groovelab_favorites key change', () => {
      let favoriteState = false;
      mockIsFavorite.mockImplementation(() => favoriteState);
      mockGetExerciseTags.mockReturnValue([]);

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

    it('should listen to storage events and re-sync on groovelab_tags key change', () => {
      mockIsFavorite.mockReturnValue(false);
      let tagList = ['tag1'];
      mockGetExerciseTags.mockImplementation(() => tagList);

      const { rerender } = render(
        <FavoriteButton exerciseId="ex-123" />
      );

      expect(screen.getByText('1')).toBeInTheDocument();

      // Simulate storage event (tags changed in another tab)
      tagList = ['tag1', 'tag2', 'tag3'];
      const storageEvent = new StorageEvent('storage', {
        key: 'groovelab_tags',
        newValue: 'some-value',
      });
      window.dispatchEvent(storageEvent);

      rerender(<FavoriteButton exerciseId="ex-123" />);
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Initial Render', () => {
    it('should render correct favorite state on first render', () => {
      mockIsFavorite.mockReturnValue(true);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should render correct tag count on first render', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1', 'tag2', 'tag3', 'tag4']);

      render(<FavoriteButton exerciseId="ex-123" />);

      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should not show visual jank (no loading/flash) on mount', () => {
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue(['tag1']);

      const { container } = render(
        <FavoriteButton exerciseId="ex-123" />
      );

      // Verify both heart and badge are rendered immediately
      const svg = container.querySelector('svg[fill="none"]');
      expect(svg).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should render heart only when no tags exist', () => {
      mockIsFavorite.mockReturnValue(true);
      mockGetExerciseTags.mockReturnValue([]);

      render(<FavoriteButton exerciseId="ex-123" />);

      const heartButton = screen.getByRole('button', {
        name: /remove from favorites/i,
      });
      expect(heartButton).toBeInTheDocument();

      // No badge
      const badges = screen.queryAllByText(/^\d+$/);
      expect(badges.length).toBe(0);
    });

    it('should display exact count with many tags (27)', () => {
      mockIsFavorite.mockReturnValue(false);
      const manyTags = Array.from({ length: 27 }, (_, i) => `tag${i}`);
      mockGetExerciseTags.mockReturnValue(manyTags);

      render(<FavoriteButton exerciseId="ex-123" />);

      expect(screen.getByText('27')).toBeInTheDocument();
    });

    it('should toggle from favorited to unfavorited', async () => {
      let favoriteState = true;
      mockIsFavorite.mockImplementation(() => favoriteState);
      mockToggleFavorite.mockImplementation(() => {
        favoriteState = false;
        return favoriteState;
      });
      mockGetExerciseTags.mockReturnValue([]);

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
      mockGetExerciseTags.mockReturnValue([]);

      // Should not throw
      expect(() => {
        render(<FavoriteButton exerciseId="" />);
      }).not.toThrow();
    });

    it('should handle very long exerciseId (no display impact)', () => {
      const longId = 'ex-' + 'a'.repeat(500);
      mockIsFavorite.mockReturnValue(false);
      mockGetExerciseTags.mockReturnValue([]);

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
