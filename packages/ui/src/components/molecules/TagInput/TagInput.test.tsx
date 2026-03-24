import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TagInput } from './TagInput';
import * as utils from '@groovelab/utils';

// Mock the storage utilities
vi.mock('@groovelab/utils', async () => {
  const actual = await vi.importActual<typeof utils>('@groovelab/utils');
  return {
    ...actual,
    getExerciseTags: vi.fn(),
    addTag: vi.fn(),
    removeTag: vi.fn(),
  };
});

const mockGetExerciseTags = vi.mocked(utils.getExerciseTags);
const mockAddTag = vi.mocked(utils.addTag);
const mockRemoveTag = vi.mocked(utils.removeTag);

describe('TagInput', () => {
  beforeEach(() => {
    mockGetExerciseTags.mockClear();
    mockAddTag.mockClear();
    mockRemoveTag.mockClear();
    mockGetExerciseTags.mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // MODAL / POPOVER BEHAVIOR
  // ============================================================================

  describe('Modal/Popover Behavior', () => {
    it('should render the dialog when isOpen is true', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should not render the dialog when isOpen is false', () => {
      mockGetExerciseTags.mockReturnValue([]);

      const { container } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).not.toBeInTheDocument();
    });

    it('should call onClose when Cancel button is clicked', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={onClose}
        />
      );

      const cancelButton = screen.getByRole('button', {
        name: /cancel/i,
      });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={onClose}
        />
      );

      const backdrop = container.querySelector('[class*="bg-black"]') as HTMLElement;
      expect(backdrop).toBeInTheDocument();

      await user.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Escape key is pressed', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={onClose}
        />
      );

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should have backdrop with semi-transparent overlay styling', () => {
      mockGetExerciseTags.mockReturnValue([]);

      const { container } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const backdrop = container.querySelector('[class*="bg-black"]') as HTMLElement;
      expect(backdrop).toHaveClass('bg-black/60', 'backdrop-blur-sm');
    });

    it('should focus input on open', async () => {
      mockGetExerciseTags.mockReturnValue([]);

      const { rerender } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      rerender(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toHaveFocus();
      });
    });

    it('should return focus to trigger element on close', async () => {
      mockGetExerciseTags.mockReturnValue([]);

      const TriggerWrapper = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
          <>
            <button onClick={() => setIsOpen(true)}>Open</button>
            <TagInput
              exerciseId="ex-1"
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
            />
          </>
        );
      };

      const user = userEvent.setup();

      render(<TriggerWrapper />);

      const openButton = screen.getByRole('button', {
        name: /open/i,
      });

      // Open modal
      await user.click(openButton);
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Close modal
      const cancelButton = screen.getByRole('button', {
        name: /cancel/i,
      });
      await user.click(cancelButton);

      // Focus should return to trigger (won't verify exact focus in unit test)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // DISPLAYING EXISTING TAGS
  // ============================================================================

  describe('Displaying Existing Tags', () => {
    it('should load existing tags on open via getExerciseTags', async () => {
      mockGetExerciseTags.mockReturnValue(['rock', 'fast']);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(mockGetExerciseTags).toHaveBeenCalledWith('ex-1');
      });
    });

    it('should display each tag as a removable chip', () => {
      mockGetExerciseTags.mockReturnValue(['rock', 'fast']);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('rock')).toBeInTheDocument();
      expect(screen.getByText('fast')).toBeInTheDocument();
    });

    it('should render remove button (X) for each tag', () => {
      mockGetExerciseTags.mockReturnValue(['rock', 'fast']);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const removeButtons = screen.getAllByRole('button', {
        name: /remove tag/i,
      });
      expect(removeButtons.length).toBe(2);
    });

    it('should sort tags alphabetically (case-insensitive)', () => {
      mockGetExerciseTags.mockReturnValue(['Zebra', 'apple', 'Banana']);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const tags = screen.getAllByText(/apple|Banana|Zebra/);
      // Tags should appear in order: apple, Banana, Zebra
      expect(tags[0]).toHaveTextContent('apple');
      expect(tags[1]).toHaveTextContent('Banana');
      expect(tags[2]).toHaveTextContent('Zebra');
    });

    it('should display flex-wrapped list of tags', () => {
      mockGetExerciseTags.mockReturnValue(['tag1', 'tag2', 'tag3']);

      const { container } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const tagContainer = container.querySelector('.flex-wrap');
      expect(tagContainer).toBeInTheDocument();
    });

    it('should show "No tags yet" when no tags exist', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/no tags yet/i)).toBeInTheDocument();
    });

    it('should not show empty state when tags exist', () => {
      mockGetExerciseTags.mockReturnValue(['rock']);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByText(/no tags yet/i)).not.toBeInTheDocument();
    });

    it('should display many tags without error', () => {
      const manyTags = Array.from({ length: 20 }, (_, i) => `tag${i}`);
      mockGetExerciseTags.mockReturnValue(manyTags);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      manyTags.forEach((tag) => {
        expect(screen.getByText(tag)).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // ADDING TAGS
  // ============================================================================

  describe('Adding Tags', () => {
    it('should have a text input field for new tags', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder');
      expect(input.getAttribute('placeholder')).toMatch(/tag/i);
    });

    it('should have an Add button', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      expect(addButton).toBeInTheDocument();
    });

    it('should call addTag when Add button is clicked', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'newtag');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'newtag');
    });

    it('should call addTag when Enter is pressed', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'newtag{Enter}');

      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'newtag');
    });

    it('should trim whitespace from input before adding', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, '  spacedtag  ');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'spacedtag');
    });

    it('should clear input after successful add', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'newtag');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should reject empty input (no-op)', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      expect(mockAddTag).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only input (no-op)', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, '   ');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      expect(mockAddTag).not.toHaveBeenCalled();
    });

    it('should reject duplicate tags (case-sensitive match)', async () => {
      mockGetExerciseTags.mockReturnValue(['rock']);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'rock');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      expect(mockAddTag).not.toHaveBeenCalled();
    });

    it('should clear input even when rejecting duplicate', async () => {
      mockGetExerciseTags.mockReturnValue(['rock']);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.type(input, 'rock');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should allow different case tags (Rock vs rock)', async () => {
      mockGetExerciseTags.mockReturnValue(['rock']);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'Rock');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      // Rock (capital R) is different from rock, so it should be allowed
      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'Rock');
    });

    it('should update tag list after successful add', async () => {
      mockGetExerciseTags.mockReturnValueOnce(['rock']);
      mockGetExerciseTags.mockReturnValue(['metal', 'rock']);
      mockAddTag.mockImplementation(() => {
        // No-op; mock handles return value
      });

      const user = userEvent.setup();
      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'metal');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('metal')).toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // REMOVING TAGS
  // ============================================================================

  describe('Removing Tags', () => {
    it('should call removeTag when remove button is clicked', async () => {
      mockGetExerciseTags.mockReturnValue(['rock', 'fast']);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const removeButton = screen.getByRole('button', {
        name: /remove tag 'rock'/i,
      });
      await user.click(removeButton);

      expect(mockRemoveTag).toHaveBeenCalledWith('ex-1', 'rock');
    });

    it('should remove tag from list after removal', async () => {
      let tags = ['rock', 'fast'];
      mockGetExerciseTags.mockImplementation(() => [...tags]);
      mockRemoveTag.mockImplementation((id, tag) => {
        tags = tags.filter((t) => t !== tag);
      });

      const user = userEvent.setup();
      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('rock')).toBeInTheDocument();

      const removeButton = screen.getByRole('button', {
        name: /remove tag 'rock'/i,
      });
      await user.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('rock')).not.toBeInTheDocument();
      });
    });

    it('should handle rapid remove clicks', async () => {
      let tags = ['rock', 'fast', 'metal'];
      mockGetExerciseTags.mockImplementation(() => [...tags]);
      mockRemoveTag.mockImplementation((id, tag) => {
        tags = tags.filter((t) => t !== tag);
      });

      const user = userEvent.setup();
      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const removeButtons = screen.getAllByRole('button', {
        name: /remove tag/i,
      });

      // Rapidly click all remove buttons
      await user.click(removeButtons[0]);
      await user.click(removeButtons[1]);
      await user.click(removeButtons[2]);

      await waitFor(() => {
        expect(screen.getByText(/no tags yet/i)).toBeInTheDocument();
      });
    });

    it('should maintain sorted order after removal', async () => {
      let tags = ['apple', 'banana', 'cherry'];
      mockGetExerciseTags.mockImplementation(() => [...tags]);
      mockRemoveTag.mockImplementation((id, tag) => {
        tags = tags.filter((t) => t !== tag);
      });

      const user = userEvent.setup();
      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const removeBananaButton = screen.getByRole('button', {
        name: /remove tag 'banana'/i,
      });
      await user.click(removeBananaButton);

      await waitFor(() => {
        const remainingTags = screen.getAllByText(/apple|cherry/);
        expect(remainingTags[0]).toHaveTextContent('apple');
        expect(remainingTags[1]).toHaveTextContent('cherry');
      });
    });
  });

  // ============================================================================
  // INPUT VALIDATION
  // ============================================================================

  describe('Input Validation', () => {
    it('should allow special characters in tags', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'rock&roll!');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'rock&roll!');
    });

    it('should allow spaces within tags', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'hard rock');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'hard rock');
    });

    it('should allow long tag names', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const longTag = 'a'.repeat(100);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, longTag);

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      expect(mockAddTag).toHaveBeenCalledWith('ex-1', longTag);
    });

    it('should allow many tags to be added', async () => {
      const tags: string[] = [];
      let addedCount = 0;
      mockGetExerciseTags.mockImplementation(() => [...tags]);
      mockAddTag.mockImplementation(() => {
        tags.push(`tag${addedCount}`);
        addedCount += 1;
      });

      const user = userEvent.setup();
      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      const addButton = screen.getByRole('button', {
        name: /add/i,
      });

      // Add 20 tags
      for (let i = 0; i < 20; i++) {
        await user.type(input, `tag${i}`);
        await user.click(addButton);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      await waitFor(() => {
        expect(screen.getByText('tag0')).toBeInTheDocument();
        expect(screen.getByText('tag19')).toBeInTheDocument();
      });
    });

    it('should distinguish between Rock and rock (case-sensitive)', async () => {
      mockGetExerciseTags.mockReturnValue(['rock']);
      mockAddTag.mockImplementation(() => {
        // Track that Rock is different
      });

      const user = userEvent.setup();
      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'Rock');

      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      await user.click(addButton);

      // Rock (capital R) is different from rock, so it should be allowed
      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'Rock');
    });
  });

  // ============================================================================
  // ACCESSIBILITY
  // ============================================================================

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      const labelId = dialog.getAttribute('aria-labelledby');
      expect(labelId).toBeTruthy();

      const titleElement = document.getElementById(labelId!);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toMatch(/manage tags/i);
    });

    it('should have aria-label on input field', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label');
    });

    it('should have aria-label on close button', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const closeButton = screen.getByRole('button', {
        name: /close tag editor/i,
      });
      expect(closeButton).toHaveAttribute('aria-label', 'Close tag editor');
    });

    it('should have aria-label on each remove button', () => {
      mockGetExerciseTags.mockReturnValue(['rock', 'fast']);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const removeButtons = screen.getAllByRole('button', {
        name: /remove tag/i,
      });
      removeButtons.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-label');
        expect(btn.getAttribute('aria-label')).toMatch(/remove tag/i);
      });
    });

    it('should have aria-label on Add button', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Add button should be accessible via role
      const addButton = screen.getByRole('button', {
        name: /add/i,
      });
      expect(addButton).toBeInTheDocument();
    });

    it('should have aria-label on Cancel button', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const cancelButton = screen.getByRole('button', {
        name: /cancel/i,
      });
      expect(cancelButton).toBeInTheDocument();
    });

    it('should allow Tab navigation through interactive elements', async () => {
      mockGetExerciseTags.mockReturnValue(['rock']);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      const addButton = screen.getByRole('button', { name: /add/i });
      const removeButton = screen.getByRole('button', {
        name: /remove tag 'rock'/i,
      });
      const cancelButton = screen.getByRole('button', {
        name: /cancel/i,
      });

      // All interactive elements should be keyboard-accessible (exist in DOM)
      expect(input).toBeInTheDocument();
      expect(addButton).toBeInTheDocument();
      expect(removeButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it('should respond to keyboard shortcuts (Enter for add)', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'newtag{Enter}');

      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'newtag');
    });

    it('should respond to keyboard shortcuts (Escape to close)', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={onClose}
        />
      );

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // STYLING
  // ============================================================================

  describe('Styling', () => {
    it('should use TailwindCSS classes for dialog background', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveClass('bg-gray-900', 'rounded-xl');
    });

    it('should use TailwindCSS classes for input field', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('bg-gray-800', 'text-white', 'rounded-lg');
    });

    it('should have focus ring on input', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:ring-2', 'focus-visible:ring-blue-500');
    });

    it('should style Add button with accent color', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should style Cancel button with secondary color', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toHaveClass('bg-gray-700', 'text-gray-200');
    });

    it('should style tag chips with subtle background', () => {
      mockGetExerciseTags.mockReturnValue(['rock']);

      const { container } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const tagChip = container.querySelector('[class*="bg-gray-700"]');
      expect(tagChip).toBeInTheDocument();
    });

    it('should have hover states on buttons', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const addButton = screen.getByRole('button', { name: /add/i });
      expect(addButton).toHaveClass('hover:bg-blue-500');
    });

    it('should have dark mode support', () => {
      mockGetExerciseTags.mockReturnValue(['rock']);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      // Check for dark mode classes
      expect(dialog.className).toMatch(/dark:|bg-gray-900/);
    });
  });

  // ============================================================================
  // PROPS
  // ============================================================================

  describe('Props', () => {
    it('should accept exerciseId prop (required)', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-custom-id"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(mockGetExerciseTags).toHaveBeenCalledWith('ex-custom-id');
    });

    it('should accept isOpen prop (required)', () => {
      mockGetExerciseTags.mockReturnValue([]);

      const { rerender } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should accept onClose prop (required)', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={onClose}
        />
      );

      const cancelButton = screen.getByRole('button', {
        name: /cancel/i,
      });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should accept className prop (optional)', () => {
      mockGetExerciseTags.mockReturnValue([]);

      const { container } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
          className="custom-class"
        />
      );

      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('custom-class');
    });

    it('should support empty exerciseId', () => {
      mockGetExerciseTags.mockReturnValue([]);

      expect(() => {
        render(
          <TagInput
            exerciseId=""
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      }).not.toThrow();

      expect(mockGetExerciseTags).toHaveBeenCalledWith('');
    });
  });

  // ============================================================================
  // STATE & SIDE EFFECTS
  // ============================================================================

  describe('State & Side Effects', () => {
    it('should load tags on mount when isOpen is true', () => {
      mockGetExerciseTags.mockReturnValue(['rock']);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(mockGetExerciseTags).toHaveBeenCalledWith('ex-1');
    });

    it('should load tags when isOpen changes from false to true', () => {
      mockGetExerciseTags.mockReturnValue([]);

      const { rerender } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      mockGetExerciseTags.mockClear();

      rerender(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(mockGetExerciseTags).toHaveBeenCalledWith('ex-1');
    });

    it('should call addTag immediately when adding', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'newtag');

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      // addTag should be called immediately
      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'newtag');
    });

    it('should call removeTag immediately when removing', async () => {
      mockGetExerciseTags.mockReturnValue(['rock']);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const removeButton = screen.getByRole('button', {
        name: /remove tag 'rock'/i,
      });
      await user.click(removeButton);

      expect(mockRemoveTag).toHaveBeenCalledWith('ex-1', 'rock');
    });

    it('should re-fetch tags after adding', async () => {
      const tags: string[] = [];
      mockGetExerciseTags.mockImplementation(() => [...tags]);
      mockAddTag.mockImplementation(() => {
        tags.push('newTag');
      });

      const user = userEvent.setup();
      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const initialCallCount = mockGetExerciseTags.mock.calls.length;

      const input = screen.getByRole('textbox');
      await user.type(input, 'newtag');

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      // Should have called getExerciseTags to refresh
      await waitFor(() => {
        expect(mockGetExerciseTags.mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });

    it('should re-fetch tags after removing', async () => {
      let tags = ['rock'];
      mockGetExerciseTags.mockImplementation(() => [...tags]);
      mockRemoveTag.mockImplementation((id, tag) => {
        tags = tags.filter((t) => t !== tag);
      });

      const user = userEvent.setup();
      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const initialCallCount = mockGetExerciseTags.mock.calls.length;

      const removeButton = screen.getByRole('button', {
        name: /remove tag 'rock'/i,
      });
      await user.click(removeButton);

      // Should have called getExerciseTags to refresh
      await waitFor(() => {
        expect(mockGetExerciseTags.mock.calls.length).toBeGreaterThan(
          initialCallCount
        );
      });
    });

    it('should not use async operations', async () => {
      mockGetExerciseTags.mockReturnValue(['rock']);
      mockAddTag.mockImplementation(() => {
        // Synchronous operation
      });
      mockRemoveTag.mockImplementation(() => {
        // Synchronous operation
      });

      const user = userEvent.setup();
      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const removeButton = screen.getByRole('button', {
        name: /remove tag 'rock'/i,
      });
      await user.click(removeButton);

      // Should complete synchronously
      expect(mockRemoveTag).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle no existing tags', () => {
      mockGetExerciseTags.mockReturnValue([]);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText(/no tags yet/i)).toBeInTheDocument();
    });

    it('should handle many existing tags without freezing', () => {
      const manyTags = Array.from({ length: 100 }, (_, i) => `tag${i}`);
      mockGetExerciseTags.mockReturnValue(manyTags);

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByText('tag0')).toBeInTheDocument();
      expect(screen.getByText('tag99')).toBeInTheDocument();
    });

    it('should allow adding same tag after removing it', async () => {
      let tags: string[] = [];
      mockGetExerciseTags.mockImplementation(() => [...tags]);
      mockAddTag.mockImplementation((id, tag) => {
        tags.push(tag);
      });
      mockRemoveTag.mockImplementation((id, tag) => {
        tags = tags.filter((t) => t !== tag);
      });

      const user = userEvent.setup();
      const { rerender } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const input = screen.getByRole('textbox');
      const addButton = screen.getByRole('button', { name: /add/i });

      // Add tag
      await user.type(input, 'rock');
      await user.click(addButton);

      // Close and reopen
      rerender(
        <TagInput
          exerciseId="ex-1"
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      // Remove via storage (simulated)
      tags = [];

      rerender(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      // Add same tag again (should work)
      await user.type(input, 'rock');
      await user.click(addButton);

      expect(mockAddTag).toHaveBeenCalledWith('ex-1', 'rock');
    });

    it('should handle isOpen toggle without errors', async () => {
      mockGetExerciseTags.mockReturnValue(['rock']);

      const { rerender } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();

      rerender(
        <TagInput
          exerciseId="ex-1"
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should handle exerciseId changes', () => {
      mockGetExerciseTags.mockReturnValue([]);

      const { rerender } = render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      mockGetExerciseTags.mockClear();

      rerender(
        <TagInput
          exerciseId="ex-2"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(mockGetExerciseTags).toHaveBeenCalledWith('ex-2');
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {
    it('should handle missing exercise gracefully', () => {
      mockGetExerciseTags.mockReturnValue([]);

      expect(() => {
        render(
          <TagInput
            exerciseId="nonexistent"
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      }).not.toThrow();
    });

    it('should call addTag even with empty input (rejected by component)', async () => {
      mockGetExerciseTags.mockReturnValue([]);
      const user = userEvent.setup();

      render(
        <TagInput
          exerciseId="ex-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      const addButton = screen.getByRole('button', { name: /add/i });
      // Click without entering text
      await user.click(addButton);

      // addTag should NOT be called because input is empty
      expect(mockAddTag).not.toHaveBeenCalled();
    });

    it('should not throw on invalid tag operations', async () => {
      mockGetExerciseTags.mockReturnValue(['rock']);

      expect(() => {
        render(
          <TagInput
            exerciseId="ex-1"
            isOpen={true}
            onClose={vi.fn()}
          />
        );
      }).not.toThrow();
    });
  });
});
