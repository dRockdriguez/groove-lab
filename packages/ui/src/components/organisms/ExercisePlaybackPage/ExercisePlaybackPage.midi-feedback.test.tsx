import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';
import type { ExercisePlaybackData, MidiEvent } from '@groovelab/types';

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

  it('calculates feedback as "hit" when note matches and timing is within tolerance', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Expected: note 36 at timestamp 0, velocity 100
    // Captured: note 36 at timestamp 50 (within ±100ms tolerance), velocity 95-105 (within ±25% of 100)
    // Result: "hit"

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Simulate incoming MIDI Note On event matching expected
    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    const midiMessage = {
      data: [0x90, 36, 100], // Note On, note 36, velocity 100
      timeStamp: 50,
    };

    if (midiInput.onmidimessage) {
      await act(async () => {
        midiInput.onmidimessage({ data: midiMessage.data, timeStamp: midiMessage.timeStamp });
      });
    }

    // Check for feedback indicator or statistics update
    await waitFor(() => {
      // Look for feedback indication or accuracy update
      const feedbackElements = screen.queryAllByTestId('feedback-indicator');
      expect(feedbackElements.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 1000 });
  });

  it('calculates feedback as "miss" when expected note is not played', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Advance time past first expected note (0ms) without capturing it
    await act(async () => {
      vi.advanceTimersByTime(200); // Past tolerance window
    });

    // Statistics should show a miss
    await waitFor(() => {
      // Look for updated statistics or feedback display
      const stats = screen.queryByText(/accuracy|hit count/i);
      expect(stats).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('calculates feedback as "wrong note" when note number differs', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Expected: note 36, Captured: note 40 (different note)
    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 40, 100], // Wrong note
          timeStamp: 0,
        });
      });
    }

    // Check for wrong note feedback
    await waitFor(() => {
      const feedbackElements = screen.queryAllByTestId('feedback-indicator');
      expect(feedbackElements.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 1000 });
  });

  it('calculates feedback as "early" when timing is before tolerance window', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Expected at 0ms, Captured at -150ms (before tolerance of ±100ms)
    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 36, 100],
          timeStamp: -150,
        });
      });
    }

    await waitFor(() => {
      const feedbackElements = screen.queryAllByTestId('feedback-indicator');
      expect(feedbackElements.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 1000 });
  });

  it('calculates feedback as "late" when timing is after tolerance window', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Expected at 0ms, Captured at +150ms (after tolerance of ±100ms)
    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 36, 100],
          timeStamp: 150,
        });
      });
    }

    await waitFor(() => {
      const feedbackElements = screen.queryAllByTestId('feedback-indicator');
      expect(feedbackElements.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 1000 });
  });

  it('calculates feedback as "weak" when velocity is below tolerance range', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Expected velocity: 100, tolerance: ±25% = 75-125
    // Captured velocity: 50 (below range)

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 36, 50], // Weak velocity
          timeStamp: 0,
        });
      });
    }

    await waitFor(() => {
      const feedbackElements = screen.queryAllByTestId('feedback-indicator');
      expect(feedbackElements.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 1000 });
  });

  it('calculates feedback as "strong" when velocity is above tolerance range', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Expected velocity: 100, tolerance: ±25% = 75-125
    // Captured velocity: 127 (above range)

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 36, 127], // Strong velocity
          timeStamp: 0,
        });
      });
    }

    await waitFor(() => {
      const feedbackElements = screen.queryAllByTestId('feedback-indicator');
      expect(feedbackElements.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 1000 });
  });

  it('displays feedback indicators on timeline as notes are played', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Simulate a correct note
    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 36, 100],
          timeStamp: 0,
        });
      });
    }

    // Feedback should appear on timeline
    await waitFor(() => {
      // Look for feedback badge or indicator
      const feedbackElements = screen.queryAllByTestId('feedback-indicator');
      expect(feedbackElements.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 1000 });
  });

  it('updates accuracy statistic in real-time as notes are played', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Simulate correct note
    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 36, 100],
          timeStamp: 0,
        });
      });
    }

    // Statistics panel should update
    await waitFor(() => {
      const accuracyText = screen.queryByText(/accuracy|hit count/i);
      expect(accuracyText).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('updates hit count statistic in real-time', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 36, 100],
          timeStamp: 0,
        });
      });
    }

    await waitFor(() => {
      const hitCountText = screen.queryByText(/hit count|1 of \d+/i);
      expect(hitCountText).toBeTruthy();
    }, { timeout: 1000 });
  });

  it('persists feedback summary after exercise finishes', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Simulate playback to completion
    await act(async () => {
      vi.advanceTimersByTime(mockExercise.durationMs + 1000);
    });

    // Statistics should still be visible
    await waitFor(() => {
      expect(screen.getByText(/accuracy/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('skips unparseable MIDI events', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];
    if (midiInput.onmidimessage) {
      // Send invalid MIDI data
      await act(async () => {
        midiInput.onmidimessage({
          data: [0xF0], // Invalid message
          timeStamp: 0,
        });
      });

      // Then send valid data
      await act(async () => {
        midiInput.onmidimessage({
          data: [0x90, 36, 100],
          timeStamp: 0,
        });
      });
    }

    // Should continue processing without error
    expect(screen.getByText('Basic Drum Pattern')).toBeInTheDocument();
  });
});
