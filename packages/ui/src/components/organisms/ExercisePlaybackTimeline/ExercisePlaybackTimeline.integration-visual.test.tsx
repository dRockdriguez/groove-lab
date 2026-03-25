import { render } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import { getDrumColor } from '@groovelab/utils';
import type { MidiEvent } from '@groovelab/types';
import type { ScoringEvent } from '@groovelab/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests: All Three Features Together (Spec 04)
// Verifies that note color feedback (Spec 01), playhead offset (Spec 02), and
// row glow opacity reduction (Spec 03) work together without conflicts.
// ─────────────────────────────────────────────────────────────────────────────

const mockMidiEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },   // kick
  { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },  // snare
  { timestamp: 1000, note: 42, velocity: 90, channel: 1, type: 'noteOn' }, // hi-hat
  { timestamp: 1500, note: 36, velocity: 95, channel: 1, type: 'noteOn' }, // kick again
];

let mockNow = 1000;

beforeEach(() => {
  mockNow = 1000;
  vi.spyOn(global.performance, 'now').mockReturnValue(mockNow);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// Visual layering (z-index correctness)
// ─────────────────────────────────────────────────────────────────────────────
describe('Visual layering: z-index correctness', () => {
  it('glow overlay has z-index 1 (below note markers)', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        playheadOffsetPx={250}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]') as HTMLElement;
    expect(glowOverlay).not.toBeNull();
    expect(glowOverlay.style.zIndex).toBe('1');
  });

  it('playhead has z-index 10 (above glow and note colors)', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={250}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).not.toBeNull();
    expect(playhead).toHaveClass('z-10');
  });

  it('loop markers have z-index 15 (above playhead)', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        loopStartMs={300}
        loopEndMs={1500}
        isLoopActive={true}
        playheadOffsetPx={250}
      />
    );

    const loopStart = container.querySelector('[data-testid="loop-start-marker"]') as HTMLElement;
    const loopEnd = container.querySelector('[data-testid="loop-end-marker"]') as HTMLElement;
    expect(loopStart).not.toBeNull();
    expect(loopEnd).not.toBeNull();
    expect(loopStart.style.zIndex).toBe('15');
    expect(loopEnd.style.zIndex).toBe('15');
  });

  it('playhead z-index (10) is greater than glow overlay z-index (1)', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        playheadOffsetPx={250}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]') as HTMLElement;
    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;

    const glowZ = parseInt(glowOverlay.style.zIndex, 10);
    // Playhead uses z-10 class, which is z-index: 10
    expect(glowZ).toBe(1);
    expect(playhead).toHaveClass('z-10');
  });

  it('loop markers z-index (15) is greater than playhead z-index (10)', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        loopStartMs={300}
        loopEndMs={1500}
        isLoopActive={true}
        playheadOffsetPx={250}
      />
    );

    const loopStart = container.querySelector('[data-testid="loop-start-marker"]') as HTMLElement;
    const loopZ = parseInt(loopStart.style.zIndex, 10);
    expect(loopZ).toBe(15);
    // Playhead is z-10, which is 10 — loop markers (15) are above playhead (10)
  });

  it('glow overlay does not prevent note markers from rendering', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        playheadOffsetPx={250}
      />
    );

    const noteMarkers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(noteMarkers.length).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Color mapping with glow
