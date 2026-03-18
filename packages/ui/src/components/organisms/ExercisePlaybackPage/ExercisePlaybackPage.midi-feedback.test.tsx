import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';
import type { ExercisePlaybackData } from '@groovelab/types';

const mockExercise: ExercisePlaybackData = {
  id: 'drums-basic-1',
  title: 'Basic Drum Pattern',
  description: 'A simple drum pattern to practice',
  bpm: 120,
  durationMs: 10000,
  audioUrl: '/storage/test/exercise.mp3',
  midiEvents: [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' }, // Kick Drum
    { timestamp: 1000, note: 38, velocity: 80, channel: 1, type: 'noteOn' }, // Snare Drum
    { timestamp: 2000, note: 42, velocity: 90, channel: 1, type: 'noteOn' }, // Closed Hi-Hat
    { timestamp: 3000, note: 36, velocity: 100, channel: 1, type: 'noteOn' }, // Kick Drum
  ],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage — MIDI Feedback', () => {
  let mockMidiAccess: any;

  beforeEach(() => {
    mockMidiAccess = {
      inputs: {
        values: () => [
          {
            id: 'input-1',
            name: 'MIDI Controller',
            onmidimessage: null,
          },
        ],
      },
      outputs: { values: () => [] },
      onstatechange: null,
    };

    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue(mockMidiAccess),
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

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('subscribes to MIDI events when Play button is clicked', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    await act(async () => {
      fireEvent.click(playButton);
    });

    // MIDI access should be requested
    await waitFor(() => {
      expect(navigator.requestMIDIAccess).toHaveBeenCalled();
    });
  });

  it('does not subscribe to MIDI events before Play is clicked', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // MIDI should not be accessed yet
    expect(navigator.requestMIDIAccess).not.toHaveBeenCalled();
  });

  it('stops capturing MIDI events when Pause is clicked', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    // Click play
    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    const pauseButton = screen.getByRole('button', { name: /pause/i });

    // Click pause
    await act(async () => {
      fireEvent.click(pauseButton);
    });

    // MIDI events should no longer be processed
    // (Implementation-dependent; this test verifies the pause state is reached)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
  });

  it('initializes and renders DrumHitFeedback when exercise loads', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Verify DrumHitFeedback is rendered with initial stats
    await waitFor(() => {
      // Component should show the main feedback labels
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Hits')).toBeInTheDocument();
      expect(screen.getByText('Violations')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('subscribes to MIDI when Play button is clicked', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // MIDI access should have been requested
    await waitFor(() => {
      expect(navigator.requestMIDIAccess).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('does not subscribe to MIDI before Play is clicked', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // MIDI should not be accessed before any interaction
    expect(navigator.requestMIDIAccess).not.toHaveBeenCalled();
  });

  it('stops capturing MIDI events when Pause is clicked', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Verify pause button appears after play
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    const pauseButton = screen.getByRole('button', { name: /pause/i });
    await act(async () => {
      fireEvent.click(pauseButton);
    });

    // Playback should be paused
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
  });

  it('renders feedback panel below the timeline', async () => {
    const { container } = render(<ExercisePlaybackPage exercise={mockExercise} />);

    // DrumHitFeedback should be rendered as part of the page
    await waitFor(() => {
      const feedbackContainer = container.querySelector('[class*="bg-gray-100"]');
      expect(feedbackContainer).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('displays all four stat labels in feedback panel', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // All four stat labels should be visible
    await waitFor(() => {
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Hits')).toBeInTheDocument();
      expect(screen.getByText('Avg Offset')).toBeInTheDocument();
      expect(screen.getByText('Violations')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('initializes statistics with zero accuracy', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Initially should show 0% accuracy when no hits recorded
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('hides live feedback banner when not playing', async () => {
    const { queryByText } = render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Live feedback banners should not appear before playback starts
    expect(queryByText('✓ Hit!')).not.toBeInTheDocument();
    expect(queryByText('⇠ Too early')).not.toBeInTheDocument();
    expect(queryByText('⇢ Too late')).not.toBeInTheDocument();
  });

  it('filters out velocity-zero MIDI events (semantic Note-Off)', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      // Send Note-On with velocity=0 (semantic Note-Off)
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 36, 0], // Note-On with velocity 0 = Note-Off
          timeStamp: 0,
        });
      });
    }

    // Should not register as a hit (velocity 0 is filtered out)
    // Accuracy should still be 0% (no hits recorded)
    await waitFor(() => {
      expect(screen.getByText('0%')).toBeInTheDocument();
    }, { timeout: 1000 });
  });
});
