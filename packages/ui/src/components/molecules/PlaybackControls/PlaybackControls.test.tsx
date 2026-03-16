import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlaybackControls } from './PlaybackControls';

describe('PlaybackControls', () => {
  const defaultProps = {
    state: 'stopped' as const,
    currentTimeMs: 0,
    durationMs: 60000,
    onTogglePlay: vi.fn(),
    onSeek: vi.fn(),
  };

  it('renders the play button', () => {
    render(<PlaybackControls {...defaultProps} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders the pause button when playing', () => {
    render(<PlaybackControls {...defaultProps} state="playing" />);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('renders a seek slider', () => {
    render(<PlaybackControls {...defaultProps} />);
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('displays current time in mm:ss format', () => {
    render(<PlaybackControls {...defaultProps} currentTimeMs={90000} />);
    expect(screen.getByText('01:30')).toBeInTheDocument();
  });

  it('displays total duration in mm:ss format', () => {
    render(<PlaybackControls {...defaultProps} durationMs={120000} />);
    expect(screen.getByText('02:00')).toBeInTheDocument();
  });

  it('calls onTogglePlay when play button is clicked', () => {
    const onTogglePlay = vi.fn();
    render(<PlaybackControls {...defaultProps} onTogglePlay={onTogglePlay} />);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(onTogglePlay).toHaveBeenCalledOnce();
  });

  it('calls onSeek when seek slider changes', () => {
    const onSeek = vi.fn();
    render(<PlaybackControls {...defaultProps} onSeek={onSeek} />);
    fireEvent.change(screen.getByRole('slider'), { target: { value: '30000' } });
    expect(onSeek).toHaveBeenCalledWith(30000);
  });

  it('sets slider max to durationMs', () => {
    render(<PlaybackControls {...defaultProps} durationMs={45000} />);
    expect(screen.getByRole('slider')).toHaveAttribute('max', '45000');
  });

  it('sets slider value to currentTimeMs', () => {
    render(<PlaybackControls {...defaultProps} currentTimeMs={15000} />);
    expect(screen.getByRole('slider')).toHaveAttribute('value', '15000');
  });

  it('seek slider has accessible aria-label', () => {
    render(<PlaybackControls {...defaultProps} />);
    expect(screen.getByRole('slider')).toHaveAttribute('aria-label', expect.stringMatching(/seek/i));
  });

  it('displays time as 00:00 when currentTimeMs is 0', () => {
    render(<PlaybackControls {...defaultProps} currentTimeMs={0} />);
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });
});