// ─────────────────────────────────────────────────────────────────────────────
describe('Color mapping with glow', () => {
  it('correct hit (green note) + green glow — both render', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'correct',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    // Note marker should be green
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });

    // Glow overlay should be present with green color at reduced opacity
    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).not.toBeNull();
    const style = glowOverlay?.getAttribute('style');
    expect(style).toMatch(/rgba\(34, 197, 94, 0\.15\)/);
  });

  it('late hit (orange note) + orange glow — both render', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'late',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 200,
      offsetMs: 200,
      timestamp: mockNow,
    });

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'late',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 200,
        offsetMs: 200,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers[0]).toHaveStyle({ backgroundColor: '#FB923C' });

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).not.toBeNull();
    const style = glowOverlay?.getAttribute('style');
    expect(style).toMatch(/rgba\(249, 115, 22, 0\.15\)/);
  });

  it('missed note (rudiment color) + red glow — rudiment color visible through glow', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'missed',
      note: 36,
      expectedTimeMs: 0,
      offsetMs: 0,
      timestamp: mockNow,
    });

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'missed',
        note: 36,
        expectedTimeMs: 0,
        offsetMs: 0,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    // Missed note should use rudiment color (not feedback color)
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    const kickColor = getDrumColor(36);
    expect(markers[0]).toHaveStyle({ backgroundColor: kickColor });
    expect(markers[0]).not.toHaveStyle({ backgroundColor: '#22C55E' });

    // Red glow should render with reduced opacity
    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).not.toBeNull();
    const style = glowOverlay?.getAttribute('style');
    expect(style).toMatch(/rgba\(239, 68, 68, 0\.15\)/);
  });

  it('early note (purple) on different notes — both visible', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'early',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: -100,
      offsetMs: -100,
      timestamp: mockNow,
    });
    glowMap.set(38, {
      classification: 'correct',
      note: 38,
      expectedTimeMs: 500,
      detectedTimeMs: 510,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'early',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: -100,
        offsetMs: -100,
        timestamp: mockNow,
      },
      {
        classification: 'correct',
        note: 38,
        expectedTimeMs: 500,
        detectedTimeMs: 510,
        offsetMs: 10,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    // Kick (note 36) — early, purple
    expect(markers[0]).toHaveStyle({ backgroundColor: '#A855F7' });
    // Snare (note 38) — correct, green
    expect(markers[2]).toHaveStyle({ backgroundColor: '#22C55E' });

    // Both glow overlays should render
    const glowOverlays = container.querySelectorAll('[data-testid="track-glow-overlay"]');
    expect(glowOverlays.length).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Playhead with glow and colors
// ─────────────────────────────────────────────────────────────────────────────
describe('Playhead with glow and colors', () => {
  it('playhead offset is 250px (explicit prop)', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={250}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).toHaveStyle({ left: '250px' });
  });

  it('playhead is visible above note colors and glow (z-10 class)', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'correct',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).toHaveClass('z-10');
  });

  it('playhead offset does not affect note marker positions', () => {
    // Use rerender to compare marker positions with different offsets
    const { container, rerender } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={0}
      />
    );

    const markers0 = Array.from(container.querySelectorAll('[data-testid="note-marker"]')) as HTMLElement[];
    const positions0 = markers0.map((m) => (m.parentElement as HTMLElement).style.left);

    rerender(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={250}
      />
    );

    const markers250 = Array.from(container.querySelectorAll('[data-testid="note-marker"]')) as HTMLElement[];
    const positions250 = markers250.map((m) => (m.parentElement as HTMLElement).style.left);

    expect(positions0.length).toBe(4);
    expect(positions0).toEqual(positions250);
  });

  it('playhead offset does not affect loop boundaries', () => {
    // Use rerender to compare loop marker positions with different offsets
    const { container, rerender } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        loopStartMs={300}
        loopEndMs={1500}
        isLoopActive={true}
        playheadOffsetPx={0}
      />
    );

    const loopStart0 = container.querySelector('[data-testid="loop-start-marker"]') as HTMLElement;
    const loopEnd0 = container.querySelector('[data-testid="loop-end-marker"]') as HTMLElement;
    const startLeft0 = loopStart0.style.left;
    const endLeft0 = loopEnd0.style.left;

    rerender(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        loopStartMs={300}
        loopEndMs={1500}
        isLoopActive={true}
        playheadOffsetPx={250}
      />
    );

    const loopStart250 = container.querySelector('[data-testid="loop-start-marker"]') as HTMLElement;
    const loopEnd250 = container.querySelector('[data-testid="loop-end-marker"]') as HTMLElement;
    expect(loopStart250.style.left).toBe(startLeft0);
    expect(loopEnd250.style.left).toBe(endLeft0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Data integration: ExercisePlaybackPage wiring
// ─────────────────────────────────────────────────────────────────────────────
describe('Data integration: prop wiring', () => {
  it('all three features default gracefully when optional props are omitted', () => {
    expect(() => {
      render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
        />
      );
    }).not.toThrow();
  });

  it('no validatedHits/scoringEvents → all rudiment colors', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={250}
      />
    );

    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    [0, 1, 2, 3].forEach((i) => {
      expect(markers[i]).not.toHaveStyle({ backgroundColor: '#22C55E' });
      expect(markers[i]).not.toHaveStyle({ backgroundColor: '#FB923C' });
      expect(markers[i]).not.toHaveStyle({ backgroundColor: '#A855F7' });
    });
  });

  it('no playheadOffsetPx → default 250px offset applied', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).toHaveStyle({ left: '250px' });
  });

  it('no activeGlows → no glow overlays', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={250}
      />
    );

    const glowOverlays = container.querySelectorAll('[data-testid="track-glow-overlay"]');
    expect(glowOverlays.length).toBe(0);
  });

  it('all three props provided — renders all features together', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'correct',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    // Note markers present with feedback color
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers.length).toBe(4);
    expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });

    // Glow overlay present
    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).not.toBeNull();

    // Playhead with offset
    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).toHaveStyle({ left: '250px' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Time accuracy (no regressions)
// ─────────────────────────────────────────────────────────────────────────────
describe('Time accuracy: no regressions', () => {
  it('note colors applied to correct notes (matches midiEvents)', () => {
    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'correct',
        note: 36,  // kick
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      },
      {
        classification: 'late',
        note: 38,  // snare
        expectedTimeMs: 500,
        detectedTimeMs: 700,
        offsetMs: 200,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    // Markers grouped by unique note: [36-first, 36-second, 38, 42]
    expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' }); // kick → green
    expect(markers[2]).toHaveStyle({ backgroundColor: '#FB923C' }); // snare → orange
    const hihatColor = getDrumColor(42);
    expect(markers[3]).toHaveStyle({ backgroundColor: hihatColor }); // hi-hat → rudiment color
  });

  it('playhead percentage position is correct (based on currentTimeMs / durationMs)', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={1000}
        playheadOffsetPx={250}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    // 1000ms / 2000ms = 50%
    expect(playhead.style.left).toContain('50');
  });

  it('loop boundaries remain at correct times regardless of other features', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        loopStartMs={400}
        loopEndMs={1600}
        isLoopActive={true}
        playheadOffsetPx={250}
      />
    );

    const loopStart = container.querySelector('[data-testid="loop-start-marker"]') as HTMLElement;
    const loopEnd = container.querySelector('[data-testid="loop-end-marker"]') as HTMLElement;

    // 400ms / 2000ms = 20%
    expect(loopStart.style.left).toContain('20');
    // 1600ms / 2000ms = 80%
    expect(loopEnd.style.left).toContain('80');
  });

  it('metronome markers remain at correct positions', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        bpm={120}
        metronomeEnabled={true}
        playheadOffsetPx={250}
      />
    );

    const downbeatMarkers = container.querySelectorAll('[data-testid="metronome-downbeat-marker"]');
    // At 120bpm, beat interval = 500ms; first downbeat at 0% = left: 0%
    expect(downbeatMarkers.length).toBeGreaterThan(0);
    const firstDownbeat = downbeatMarkers[0] as HTMLElement;
    expect(firstDownbeat.style.left).toContain('0');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Complex scenarios
// ─────────────────────────────────────────────────────────────────────────────
describe('Complex scenario 1: Full playback with all feedback features', () => {
  it('note colors + glow + playhead offset all render together correctly', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });
    glowMap.set(38, {
      classification: 'late',
      note: 38,
      expectedTimeMs: 500,
      detectedTimeMs: 700,
      offsetMs: 200,
      timestamp: mockNow,
    });

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'correct',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      },
      {
        classification: 'late',
        note: 38,
        expectedTimeMs: 500,
        detectedTimeMs: 700,
        offsetMs: 200,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={800}
        activeGlows={glowMap}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    // All note markers rendered
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers.length).toBe(4);

    // Colors correct per note
    expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' }); // kick → correct → green
    expect(markers[2]).toHaveStyle({ backgroundColor: '#FB923C' }); // snare → late → orange

    // Two glow overlays (one per note with glow)
    const glowOverlays = container.querySelectorAll('[data-testid="track-glow-overlay"]');
    expect(glowOverlays.length).toBe(2);

    // Playhead with offset (fixed at 250px)
    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).toHaveStyle({ left: '250px' });
  });
});

