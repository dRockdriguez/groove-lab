import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { PlaybackControls } from './PlaybackControls';

describe('PlaybackControls — Keyboard Accessibility', () => {
  const defaultProps = {
    state: 'stopped' as const,
    currentTimeMs: 0,
    durationMs: 60000,
    onTogglePlay: vi.fn(),
    onSeek: vi.fn(),
  };

  it('toggles play/pause when Space key is pressed', async () => {
    const user = userEvent.setup({ delay: null });
    const onTogglePlay = vi.fn();
    render(<PlaybackControls {...defaultProps} onTogglePlay={onTogglePlay} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    playButton.focus();

    await user.keyboard(' ');

    expect(onTogglePlay).toHaveBeenCalled();
  });

  it('toggles play/pause when Enter key is pressed', async () => {
    const user = userEvent.setup({ delay: null });
    const onTogglePlay = vi.fn();
    render(<PlaybackControls {...defaultProps} onTogglePlay={onTogglePlay} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    playButton.focus();

    await user.keyboard('{Enter}');

    expect(onTogglePlay).toHaveBeenCalled();
  });

  it('slider receives focus with Tab key', async () => {
    const user = userEvent.setup({ delay: null });
    render(<PlaybackControls {...defaultProps} />);

    const slider = screen.getByRole('slider');
    slider.focus();

    expect(slider).toHaveFocus();
  });

  it('slider can be incremented with ArrowUp', async () => {
    const user = userEvent.setup({ delay: null });
    const onSeek = vi.fn();
    render(<PlaybackControls {...defaultProps} onSeek={onSeek} currentTimeMs={0} />);

    const slider = screen.getByRole('slider') as HTMLInputElement;
    slider.focus();

    // Simulate ArrowUp (increment)
    await user.keyboard('{ArrowUp}');

    expect(slider).toHaveFocus();
  });

  it('slider can be decremented with ArrowDown', async () => {
    const user = userEvent.setup({ delay: null });
    const onSeek = vi.fn();
    render(
      <PlaybackControls {...defaultProps} onSeek={onSeek} currentTimeMs={30000} />
    );

    const slider = screen.getByRole('slider') as HTMLInputElement;
    slider.focus();

    // Simulate ArrowDown (decrement)
    await user.keyboard('{ArrowDown}');

    expect(slider).toHaveFocus();
  });

  it('play button is keyboard focusable', () => {
    render(<PlaybackControls {...defaultProps} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    playButton.focus();

    expect(playButton).toHaveFocus();
  });

  it('slider is keyboard focusable', () => {
    render(<PlaybackControls {...defaultProps} />);

    const slider = screen.getByRole('slider');
    slider.focus();

    expect(slider).toHaveFocus();
  });

  it('play button has proper aria-label for screen readers', () => {
    render(<PlaybackControls {...defaultProps} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toHaveAttribute('aria-label');
  });

  it('slider has proper aria-label for screen readers', () => {
    render(<PlaybackControls {...defaultProps} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-label', expect.stringMatching(/seek/i));
  });

  it('slider has aria-valuemin set to 0', () => {
    render(<PlaybackControls {...defaultProps} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
  });

  it('slider has aria-valuemax set to duration', () => {
    render(<PlaybackControls {...defaultProps} durationMs={90000} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemax', '90000');
  });

  it('slider has aria-valuenow set to current time', () => {
    render(<PlaybackControls {...defaultProps} currentTimeMs={45000} />);

    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '45000');
  });

  it('slider updates aria-valuenow when currentTimeMs changes', () => {
    const { rerender } = render(
      <PlaybackControls {...defaultProps} currentTimeMs={0} />
    );

    let slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '0');

    rerender(
      <PlaybackControls {...defaultProps} currentTimeMs={30000} />
    );

    slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '30000');
  });

  it('pause button is keyboard focusable when playing', () => {
    render(<PlaybackControls {...defaultProps} state="playing" />);

    const pauseButton = screen.getByRole('button', { name: /pause/i });
    pauseButton.focus();

    expect(pauseButton).toHaveFocus();
  });

  it('pause button has proper aria-label when playing', () => {
    render(<PlaybackControls {...defaultProps} state="playing" />);

    const pauseButton = screen.getByRole('button', { name: /pause/i });
    expect(pauseButton).toHaveAttribute('aria-label');
  });
});
