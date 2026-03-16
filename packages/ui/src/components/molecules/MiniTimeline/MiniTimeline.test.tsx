import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MiniTimeline } from './MiniTimeline';
import type { MidiEvent } from '@groovelab/types';

const mockEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
  { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
  { timestamp: 1000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
];

describe('MiniTimeline', () => {
  it('renders the mini timeline container', () => {
    render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
        onSeek={vi.fn()}
      />
    );
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('calls onSeek when clicked', () => {
    const onSeek = vi.fn();
    render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
        onSeek={onSeek}
      />
    );
    fireEvent.click(screen.getByRole('presentation'));
    expect(onSeek).toHaveBeenCalled();
  });

  it('shows all MIDI event markers', () => {
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
        onSeek={vi.fn()}
      />
    );
    const markers = container.querySelectorAll('[data-testid="mini-note-marker"]');
    expect(markers.length).toBe(mockEvents.length);
  });

  it('has accessible label', () => {
    render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={0}
        onSeek={vi.fn()}
      />
    );
    expect(screen.getByRole('presentation')).toHaveAttribute('aria-label', expect.stringMatching(/timeline overview/i));
  });
});
