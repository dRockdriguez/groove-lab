import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import { MiniTimeline } from '../../molecules/MiniTimeline/MiniTimeline';
import { getDrumColor } from '@groovelab/utils';
import type { MidiEvent } from '@groovelab/types';

describe('getDrumColor utility', () => {
  it('returns Deep Red (#DC2626) for Kick Drum (note 36)', () => {
    expect(getDrumColor(36)).toBe('#DC2626');
  });

  it('returns Blue (#3B82F6) for Snare Drum (note 38)', () => {
    expect(getDrumColor(38)).toBe('#3B82F6');
  });

  it('returns Bright Yellow (#FBBF24) for Closed Hi-Hat (note 42)', () => {
    expect(getDrumColor(42)).toBe('#FBBF24');
  });

  it('returns Golden Yellow (#F59E0B) for Open Hi-Hat (note 46)', () => {
    expect(getDrumColor(46)).toBe('#F59E0B');
  });

  it('returns Purple (#A855F7) for High Tom (note 50)', () => {
    expect(getDrumColor(50)).toBe('#A855F7');
  });

  it('returns Indigo (#4F46E5) for Low Floor Tom (note 41)', () => {
    expect(getDrumColor(41)).toBe('#4F46E5');
  });

  it('returns Cyan (#06B6D4) for Crash Cymbal (note 49)', () => {
    expect(getDrumColor(49)).toBe('#06B6D4');
  });

  it('returns Teal (#0891B2) for Ride Cymbal (note 51)', () => {
    expect(getDrumColor(51)).toBe('#0891B2');
  });

  it('returns a default gray color (#6B7280) for unknown MIDI notes', () => {
    expect(getDrumColor(0)).toBe('#6B7280');
    expect(getDrumColor(127)).toBe('#6B7280');
    expect(getDrumColor(99)).toBe('#6B7280');
  });

  it('returns different colors for kick, snare, and hi-hat', () => {
    const kickColor = getDrumColor(36);
    const snareColor = getDrumColor(38);
    const hiHatColor = getDrumColor(42);
    expect(kickColor).not.toBe(snareColor);
    expect(kickColor).not.toBe(hiHatColor);
    expect(snareColor).not.toBe(hiHatColor);
  });
});

describe('ExercisePlaybackTimeline drum colors', () => {
  const mockEvents: MidiEvent[] = [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
    { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
    { timestamp: 1000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
  ];

  it('applies kick drum color (#DC2626) to note 36 markers', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
      />
    );
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers[0]).toHaveStyle({ backgroundColor: '#DC2626' });
  });

  it('applies snare drum color (#3B82F6) to note 38 markers', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
      />
    );
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers[1]).toHaveStyle({ backgroundColor: '#3B82F6' });
  });

  it('applies hi-hat color (#FBBF24) to note 42 markers', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
      />
    );
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers[2]).toHaveStyle({ backgroundColor: '#FBBF24' });
  });

  it('does not use hardcoded green color for note markers', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
      />
    );
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    markers.forEach((marker) => {
      expect(marker).not.toHaveClass('bg-green-500');
    });
  });
});

describe('MiniTimeline drum colors', () => {
  const mockEvents: MidiEvent[] = [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
    { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
    { timestamp: 1000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
  ];

  it('applies rudiment-specific colors to mini timeline note markers', () => {
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
        onSeek={() => {}}
      />
    );
    const markers = container.querySelectorAll('[data-testid="mini-note-marker"]');
    expect(markers[0]).toHaveStyle({ backgroundColor: '#DC2626' }); // kick
    expect(markers[1]).toHaveStyle({ backgroundColor: '#3B82F6' }); // snare
    expect(markers[2]).toHaveStyle({ backgroundColor: '#FBBF24' }); // closed hi-hat
  });

  it('does not use hardcoded green color for mini note markers', () => {
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
        onSeek={() => {}}
      />
    );
    const markers = container.querySelectorAll('[data-testid="mini-note-marker"]');
    markers.forEach((marker) => {
      expect(marker).not.toHaveClass('bg-green-500');
    });
  });
});
