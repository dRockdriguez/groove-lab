import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PlaybackControls } from './PlaybackControls';

describe('PlaybackControls — Metronome Markers', () => {
  const baseProps = {
    state: 'stopped' as const,
    currentTimeMs: 0,
    durationMs: 60000,
    onTogglePlay: vi.fn(),
    onSeek: vi.fn(),
  };

  it('renders no beat markers when metronomeEnabled is not provided', () => {
    const { container } = render(<PlaybackControls {...baseProps} bpm={120} />);
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('renders no beat markers when metronomeEnabled is false', () => {
    const { container } = render(
      <PlaybackControls {...baseProps} bpm={120} metronomeEnabled={false} />
    );
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('renders beat markers when metronomeEnabled is true', () => {
    const { container } = render(
      <PlaybackControls {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBeGreaterThan(0);
  });

  it('renders downbeat markers when metronomeEnabled is true', () => {
    const { container } = render(
      <PlaybackControls {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBeGreaterThan(0);
  });

  it('first marker is a downbeat marker', () => {
    const { container } = render(
      <PlaybackControls {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    const allMarkers = container.querySelectorAll(
      '[data-testid="metronome-beat-marker"], [data-testid="metronome-downbeat-marker"]'
    );
    expect(allMarkers.length).toBeGreaterThan(0);
    expect(allMarkers[0].getAttribute('data-testid')).toBe('metronome-downbeat-marker');
  });

  it('calculates correct number of beats at 60 BPM in 60 seconds', () => {
    // beatInterval = 60000/60 = 1000ms, numBeats = 60000/1000 = 60 beats
    const { container } = render(
      <PlaybackControls {...baseProps} bpm={60} durationMs={60000} metronomeEnabled={true} />
    );
    const beats = container.querySelectorAll('[data-testid="metronome-beat-marker"]');
    const downbeats = container.querySelectorAll('[data-testid="metronome-downbeat-marker"]');
    expect(beats.length + downbeats.length).toBe(60);
  });

  it('renders 15 downbeat markers at 60 BPM in 60 seconds', () => {
    // 60 beats / 4 = 15 downbeats (indices 0, 4, 8, ..., 56)
    const { container } = render(
      <PlaybackControls {...baseProps} bpm={60} durationMs={60000} metronomeEnabled={true} />
    );
    const downbeats = container.querySelectorAll('[data-testid="metronome-downbeat-marker"]');
    expect(downbeats.length).toBe(15);
  });

  it('marker layer has accessible aria-label with beat count', () => {
    render(<PlaybackControls {...baseProps} bpm={60} durationMs={60000} metronomeEnabled={true} />);
    expect(screen.getByRole('img', { name: /metronome beats at 60 intervals/i })).toBeInTheDocument();
  });

  it('individual beat markers have aria-hidden="true"', () => {
    const { container } = render(
      <PlaybackControls {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    const markers = container.querySelectorAll(
      '[data-testid="metronome-beat-marker"], [data-testid="metronome-downbeat-marker"]'
    );
    markers.forEach(marker => {
      expect(marker.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('markers have pointer-events-none style to not block seeking', () => {
    const { container } = render(
      <PlaybackControls {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    const markerLayer = container.querySelector('[role="img"][aria-label]');
    expect(markerLayer).not.toBeNull();
    const style = (markerLayer as HTMLElement).style.pointerEvents;
    expect(style).toBe('none');
  });

  it('seek slider remains interactive when markers are shown', () => {
    const onSeek = vi.fn();
    render(
      <PlaybackControls {...baseProps} bpm={120} metronomeEnabled={true} onSeek={onSeek} />
    );
    const slider = screen.getByLabelText('Seek playback position');
    fireEvent.change(slider, { target: { value: '30000' } });
    expect(onSeek).toHaveBeenCalledWith(30000);
  });

  it('renders no markers when durationMs is 0', () => {
    const { container } = render(
      <PlaybackControls {...baseProps} durationMs={0} bpm={120} metronomeEnabled={true} />
    );
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('renders no markers when bpm is not provided even if metronomeEnabled is true', () => {
    const { container } = render(
      <PlaybackControls {...baseProps} metronomeEnabled={true} />
    );
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('updates beat count when BPM changes', () => {
    const { container, rerender } = render(
      <PlaybackControls {...baseProps} bpm={60} durationMs={60000} metronomeEnabled={true} />
    );
    const initialCount =
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length;

    rerender(
      <PlaybackControls {...baseProps} bpm={120} durationMs={60000} metronomeEnabled={true} />
    );
    const updatedCount =
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length;

    // 120 BPM = twice as many beats as 60 BPM
    expect(updatedCount).toBe(initialCount * 2);
  });

  it('markers disappear when metronomeEnabled changes from true to false', () => {
    const { container, rerender } = render(
      <PlaybackControls {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    expect(
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length
    ).toBeGreaterThan(0);

    rerender(<PlaybackControls {...baseProps} bpm={120} metronomeEnabled={false} />);
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });
});
