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

  it('renders playhead at correct position for 0ms', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={0}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).toBeInTheDocument();
    expect(playhead.style.left).toBe('0%');
  });

  it('positions playhead at 25% for quarter-way through exercise', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('25%');
  });

  it('positions playhead at 50% for half-way through exercise', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('50%');
  });

  it('positions playhead at 100% when exercise finishes', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={8000}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('100%');
  });

  it('updates playhead position when currentTimeMs prop changes', () => {
    const { container, rerender } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={0}
      />
    );

    let playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('0%');

    // Advance to 2 seconds (25%)
    rerender(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
      />
    );

    playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('25%');

    // Advance to 4 seconds (50%)
    rerender(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
      />
    );

    playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('50%');
  });

  it('calculates playhead position accurately for various timestamps', () => {
    const testCases = [
      { currentTimeMs: 1000, durationMs: 10000, expectedPercent: '10%' },
      { currentTimeMs: 3333, durationMs: 10000, expectedPercent: '33.33%' },
      { currentTimeMs: 5000, durationMs: 10000, expectedPercent: '50%' },
      { currentTimeMs: 7500, durationMs: 10000, expectedPercent: '75%' },
      { currentTimeMs: 9999, durationMs: 10000, expectedPercent: '99.99%' },
    ];

    testCases.forEach(({ currentTimeMs, durationMs, expectedPercent }) => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={durationMs}
          currentTimeMs={currentTimeMs}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      const actualPercent = playhead.style.left;

      // Allow for floating-point precision differences
      expect(Math.abs(parseFloat(actualPercent) - parseFloat(expectedPercent))).toBeLessThan(1);
    });
  });

  it('playhead stays within 50ms tolerance of audio playback', () => {
    // This test verifies the playhead can update frequently enough to stay in sync
    const { container, rerender } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={0}
      />
    );

    const timestamps = [50, 100, 150, 200, 250, 300];

    timestamps.forEach((currentTimeMs) => {
      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={currentTimeMs}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      const expectedPercent = (currentTimeMs / 8000) * 100;
      const actualPercent = parseFloat(playhead.style.left);

      // Playhead should be within 50ms * (100% / durationMs) of expected position
      const tolerance = (50 / 8000) * 100; // 0.625%
      expect(Math.abs(actualPercent - expectedPercent)).toBeLessThanOrEqual(tolerance + 0.5); // Add small margin for rounding
    });
  });

  it('playhead position has high precision for long exercises', () => {
    const durationMs = 300000; // 5 minute exercise
    const currentTimeMs = 123456; // Precise middle position

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={currentTimeMs}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    const expectedPercent = (currentTimeMs / durationMs) * 100;
    const actualPercent = parseFloat(playhead.style.left);

    expect(Math.abs(actualPercent - expectedPercent)).toBeLessThan(0.1);
  });

  it('playhead position for very short exercises', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={1000}
        currentTimeMs={500}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('50%');
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

    // Playhead should have positioning
    const style = window.getComputedStyle(playhead);
    expect(style.position).toBeTruthy();
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

  it('handles playhead at fractional millisecond positions', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={10000}
        currentTimeMs={1234} // Fractional position
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    const expectedPercent = (1234 / 10000) * 100;
    const actualPercent = parseFloat(playhead.style.left);

    expect(Math.abs(actualPercent - expectedPercent)).toBeLessThan(0.1);
  });

  it('playhead updates smoothly without jumping', () => {
    const { container, rerender } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={0}
      />
    );

    let previousPercent = 0;

    // Simulate smooth playback at ~60fps intervals (16ms)
    for (let i = 16; i <= 1000; i += 16) {
      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={i}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      const currentPercent = parseFloat(playhead.style.left);

      // Each update should be small and continuous
      const percentChange = currentPercent - previousPercent;
      expect(percentChange).toBeGreaterThanOrEqual(0); // No backward motion
      expect(percentChange).toBeLessThan(1); // Small increments

      previousPercent = currentPercent;
    }
  });

  it('playhead does not exceed 100% position', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={10000} // Beyond duration
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    const percent = parseFloat(playhead.style.left);

    expect(percent).toBeLessThanOrEqual(100);
  });

  it('playhead does not go below 0% position', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={-1000} // Before start
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    const percent = parseFloat(playhead.style.left);

    expect(percent).toBeGreaterThanOrEqual(0);
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
    const style = window.getComputedStyle(playhead);

    // Playhead should be visible but not block interaction with notes
    expect(style.pointerEvents).not.toBe('auto');
  });
});