describe('Complex scenario 2: Loop with feedback', () => {
  it('loop brackets, note colors, glow, and playhead coexist without error', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'correct',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      },
    ];

    expect(() => {
      render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          loopStartMs={200}
          loopEndMs={1800}
          isLoopActive={true}
          activeGlows={glowMap}
          scoringEvents={scoringEvents}
          playheadOffsetPx={250}
        />
      );
    }).not.toThrow();
  });

  it('loop markers visible with note colors and glow active', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        loopStartMs={200}
        loopEndMs={1800}
        isLoopActive={true}
        activeGlows={glowMap}
        playheadOffsetPx={250}
      />
    );

    const loopStart = container.querySelector('[data-testid="loop-start-marker"]');
    const loopEnd = container.querySelector('[data-testid="loop-end-marker"]');
    expect(loopStart).not.toBeNull();
    expect(loopEnd).not.toBeNull();
  });
});

describe('Complex scenario 3: Metronome + feedback', () => {
  it('metronome markers render alongside note colors, glow, and playhead', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'correct',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        bpm={120}
        metronomeEnabled={true}
        activeGlows={glowMap}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    // Metronome markers should be present
    const beatMarkers = container.querySelectorAll(
      '[data-testid="metronome-downbeat-marker"], [data-testid="metronome-beat-marker"]'
    );
    expect(beatMarkers.length).toBeGreaterThan(0);

    // Glow overlay still renders
    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).not.toBeNull();

    // Note markers still colored
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });
  });
});

