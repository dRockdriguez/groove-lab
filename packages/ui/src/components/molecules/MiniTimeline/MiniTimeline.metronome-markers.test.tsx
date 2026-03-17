import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MiniTimeline } from './MiniTimeline';
import type { MidiEvent } from '@groovelab/types';

const mockEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
  { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
];

describe('MiniTimeline — Metronome Markers', () => {
  const baseProps = {
    midiEvents: mockEvents,
    durationMs: 60000,
    currentTimeMs: 0,
    onSeek: vi.fn(),
  };

  it('renders no beat markers when metronomeEnabled is not provided', () => {
    const { container } = render(<MiniTimeline {...baseProps} bpm={120} />);
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('renders no beat markers when metronomeEnabled is false', () => {
    const { container } = render(
      <MiniTimeline {...baseProps} bpm={120} metronomeEnabled={false} />
    );
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('renders beat markers when metronomeEnabled is true', () => {
    const { container } = render(
      <MiniTimeline {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBeGreaterThan(0);
  });

  it('renders downbeat markers when metronomeEnabled is true', () => {
    const { container } = render(
      <MiniTimeline {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBeGreaterThan(0);
  });

  it('first marker is a downbeat marker', () => {
    const { container } = render(
      <MiniTimeline {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    const allMarkers = container.querySelectorAll(
      '[data-testid="metronome-beat-marker"], [data-testid="metronome-downbeat-marker"]'
    );
    expect(allMarkers.length).toBeGreaterThan(0);
    expect(allMarkers[0].getAttribute('data-testid')).toBe('metronome-downbeat-marker');
  });

  it('calculates correct number of beats at 120 BPM in 60 seconds', () => {
    // beatInterval = 60000/120 = 500ms, numBeats = 60000/500 = 120 beats
    const { container } = render(
      <MiniTimeline {...baseProps} bpm={120} durationMs={60000} metronomeEnabled={true} />
    );
    const beats = container.querySelectorAll('[data-testid="metronome-beat-marker"]');
    const downbeats = container.querySelectorAll('[data-testid="metronome-downbeat-marker"]');
    expect(beats.length + downbeats.length).toBe(120);
  });

  it('renders 30 downbeat markers at 120 BPM in 60 seconds', () => {
    // 120 beats / 4 = 30 downbeats
    const { container } = render(
      <MiniTimeline {...baseProps} bpm={120} durationMs={60000} metronomeEnabled={true} />
    );
    const downbeats = container.querySelectorAll('[data-testid="metronome-downbeat-marker"]');
    expect(downbeats.length).toBe(30);
  });

  it('marker layer has accessible aria-label with beat count', () => {
    render(
      <MiniTimeline {...baseProps} bpm={120} durationMs={60000} metronomeEnabled={true} />
    );
    expect(screen.getByRole('img', { name: /metronome beats at 120 intervals/i })).toBeInTheDocument();
  });

  it('individual markers have aria-hidden="true"', () => {
    const { container } = render(
      <MiniTimeline {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    const markers = container.querySelectorAll(
      '[data-testid="metronome-beat-marker"], [data-testid="metronome-downbeat-marker"]'
    );
    markers.forEach(marker => {
      expect(marker.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('marker layer has pointer-events-none to not block seeking', () => {
    const { container } = render(
      <MiniTimeline {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    const markerLayer = container.querySelector('[role="img"][aria-label]');
    expect(markerLayer).not.toBeNull();
    expect((markerLayer as HTMLElement).style.pointerEvents).toBe('none');
  });

  it('click-to-seek still works when markers are shown', () => {
    const onSeek = vi.fn();
    render(
      <MiniTimeline {...baseProps} bpm={120} metronomeEnabled={true} onSeek={onSeek} />
    );
    fireEvent.click(screen.getByRole('presentation'));
    expect(onSeek).toHaveBeenCalled();
  });

  it('renders no markers when durationMs is 0', () => {
    const { container } = render(
      <MiniTimeline {...baseProps} durationMs={0} bpm={120} metronomeEnabled={true} />
    );
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('renders no markers when bpm is not provided even if metronomeEnabled is true', () => {
    const { container } = render(<MiniTimeline {...baseProps} metronomeEnabled={true} />);
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('markers disappear when metronomeEnabled changes from true to false', () => {
    const { container, rerender } = render(
      <MiniTimeline {...baseProps} bpm={120} metronomeEnabled={true} />
    );
    expect(
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length
    ).toBeGreaterThan(0);

    rerender(<MiniTimeline {...baseProps} bpm={120} metronomeEnabled={false} />);
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('updates beat count when BPM changes', () => {
    const { container, rerender } = render(
      <MiniTimeline {...baseProps} bpm={60} durationMs={60000} metronomeEnabled={true} />
    );
    const initialCount =
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length;

    rerender(<MiniTimeline {...baseProps} bpm={120} durationMs={60000} metronomeEnabled={true} />);
    const updatedCount =
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length;

    // 120 BPM = twice as many beats as 60 BPM
    expect(updatedCount).toBe(initialCount * 2);
  });
});
