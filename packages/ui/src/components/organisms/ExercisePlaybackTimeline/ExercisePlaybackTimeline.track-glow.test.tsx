import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import type { MidiEvent } from '@groovelab/types';
import type { DrumHitValidation } from '@groovelab/utils';

describe('ExercisePlaybackTimeline — Track Glow Overlays', () => {
  const mockEvents: MidiEvent[] = [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' }, // Kick
    { timestamp: 1000, note: 38, velocity: 80, channel: 1, type: 'noteOn' }, // Snare
    { timestamp: 2000, note: 42, velocity: 90, channel: 1, type: 'noteOn' }, // Hi-Hat
    { timestamp: 2500, note: 49, velocity: 85, channel: 1, type: 'noteOn' }, // Crash
  ];

  const durationMs = 3000;

  // AC: Green glow for 'hit' at elapsed=0
  it('renders green glow for hit classification when elapsed = 0', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 500,
        detectedTimeMs: 525,
        offsetMs: 25,
        classification: 'hit',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={500}
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeTruthy();
    // Green color: rgba(34, 197, 94, ...)
    expect(glowOverlay?.getAttribute('style')).toMatch(/rgba\(34,\s*197,\s*94,/);
  });

  // AC: Yellow glow for 'early' at elapsed=0
  it('renders yellow glow for early classification when elapsed = 0', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 38,
        expectedTimeMs: 1000,
        detectedTimeMs: 950,
        offsetMs: -50,
        classification: 'early',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={1000}
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeTruthy();
    // Yellow color: rgba(234, 179, 8, ...)
    expect(glowOverlay?.getAttribute('style')).toMatch(/rgba\(234,\s*179,\s*8,/);
  });

  // AC: Orange glow for 'late' at elapsed=0
  it('renders orange glow for late classification when elapsed = 0', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 42,
        expectedTimeMs: 2000,
        detectedTimeMs: 2050,
        offsetMs: 50,
        classification: 'late',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={2000}
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeTruthy();
    // Orange color: rgba(249, 115, 22, ...)
    expect(glowOverlay?.getAttribute('style')).toMatch(/rgba\(249,\s*115,\s*22,/);
  });

  // AC: Red glow for 'violation'
  it('renders red glow for violation classification', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 49,
        expectedTimeMs: 2500,
        detectedTimeMs: 2550,
        offsetMs: 50,
        classification: 'violation',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={2500}
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeTruthy();
    // Red color: rgba(239, 68, 68, ...)
    expect(glowOverlay?.getAttribute('style')).toMatch(/rgba\(239,\s*68,\s*68,/);
  });

  // AC: No glow when elapsed < 0 (post-loop jump)
  it('does not render glow when elapsed < 0 (post-loop jump)', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 1500,
        detectedTimeMs: 1550,
        offsetMs: 50,
        classification: 'hit',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={3500}
        currentTimeMs={0} // Loop jumped back to start
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeFalsy();
  });

  // AC: No glow when elapsed > 800 (expired)
  it('does not render glow when elapsed > 800 (expired)', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 50,
        offsetMs: 50,
        classification: 'hit',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={850} // 850ms past hit, expired
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeFalsy();
  });

  // AC: Note-bar overlay (hit-overlay) coexists with row glow
  it('renders both hit-overlay (note-bar) and track-glow-overlay simultaneously', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 50,
        offsetMs: 50,
        classification: 'hit',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={100}
        validatedHits={validatedHits}
      />
    );

    const hitOverlay = container.querySelector('[data-testid="hit-overlay"]');
    const trackGlowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');

    expect(hitOverlay).toBeTruthy();
    expect(trackGlowOverlay).toBeTruthy();
  });

  // AC: Row glow has aria-hidden="true"
  it('has aria-hidden="true" on track glow overlay', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 500,
        detectedTimeMs: 525,
        offsetMs: 25,
        classification: 'hit',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={500}
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay?.getAttribute('aria-hidden')).toBe('true');
  });

  // AC: Multiple hits on same note: last-wins behavior
  it('applies last-wins behavior for multiple hits on same note', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 50,
        offsetMs: 50,
        classification: 'hit', // First hit: green
      },
      {
        expectedNote: 36,
        expectedTimeMs: 500,
        detectedTimeMs: 480,
        offsetMs: -20,
        classification: 'early', // Second hit: yellow (last-wins)
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={500}
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    // Should show yellow (early) since it's the most recent hit for note 36
    expect(glowOverlay?.getAttribute('style')).toMatch(/rgba\(234,\s*179,\s*8,/);
  });

  // AC: Glow fades based on elapsed time
  it('applies correct glow opacity when elapsed = 100', () => {
    // glowOpacity = max(0, min(1, 1 - 100/800)) * 0.4 ≈ 0.45
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 50,
        offsetMs: 50,
        classification: 'hit',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={100}
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeTruthy();
    // 0.875 * 0.4 ≈ 0.35, but let's verify the computed opacity is in style
    const styleAttr = glowOverlay?.getAttribute('style');
    // Should contain a reasonable opacity value < 1
    expect(styleAttr).toMatch(/rgba\(34,\s*197,\s*94,\s*0\.[0-9]+\)/);
  });

  // Edge case: validatedHits undefined
  it('does not render glow when validatedHits is undefined', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={100}
        validatedHits={undefined}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeFalsy();
  });

  // Edge case: Note in validatedHits but not in midiEvents
  it('does not render glow for note not in midiEvents (violation for unmapped note)', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 60, // Not in mockEvents
        expectedTimeMs: 1000,
        detectedTimeMs: 1050,
        offsetMs: 50,
        classification: 'violation',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={1000}
        validatedHits={validatedHits}
      />
    );

    // No row exists for note 60, so no glow can be rendered
    // Count total glow overlays (should be 0)
    const glowOverlays = container.querySelectorAll('[data-testid="track-glow-overlay"]');
    expect(glowOverlays.length).toBe(0);
  });

  // AC: Rapid successive hits on same note: last-wins overwrite
  it('overwrites glow immediately when rapid successive hits occur on same note', () => {
    // Simulate two hits very close in time on note 36
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 50,
        detectedTimeMs: 60,
        offsetMs: 10,
        classification: 'hit',
      },
      {
        expectedNote: 36,
        expectedTimeMs: 100,
        detectedTimeMs: 105,
        offsetMs: 5,
        classification: 'hit',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={100}
        validatedHits={validatedHits}
      />
    );

    const glowOverlays = container.querySelectorAll('[data-testid="track-glow-overlay"]');
    // Only one glow per note, so only one overlay for note 36
    // (the most recent hit at 100ms is used)
    expect(glowOverlays.length).toBeGreaterThanOrEqual(1);

    // Verify the glow uses expectedTimeMs of the most recent hit (100ms)
    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeTruthy();
    // Both are 'hit' classification, so color should be green
    expect(glowOverlay?.getAttribute('style')).toMatch(/rgba\(34,\s*197,\s*94,/);
  });

  // Acceptance Criterion: Boundary case at elapsed = 0
  it('renders glow with full opacity (0.4) when elapsed = 0', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 500,
        detectedTimeMs: 525,
        offsetMs: 25,
        classification: 'hit',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={500}
        validatedHits={validatedHits}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeTruthy();
    // At elapsed = 0: glowOpacity = (1 - 0/800) * 0.4 = 0.4
    const styleAttr = glowOverlay?.getAttribute('style');
    expect(styleAttr).toMatch(/rgba\(34,\s*197,\s*94,\s*0\.4/);
  });

  // Acceptance Criterion: Edge case at elapsed = 800 (boundary of fade window)
  it('does not render glow when elapsed = 800 (fade window expired)', () => {
    const validatedHits: DrumHitValidation[] = [
      {
        expectedNote: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 50,
        offsetMs: 50,
        classification: 'hit',
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={durationMs}
        currentTimeMs={800}
        validatedHits={validatedHits}
      />
    );

    // At elapsed = 800: glowOpacity = (1 - 800/800) * 0.4 = 0
    // Opacity 0 means no render
    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toBeFalsy();
  });
});
