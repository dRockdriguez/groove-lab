import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import { getDrumColor } from '@groovelab/utils';
import type { MidiEvent, ScoringEvent } from '@groovelab/utils';

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPTANCE CRITERIA MAPPING
// ─────────────────────────────────────────────────────────────────────────────
// AC1: classification === 'correct' renders green (#22C55E)
// AC2: classification === 'late' renders orange (#FB923C)
// AC3: classification === 'early' renders purple (#A855F7)
// AC4: classification === 'missed' renders rudiment color
// AC5: classification === 'wrong_note' renders rudiment color
// AC6: Note not in scoringEvents renders rudiment color
// AC7: Lookup built via useMemo, most-recent wins (highest detectedTimeMs)
// AC8: Multiple hits same note → most recent (highest detectedTimeMs ?? timestamp) wins
// AC9: Color determined by lookup first, getDrumColor fallback
// AC10: scoringEvents prop optional; undefined/empty → all rudiment colors
// AC11: ExercisePlaybackPage passes scoringEvents and updates on hits/misses/resets/loops

describe('ExercisePlaybackTimeline note color feedback', () => {
  const mockMidiEvents: MidiEvent[] = [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },    // kick at 0ms
    { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },   // snare at 500ms
    { timestamp: 1000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },  // hi-hat at 1000ms
    { timestamp: 1500, note: 36, velocity: 95, channel: 1, type: 'noteOn' },  // kick again at 1500ms
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // AC1: Green color for 'correct' classification
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC1: correct hits render green (#22C55E)', () => {
    it('renders note marker green when classification is correct', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 50,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // First marker (kick at 0ms with correct classification)
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });
    });

    it('applies green color to multiple correct hits on different notes', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 50,
          timestamp: Date.now(),
        },
        {
          classification: 'correct',
          note: 38,
          expectedTimeMs: 500,
          detectedTimeMs: 550,
          offsetMs: 50,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Check markers for notes with correct classification
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' }); // kick
      expect(markers[1]).toHaveStyle({ backgroundColor: '#22C55E' }); // snare
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC2: Orange color for 'late' classification
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC2: late hits render orange (#FB923C)', () => {
    it('renders note marker orange when classification is late', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'late',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 200,
          offsetMs: 200,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      expect(markers[0]).toHaveStyle({ backgroundColor: '#FB923C' });
    });

    it('applies orange color to late hits on multiple notes', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'late',
          note: 38,
          expectedTimeMs: 500,
          detectedTimeMs: 750,
          offsetMs: 250,
          timestamp: Date.now(),
        },
        {
          classification: 'late',
          note: 42,
          expectedTimeMs: 1000,
          detectedTimeMs: 1150,
          offsetMs: 150,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Markers are grouped by unique note: [36-first, 36-second, 38, 42]
      // Snare (38) and hi-hat (42) with late classification
      expect(markers[2]).toHaveStyle({ backgroundColor: '#FB923C' });
      expect(markers[3]).toHaveStyle({ backgroundColor: '#FB923C' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC3: Purple color for 'early' classification
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC3: early hits render purple (#A855F7)', () => {
    it('renders note marker purple when classification is early', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'early',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: -150,
          offsetMs: -150,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      expect(markers[0]).toHaveStyle({ backgroundColor: '#A855F7' });
    });

    it('applies purple color to early hits on different notes', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'early',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: -100,
          offsetMs: -100,
          timestamp: Date.now(),
        },
        {
          classification: 'early',
          note: 42,
          expectedTimeMs: 1000,
          detectedTimeMs: 850,
          offsetMs: -150,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Markers are grouped by unique note: [36-first, 36-second, 38, 42]
      // Kick (36) and hi-hat (42) with early classification
      expect(markers[0]).toHaveStyle({ backgroundColor: '#A855F7' });
      expect(markers[3]).toHaveStyle({ backgroundColor: '#A855F7' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC4: 'missed' classification renders rudiment color (falls back to getDrumColor)
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC4: missed hits render rudiment color', () => {
    it('renders rudiment color for missed note', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'missed',
          note: 36,
          expectedTimeMs: 100,
          detectedTimeMs: undefined,
          offsetMs: 0,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Missed should use rudiment color, not any feedback color
      expect(markers[0]).not.toHaveStyle({ backgroundColor: '#22C55E' }); // not green
      expect(markers[0]).not.toHaveStyle({ backgroundColor: '#FB923C' }); // not orange
      expect(markers[0]).not.toHaveStyle({ backgroundColor: '#A855F7' }); // not purple
    });

    it('missed classification does not apply feedback color for expected hits', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'missed',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: undefined,
          offsetMs: 0,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      const kickColor = getDrumColor(36);
      expect(markers[0]).toHaveStyle({ backgroundColor: kickColor });
      // Should NOT be green
      expect(markers[0]).not.toHaveStyle({ backgroundColor: '#22C55E' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC5: 'wrong_note' classification renders rudiment color
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC5: wrong_note hits render rudiment color', () => {
    it('renders rudiment color for wrong_note classification', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'wrong_note',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 0,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      const kickColor = getDrumColor(36);
      expect(markers[0]).toHaveStyle({ backgroundColor: kickColor });
    });

    it('wrong_note does not show feedback colors on any note', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'wrong_note',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 0,
          timestamp: Date.now(),
        },
        {
          classification: 'wrong_note',
          note: 42,
          expectedTimeMs: 1000,
          detectedTimeMs: 1050,
          offsetMs: 0,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Should use rudiment colors, not feedback colors
      expect(markers[0]).not.toHaveStyle({ backgroundColor: '#22C55E' }); // not green
      expect(markers[0]).not.toHaveStyle({ backgroundColor: '#FB923C' }); // not orange
      expect(markers[0]).not.toHaveStyle({ backgroundColor: '#A855F7' }); // not purple
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#22C55E' }); // not green
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#FB923C' }); // not orange
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#A855F7' }); // not purple
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC6: Note not in scoringEvents renders rudiment color
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC6: notes not in scoringEvents render rudiment color', () => {
    it('renders rudiment color for notes without scoringEvents entries', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 50,
          timestamp: Date.now(),
        },
        // Only kick (36) has a scoring event
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Markers are grouped by unique note: [36-first, 36-second, 38, 42]
      // Kick (36) should have feedback color (green)
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });
      // Snare (38) is not in scoringEvents, should show rudiment color (not feedback color)
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#22C55E' });
      // Hi-hat (42) is not in scoringEvents, should show rudiment color (not feedback color)
      expect(markers[3]).not.toHaveStyle({ backgroundColor: '#22C55E' });
    });

    it('unscored notes maintain original drum color when others are scored', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'late',
          note: 38,
          expectedTimeMs: 500,
          detectedTimeMs: 750,
          offsetMs: 250,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Kick (36) is not in scoringEvents
      const kickColor = getDrumColor(36);
      expect(markers[0]).toHaveStyle({ backgroundColor: kickColor });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC7: Lookup built via useMemo from scoringEvents; most-recent wins
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC7: lookup memoized from scoringEvents', () => {
    it('uses memoized lookup for color calculation', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 50,
          timestamp: Date.now(),
        },
      ];

      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      let markers = container.querySelectorAll('[data-testid="note-marker"]');
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });

      // Re-render with same scoringEvents (memoization should prevent lookup rebuild)
      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          scoringEvents={scoringEvents}
        />
      );

      markers = container.querySelectorAll('[data-testid="note-marker"]');
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });
    });

    it('rebuilds lookup when scoringEvents changes', () => {
      const scoringEvents1: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 50,
          timestamp: Date.now(),
        },
      ];

      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents1}
        />
      );

      let markers = container.querySelectorAll('[data-testid="note-marker"]');
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });

      // Change to late classification
      const scoringEvents2: ScoringEvent[] = [
        {
          classification: 'late',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 200,
          offsetMs: 200,
          timestamp: Date.now(),
        },
      ];

      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents2}
        />
      );

      markers = container.querySelectorAll('[data-testid="note-marker"]');
      expect(markers[0]).toHaveStyle({ backgroundColor: '#FB923C' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC8: Multiple hits on same note → highest detectedTimeMs wins
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC8: multiple hits on same note — most recent wins', () => {
    it('uses most recent hit (highest detectedTimeMs) for color', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'early',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: -100,
          offsetMs: -100,
          timestamp: Date.now(),
        },
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 1500,
          detectedTimeMs: 1550,
          offsetMs: 50,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Markers are grouped by unique note: [36-first, 36-second, 38, 42]
      // Both kick markers should show 'correct' color (most recent = 1550 > -100)
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });
      expect(markers[1]).toHaveStyle({ backgroundColor: '#22C55E' });
    });

    it('handles multiple same-note hits with detectedTimeMs undefined fallback', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 1500, // later detectedTimeMs
          offsetMs: 0,
          timestamp: 100,
        },
        {
          classification: 'missed',
          note: 36,
          expectedTimeMs: 1500,
          detectedTimeMs: undefined, // fallback to timestamp (1000) which is less than 1500
          offsetMs: 0,
          timestamp: 1000,
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Markers are grouped by unique note: [36-first, 36-second, 38, 42]
      // Both kick markers should show 'correct' (detectedTimeMs: 1500 > timestamp: 1000)
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' });
      expect(markers[1]).toHaveStyle({ backgroundColor: '#22C55E' });
    });

    it('prefers detectedTimeMs over timestamp for most-recent determination', () => {
      const now = Date.now();
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'late',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 100,
          offsetMs: 100,
          timestamp: now + 1000, // newer timestamp, but older detectedTimeMs
        },
        {
          classification: 'early',
          note: 36,
          expectedTimeMs: 1500,
          detectedTimeMs: 1400,
          offsetMs: -100,
          timestamp: now, // older timestamp, but newer detectedTimeMs
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Markers are grouped by unique note: [36-first, 36-second, 38, 42]
      // Should use 'early' because detectedTimeMs 1400 > 100
      expect(markers[0]).toHaveStyle({ backgroundColor: '#A855F7' });
      expect(markers[1]).toHaveStyle({ backgroundColor: '#A855F7' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC9: Color determined by lookup first, getDrumColor fallback
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC9: lookup first, fallback to getDrumColor', () => {
    it('prioritizes lookup color over getDrumColor', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 50,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      const kickColor = getDrumColor(36); // would be '#DC2626'
      expect(markers[0]).not.toHaveStyle({ backgroundColor: kickColor });
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' }); // feedback color wins
    });

    it('falls back to getDrumColor when note not in lookup', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 50,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Markers are grouped by unique note: [36-first, 36-second, 38, 42]
      // Snare (38) at markers[2] not in lookup, should NOT use feedback colors
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#22C55E' }); // not green
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#FB923C' }); // not orange
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#A855F7' }); // not purple
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC10: scoringEvents prop optional; undefined/empty → all rudiment colors
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC10: scoringEvents prop is optional', () => {
    it('renders all notes with rudiment colors when scoringEvents is undefined', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={undefined}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // All should use rudiment colors, not feedback colors
      [0, 1, 2, 3].forEach((i) => {
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#22C55E' });
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#FB923C' });
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#A855F7' });
      });
    });

    it('renders all notes with rudiment colors when scoringEvents is empty array', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={[]}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // All should use rudiment colors, not feedback colors
      [0, 1, 2, 3].forEach((i) => {
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#22C55E' });
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#FB923C' });
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#A855F7' });
      });
    });

    it('does not pass scoringEvents prop — defaults to undefined', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // All notes should use rudiment colors when prop is not provided
      [0, 1].forEach((i) => {
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#22C55E' });
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#FB923C' });
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#A855F7' });
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Additional: Verify opacity calculation unchanged
  // ───────────────────────────────────────────────────────────────────────────
  describe('Opacity calculation unchanged', () => {
    it('maintains original note opacity based on velocity', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 50,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // First marker has velocity 100
      const expectedOpacity = Math.max(0.3, 100 / 127);
      expect(markers[0]).toHaveStyle({
        opacity: expectedOpacity.toString(),
      });
    });

    it('applies color AND opacity together correctly', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'late',
          note: 38,
          expectedTimeMs: 500,
          detectedTimeMs: 750,
          offsetMs: 250,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Markers are grouped by unique note: [36-first, 36-second, 38, 42]
      // Index 2 is snare (note 38, velocity 80) — late classification
      const expectedOpacity = Math.max(0.3, 80 / 127);
      expect(markers[2]).toHaveStyle({ backgroundColor: '#FB923C' });
      expect(markers[2]).toHaveStyle({ opacity: expectedOpacity.toString() });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Edge cases
  // ───────────────────────────────────────────────────────────────────────────
  describe('Edge cases', () => {
    it('handles note exists in exercise but was never played (in midiEvents but not in scoringEvents)', () => {
      const scoringEvents: ScoringEvent[] = [];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // All should render with rudiment colors, not feedback colors
      [0, 1, 2, 3].forEach((i) => {
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#22C55E' });
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#FB923C' });
        expect(markers[i]).not.toHaveStyle({ backgroundColor: '#A855F7' });
      });
    });

    it('silently ignores scoring event for note not in midiEvents', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 99, // Not in mockMidiEvents
          expectedTimeMs: 2000,
          detectedTimeMs: 2050,
          offsetMs: 50,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      // Should not error; just render the existing notes with rudiment colors
      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      expect(markers).toHaveLength(4);
    });

    it('handles mixed correct and missed classifications on different notes', () => {
      const scoringEvents: ScoringEvent[] = [
        {
          classification: 'correct',
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 50,
          offsetMs: 50,
          timestamp: Date.now(),
        },
        {
          classification: 'missed',
          note: 38,
          expectedTimeMs: 500,
          detectedTimeMs: undefined,
          offsetMs: 0,
          timestamp: Date.now(),
        },
        {
          classification: 'late',
          note: 42,
          expectedTimeMs: 1000,
          detectedTimeMs: 1200,
          offsetMs: 200,
          timestamp: Date.now(),
        },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          scoringEvents={scoringEvents}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // Markers are grouped by unique note: [36-first, 36-second, 38, 42]
      expect(markers[0]).toHaveStyle({ backgroundColor: '#22C55E' }); // first kick (note 36) → correct
      // markers[1] is the second kick (note 36) - also uses same lookup as first kick, so also green
      expect(markers[1]).toHaveStyle({ backgroundColor: '#22C55E' }); // second kick (note 36) → correct (same note lookup)
      // markers[2] is snare (note 38) → missed should not use feedback color
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#22C55E' }); // not green
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#FB923C' }); // not orange
      expect(markers[2]).not.toHaveStyle({ backgroundColor: '#A855F7' }); // not purple
      expect(markers[3]).toHaveStyle({ backgroundColor: '#FB923C' }); // hi-hat (note 42) → late
    });
  });
});
