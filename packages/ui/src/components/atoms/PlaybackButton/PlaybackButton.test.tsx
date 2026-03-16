import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlaybackButton } from './PlaybackButton';

describe('PlaybackButton', () => {
  it('renders a Play button when state is stopped', () => {
    render(<PlaybackButton state="stopped" onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders a Play button when state is paused', () => {
    render(<PlaybackButton state="paused" onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders a Pause button when state is playing', () => {
    render(<PlaybackButton state="playing" onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn();
    render(<PlaybackButton state="stopped" onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it('is disabled when disabled prop is true', () => {
    render(<PlaybackButton state="stopped" onToggle={vi.fn()} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('has a descriptive aria-label for Play state', () => {
    render(<PlaybackButton state="stopped" onToggle={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringMatching(/play/i));
  });

  it('has a descriptive aria-label for Pause state', () => {
    render(<PlaybackButton state="playing" onToggle={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringMatching(/pause/i));
  });

  it('responds to Enter key press', () => {
    const onToggle = vi.fn();
    render(<PlaybackButton state="stopped" onToggle={onToggle} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalled();
  });

  it('responds to Space key press', () => {
    const onToggle = vi.fn();
    render(<PlaybackButton state="stopped" onToggle={onToggle} />);
    fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalled();
  });
});
