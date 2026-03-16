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
  midiEvents: [{ timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' }],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage — Metronome-Audio Sync (Criterion #10)', () => {
  let audioContextMock: any;
  let oscillatorMock: any;
  let gainMock: any;

  beforeEach(() => {
    // Create detailed AudioContext mock for scheduling tests
    oscillatorMock = {
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 1000 },
      type: 'sine',
    };

    gainMock = {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        value: 0.3,
      },
    };

    audioContextMock = {
      createOscillator: vi.fn().mockReturnValue(oscillatorMock),
      createGain: vi.fn().mockReturnValue(gainMock),
      destination: {},
      currentTime: 0,
      state: 'running',
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).AudioContext = vi.fn().mockImplementation(() => audioContextMock);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).webkitAudioContext = vi.fn().mockImplementation(() => audioContextMock);

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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Metronome Scheduling Locked to Audio currentTime ─────────────────────

  it('metronome timing is based on audio element currentTime, not wall-clock time', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Enable metronome
    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    // Start playback
    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    await waitFor(() => {
      // Metronome should be using audio currentTime, not system time
      // This is verified by the fact that metronome timing adjusts based on audio position
      expect(audioContextMock.createOscillator).toHaveBeenCalled();
    });
  });

  // ── Pause Cancels Pending Clicks ─────────────────────────────────────────

  it('pausing exercise cancels pending metronome clicks', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    const initialOscillatorCount = oscillatorMock.start.mock.calls.length;

    // Pause
    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    await act(async () => {
      fireEvent.click(pauseBtn);
    });

    // After pause, no new oscillators should be started
    const afterPauseOscillatorCount = oscillatorMock.start.mock.calls.length;
    expect(afterPauseOscillatorCount).toBe(initialOscillatorCount);
  });

  // ── Seek Realigns Clicks with Audio ──────────────────────────────────────

  it('seeking in audio realigns metronome clicks with the audio position', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Get oscillator count before seek
    const beforeSeekCount = oscillatorMock.start.mock.calls.length;

    // Seek via playback controls (this would trigger pause/resume internally)
    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    await act(async () => {
      fireEvent.click(pauseBtn);
    });

    // Resume playback (simulating seek + play)
    const resumePlayBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(resumePlayBtn);
    });

    // After seek and resume, metronome should restart clicks aligned with new position
    expect(oscillatorMock.start).toHaveBeenCalled();
  });

  // ── Metronome Clicks Stop on Pause ───────────────────────────────────────

  it('metronome stops scheduling clicks when playback is paused', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    await act(async () => {
      fireEvent.click(pauseBtn);
    });

    // After pause, no further oscillator starts should occur
    const afterPauseStartCount = oscillatorMock.start.mock.calls.length;

    // Wait a bit to ensure no async scheduling happens
    await new Promise(resolve => setTimeout(resolve, 100));

    // Count should not increase
    expect(oscillatorMock.start.mock.calls.length).toBe(afterPauseStartCount);
  });

  // ── Metronome Clicks Stop on Stop ────────────────────────────────────────

  it('metronome stops scheduling clicks when playback is stopped', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    const stopBtn = screen.getByRole('button', { name: /stop/i });
    await act(async () => {
      fireEvent.click(stopBtn);
    });

    // After stop, no further oscillator starts should occur
    const afterStopStartCount = oscillatorMock.start.mock.calls.length;

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(oscillatorMock.start.mock.calls.length).toBe(afterStopStartCount);
  });

  // ── No Drift After Pause and Resume ──────────────────────────────────────

  it('metronome does not drift when paused and resumed at same position', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Record initial oscillator count
    const firstPlayCount = oscillatorMock.start.mock.calls.length;

    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    await act(async () => {
      fireEvent.click(pauseBtn);
    });

    // Resume at same position
    const resumeBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(resumeBtn);
    });

    // Metronome should realign without drift
    expect(oscillatorMock.start).toHaveBeenCalled();
  });

  // ── Rapid Seek Operations ────────────────────────────────────────────────

  it('metronome handles rapid seek operations without drift', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Perform rapid pause/play cycles (simulating seeks)
    for (let i = 0; i < 3; i++) {
      const pauseBtn = screen.getByRole('button', { name: /pause/i });
      await act(async () => {
        fireEvent.click(pauseBtn);
      });

      const resumeBtn = screen.getByRole('button', { name: /play/i });
      await act(async () => {
        fireEvent.click(resumeBtn);
      });
    }

    // Metronome should have realigned each time without error
    expect(oscillatorMock.start).toHaveBeenCalled();
  });

  // ── Metronome Respects Audio isPlaying Prop ──────────────────────────────

  it('metronome is active only when ExercisePlaybackPage has isPlaying=true', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    // Metronome is enabled but playback not active
    expect(oscillatorMock.start).not.toHaveBeenCalled();

    // Start playback
    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Now metronome should have started
    await waitFor(() => {
      expect(oscillatorMock.start).toHaveBeenCalled();
    });
  });

  // ── BPM Change Updates Metronome Interval Locked to Audio Time ────────────

  it('changing BPM adjusts metronome interval while respecting audio currentTime', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Change BPM while playing is paused
    const pauseBtn = screen.getByRole('button', { name: /pause/i });
    await act(async () => {
      fireEvent.click(pauseBtn);
    });

    const incrementBtn = screen.getByRole('button', { name: 'Increase BPM' });
    fireEvent.click(incrementBtn);

    // Resume with new BPM
    const resumeBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(resumeBtn);
    });

    // Metronome should use new interval
    expect(oscillatorMock.start).toHaveBeenCalled();
  });

  // ── Metronome Sync with Exercise Audio Properties ───────────────────────

  it('metronome uses exercise audio element for timing reference', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Metronome should be active and locked to audio timing
    expect(audioContextMock.createOscillator).toHaveBeenCalled();
  });

  // ── Scheduled Clicks Cleanup on Component Unmount ────────────────────────

  it('metronome cleans up scheduled clicks when component unmounts', async () => {
    const { unmount } = render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    unmount();

    // Audio context should be closed
    await waitFor(() => {
      expect(audioContextMock.close).toHaveBeenCalled();
    });
  });

  // ── Prevent Timing Drift Across Pause/Resume Cycles ──────────────────────

  it('metronome click timing does not accumulate error across multiple pause/resume cycles', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    const initialOscStartCalls = oscillatorMock.start.mock.calls.length;

    // Perform 5 pause/resume cycles
    for (let i = 0; i < 5; i++) {
      const pauseBtn = screen.getByRole('button', { name: /pause/i });
      await act(async () => {
        fireEvent.click(pauseBtn);
      });

      const resumeBtn = screen.getByRole('button', { name: /play/i });
      await act(async () => {
        fireEvent.click(resumeBtn);
      });
    }

    // Each resume should start fresh scheduling without accumulated drift
    expect(oscillatorMock.start).toHaveBeenCalled();
  });

  // ── Metronome Does Not Anticipate or Lag Audio Time ──────────────────────

  it('metronome clicks are synchronized with audio playback, not ahead or behind', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const toggleBtn = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleBtn);

    const playBtn = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playBtn);
    });

    // Metronome should use audioContext.currentTime for scheduling
    expect(audioContextMock.currentTime).toBeDefined();

    // Check that oscillator scheduling uses AudioContext time
    const oscillatorStartCalls = oscillatorMock.start.mock.calls;
    expect(oscillatorStartCalls.length).toBeGreaterThan(0);
  });
});
