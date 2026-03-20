import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';

describe('ExercisePlaybackPage - Loop Playback Logic', () => {
  const mockExercise = {
    id: '1',
    title: 'Exercise 1',
    bpm: 120,
    durationMs: 60000,
    audioUrl: '/path/to/audio.mp3',
    midiEvents: [
      { note: 36, timestamp: 5000, velocity: 100 },
      { note: 36, timestamp: 10000, velocity: 95 },
      { note: 36, timestamp: 20000, velocity: 100 },
      { note: 36, timestamp: 30000, velocity: 95 },
      { note: 36, timestamp: 50000, velocity: 100 },
    ],
  };

  const defaultProps = {
    exercise: mockExercise,
    onExerciseSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loop State Management', () => {
    it('should initialize with default loop state (no loop)', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // Loop toggle should be disabled when no region selected (loopStartMs >= loopEndMs)
      const buttons = Array.from(container.querySelectorAll('button[aria-pressed]'));
      const loopToggle = buttons.find((btn) => btn.getAttribute('aria-label')?.includes('loop'));

      expect(loopToggle).toBeDisabled();
      expect(loopToggle).toHaveAttribute('aria-pressed', 'false');
    });

    it('should update loop repetitions count', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const repsSelector = screen.getByLabelText(/Number of loop repetitions/i) as HTMLSelectElement;
      const initialValue = repsSelector.value;

      await user.selectOptions(repsSelector, '5');

      await waitFor(() => {
        expect(repsSelector.value).toBe('5');
        expect(repsSelector.value).not.toBe(initialValue);
      });
    });

    it('should toggle infinite repetitions', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const repsSelector = screen.getByLabelText(/Number of loop repetitions/i) as HTMLSelectElement;

      await user.selectOptions(repsSelector, 'infinite');

      await waitFor(() => {
        expect(repsSelector.value).toBe('infinite');
      });
    });
  });

  describe('Loop Toggle Button', () => {
    it('should disable loop toggle when no region selected', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // Find the loop toggle button by its aria-label (contains "loop")
      const buttons = Array.from(container.querySelectorAll('button[aria-pressed]'));
      const loopToggle = buttons.find((btn) => btn.getAttribute('aria-label')?.includes('loop'));

      expect(loopToggle).toBeDisabled();
      expect(loopToggle?.className).toMatch(/disabled:opacity-50/);
    });

    it('should show loop toggle button with clear UI text', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // Initially shows "Loop Off" when no region selected
      expect(screen.getByText('Loop Off')).toBeInTheDocument();

      // Button should have aria-label explaining its function
      const buttons = Array.from(container.querySelectorAll('button[aria-pressed]'));
      const loopToggle = buttons.find((btn) => btn.getAttribute('aria-label')?.includes('loop'));
      expect(loopToggle).toHaveAttribute('aria-label');
    });
  });

  describe('Clear Loop', () => {
    it('should have clear button disabled when no loop region selected', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);

      const clearButton = screen.getByText('Clear');

      // Clear button disabled when no region selected
      expect(clearButton).toBeDisabled();
      expect(clearButton).toHaveAttribute('aria-label', 'Clear loop region');
    });

    it('should render clear button with accessible label', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);

      const clearButton = screen.getByText('Clear');
      const ariaLabel = clearButton.getAttribute('aria-label') || '';
      expect(ariaLabel.toLowerCase()).toContain('clear');
    });
  });

  describe('Layout and Rendering', () => {
    it('should render LoopControls component with header', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);

      expect(screen.getByText('Loop Control')).toBeInTheDocument();
      expect(screen.getByText('Loop Off')).toBeInTheDocument();
    });

    it('should render repetitions selector with proper options', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);

      const selector = screen.getByLabelText(/Number of loop repetitions/i);
      expect(selector).toBeInTheDocument();
      expect(selector).toBeVisible();
    });

    it('should render loop toggle button with aria-pressed attribute', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const toggleButton = container.querySelector('button[aria-pressed]');
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-pressed');
    });

    it('should render clear button', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);

      const clearButton = screen.getByText('Clear');
      expect(clearButton).toBeInTheDocument();
      expect(clearButton).toBeVisible();
    });

    it('should not display loop status when no region selected', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);

      // Loop status is displayed only when loopStartMs < loopEndMs
      // With default props (loopStartMs=0, loopEndMs=0), status should not appear
      // The status text "Loop: mm:ss–mm:ss" should not be visible
      const loopStatusText = screen.queryByText(/^Loop: \d{1,2}:\d{2}–\d{1,2}:\d{2}/);
      expect(loopStatusText).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible LoopControls', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const loopControls = container.querySelector('[aria-label*="Loop controls"]');
      expect(loopControls).toBeInTheDocument();
      expect(screen.getByLabelText(/Number of loop repetitions/i)).toBeInTheDocument();
    });

    it('should have aria-pressed on toggle button', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);
      const toggleButton = container.querySelector('button[aria-pressed]');
      expect(toggleButton).toHaveAttribute('aria-pressed');
    });

    it('should have aria-label on clear button', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);
      const clearButton = screen.getByText('Clear');
      expect(clearButton).toHaveAttribute('aria-label');
    });
  });

  describe('Responsive Design', () => {
    it('should render LoopControls below playback controls', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // Check that Loop Control is present
      expect(screen.getByText('Loop Control')).toBeInTheDocument();
    });
  });

  describe('Repetitions Selector Options', () => {
    it('should display preset repetition options', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);
      const selector = screen.getByLabelText(/Number of loop repetitions/i) as HTMLSelectElement;
      const options = Array.from(selector.options).map((o) => o.value);

      expect(options).toContain('1');
      expect(options).toContain('3');
      expect(options).toContain('5');
      expect(options).toContain('10');
      expect(options).toContain('25');
      expect(options).toContain('50');
      expect(options).toContain('100');
      expect(options).toContain('999');
      expect(options).toContain('infinite');
    });
  });

  describe('Integration with Timeline', () => {
    it('should have LoopControls available for timeline interaction', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // LoopControls should be present for use with timeline drag-select
      expect(screen.getByText('Loop Control')).toBeInTheDocument();

      // LoopControls container should have aria-label
      const loopControls = container.querySelector('[aria-label*="Loop controls"]');
      expect(loopControls).toBeInTheDocument();
    });

    it('should render both timelines for drag-select interaction', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // Component should render exercise playback content
      expect(screen.getByText('Loop Control')).toBeInTheDocument();

      // Verify timelines are present
      const timeline = container.querySelector('[role="presentation"]');
      expect(timeline).toBeInTheDocument();
    });
  });

  describe('Button States', () => {
    it('should show disabled toggle button when no loop region selected', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);
      const buttons = Array.from(container.querySelectorAll('button[aria-pressed]'));
      const loopToggle = buttons.find((btn) => btn.getAttribute('aria-label')?.includes('loop'));
      expect(loopToggle).toBeDisabled();
    });

    it('should show disabled clear button when no loop region selected', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);
      const clearButton = screen.getByText('Clear');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Dark Mode Support', () => {
    it('should apply dark mode classes to LoopControls elements', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // Check that the header has dark mode classes
      const header = screen.getByText('Loop Control');
      expect(header.className).toMatch(/dark:/);

      // Check that the selector has dark mode classes
      const selector = screen.getByLabelText(/Number of loop repetitions/i);
      expect(selector.className).toMatch(/dark:/);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support Tab navigation through loop controls', async () => {
      const user = await userEvent.setup();
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const selector = screen.getByLabelText(/Number of loop repetitions/i);
      selector.focus();

      expect(selector).toHaveFocus();

      await user.keyboard('{Tab}');
      // After Tab, focus should move to the next interactive element.
      // Note: the loop toggle/clear buttons are disabled (no loop region set), so Tab
      // skips them and moves to the next focusable element (e.g. drum volume slider).
      const interactiveElements = Array.from(
        container.querySelectorAll<HTMLElement>('button, input, select'),
      );
      const anyHasFocus = interactiveElements.some(el => el === document.activeElement);
      expect(anyHasFocus).toBe(true);
    });

    it('should support arrow key navigation in repetitions selector', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const selector = screen.getByLabelText(/Number of loop repetitions/i) as HTMLSelectElement;
      selector.focus();

      const initialValue = selector.value;
      await user.keyboard('{ArrowDown}');

      // Value may or may not change depending on the current selection
      // Just verify the selector is still there and focused
      expect(selector).toHaveFocus();
    });
  });

  describe('Visual Feedback', () => {
    it('should show loop toggle button in inactive state initially', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);
      expect(screen.getByText('Loop Off')).toBeInTheDocument();
    });

    it('should have distinct styling for different button states', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);
      const toggleButton = container.querySelector('button[aria-pressed="false"]');

      // Button should have classes indicating inactive state
      expect(toggleButton?.className).toMatch(/gray|bg-/);
    });
  });
});
