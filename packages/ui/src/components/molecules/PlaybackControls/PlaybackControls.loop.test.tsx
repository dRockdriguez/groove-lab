import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaybackControls } from './PlaybackControls';

describe('PlaybackControls - Loop Integration', () => {
  const defaultProps = {
    state: 'stopped' as const,
    currentTimeMs: 0,
    durationMs: 60000,
    onTogglePlay: vi.fn(),
    onSeek: vi.fn(),
    loopControls: {
      loopStartMs: 15000,
      loopEndMs: 45000,
      isLoopActive: false,
      loopRepetitions: 3,
      durationMs: 60000,
      onLoopToggle: vi.fn(),
      onLoopRepetitionsChange: vi.fn(),
      onLoopClear: vi.fn(),
    },
  };

  describe('LoopControls Integration', () => {
    it('should render LoopControls when loopControls prop provided', () => {
      render(<PlaybackControls {...defaultProps} />);
      expect(screen.getByText('Loop Control')).toBeInTheDocument();
      expect(screen.getByText('Loop Off')).toBeInTheDocument();
    });

    it('should display LoopControls below seek slider', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const seekSlider = container.querySelector('[role="slider"]');
      const loopControls = screen.getByLabelText(/loop controls/i);

      const sliderRect = seekSlider!.getBoundingClientRect();
      const loopRect = loopControls.getBoundingClientRect();

      // LoopControls should be below seek slider
      expect(loopRect.top).toBeGreaterThanOrEqual(sliderRect.bottom);
    });

    it('should display loop status when region is selected', () => {
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 20000,
            loopEndMs: 50000,
          }}
        />
      );

      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv).toBeInTheDocument();
      expect(statusDiv?.textContent).toMatch(/Loop:/);
    });

    it('should update loop status when loop times change', () => {
      const { rerender, container } = render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 15000,
            loopEndMs: 45000,
          }}
        />
      );

      let statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:15/);

      rerender(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 20000,
            loopEndMs: 50000,
          }}
        />
      );

      statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:20/);
    });

    it('should pass loop callbacks to LoopControls', async () => {
      const onLoopToggle = vi.fn();
      const user = await userEvent.setup();

      render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 10000,
            loopEndMs: 30000,
            onLoopToggle,
          }}
        />
      );

      const toggleButton = screen.getByText('Loop Off');
      await user.click(toggleButton);

      expect(onLoopToggle).toHaveBeenCalledWith(true);
    });

    it('should update LoopControls when loop state changes', () => {
      const { rerender } = render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            isLoopActive: false,
            loopRepetitions: 3,
            loopStartMs: 10000,
            loopEndMs: 30000,
          }}
        />
      );

      expect(screen.getByText('Loop Off')).toBeInTheDocument();

      rerender(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            isLoopActive: true,
            loopRepetitions: 3,
            loopStartMs: 10000,
            loopEndMs: 30000,
          }}
        />
      );

      expect(screen.getByText(/✓ Loop On/)).toBeInTheDocument();
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
          loopControls={{
            ...defaultProps.loopControls,
            isLoopActive: true,
            loopStartMs: 15000,
            loopEndMs: 45000,
          }}
        />
      );

      const seekSlider = container.querySelector('[role="slider"]') as HTMLInputElement;

      // Seek to 50% via onChange (30000ms out of 60000ms)
      fireEvent.change(seekSlider, { target: { value: '30000' } });

      await waitFor(() => {
        expect(onSeek).toHaveBeenCalledWith(30000);
      });
    });

    it('should allow seeking before loop start', async () => {
      const onSeek = vi.fn();
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          onSeek={onSeek}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 15000,
            loopEndMs: 45000,
          }}
        />
      );

      const seekSlider = container.querySelector('[role="slider"]') as HTMLInputElement;

      // Seek to 10% (before loop start at 25%) = 6000ms out of 60000ms
      fireEvent.change(seekSlider, { target: { value: '6000' } });

      expect(onSeek).toHaveBeenCalledWith(6000);
    });

    it('should allow seeking past loop end', async () => {
      const onSeek = vi.fn();
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          onSeek={onSeek}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 15000,
            loopEndMs: 45000,
          }}
        />
      );

      const seekSlider = container.querySelector('[role="slider"]') as HTMLInputElement;

      // Seek to 90% (after loop end at 75%) = 54000ms out of 60000ms
      fireEvent.change(seekSlider, { target: { value: '54000' } });

      expect(onSeek).toHaveBeenCalledWith(54000);
    });
  });

  describe('Layout Responsiveness', () => {
    it('should display seek slider and LoopControls in proper layout', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const playbackControls = container.firstChild;
      expect(playbackControls).toHaveClass('flex', 'flex-col');
    });

    it('should maintain spacing between seek slider and LoopControls', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const seekSlider = container.querySelector('[role="slider"]');
      const loopControls = screen.getByLabelText(/loop controls/i);

      // Should have gap/margin between them
      const parentDiv = container.querySelector('.flex.flex-col.gap-3');
      expect(parentDiv).toHaveClass('gap-3');
    });
  });

  describe('Disabled State During Playback', () => {
    it('should disable loop toggle when no region selected', () => {
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 0,
            loopEndMs: 0,
          }}
        />
      );

      const toggleButton = container.querySelector('button[aria-pressed]');
      expect(toggleButton).toBeDisabled();
    });

    it('should enable loop toggle when region is selected', () => {
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 10000,
            loopEndMs: 30000,
          }}
        />
      );

      const toggleButton = container.querySelector('button[aria-pressed]');
      expect(toggleButton).not.toBeDisabled();
    });

    it('should allow seek slider during playback', () => {
      const { container } = render(
        <PlaybackControls {...defaultProps} state="playing" />
      );

      const seekSlider = container.querySelector('[role="slider"]');
      expect(seekSlider).not.toBeDisabled();
    });
  });

  describe('Loop Visualization Alongside Playback', () => {
    it('should display loop information during playback', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          state="playing"
          loopControls={{
            ...defaultProps.loopControls,
            isLoopActive: true,
            loopStartMs: 15000,
            loopEndMs: 45000,
            loopRepetitions: 5,
          }}
        />
      );

      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          state="playing"
          loopControls={{
            ...defaultProps.loopControls,
            isLoopActive: true,
            loopStartMs: 15000,
            loopEndMs: 45000,
            loopRepetitions: 5,
          }}
        />
      );

      // Check that loop status is displayed
      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/5x/);
    });

    it('should display infinite loop status', () => {
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            isLoopActive: true,
            loopStartMs: 15000,
            loopEndMs: 45000,
            loopRepetitions: 'infinite',
          }}
        />
      );

      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/∞ reps/);
    });
  });

  describe('Repetitions Control', () => {
    it('should update repetitions when selector changes', async () => {
      const onRepetitionsChange = vi.fn();
      const user = await userEvent.setup();

      render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            onLoopRepetitionsChange: onRepetitionsChange,
          }}
        />
      );

      const selector = screen.getByLabelText(/Number of loop repetitions/i);
      await user.selectOptions(selector, '50');

      expect(onRepetitionsChange).toHaveBeenCalledWith(50);
    });

    it('should support switching to infinite repetitions', async () => {
      const onRepetitionsChange = vi.fn();
      const user = await userEvent.setup();

      render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopRepetitions: 5,
            onLoopRepetitionsChange: onRepetitionsChange,
          }}
        />
      );

      const selector = screen.getByLabelText(/Number of loop repetitions/i);
      await user.selectOptions(selector, 'infinite');

      expect(onRepetitionsChange).toHaveBeenCalledWith('infinite');
    });
  });

  describe('Clear Functionality', () => {
    it('should call onLoopClear when clear button clicked', async () => {
      const onLoopClear = vi.fn();
      const user = await userEvent.setup();

      render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 10000,
            loopEndMs: 30000,
            onLoopClear,
          }}
        />
      );

      const clearButton = screen.getByText('Clear');
      await user.click(clearButton);

      expect(onLoopClear).toHaveBeenCalled();
    });

    it('should disable clear button when no region selected', () => {
      render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 0,
            loopEndMs: 0,
          }}
        />
      );

      const clearButton = screen.getByText('Clear');
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible structure for screen readers', () => {
      render(<PlaybackControls {...defaultProps} />);

      expect(screen.getByLabelText(/loop controls/i)).toBeInTheDocument();
      expect(screen.getByText('Loop Control')).toBeInTheDocument();
      expect(screen.getByLabelText(/Number of loop repetitions/i)).toBeInTheDocument();
    });

    it('should have aria-labels on interactive controls', () => {
      const { container } = render(<PlaybackControls {...defaultProps} />);

      const toggleButton = container.querySelector('button[aria-pressed]');
      expect(toggleButton).toHaveAttribute('aria-label');

      const clearButton = screen.getByText('Clear');
      expect(clearButton).toHaveAttribute('aria-label');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long exercises (>10 minutes)', () => {
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          durationMs={600000} // 10 minutes
          loopControls={{
            ...defaultProps.loopControls,
            durationMs: 600000,
            loopStartMs: 300000,
            loopEndMs: 360000,
          }}
        />
      );

      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/5:00/);
      expect(statusDiv?.textContent).toMatch(/6:00/);
    });

    it('should handle loop at very beginning of exercise', () => {
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopStartMs: 0,
            loopEndMs: 5000,
          }}
        />
      );

      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:00/);
      expect(statusDiv?.textContent).toMatch(/0:05/);
    });

    it('should handle loop at very end of exercise', () => {
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          durationMs={60000}
          loopControls={{
            ...defaultProps.loopControls,
            durationMs: 60000,
            loopStartMs: 55000,
            loopEndMs: 60000,
          }}
        />
      );

      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/0:55/);
      expect(statusDiv?.textContent).toMatch(/1:00/);
    });

    it('should handle maximum repetitions (999)', () => {
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopRepetitions: 999,
            loopStartMs: 10000,
            loopEndMs: 30000,
          }}
        />
      );

      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/999x/);
    });

    it('should handle infinite repetitions', () => {
      const { container } = render(
        <PlaybackControls
          {...defaultProps}
          loopControls={{
            ...defaultProps.loopControls,
            loopRepetitions: 'infinite',
            loopStartMs: 10000,
            loopEndMs: 30000,
          }}
        />
      );

      const statusDiv = container.querySelector('.bg-gray-100');
      expect(statusDiv?.textContent).toMatch(/∞ reps/);
    });
  });
});
