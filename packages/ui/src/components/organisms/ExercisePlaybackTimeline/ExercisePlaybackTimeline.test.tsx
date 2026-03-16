import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import type { MidiEvent } from '@groovelab/types';

const mockEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
  { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
  { timestamp: 1000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
  { timestamp: 1500, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
];

describe('ExercisePlaybackTimeline', () => {
  it('renders a track for each unique drum element', () => {
    render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
      />
    );
    // 3 unique notes: 36 (Kick Drum), 38 (Snare Drum), 42 (Closed Hi-Hat)
    expect(screen.getByText(/kick drum/i)).toBeInTheDocument();
    expect(screen.getByText(/snare drum/i)).toBeInTheDocument();
    expect(screen.getByText(/closed hi-hat/i)).toBeInTheDocument();
  });

  it('renders note markers for each MIDI event', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
      />
    );
    const markers = container.querySelectorAll('[data-testid="note-marker"]');
    expect(markers.length).toBe(mockEvents.length);
  });

  it('renders a playhead cursor', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
      />
    );
    expect(container.querySelector('[data-testid="playhead"]')).toBeInTheDocument();
  });

  it('positions playhead at correct position based on current time', () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={1000}
      />
    );
    const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
    expect(playhead.style.left).toBe('50%');
  });

  it('displays "no note data" message when midiEvents is empty', () => {
    render(
      <ExercisePlaybackTimeline
        midiEvents={[]}
        durationMs={2000}
        currentTimeMs={0}
      />
    );
    expect(screen.getByText(/no note data/i)).toBeInTheDocument();
  });

  it('renders track labels using GM drum names', () => {
    render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
      />
    );
    expect(screen.getByText(/kick drum/i)).toBeInTheDocument();
  });
});
