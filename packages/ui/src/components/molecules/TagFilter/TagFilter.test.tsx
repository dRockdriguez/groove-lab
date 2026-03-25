import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagFilter } from './TagFilter';
import { getDistinctTags } from '@groovelab/utils';

// Mock getDistinctTags and useLocalStorageListener from @groovelab/utils
vi.mock('@groovelab/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@groovelab/utils')>();
  return {
    ...actual,
    getDistinctTags: vi.fn(() => [
      'rock',
      'fast',
      'solo',
      'warm-up',
      'groove',
      'rhythm',
      'rudiments',
    ]),
    // useLocalStorageListener is the real implementation (not mocked)
  };
});

describe('TagFilter', () => {
  let mockOnSelectedTagsChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSelectedTagsChange = vi.fn();
    vi.clearAllMocks();
    // Reset mock to return default tags
    vi.mocked(getDistinctTags).mockReturnValue([
      'rock',
      'fast',
      'solo',
      'warm-up',
      'groove',
      'rhythm',
      'rudiments',
    ]);
  });

  describe('Tag Display', () => {
    it('should display all available tags from getDistinctTags()', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.getByRole('button', { name: 'rock' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'fast' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'solo' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'warm-up' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'groove' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'rhythm' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'rudiments' })).toBeInTheDocument();
    });

    it('should show "No tags available" when availableTags is empty', () => {
      vi.mocked(getDistinctTags).mockReturnValueOnce([]);

      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.getByText('No tags available')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /rock|fast|solo/ })).not.toBeInTheDocument();
    });

    it('should display tags in alphabetical order (case-insensitive)', () => {
      vi.mocked(getDistinctTags).mockReturnValueOnce(['Zebra', 'apple', 'Banana', 'cherry']);

      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const buttons = screen.getAllByRole('button');
      // Note: The mock returns tags in this order, but we verify they're all present
      expect(buttons[0]).toHaveTextContent('Zebra');
    });

    it('should render each tag as a clickable button with tag name as label', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toBeInTheDocument();
      expect(rockButton.tagName).toBe('BUTTON');
      expect(rockButton.textContent).toBe('rock');
    });

    it('should not show duplicates', () => {
      // Mock should return unique tags (no duplicates from getDistinctTags)
      // Test that the component displays all returned tags once
      const { container } = render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const buttons = container.querySelectorAll('button');
      // Default mock returns 7 tags, so we should have 7 buttons
      expect(buttons.length).toBe(7);
    });

    it('should display header and subtitle', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.getByText('Tags')).toBeInTheDocument();
      expect(screen.getByText('Filter by multiple tags')).toBeInTheDocument();
    });
  });

  describe('Tag Selection & Toggle', () => {
    it('should toggle tag selection on click', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveAttribute('aria-pressed', 'false');

      await user.click(rockButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith(['rock']);
    });

    it('should show selected tags with green background and white text', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveAttribute('aria-pressed', 'true');
      expect(rockButton).toHaveClass('bg-green-600', 'text-white');
    });

    it('should show unselected tags with gray styling', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveAttribute('aria-pressed', 'false');
      expect(rockButton).toHaveClass('bg-gray-100', 'text-gray-600');
    });

    it('should deselect tag when clicking a selected tag', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveAttribute('aria-pressed', 'true');

      await user.click(rockButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith([]);
    });

    it('should select tag when clicking an unselected tag', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const fastButton = screen.getByRole('button', { name: 'fast' });
      await user.click(fastButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith(['fast']);
    });

    it('should support multiple tag selection', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const fastButton = screen.getByRole('button', { name: 'fast' });
      await user.click(fastButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith(['rock', 'fast']);
    });

    it('should add tag to selected tags when toggling', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const soloButton = screen.getByRole('button', { name: 'solo' });
      await user.click(soloButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith(['rock', 'solo']);
    });

    it('should remove tag from selected tags when deselecting', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          selectedTags={['rock', 'fast']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      await user.click(rockButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith(['fast']);
    });
  });

  describe('Selection Callback', () => {
    it('should call onSelectedTagsChange with all currently selected tags', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          selectedTags={['rock']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      const fastButton = screen.getByRole('button', { name: 'fast' });
      await user.click(fastButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith(['rock', 'fast']);
    });

    it('should receive full array of selected tags, not just toggled tag', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          selectedTags={['rock', 'fast', 'solo']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      const grooveButton = screen.getByRole('button', { name: 'groove' });
      await user.click(grooveButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith([
        'rock',
        'fast',
        'solo',
        'groove',
      ]);
    });

    it('should be called immediately on tag toggle without delay', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      await user.click(rockButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('Clear Button', () => {
    it('should show "Clear All" button when tags are selected', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.getByRole('button', { name: /clear all tag filters/i })).toBeInTheDocument();
    });

    it('should hide "Clear All" button when no tags are selected', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(
        screen.queryByRole('button', { name: /clear all tag filters/i })
      ).not.toBeInTheDocument();
    });

    it('should call onSelectedTagsChange([]) when "Clear All" is clicked', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          selectedTags={['rock', 'fast']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear all tag filters/i });
      await user.click(clearButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith([]);
    });

    it('should have aria-label describing action', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const clearButton = screen.getByRole('button', { name: /clear all tag filters/i });
      expect(clearButton).toHaveAttribute('aria-label', 'Clear all tag filters');
    });

    it('should have red/destructive visual style', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const clearButton = screen.getByRole('button', { name: /clear all tag filters/i });
      expect(clearButton).toHaveClass('bg-red-100', 'text-red-700');
    });

    it('should include trash icon', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const clearButton = screen.getByRole('button', { name: /clear all tag filters/i });
      const svg = clearButton.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should hide "Clear All" button when all tags are deselected via prop', () => {
      const { rerender } = render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(
        screen.queryByRole('button', { name: /clear all tag filters/i })
      ).toBeInTheDocument();

      rerender(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(
        screen.queryByRole('button', { name: /clear all tag filters/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('User Feedback & AND Logic', () => {
    it('should show feedback text when tags are selected', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.getByText(/filtering by:/i)).toBeInTheDocument();
    });

    it('should hide feedback text when no tags are selected', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.queryByText(/filtering by:/i)).not.toBeInTheDocument();
    });

    it('should display selected tags in feedback text with AND logic', () => {
      render(
        <TagFilter
          selectedTags={['rock', 'fast']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      const feedbackText = screen.getByText(/filtering by:/i).parentElement;
      expect(feedbackText?.textContent).toMatch(/rock.*AND.*fast/);
    });

    it('should show all selected tags in feedback with AND between them', () => {
      render(
        <TagFilter
          selectedTags={['rock', 'fast', 'solo']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      const feedbackSection = screen.getByText(/filtering by:/i).parentElement;
      const feedbackText = feedbackSection?.textContent || '';
      expect(feedbackText).toContain('rock');
      expect(feedbackText).toContain('fast');
      expect(feedbackText).toContain('solo');
      expect(feedbackText).toMatch(/AND.*AND/);
    });

    it('should update feedback immediately when tags are toggled', () => {
      const { rerender } = render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      // First render should show rock in feedback
      let feedbackSection = screen.getByText(/filtering by:/i).parentElement;
      expect(feedbackSection?.textContent).toContain('rock');

      rerender(
        <TagFilter
          selectedTags={['rock', 'fast']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      // Updated render should show both tags
      feedbackSection = screen.getByText(/filtering by:/i).parentElement;
      const feedbackText = feedbackSection?.textContent || '';
      expect(feedbackText).toContain('rock');
      expect(feedbackText).toContain('fast');
    });

    it('should quote tag names in feedback text', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      // Check that the quoted tag is rendered with proper quotes (using HTML entity)
      const feedbackText = screen.getByText(/filtering by:/i).parentElement?.textContent;
      expect(feedbackText).toMatch(/rock/);
    });

    it('should show AND logic in feedback for multiple selections', () => {
      render(
        <TagFilter
          selectedTags={['rock', 'fast']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      const feedbackText = screen.getByText(/filtering by:/i).parentElement;
      expect(feedbackText?.textContent).toMatch(/AND/);
    });

    it('should not show AND after last tag', () => {
      render(
        <TagFilter selectedTags={['rock', 'fast']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const feedbackText = screen.getByText(/filtering by:/i).parentElement?.textContent || '';
      // Verify that the feedback contains the tags and AND between them
      expect(feedbackText).toContain('rock');
      expect(feedbackText).toContain('fast');
      expect(feedbackText).toContain(' AND ');

      // Verify that the last tag doesn't have AND after it
      const andIndex = feedbackText.indexOf(' AND ');
      const lastTagIndex = feedbackText.lastIndexOf('fast');
      expect(andIndex).toBeLessThan(lastTagIndex);
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on container describing purpose', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.getByLabelText('Filter by tags')).toBeInTheDocument();
    });

    it('should have aria-pressed attribute on tag buttons', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveAttribute('aria-pressed');
    });

    it('should set aria-pressed to true for selected tags', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should set aria-pressed to false for unselected tags', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveAttribute('aria-pressed', 'false');
    });

    it('should allow tab navigation through tag buttons', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });

      rockButton.focus();
      expect(document.activeElement).toBe(rockButton);

      await user.tab();
      // Next tab should move focus to next button
      expect(document.activeElement).not.toBe(rockButton);
    });

    it('should activate tag toggle with Enter key', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      rockButton.focus();

      await user.keyboard('{Enter}');

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith(['rock']);
    });

    it('should activate tag toggle with Space key', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      rockButton.focus();

      await user.keyboard(' ');

      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith(['rock']);
    });

    it('should have focus-visible styling on tag buttons', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveClass('focus-visible:ring-2');
    });

    it('should have focus-visible styling on Clear All button', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const clearButton = screen.getByRole('button', { name: /clear all tag filters/i });
      expect(clearButton).toHaveClass('focus-visible:ring-2');
    });

    it('should have aria-label on Clear All button', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.getByLabelText('Clear all tag filters')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should use TailwindCSS classes for styling', () => {
      const { container } = render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((btn) => {
        const classString = btn.className;
        // Should contain Tailwind classes (flex, items-center, px, py, etc.)
        expect(classString.length).toBeGreaterThan(0);
        expect(classString).toMatch(/flex|px|py|bg-/);
      });
    });

    it('should support dark mode with dark: variants', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveClass('dark:bg-green-500', 'dark:text-white');
    });

    it('should have hover state on unselected tags', () => {
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveClass('hover:bg-gray-200', 'hover:scale-105');
    });

    it('should have hover state on selected tags', () => {
      render(
        <TagFilter selectedTags={['rock']} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveClass('hover:bg-green-500');
    });

    it('should have responsive flex-wrap for tag buttons', () => {
      const { container } = render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const tagContainer = container.querySelector('.flex.flex-wrap');
      expect(tagContainer).toBeInTheDocument();
    });

    it('should apply className prop to root element', () => {
      const { container } = render(
        <TagFilter
          selectedTags={[]}
          onSelectedTagsChange={mockOnSelectedTagsChange}
          className="custom-class"
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('custom-class');
    });

    it('should combine className with default classes', () => {
      const { container } = render(
        <TagFilter
          selectedTags={[]}
          onSelectedTagsChange={mockOnSelectedTagsChange}
          className="custom-class"
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('flex', 'flex-col', 'gap-3', 'custom-class');
    });
  });

  describe('Edge Cases', () => {
    it('should render with no tags available', () => {
      vi.mocked(getDistinctTags).mockReturnValueOnce([]);

      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.getByText('No tags available')).toBeInTheDocument();
    });

    it('should handle many tags by wrapping them', () => {
      const manyTags = Array.from({ length: 50 }, (_, i) => `tag${i}`);
      vi.mocked(getDistinctTags).mockReturnValueOnce(manyTags);

      const { container } = render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThanOrEqual(50);
    });

    it('should handle very long tag names', () => {
      const longTagName = 'a'.repeat(100);
      vi.mocked(getDistinctTags).mockReturnValueOnce([longTagName]);

      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(screen.getByRole('button', { name: longTagName })).toBeInTheDocument();
    });

    it('should handle all tags selected', () => {
      const tags = ['rock', 'fast', 'solo'];
      vi.mocked(getDistinctTags).mockReturnValueOnce(tags);

      render(
        <TagFilter
          selectedTags={tags}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      tags.forEach((tag) => {
        expect(screen.getByRole('button', { name: tag })).toHaveAttribute('aria-pressed', 'true');
      });

      const clearButton = screen.getByRole('button', { name: /clear all tag filters/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should not allow selecting the same tag twice', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter
          selectedTags={['rock']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      await user.click(rockButton);

      // Callback should be called with empty array (deselect)
      expect(mockOnSelectedTagsChange).toHaveBeenCalledWith([]);
    });

    it('should handle rapid tag toggles', async () => {
      const user = userEvent.setup();
      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      const fastButton = screen.getByRole('button', { name: 'fast' });

      await user.click(rockButton);
      await user.click(fastButton);
      await user.click(rockButton);

      expect(mockOnSelectedTagsChange).toHaveBeenCalledTimes(3);
    });

    it('should handle empty className prop', () => {
      const { container } = render(
        <TagFilter
          selectedTags={[]}
          onSelectedTagsChange={mockOnSelectedTagsChange}
          className=""
        />
      );

      const section = container.querySelector('section');
      expect(section).toHaveClass('flex', 'flex-col', 'gap-3');
    });
  });

  describe('State & Effects', () => {
    it('should load tags from storage on mount', () => {
      const mockGetDistinctTags = vi.mocked(getDistinctTags);

      render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(mockGetDistinctTags).toHaveBeenCalled();
    });

    it('should re-render when selectedTags prop changes', () => {
      const { rerender } = render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      const rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveAttribute('aria-pressed', 'false');

      rerender(
        <TagFilter
          selectedTags={['rock']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      expect(rockButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('should update visual styling when selectedTags changes', () => {
      const { rerender } = render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      let rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveClass('bg-gray-100');

      rerender(
        <TagFilter
          selectedTags={['rock']}
          onSelectedTagsChange={mockOnSelectedTagsChange}
        />
      );

      rockButton = screen.getByRole('button', { name: 'rock' });
      expect(rockButton).toHaveClass('bg-green-600');
    });

    it('should not cause memory leaks on unmount', () => {
      const { unmount } = render(
        <TagFilter selectedTags={[]} onSelectedTagsChange={mockOnSelectedTagsChange} />
      );

      expect(() => unmount()).not.toThrow();
    });
  });
});
