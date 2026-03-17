import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaybackControls } from './PlaybackControls';

describe('PlaybackControls - Loop Integration', () => {
  const defaultProps = {
    isPlaying: false,
    duration: 60000,
    currentTime: 0,
    onPlayPause: vi.fn(),
    onSeek: vi.fn(),
    bpm: 120,
    metronomeEnabled: false,
    onMetronomeToggle: vi.fn(),
    onBpmChange: vi.fn(),
    loopStartMs: 15000,
    loopEndMs: 45000,
    isLoopActive: false,
    loopRepetitions: 3,
    currentLoopRepetition: 0,
    onLoopStartChange: vi.fn(),
    onLoopEndChange: vi.fn(),
    onLoopToggle: vi.fn(),
    onLoopRepetitionsChange: vi.fn(),
    onLoopClear: vi.fn(),
  };

  describe('LoopControls Integration', () => {
    it('should render LoopControls as sub-component', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByLabelText(/loop start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/loop end time/i)).toBeInTheDocument();
    });

    it('should display LoopControls below seek slider', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const seekSlider = container.querySelector('[role="slider"]');
      const loopControls = container.querySelector('[data-testid="loop-controls"]');

      const sliderRect = seekSlider!.getBoundingClientRect();
      const loopRect = loopControls!.getBoundingClientRect();

      // LoopControls should be below seek slider
      expect(loopRect.top).toBeGreaterThan(sliderRect.bottom);
    });

    it('should pass loop props to LoopControls', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          loopStartMs={20000}
          loopEndMs={50000}
          loopRepetitions={5}
        />
      );

      expect(screen.getByLabelText(/loop start time/i)).toHaveValue('00:20');
      expect(screen.getByLabelText(/loop end time/i)).toHaveValue('00:50');
      expect(screen.getByLabelText(/loop repetitions/i)).toHaveValue(5);
    });

    it('should pass loop callbacks to LoopControls', async () => {
      const onLoopStartChange = vi.fn();
      const onLoopToggle = vi.fn();
      const user = await userEvent.setup();

      render(
        <PlaybackControls
          {...defaultProps}
          onLoopStartChange={onLoopStartChange}
          onLoopToggle={onLoopToggle}
        />
      );

      const startInput = screen.getByLabelText(/loop start time/i);
      await user.clear(startInput);
      await user.type(startInput, '00:10');

      expect(onLoopStartChange).toHaveBeenCalled();
    });

    it('should update LoopControls when loop state changes', () => {
      const { rerender } = render(
        <PlaybackControls
          {...defaultProps}
          isLoopActive={false}
          loopRepetitions={3}
        />
      );

      let toggleButton = screen.getByRole('button', { name: /enable loop/i });
      expect(toggleButton).toBeInTheDocument();

      rerender(
        <PlaybackControls
          {...defaultProps}
          isLoopActive={true}
          loopRepetitions={3}
          currentLoopRepetition={1}
        />
      );

      toggleButton = screen.getByRole('button', { name: /disable loop/i });
      expect(toggleButton).toBeInTheDocument();
      expect(screen.getByText(/repeat 1 of 3/i)).toBeInTheDocument();
    });
  });

  describe('Seek Slider with Loop Context', () => {
    it('should display seek slider unchanged', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const seekSlider = container.querySelector('[role="slider"]');
      expect(seekSlider).toBeInTheDocument();
    });

    it('should not interfere with seek when loop is active', async () => {
      const onSeek = vi.fn();
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          onSeek={onSeek}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const seekSlider = container.querySelector('[role="slider"]');
      const rect = seekSlider!.getBoundingClientRect();

      // Seek to 50% (outside loop)
      fireEvent.mouseDown(seekSlider!);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.5 });
      fireEvent.mouseUp();

      await waitFor(() => {
        expect(onSeek).toHaveBeenCalled();
      });
    });

    it('should allow seeking before loop start', async () => {
      const onSeek = vi.fn();
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          onSeek={onSeek}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const seekSlider = container.querySelector('[role="slider"]');
      const rect = seekSlider!.getBoundingClientRect();

      // Seek to 10% (before loop start at 25%)
      fireEvent.mouseDown(seekSlider!);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.1 });
      fireEvent.mouseUp();

      expect(onSeek).toHaveBeenCalled();
    });

    it('should allow seeking past loop end', async () => {
      const onSeek = vi.fn();
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          onSeek={onSeek}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const seekSlider = container.querySelector('[role="slider"]');
      const rect = seekSlider!.getBoundingClientRect();

      // Seek to 90% (after loop end at 75%)
      fireEvent.mouseDown(seekSlider!);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.9 });
      fireEvent.mouseUp();

      expect(onSeek).toHaveBeenCalled();
    });
  });

  describe('Layout Responsiveness', () => {
    it('should display seek slider and LoopControls in proper layout', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const playbackControls = container.querySelector('[data-testid="playback-controls"]');
      expect(playbackControls).toHaveClass('flex', 'flex-col');
    });

    it('should maintain spacing between seek slider and LoopControls', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const seekSlider = container.querySelector('[role="slider"]');
      const loopControls = container.querySelector('[data-testid="loop-controls"]');

      const sliderStyle = window.getComputedStyle(seekSlider!);
      const loopStyle = window.getComputedStyle(loopControls!);

      // Should have gap/margin between them
      expect(seekSlider?.parentElement).toHaveStyle('gap');
    });
  });

  describe('Disabled State During Playback', () => {
    it('should disable LoopControls inputs when playing', () => {
      render(
        <PlaybackControls {...defaultProps} isPlaying={true} />
      );

      expect(screen.getByLabelText(/loop start time/i)).toBeDisabled();
      expect(screen.getByLabelText(/loop end time/i)).toBeDisabled();
      expect(screen.getByLabelText(/loop repetitions/i)).toBeDisabled();
    });

    it('should allow seek slider during playback', () => {
      const { container } = render(
        <PlaybackControls {...defaultProps} isPlaying={true} />
      );

      const seekSlider = container.querySelector('[role="slider"]');
      expect(seekSlider).not.toBeDisabled();
    });

    it('should disable loop toggle during playback if invalid', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          isPlaying={true}
          loopStartMs={30000}
          loopEndMs={30100}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      expect(toggleButton).toBeDisabled();
    });
  });

  describe('Loop Visualization Alongside Playback', () => {
    it('should display loop information during playback', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          isPlaying={true}
          isLoopActive={true}
          currentLoopRepetition={2}
          loopRepetitions={5}
        />
      );

      expect(screen.getByText(/repeat 2 of 5/i)).toBeInTheDocument();
    });

    it('should update repetition counter in real-time', () => {
      const { rerender } = render(
        <PlaybackControls
          {...defaultProps}
          isLoopActive={true}
          currentLoopRepetition={1}
          loopRepetitions={3}
        />
      );

      expect(screen.getByText(/repeat 1 of 3/i)).toBeInTheDocument();

      rerender(
        <PlaybackControls
          {...defaultProps}
          isLoopActive={true}
          currentLoopRepetition={2}
          loopRepetitions={3}
        />
      );

      expect(screen.getByText(/repeat 2 of 3/i)).toBeInTheDocument();
    });

    it('should announce infinite loop status', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          isLoopActive={true}
          loopRepetitions="infinite"
          currentLoopRepetition={10}
        />
      );

      expect(screen.getByText(/repeat 10 \/ ∞/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts Availability', () => {
    it('should support keyboard shortcuts in LoopControls', async () => {
      const user = await userEvent.setup();
      render(
        <PlaybackControls
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={30000}
        />
      );

      const startInput = screen.getByLabelText(/loop start time/i) as HTMLInputElement;
      startInput.focus();

      // Test arrow key adjustment
      await user.keyboard('{ArrowUp}');

      await waitFor(() => {
        expect(parseInt(startInput.value) || 0).toBeGreaterThan(0);
      });
    });

    it('should tab through seek slider and LoopControls', async () => {
      const user = await userEvent.setup();
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const playPauseButton = screen.getByRole('button', { name: /play|pause/i });
      playPauseButton.focus();

      await user.keyboard('{Tab}');
      const seekSlider = container.querySelector('[role="slider"]');
      expect(seekSlider).toHaveFocus();

      await user.keyboard('{Tab}');
      const startInput = screen.getByLabelText(/loop start time/i);
      expect(startInput).toHaveFocus();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure for screen readers', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const playbackControls = container.querySelector('[data-testid="playback-controls"]');
      expect(playbackControls).toHaveAttribute('role', 'group');
      expect(playbackControls).toHaveAttribute('aria-label');
    });

    it('should announce loop status changes', async () => {
      const user = await userEvent.setup();
      render(
        <PlaybackControls
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /enable loop/i });
      await user.click(toggleButton);

      await waitFor(() => {
        const liveRegion = screen.getByRole('status', { hidden: true });
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long exercises (>10 minutes)', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          duration={600000} // 10 minutes
          loopStartMs={300000}
          loopEndMs={360000}
        />
      );

      expect(screen.getByLabelText(/loop start time/i)).toHaveValue('05:00');
      expect(screen.getByLabelText(/loop end time/i)).toHaveValue('06:00');
    });

    it('should handle loop at very beginning of exercise', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={5000}
        />
      );

      expect(screen.getByLabelText(/loop start time/i)).toHaveValue('00:00');
      expect(screen.getByLabelText(/loop end time/i)).toHaveValue('00:05');
    });

    it('should handle loop at very end of exercise', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          duration={60000}
          loopStartMs={55000}
          loopEndMs={60000}
        />
      );

      expect(screen.getByLabelText(/loop start time/i)).toHaveValue('00:55');
      expect(screen.getByLabelText(/loop end time/i)).toHaveValue('01:00');
    });

    it('should handle high BPM with loop', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          bpm={300}
          loopStartMs={10000}
          loopEndMs={15000}
        />
      );

      expect(screen.getByLabelText(/BPM/i)).toHaveValue(300);
      expect(screen.getByLabelText(/loop start time/i)).toHaveValue('00:10');
    });

    it('should handle low BPM with loop', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          bpm={40}
          loopStartMs={10000}
          loopEndMs={15000}
        />
      );

      expect(screen.getByLabelText(/BPM/i)).toHaveValue(40);
      expect(screen.getByLabelText(/loop start time/i)).toHaveValue('00:10');
    });

    it('should handle maximum repetitions (999)', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          loopRepetitions={999}
        />
      );

      expect(screen.getByLabelText(/loop repetitions/i)).toHaveValue(999);
    });

    it('should handle undefined loop props gracefully', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          loopStartMs={undefined as any}
          loopEndMs={undefined as any}
        />
      );

      expect(screen.getByLabelText(/loop start time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/loop end time/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not cause frame drops during rapid loop prop updates', () => {
      const { rerender } = render(<PlaybackControls {...defaultProps} />);

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        rerender(
          <PlaybackControls
            {...defaultProps}
            currentLoopRepetition={i}
          />
        );
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // 100 re-renders should complete in reasonable time (not exceed 1600ms for 60fps)
      expect(duration).toBeLessThan(2000);
    });
  });
});
