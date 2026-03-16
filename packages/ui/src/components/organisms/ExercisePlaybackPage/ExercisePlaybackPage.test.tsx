import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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
  midiEvents: [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
    { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
  ],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage', () => {
  beforeEach(() => {
    // Mock navigator.requestMIDIAccess
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue({
        inputs: { values: () => [] },
        onstatechange: null,
      }),
      writable: true,
      configurable: true,
    });

    // Mock HTMLMediaElement
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays the exercise title', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByText('Basic Drum Pattern')).toBeInTheDocument();
  });

  it('displays the exercise BPM', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByText(/120/)).toBeInTheDocument();
  });

  it('renders the play button', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('renders the timeline', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByText(/kick drum/i)).toBeInTheDocument();
  });

  it('renders the MIDI status indicator', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    // Should show some MIDI status (connected/disconnected/denied)
    expect(
      screen.getByText(/midi drum kit|no midi/i)
    ).toBeInTheDocument();
  });

  it('toggles to pause state when play button is clicked', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  it('toggles back to play state when pause button is clicked', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
  });

  it('shows "no audio" message when audioUrl is empty', () => {
    const noAudioExercise = { ...mockExercise, audioUrl: '' };
    render(<ExercisePlaybackPage exercise={noAudioExercise} />);
    expect(screen.getByText(/no audio/i)).toBeInTheDocument();
  });

  it('shows "no note data" message when midiEvents is empty', () => {
    const noMidiExercise = { ...mockExercise, midiEvents: [] };
    render(<ExercisePlaybackPage exercise={noMidiExercise} />);
    expect(screen.getByText(/no note data/i)).toBeInTheDocument();
  });

  it('renders the mini timeline', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('renders the session statistics panel', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument();
  });

  it('renders the seek slider', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByLabelText('Seek playback position')).toBeInTheDocument();
  });

  it('displays duration in mm:ss format', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    // 16000ms = 00:16
    expect(screen.getByText('00:16')).toBeInTheDocument();
  });

  it('shows bpm label', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByText(/bpm/i)).toBeInTheDocument();
  });
});

describe('ExercisePlaybackPage — loading state', () => {
  it('shows loading state when exerciseId is provided but no exercise data', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementationOnce(
      () => new Promise(() => {})
    );

    render(<ExercisePlaybackPage exerciseId="drums-basic-1" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    fetchMock.mockRestore();
  });

  it('fetches exercise data when exerciseId is provided', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockExercise,
    } as Response);

    await act(async () => {
      render(<ExercisePlaybackPage exerciseId="drums-basic-1" />);
    });

    await waitFor(() => {
      expect(screen.getByText('Basic Drum Pattern')).toBeInTheDocument();
    });

    fetchMock.mockRestore();
  });

  it('shows error message when fetch fails', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Exercise not found' }),
    } as Response);

    await act(async () => {
      render(<ExercisePlaybackPage exerciseId="not-found" />);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    fetchMock.mockRestore();
  });

  it('shows retry button when fetch fails', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Server error' }),
    } as Response);

    await act(async () => {
      render(<ExercisePlaybackPage exerciseId="error-exercise" />);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    fetchMock.mockRestore();
  });
});
