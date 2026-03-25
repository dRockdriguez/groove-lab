import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import type { MidiEvent } from '@groovelab/types';

const mockEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
  { timestamp: 2000, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
  { timestamp: 4000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
  { timestamp: 6000, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
];

describe('ExercisePlaybackTimeline — Playhead Synchronization', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ─── NEW BEHAVIOR: Playhead is fixed at playheadOffsetPx ───────────────

  it('renders playhead at fixed position (default 250px) regardless of currentTimeMs', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={0}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).toBeInTheDocument();
    expect(playhead.style.left).toBe('250px');
  });

  it('maintains fixed playhead position at quarter-way through exercise', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('250px');
  });

  it('maintains fixed playhead position at half-way through exercise', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('250px');
  });

  it('maintains fixed playhead position when exercise finishes', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={8000}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('250px');
  });

  it('keeps playhead position constant when currentTimeMs prop changes', () => {
    const { container, rerender } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={0}
      />
    );

    let playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('250px');

    // Advance to 2 seconds
    rerender(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
      />
    );

    playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('250px');

    // Advance to 4 seconds
    rerender(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
      />
    );

    playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('250px');
  });

  it('playhead position is always constant regardless of various timestamps', () => {
    const testCases = [
      { currentTimeMs: 1000, durationMs: 10000 },
      { currentTimeMs: 3333, durationMs: 10000 },
      { currentTimeMs: 5000, durationMs: 10000 },
      { currentTimeMs: 7500, durationMs: 10000 },
      { currentTimeMs: 9999, durationMs: 10000 },
    ];

    testCases.forEach(({ currentTimeMs, durationMs }) => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={durationMs}
          currentTimeMs={currentTimeMs}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      // Playhead should always be at fixed position, not a percentage
      expect(playhead.style.left).toBe('250px');
    });
  });

  it('respects custom playheadOffsetPx prop', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
        playheadOffsetPx={150}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('150px');
  });

  it('playhead offset remains constant with custom playheadOffsetPx across time changes', () => {
    const { container, rerender } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={0}
        playheadOffsetPx={200}
      />
    );

    let playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('200px');

    rerender(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
        playheadOffsetPx={200}
      />
    );

    playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('200px');
  });

  it('playhead is visible and rendered as a line or bar', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).toBeVisible();
    expect(playhead.className).toContain('bg-green-500');
  });

  it('playhead remains above timeline content (z-index)', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    const style = window.getComputedStyle(playhead);

    // Playhead should have higher z-index than tracks
    const zIndex = style.zIndex;
    if (zIndex && zIndex !== 'auto') {
      expect(parseInt(zIndex)).toBeGreaterThan(0);
    }
  });

  it('playhead does not change position during playback', () => {
    const { container, rerender } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={0}
      />
    );

    let previousLeft = '';
    const timestamps = [50, 100, 150, 200, 250, 300, 4000, 8000];

    timestamps.forEach((currentTimeMs) => {
      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={currentTimeMs}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      const currentLeft = playhead.style.left;

      // Each iteration should have the same left value
      if (previousLeft) {
        expect(currentLeft).toBe(previousLeft);
      }
      previousLeft = currentLeft;
    });
  });

  it('playhead width or styling does not interfere with interaction', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    // Playhead should have pointer-events-none class (Tailwind) or style
    expect(playhead.className).toContain('pointer-events-none');
  });

  it('playhead position is independent of currentTimeMs changes', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={10000}
        currentTimeMs={1234}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    // Playhead should be at the fixed offset, not calculated from currentTimeMs
    expect(playhead.style.left).toBe('250px');
  });

  it('playhead is at fixed position for exercises of varying duration', () => {
    const durations = [1000, 5000, 10000, 60000, 300000];

    durations.forEach((durationMs) => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={durationMs}
          currentTimeMs={durationMs / 2}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      // Playhead should be at fixed position regardless of duration
      expect(playhead.style.left).toBe('250px');
    });
  });
});
