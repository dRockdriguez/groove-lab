import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';
import type { ExercisePlaybackData } from '@groovelab/types';

const mockExercise: ExercisePlaybackData = {
  id: 'drums-basic-1',
  title: 'Basic Drum Pattern',
  description: 'A simple drum pattern to practice',
  bpm: 120,
  durationMs: 16000,
  audioUrl: '/storage/test/exercise.mp3',
  midiEvents: [{ timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' }],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage — Metronome Integration', () => {
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

  it('renders the MetronomeControl toggle button', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByRole('button', { name: 'Toggle metronome' })).toBeInTheDocument();
  });

  it('renders the MetronomeControl increment button', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByRole('button', { name: 'Increase BPM' })).toBeInTheDocument();
  });

  it('renders the MetronomeControl decrement button', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByRole('button', { name: 'Decrease BPM' })).toBeInTheDocument();
  });

  it('MetronomeControl displays a BPM input', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByLabelText('BPM')).toBeInTheDocument();
  });

  it('MetronomeControl default BPM is 120', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByLabelText('BPM')).toHaveValue(120);
  });

  it('MetronomeControl BPM increases when increment button is clicked', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    expect(screen.getByLabelText('BPM')).toHaveValue(121);
  });

  it('MetronomeControl toggle button starts with aria-pressed="false"', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggle = screen.getByRole('button', { name: 'Toggle metronome' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  it('MetronomeControl toggle button becomes aria-pressed="true" when clicked', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggle = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });
});
