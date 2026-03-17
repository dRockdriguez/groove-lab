import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';

describe('ExercisePlaybackPage - Loop Playback Logic', () => {
  const mockExercise = {
    id: '1',
    name: 'Exercise 1',
    bpm: 120,
    duration: 60000,
    instrumentType: 'drums' as const,
    filePath: '/path/to/audio.mp3',
    tracks: [
      {
        id: 'kick',
        name: 'Kick',
        color: '#FF0000',
        notes: [
          { time: 5000, velocity: 100 },
          { time: 10000, velocity: 95 },
          { time: 20000, velocity: 100 },
          { time: 30000, velocity: 95 },
          { time: 50000, velocity: 100 },
        ],
      },
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
      render(<ExercisePlaybackPage {...defaultProps} />);

      expect(screen.getByLabelText(/loop start time/i)).toHaveValue('00:00');
      expect(screen.getByLabelText(/loop end time/i)).toHaveValue('00:00');
      expect(
        screen.getByRole('button', { name: /enable loop/i })
      ).toBeDisabled();
    });

    it('should update loop start time', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i);
      await user.clear(startInput);
      await user.type(startInput, '00:15');

      await waitFor(() => {
        expect(startInput).toHaveValue('00:15');
      });
    });

    it('should update loop end time', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const endInput = screen.getByLabelText(/loop end time/i);
      await user.clear(endInput);
      await user.type(endInput, '00:45');

      await waitFor(() => {
        expect(endInput).toHaveValue('00:45');
      });
    });

    it('should preserve loop parameters when toggling on/off', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      // Set loop times
      const startInput = screen.getByLabelText(/loop start time/i);
      const endInput = screen.getByLabelText(/loop end time/i);

      await user.clear(startInput);
      await user.type(startInput, '00:15');
      await user.clear(endInput);
      await user.type(endInput, '00:45');

      // Toggle loop on
      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      await user.click(toggleButton);

      await waitFor(() => {
        expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
      });

      // Toggle loop off
      const disableButton = screen.getByRole('button', { name: /disable loop/i });
      await user.click(disableButton);

      await waitFor(() => {
        // Parameters should be preserved
        expect(startInput).toHaveValue('00:15');
        expect(endInput).toHaveValue('00:45');
      });
    });

    it('should update repetitions count', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const repetitionsInput = screen.getByLabelText(/loop repetitions/i);
      await user.clear(repetitionsInput);
      await user.type(repetitionsInput, '5');

      await waitFor(() => {
        expect(repetitionsInput).toHaveValue(5);
      });
    });

    it('should toggle infinite repetitions', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const infiniteRadio = screen.getByRole('radio', { name: /infinite/i });
      await user.click(infiniteRadio);

      await waitFor(() => {
        expect(infiniteRadio).toBeChecked();
      });
    });
  });

  describe('Loop Auto-Jump at End Point', () => {
    it('should jump to loop start when playback reaches loop end with repetitions remaining', async () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // Set loop
      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/loop end time/i) as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: '15000' } });
      fireEvent.change(endInput, { target: { value: '30000' } });

      // Enable loop
      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      fireEvent.click(toggleButton);

      // Get audio element and simulate playback reaching end
      const audio = container.querySelector('audio') as HTMLAudioElement;
      if (audio) {
        audio.currentTime = 30.5; // Beyond loop end
        fireEvent.timeupdate(audio);

        await waitFor(() => {
          // Should jump back to loop start
          expect(audio.currentTime).toBeLessThan(30.0); // Should be <= 15s
        });
      }
    });

    it('should increment repetition counter after jump', async () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // Setup loop with 3 repetitions
      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/loop end time/i) as HTMLInputElement;
      const repetitionsInput = screen.getByLabelText(/loop repetitions/i) as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: '15000' } });
      fireEvent.change(endInput, { target: { value: '30000' } });
      fireEvent.change(repetitionsInput, { target: { value: '3' } });

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      fireEvent.click(toggleButton);

      // Trigger jump by simulating playback
      const audio = container.querySelector('audio') as HTMLAudioElement;
      if (audio) {
        // First jump
        audio.currentTime = 30.5;
        fireEvent.timeupdate(audio);

        await waitFor(() => {
          expect(screen.getByText(/repeat 1 of 3/i)).toBeInTheDocument();
        });
      }
    });

    it('should continue past loop end when repetitions exhausted', async () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/loop end time/i) as HTMLInputElement;
      const repetitionsInput = screen.getByLabelText(/loop repetitions/i) as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: '15000' } });
      fireEvent.change(endInput, { target: { value: '30000' } });
      fireEvent.change(repetitionsInput, { target: { value: '1' } });

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      fireEvent.click(toggleButton);

      const audio = container.querySelector('audio') as HTMLAudioElement;
      if (audio) {
        // First jump completes the single repetition
        audio.currentTime = 30.5;
        fireEvent.timeupdate(audio);

        await waitFor(() => {
          // Should disable loop and allow continuing past end
          expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
        });
      }
    });

    it('should not jump if loop is disabled', async () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/loop end time/i) as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: '15000' } });
      fireEvent.change(endInput, { target: { value: '30000' } });

      // Don't enable loop

      const audio = container.querySelector('audio') as HTMLAudioElement;
      if (audio) {
        const initialTime = audio.currentTime;
        audio.currentTime = 30.5;
        fireEvent.timeupdate(audio);

        // Should not jump back
        expect(audio.currentTime).toBeCloseTo(30.5, 0);
      }
    });

    it('should handle infinite loop repetitions', async () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/loop end time/i) as HTMLInputElement;
      const infiniteRadio = screen.getByRole('radio', { name: /infinite/i });

      fireEvent.change(startInput, { target: { value: '15000' } });
      fireEvent.change(endInput, { target: { value: '30000' } });
      fireEvent.click(infiniteRadio);

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      fireEvent.click(toggleButton);

      const audio = container.querySelector('audio') as HTMLAudioElement;
      if (audio) {
        // Multiple jumps should all work
        for (let i = 0; i < 5; i++) {
          audio.currentTime = 30.5;
          fireEvent.timeupdate(audio);
        }

        // Should still show infinite indicator
        await waitFor(() => {
          expect(screen.getByText(/∞/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Loop Visualization', () => {
    it('should render loop markers when loop is set', () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/loop end time/i) as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: '15000' } });
      fireEvent.change(endInput, { target: { value: '45000' } });

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      fireEvent.click(toggleButton);

      expect(screen.getByTestId('loop-start-bracket')).toBeInTheDocument();
      expect(screen.getByTestId('loop-end-bracket')).toBeInTheDocument();
    });

    it('should hide loop markers when loop is disabled', async () => {
      const user = await userEvent.setup();
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i);
      const endInput = screen.getByLabelText(/loop end time/i);

      await user.clear(startInput);
      await user.type(startInput, '00:15');
      await user.clear(endInput);
      await user.type(endInput, '00:45');

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      await user.click(toggleButton);

      expect(screen.getByTestId('loop-start-bracket')).toBeInTheDocument();

      const disableButton = screen.getByRole('button', { name: /disable loop/i });
      await user.click(disableButton);

      await waitFor(() => {
        expect(screen.queryByTestId('loop-start-bracket')).not.toBeInTheDocument();
      });
    });
  });

  describe('Clear Loop', () => {
    it('should clear loop parameters when Clear button is clicked', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i);
      const endInput = screen.getByLabelText(/loop end time/i);

      await user.clear(startInput);
      await user.type(startInput, '00:15');
      await user.clear(endInput);
      await user.type(endInput, '00:45');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(startInput).toHaveValue('00:00');
        expect(endInput).toHaveValue('00:00');
      });
    });

    it('should reset repetitions to 1 when Clear is clicked', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const repetitionsInput = screen.getByLabelText(/loop repetitions/i);
      await user.clear(repetitionsInput);
      await user.type(repetitionsInput, '5');

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(repetitionsInput).toHaveValue(1);
      });
    });

    it('should disable loop when Clear is clicked', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i);
      const endInput = screen.getByLabelText(/loop end time/i);

      await user.clear(startInput);
      await user.type(startInput, '00:15');
      await user.clear(endInput);
      await user.type(endInput, '00:45');

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      await user.click(toggleButton);

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /enable loop/i })).toBeDisabled();
      });
    });

    it('should clear loop automatically when playback ends', async () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/loop end time/i) as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: '15000' } });
      fireEvent.change(endInput, { target: { value: '45000' } });

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      fireEvent.click(toggleButton);

      const audio = container.querySelector('audio') as HTMLAudioElement;
      if (audio) {
        // Simulate playback ending
        audio.currentTime = mockExercise.duration / 1000;
        fireEvent.timeupdate(audio);
        fireEvent.ended(audio);

        await waitFor(() => {
          // Loop should be disabled
          expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
        });
      }
    });
  });

  describe('Loop with Metronome', () => {
    it('should not interfere with metronome state during loop jump', async () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      // Enable metronome
      const metronomeToggle = screen.getByRole('button', { name: /toggle metronome/i });
      fireEvent.click(metronomeToggle);

      // Setup loop
      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/loop end time/i) as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: '15000' } });
      fireEvent.change(endInput, { target: { value: '30000' } });

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      fireEvent.click(toggleButton);

      const audio = container.querySelector('audio') as HTMLAudioElement;
      if (audio) {
        audio.currentTime = 30.5;
        fireEvent.timeupdate(audio);

        // Metronome should still be enabled after jump
        expect(metronomeToggle).toHaveAttribute('aria-pressed', 'true');
      }
    });
  });

  describe('Keyboard Shortcuts', () => {
    it('should toggle loop with Ctrl+L', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i);
      const endInput = screen.getByLabelText(/loop end time/i);

      await user.clear(startInput);
      await user.type(startInput, '00:15');
      await user.clear(endInput);
      await user.type(endInput, '00:45');

      await user.keyboard('{Control>}l{/Control}');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /disable loop/i })).toBeInTheDocument();
      });
    });

    it('should allow arrow key adjustment in numeric inputs', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      startInput.focus();

      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(parseInt(startInput.value) || 0).toBeGreaterThan(0);
      });
    });
  });

  describe('Loop Not Persisted Across Sessions', () => {
    it('should not persist loop in localStorage', () => {
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      fireEvent.change(startInput, { target: { value: '15000' } });

      // Loop state should be in React state, not localStorage
      expect(localStorage.getItem('loopState')).toBeNull();
    });

    it('should clear loop on page reload simulation', () => {
      const { unmount } = render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      fireEvent.change(startInput, { target: { value: '15000' } });

      unmount();

      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);
      const newStartInput = container.querySelector('[aria-label*="start time"]') as HTMLInputElement;

      expect(newStartInput.value).toBe('00:00');
    });
  });

  describe('Accessibility', () => {
    it('should announce repetition counter updates', async () => {
      const { container } = render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      const endInput = screen.getByLabelText(/loop end time/i) as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: '15000' } });
      fireEvent.change(endInput, { target: { value: '30000' } });

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      fireEvent.click(toggleButton);

      const audio = container.querySelector('audio') as HTMLAudioElement;
      if (audio) {
        audio.currentTime = 30.5;
        fireEvent.timeupdate(audio);

        const liveRegion = screen.getByRole('status', { hidden: true });
        await waitFor(() => {
          expect(liveRegion).toHaveAttribute('aria-live', 'polite');
        });
      }
    });

    it('should be keyboard navigable through all loop controls', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i);
      startInput.focus();

      await user.keyboard('{Tab}');
      const endInput = screen.getByLabelText(/loop end time/i);
      expect(endInput).toHaveFocus();

      await user.keyboard('{Tab}');
      const repetitionsInput = screen.getByLabelText(/loop repetitions/i);
      expect(repetitionsInput).toHaveFocus();
    });
  });

  describe('Validation', () => {
    it('should show error when start >= end', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i);
      const endInput = screen.getByLabelText(/loop end time/i);

      await user.clear(endInput);
      await user.type(endInput, '00:30');
      await user.clear(startInput);
      await user.type(startInput, '00:30');

      await waitFor(() => {
        expect(screen.getByText(/start must be before end/i)).toBeInTheDocument();
      });
    });

    it('should disable loop toggle when range is invalid', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i);
      const endInput = screen.getByLabelText(/loop end time/i);

      await user.clear(endInput);
      await user.type(endInput, '00:30');
      await user.clear(startInput);
      await user.type(startInput, '00:40');

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      expect(toggleButton).toBeDisabled();
    });

    it('should enforce minimum 500ms loop duration', async () => {
      const user = await userEvent.setup();
      render(<ExercisePlaybackPage {...defaultProps} />);

      const startInput = screen.getByLabelText(/loop start time/i);
      const endInput = screen.getByLabelText(/loop end time/i);

      await user.clear(startInput);
      await user.type(startInput, '00:10');
      await user.clear(endInput);
      await user.type(endInput, '00:10.3'); // 300ms duration

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      expect(toggleButton).toBeDisabled();
      expect(screen.getByText(/minimum 500ms/i)).toBeInTheDocument();
    });
  });
});
