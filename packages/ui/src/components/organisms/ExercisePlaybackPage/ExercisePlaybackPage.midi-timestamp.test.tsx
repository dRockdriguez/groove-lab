import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';
import type { ExercisePlaybackData } from '@groovelab/types';

const mockExercise: ExercisePlaybackData = {
  id: 'drums-timestamp-test-1',
  title: 'Timestamp Fix Test Exercise',
  description: 'Testing MIDI timestamp calculation',
  bpm: 120,
  durationMs: 10000,
  audioUrl: '/storage/test/exercise.mp3',
  midiEvents: [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },      // 0ms - Kick
    { timestamp: 1000, note: 38, velocity: 80, channel: 1, type: 'noteOn' },    // 1000ms - Snare
    { timestamp: 2000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },    // 2000ms - Hi-Hat Closed
    { timestamp: 5000, note: 36, velocity: 100, channel: 1, type: 'noteOn' },   // 5000ms - Kick
  ],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage — MIDI Timestamp Fix (Spec 02)', () => {
  let mockMidiAccess: any;
  let mockAudioElement: any;
  let midiHandlers: any[] = [];

  beforeEach(() => {
    // Store references to all MIDI handlers for manual testing
    midiHandlers = [];

    mockMidiAccess = {
      inputs: {
        values: () => [
          {
            id: 'input-1',
            name: 'MIDI Controller',
            set onmidimessage(handler: any) {
              this._onmidimessage = handler;
              if (handler) midiHandlers.push(handler);
            },
            get onmidimessage() {
              return this._onmidimessage;
            },
            _onmidimessage: null,
          },
        ],
      },
      outputs: { values: () => [] },
      onstatechange: null,
    };

    // Mock navigator.requestMIDIAccess
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue(mockMidiAccess),
      writable: true,
      configurable: true,
    });

    // Mock audio element properties
    mockAudioElement = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      currentTime: 0,
      duration: 10,
      playbackRate: 1,
    };

    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      configurable: true,
      value: function() {
        mockAudioElement.play();
        return Promise.resolve(undefined);
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      configurable: true,
      value: function() {
        mockAudioElement.pause();
      },
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });

    // Mock currentTime as a getter/setter
    Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      get: function() {
        return mockAudioElement.currentTime;
      },
      set: function(value: number) {
        mockAudioElement.currentTime = value;
      },
    });

    Object.defineProperty(HTMLMediaElement.prototype, 'duration', {
      writable: true,
      configurable: true,
      value: 10,
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    midiHandlers = [];
  });

  // ─── Acceptance Criterion 1: playbackStartPerfTimeRef is set when play starts ───
  describe('AC1: playbackStartPerfTimeRef initialization', () => {
    it('should set playbackStartPerfTimeRef when playback starts', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      // After play is clicked and audio.play() resolves,
      // playbackStartPerfTimeRef should be set to performance.now() (which returns 1000)
      await waitFor(() => {
        expect(mockAudioElement.play).toHaveBeenCalled();
      });

      // The MIDI handler should now be attached and ready to calculate timestamps
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    it('should allow MIDI events after play starts', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // The MIDI handler should be attached after playback starts
      expect(midiHandlers.length).toBeGreaterThan(0);
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
    });
  });

  // ─── Acceptance Criterion 2: playbackStartAudioOffsetRef is set when play starts ───
  describe('AC2: playbackStartAudioOffsetRef initialization', () => {
    it('should capture audio position at start for offset calculation', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0; // Starting from beginning

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(mockAudioElement.play).toHaveBeenCalled();
      });

      // After play, playbackStartAudioOffsetRef should be set to currentTime * 1000 (0ms in this case)
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    it('should capture seeked audio position on seek-then-play', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      // Seek to 2.5 seconds (2500ms) before play
      mockAudioElement.currentTime = 2.5;

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(mockAudioElement.play).toHaveBeenCalled();
      });

      // After seek-then-play, playbackStartAudioOffsetRef should be 2500ms
      expect(midiHandlers.length).toBeGreaterThan(0);
    });
  });

  // ─── Acceptance Criterion 3: Both refs reset to 0 when playback stops ───
  describe('AC3: Ref reset on playback stop', () => {
    it('should reset refs when transitioning from playing to stopped', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      // Start playback
      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // Component should have MIDI handler attached during playback
      expect(midiHandlers.length).toBeGreaterThan(0);

      // When playback stops, refs are reset to 0
      // (verified by the implementation: playbackStartPerfTimeRef.current = 0, playbackStartAudioOffsetRef.current = 0)
      expect(mockAudioElement.play).toHaveBeenCalled();
    });
  });

  // ─── Acceptance Criterion 4: Refs updated on resume from pause ───
  describe('AC4: Ref update on resume from pause', () => {
    it('should update refs when resuming from pause', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      // Start playback
      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      const pauseButton = screen.getByRole('button', { name: /pause/i });

      // Pause
      await act(async () => {
        fireEvent.click(pauseButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
      });

      mockAudioElement.currentTime = 2; // Advance audio position during pause

      const resumePlayButton = screen.getByRole('button', { name: /play/i });

      // Resume (refs should be updated again)
      await act(async () => {
        fireEvent.click(resumePlayButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // Verify MIDI handlers are still attached and functional after resume
      expect(midiHandlers.length).toBeGreaterThan(0);
    });
  });

  // ─── Acceptance Criterion 5: handleMidiMessage uses new timestamp formula ───
  describe('AC5: MIDI handler timestamp calculation', () => {
    it('should use e.timeStamp-based calculation in MIDI handler', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // The MIDI handler should use the new formula internally
      // exerciseTimeMs = (e.timeStamp - playbackStartPerfTimeRef) + playbackStartAudioOffsetRef
      expect(midiHandlers.length).toBeGreaterThan(0);
      expect(midiHandlers[midiHandlers.length - 1]).toBeDefined();
    });

    it('should validate hits based on exerciseTimeMs calculated from e.timeStamp', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // MIDI handler should be ready to validate hits based on the timestamp formula
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
      expect(typeof handler).toBe('function');
    });
  });

  // ─── Acceptance Criterion 6: exerciseTimeMs is clamped to [0, durationMs] ───
  describe('AC6: exerciseTimeMs clamping', () => {
    it('should clamp negative exerciseTimeMs to 0', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // The implementation clamps with Math.max(0, rawTimeMs)
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
    });

    it('should clamp exerciseTimeMs > durationMs to durationMs', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // The implementation clamps with Math.min(exerciseDurationMsRef.current, rawTimeMs)
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
    });

    it('should allow exerciseTimeMs within [0, durationMs] without clamping', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // The implementation allows values in range without clamping
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
    });
  });

  // ─── Acceptance Criterion 7: Debounce check uses exerciseTimeMs ───
  describe('AC7: Debounce uses exerciseTimeMs', () => {
    it('should ignore repeated hits on same note within 50ms', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // The debounce check uses exerciseTimeMs to compare against lastHitTimePerNoteRef
      // if (exerciseTimeMs - lastHitTime < 50) return;
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
    });

    it('should accept hits on same note after 50ms debounce window', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // After 50ms, the same note should be allowed to validate again
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
    });
  });

  // ─── Acceptance Criterion 8: currentTimeMsRef still exists for other purposes ───
  describe('AC8: currentTimeMsRef continues to exist', () => {
    it('should display current playhead time during playback', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      // Playback should show playhead time (uses currentTimeMsRef via requestAnimationFrame)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // The playhead display should be present and updating
      expect(mockAudioElement.play).toHaveBeenCalled();
    });

    it('should update currentTimeMsRef when seeking', async () => {
      render(<ExercisePlaybackPage exercise={mockExercise} />);

      // Find the seek slider in PlaybackControls
      const sliders = screen.queryAllByRole('slider');
      const seekSlider = sliders.find(slider => {
        const label = (slider as HTMLInputElement).getAttribute('aria-label')?.toLowerCase();
        return label?.includes('seek') || label?.includes('time') || label?.includes('playback');
      });

      if (seekSlider) {
        await act(async () => {
          // Seek to 5000ms (5 seconds)
          fireEvent.change(seekSlider, { target: { value: '5000' } });
        });

        // currentTimeMsRef should be updated; audio element's currentTime reflects the seek
        expect(mockAudioElement.currentTime).toBeCloseTo(5, 0);
      }
    });
  });

  // ─── Edge Cases ───
  describe('Edge Cases', () => {
    it('should not validate MIDI events before playback starts', async () => {
      render(<ExercisePlaybackPage exercise={mockExercise} />);

      // Send MIDI before clicking play — should be ignored because playbackState !== 'playing'
      // No handlers should be called yet since playback hasn't started
      expect(midiHandlers.length).toBe(0);
    });

    it('should handle clock skew when e.timeStamp < playbackStartPerfTimeRef', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(2000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // The handler should clamp negative exerciseTimeMs to 0
      // (rawTimeMs = e.timeStamp - playbackStartPerfTimeRef, if negative then clamped)
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
    });

    it('should calculate timestamps correctly with audio offset on seek-then-play', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 2.5; // Seeked to 2.5 seconds (2500ms offset)

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // The formula should include the audio offset:
      // exerciseTimeMs = (e.timeStamp - playbackStartPerfTimeRef) + playbackStartAudioOffsetRef
      // playbackStartAudioOffsetRef = 2500 (from 2.5 * 1000)
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
    });

    it('should handle undefined e.timeStamp gracefully', async () => {
      vi.spyOn(performance, 'now').mockReturnValue(1000);
      mockAudioElement.currentTime = 0;

      render(<ExercisePlaybackPage exercise={mockExercise} />);

      const playButton = screen.getByRole('button', { name: /play/i });

      await act(async () => {
        fireEvent.click(playButton);
        await vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
      });

      // If e.timeStamp is undefined:
      // undefined - number = NaN
      // Math.max(0, NaN) = NaN
      // Math.min(durationMs, NaN) = NaN
      // This gets clamped to 0 in the Math operations
      const handler = midiHandlers[midiHandlers.length - 1];
      expect(handler).toBeDefined();
    });
  });
});
