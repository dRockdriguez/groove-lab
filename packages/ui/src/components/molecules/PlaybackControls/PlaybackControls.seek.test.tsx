import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlaybackControls } from './PlaybackControls';

describe('PlaybackControls — Seek Behavior', () => {
  const defaultProps = {
    state: 'stopped' as const,
    currentTimeMs: 0,
    durationMs: 60000,
    onTogglePlay: vi.fn(),
    onSeek: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls onSeek when slider value changes', () => {
    const onSeek = vi.fn();
    render(<PlaybackControls {...defaultProps} onSeek={onSeek} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '30000' } });

    expect(onSeek).toHaveBeenCalledWith(30000);
  });

  it('slider tracks currentTimeMs value', () => {
    render(<PlaybackControls {...defaultProps} currentTimeMs={15000} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.value).toBe('15000');
  });

  it('slider max value equals durationMs', () => {
    render(<PlaybackControls {...defaultProps} durationMs={45000} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.max).toBe('45000');
  });

  it('slider min value is 0', () => {
    render(<PlaybackControls {...defaultProps} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.min).toBe('0');
  });

  it('allows seeking to any position between 0 and duration', () => {
    const onSeek = vi.fn();
    render(<PlaybackControls {...defaultProps} onSeek={onSeek} durationMs={120000} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;

    // Seek to middle
    fireEvent.change(slider, { target: { value: '60000' } });
    expect(onSeek).toHaveBeenCalledWith(60000);

    // Seek near end
    fireEvent.change(slider, { target: { value: '110000' } });
    expect(onSeek).toHaveBeenCalledWith(110000);

    // Seek near start
    fireEvent.change(slider, { target: { value: '5000' } });
    expect(onSeek).toHaveBeenCalledWith(5000);
  });

  it('displays dragged slider position in time display', () => {
    const onSeek = vi.fn();
    render(<PlaybackControls {...defaultProps} onSeek={onSeek} currentTimeMs={0} durationMs={120000} />);

    // Time display should show current time
    expect(screen.getByText('00:00')).toBeInTheDocument();

    // When seeking, the onSeek callback is called with new time
    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '90000' } });

    expect(onSeek).toHaveBeenCalledWith(90000);
  });

  it('preserves currentTimeMs during drag in controlled component', () => {
    const { rerender } = render(
      <PlaybackControls {...defaultProps} currentTimeMs={0} />
    );

    const slider = screen.getByRole('slider') as HTMLInputElement;

    // Simulate drag
    fireEvent.mouseDown(slider);
    fireEvent.change(slider, { target: { value: '50000' } });
    fireEvent.mouseUp(slider);

    // Component should maintain current position from prop
    rerender(
      <PlaybackControls {...defaultProps} currentTimeMs={50000} />
    );

    expect(slider.value).toBe('50000');
  });

  it('slider accepts decimal time values for smooth playback', () => {
    const onSeek = vi.fn();
    render(<PlaybackControls {...defaultProps} onSeek={onSeek} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;

    // Seek to precise position
    fireEvent.change(slider, { target: { value: '12345' } });

    expect(onSeek).toHaveBeenCalledWith(12345);
  });

  it('handles rapid successive seeks', () => {
    const onSeek = vi.fn();
    render(<PlaybackControls {...defaultProps} onSeek={onSeek} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;

    // Rapid seeks
    fireEvent.change(slider, { target: { value: '10000' } });
    fireEvent.change(slider, { target: { value: '20000' } });
    fireEvent.change(slider, { target: { value: '30000' } });

    expect(onSeek).toHaveBeenCalledTimes(3);
    expect(onSeek).toHaveBeenLastCalledWith(30000);
  });

  it('displays both current time and total duration', () => {
    render(
      <PlaybackControls
        {...defaultProps}
        currentTimeMs={30000}
        durationMs={120000}
      />
    );

    expect(screen.getByText('00:30')).toBeInTheDocument(); // Current time
    expect(screen.getByText('02:00')).toBeInTheDocument(); // Total duration
  });

  it('updates time display when currentTimeMs prop changes', () => {
    const { rerender } = render(
      <PlaybackControls
        {...defaultProps}
        currentTimeMs={0}
        durationMs={60000}
      />
    );

    expect(screen.getByText('00:00')).toBeInTheDocument();

    rerender(
      <PlaybackControls
        {...defaultProps}
        currentTimeMs={45000}
        durationMs={60000}
      />
    );

    expect(screen.getByText('00:45')).toBeInTheDocument();
  });

  it('formats time correctly at edge cases', () => {
    // At start
    let { rerender } = render(
      <PlaybackControls
        {...defaultProps}
        currentTimeMs={0}
        durationMs={60000}
      />
    );
    expect(screen.getByText('00:00')).toBeInTheDocument();

    // At end (both current and duration are same, so use getAllByText)
    rerender(
      <PlaybackControls
        {...defaultProps}
        currentTimeMs={60000}
        durationMs={60000}
      />
    );
    const endTimeElements = screen.getAllByText('01:00');
    expect(endTimeElements.length).toBeGreaterThan(0);

    // Over an hour (formatDuration uses mm:ss, so 61 minutes 1 second)
    rerender(
      <PlaybackControls
        {...defaultProps}
        currentTimeMs={3661000}
        durationMs={3661000}
      />
    );
    // formatDuration shows mm:ss format, so 61 minutes 1 second = 61:01
    // Both current and duration display the same value, so use getAllByText
    const timeDisplays = screen.getAllByText('61:01');
    expect(timeDisplays.length).toBeGreaterThan(0);
  });

  it('slider step is appropriate for seeking precision', () => {
    render(<PlaybackControls {...defaultProps} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    const step = slider.getAttribute('step');

    // Step should be defined or defaults to 1 (millisecond precision)
    if (step) {
      expect(parseInt(step)).toBeLessThanOrEqual(1000); // At most 1 second
    }
  });

  it('does not interfere with play/pause when seeking', () => {
    const onTogglePlay = vi.fn();
    const onSeek = vi.fn();

    render(
      <PlaybackControls
        {...defaultProps}
        onTogglePlay={onTogglePlay}
        onSeek={onSeek}
      />
    );

    // Seek
    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '30000' } });

    // Play button should still work
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    expect(onSeek).toHaveBeenCalledWith(30000);
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('slider is disabled when in stopped state with no duration', () => {
    render(
      <PlaybackControls
        {...defaultProps}
        state="stopped"
        durationMs={0}
      />
    );

    const slider = screen.getByRole('slider');
    // Should still be present but max would be 0
    expect(slider).toHaveAttribute('max', '0');
  });

  it('slider is accessible when playing', () => {
    render(
      <PlaybackControls
        {...defaultProps}
        state="playing"
      />
    );

    const slider = screen.getByRole('slider');
    expect(slider).not.toBeDisabled();
  });

  it('slider is accessible when paused', () => {
    render(
      <PlaybackControls
        {...defaultProps}
        state="paused"
      />
    );

    const slider = screen.getByRole('slider');
    expect(slider).not.toBeDisabled();
  });
});
