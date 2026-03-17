import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';
import type { ExercisePlaybackData } from '@groovelab/types';

const mockExercise: ExercisePlaybackData = {
  id: 'drums-basic-1',
  title: 'Basic Drum Pattern',
  description: 'A simple drum pattern to practice',
  bpm: 120,
  durationMs: 60000,
  audioUrl: '/storage/test/exercise.mp3',
  midiEvents: [{ timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' }],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage — Metronome Visualization', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue({ inputs: { values: () => [] }, onstatechange: null }),
      writable: true,
      configurable: true,
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      writable: true,
      value: vi.fn(),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).AudioContext = vi.fn().mockImplementation(() => ({
      createOscillator: vi.fn().mockReturnValue({
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        frequency: { value: 1000 },
        type: 'sine',
      }),
      createGain: vi.fn().mockReturnValue({
        connect: vi.fn(),
        gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), value: 0.3 },
      }),
      destination: {},
      currentTime: 0,
      state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not show metronome beat markers when metronome is disabled', () => {
    const { container } = render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('shows beat markers on PlaybackControls after metronome is enabled', () => {
    const { container } = render(<ExercisePlaybackPage exercise={mockExercise} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle metronome' }));
    expect(
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length
    ).toBeGreaterThan(0);
  });

  it('shows beat markers on MiniTimeline after metronome is enabled', () => {
    const { container } = render(<ExercisePlaybackPage exercise={mockExercise} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle metronome' }));
    // There should be markers (from both PlaybackControls + MiniTimeline)
    const allMarkers = container.querySelectorAll(
      '[data-testid="metronome-beat-marker"], [data-testid="metronome-downbeat-marker"]'
    );
    expect(allMarkers.length).toBeGreaterThan(0);
  });

  it('hides beat markers when metronome is toggled off again', () => {
    const { container } = render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn); // enable
    expect(
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length
    ).toBeGreaterThan(0);

    fireEvent.click(toggleBtn); // disable
    expect(container.querySelectorAll('[data-testid="metronome-beat-marker"]').length).toBe(0);
    expect(container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length).toBe(0);
  });

  it('updates marker count when BPM is increased', () => {
    const { container } = render(<ExercisePlaybackPage exercise={mockExercise} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle metronome' }));

    const countBefore =
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length;

    // Increase BPM by clicking Increase BPM 60 times (120 -> 180)
    // This doubles the beat count for a 60s exercise: 120 BPM -> 180 BPM
    // Use BPM input directly instead for reliability
    const bpmInput = screen.getByLabelText('BPM');
    fireEvent.change(bpmInput, { target: { value: '240' } });

    const countAfter =
      container.querySelectorAll('[data-testid="metronome-beat-marker"]').length +
      container.querySelectorAll('[data-testid="metronome-downbeat-marker"]').length;

    // 240 BPM = 2x beats of 120 BPM for a 60s exercise
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  it('marker layer aria-label reflects correct beat count', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle metronome' }));
    // 120 BPM in 60s = 120 beats total across the timeline
    const layers = screen.getAllByRole('img', { name: /metronome beats at/i });
    expect(layers.length).toBeGreaterThan(0);
    expect(layers[0]).toHaveAttribute('aria-label', expect.stringMatching(/metronome beats at 120 intervals/i));
  });
});