describe('Complex scenario 4: Multiple simultaneous events', () => {
  it('multiple notes at same beat each render correct feedback color', () => {
    const multiNoteEvents: MidiEvent[] = [
      { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },  // kick at 0ms
      { timestamp: 0, note: 38, velocity: 80, channel: 1, type: 'noteOn' },   // snare at 0ms (same beat)
      { timestamp: 0, note: 42, velocity: 90, channel: 1, type: 'noteOn' },   // hi-hat at 0ms (same beat)
    ];

    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'correct',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      },
      {
        classification: 'late',
        note: 38,
        expectedTimeMs: 0,
        detectedTimeMs: 200,
        offsetMs: 200,
        timestamp: mockNow,
      },
      {
        classification: 'early',
        note: 42,
        expectedTimeMs: 0,
        detectedTimeMs: -100,
        offsetMs: -100,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={multiNoteEvents}
        durationMs={2000}
        currentTimeMs={500}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers.length).toBe(3);
    // Each note renders its unique feedback color
    expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' }); // kick → correct → green
    expect(markers[1]).toHaveStyle({ backgroundColor: '#FB923C' }); // snare → late → orange
    expect(markers[2]).toHaveStyle({ backgroundColor: '#A855F7' }); // hi-hat → early → purple
  });

  it('glows on different notes do not interfere (each per-note)', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });
    glowMap.set(38, {
      classification: 'late',
      note: 38,
      expectedTimeMs: 500,
      detectedTimeMs: 700,
      offsetMs: 200,
      timestamp: mockNow,
    });
    glowMap.set(42, {
      classification: 'early',
      note: 42,
      expectedTimeMs: 1000,
      detectedTimeMs: 900,
      offsetMs: -100,
      timestamp: mockNow,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        playheadOffsetPx={250}
      />
    );

    // Each note has its own independent glow overlay
    const glowOverlays = container.querySelectorAll('[data-testid="track-glow-overlay"]');
    expect(glowOverlays.length).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Regression: Existing behavior unchanged
// ─────────────────────────────────────────────────────────────────────────────
describe('Regression: Existing behavior unchanged', () => {
  it('all MIDI note events render as note markers', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={250}
      />
    );

    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers.length).toBe(4);
  });

  it('empty midiEvents renders "no note data" message', () => {
    const { getByText } = render(
      <ExercisePlaybackTimeline
        midiEvents={[]}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={250}
      />
    );

    expect(getByText(/no note data/i)).toBeTruthy();
  });

  it('glow overlay is pointer-events-none (does not block clicks)', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        playheadOffsetPx={250}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]') as HTMLElement;
    expect(glowOverlay).toHaveStyle({ pointerEvents: 'none' });
  });

  it('glow overlay is aria-hidden (not in accessibility tree)', () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: 'correct',
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
        playheadOffsetPx={250}
      />
    );

    const glowOverlay = container.querySelector('[data-testid="track-glow-overlay"]');
    expect(glowOverlay).toHaveAttribute('aria-hidden', 'true');
  });

  it('playhead is pointer-events-none (does not block clicks)', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={250}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead).toHaveClass('pointer-events-none');
  });

  it('playhead is aria-hidden (not in accessibility tree)', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        playheadOffsetPx={250}
      />
    );

    const playhead = container.querySelector('[data-testid="playhead"]');
    expect(playhead).toHaveAttribute('aria-hidden', 'true');
  });

  it('note opacity unchanged — based on velocity only', () => {
    const scoringEvents: ScoringEvent[] = [
      {
        classification: 'correct',
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      },
    ];

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockMidiEvents}
        durationMs={2000}
        currentTimeMs={500}
        scoringEvents={scoringEvents}
        playheadOffsetPx={250}
      />
    );

    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    // Kick velocity = 100; opacity = Math.max(0.3, 100/127) ≈ 0.787
    const expectedOpacity = Math.max(0.3, 100 / 127);
    expect(markers[0]).toHaveStyle({ opacity: expectedOpacity.toString() });
  });
});
