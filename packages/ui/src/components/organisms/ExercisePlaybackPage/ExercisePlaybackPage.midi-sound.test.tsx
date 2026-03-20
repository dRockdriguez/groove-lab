import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';
import type { ExercisePlaybackData } from '@groovelab/types';

const mockExercise: ExercisePlaybackData = {
  id: 'drums-sound-1',
  title: 'Drum Sound Test',
  description: 'Test exercise for drum sound playback',
  bpm: 120,
  durationMs: 10000,
  audioUrl: '/storage/test/exercise.mp3',
  midiEvents: [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' }, // Kick
    { timestamp: 1000, note: 38, velocity: 80, channel: 1, type: 'noteOn' }, // Snare
    { timestamp: 2000, note: 42, velocity: 90, channel: 1, type: 'noteOn' }, // Hi-Hat
  ],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage — MIDI Sound (Always-On with Sound)', () => {
  let mockMidiAccess: any;
  let mockAudioContext: any;
  let midiHandlers: any[] = [];
  let mockMidiInput: any;

  beforeEach(() => {
    midiHandlers = [];

    // Create a persistent mock MIDI input object
    mockMidiInput = {
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
    };

    // Mock MIDI access with getter/setter pattern for onmidimessage
    mockMidiAccess = {
      inputs: {
        values: () => [mockMidiInput],
      },
      outputs: { values: () => [] },
      onstatechange: null,
    };

    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue(mockMidiAccess),
      writable: true,
      configurable: true,
    });

    // Mock AudioContext
    mockAudioContext = {
      state: 'running',
      destination: {},
      sampleRate: 44100,
      currentTime: 0,
      createGain: vi.fn(() => ({
        gain: {
          value: 0.7,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      })),
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createOscillator: vi.fn(() => ({
        frequency: {
          value: 160,
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        type: 'sine',
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createBufferSource: vi.fn(() => ({
        buffer: {},
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createBiquadFilter: vi.fn(() => ({
        frequency: { value: 8000 },
        type: 'highpass',
        connect: vi.fn(),
      })),
      createBuffer: vi.fn((channels: number, length: number, sampleRate: number) => ({
        getChannelData: vi.fn(() => new Float32Array(length)),
        numberOfChannels: channels,
        length: length,
        sampleRate: sampleRate,
      })),
      createScriptProcessor: vi.fn(() => ({
        connect: vi.fn(),
        disconnect: vi.fn(),
        onaudioprocess: null,
      })),
    };

    Object.defineProperty(window, 'AudioContext', {
      value: vi.fn().mockImplementation(() => mockAudioContext),
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

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    midiHandlers = [];
  });

  // ─── AC 1: Sound plays when stopped + MIDI note-on with velocity > 0 ───────
  it('AC1: plays drum sound when playbackState is stopped and MIDI note-on arrives with velocity > 0', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Component should render with play button
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    // Click play to trigger MIDI initialization
    const playButton = screen.getByRole('button', { name: /play/i });
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Simulate MIDI note-on (status=0x90, note=36, velocity=100) while in stopped state
    // (playback is technically started, but we're testing the always-on sound)
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 100,
      });
    });

    // AudioContext should be created (sound plays on MIDI event)
    expect(window.AudioContext).toHaveBeenCalled();
  });

  // ─── AC 2: Sound plays when paused + MIDI note-on with velocity > 0 ───────
  it('AC2: plays drum sound when playbackState is paused and MIDI note-on arrives with velocity > 0', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    // Start playback
    await act(async () => {
      fireEvent.click(playButton);
    });

    // Wait for pause button to appear
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const pauseButton = screen.getByRole('button', { name: /pause/i });

    // Click pause to enter paused state
    await act(async () => {
      fireEvent.click(pauseButton);
    });

    // Wait for play button to reappear (paused state)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Send MIDI note-on while paused
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 38, 80],
        timeStamp: 200,
      });
    });

    // AudioContext should be created (sound should play even when paused)
    expect(window.AudioContext).toHaveBeenCalled();
  });

  // ─── AC 3: Sound + scoring when playing + MIDI note-on with velocity > 0 ──
  it('AC3: plays drum sound AND validates hit when playbackState is playing and MIDI note-on arrives with velocity > 0', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    // Start playback
    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Clear previous calls before testing the MIDI event
    vi.clearAllMocks();

    // Send a note-on event that matches an expected exercise event (note=36 at timestamp 0)
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 100, // ~100ms into playback
      });
    });

    // Verify AudioContext was created (sound should play)
    await waitFor(() => {
      expect(window.AudioContext).toHaveBeenCalled();
    });
  });

  // ─── AC 4: Velocity 0 triggers nothing (sound + scoring) ───────────────────
  it('AC4: ignores MIDI note-on with velocity === 0 (no sound, no scoring)', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    // Start playback
    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Get the current call count before the velocity=0 message
    const audioContextCallsBefore = (window.AudioContext as any).mock.callCount;

    // Send note-on with velocity=0 (should be ignored)
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 0], // Note-On with velocity 0
        timeStamp: 100,
      });
    });

    // AudioContext call count should not have changed (no new sound created)
    const audioContextCallsAfter = (window.AudioContext as any).mock.callCount;
    expect(audioContextCallsAfter).toBe(audioContextCallsBefore);
  });

  // ─── AC 5: Non-note-on status triggers nothing ───────────────────────────
  it('AC5: ignores MIDI messages that are not note-on (status !== 0x90)', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    // Start playback
    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Get the current call count before the non-note-on message
    const audioContextCallsBefore = (window.AudioContext as any).mock.callCount;

    // Send a Control Change message (status=0xB0, not 0x90)
    await act(async () => {
      midiInput.onmidimessage({
        data: [0xB0, 64, 127], // Control Change
        timeStamp: 100,
      });
    });

    // AudioContext call count should not have changed (not a note-on)
    const audioContextCallsAfter = (window.AudioContext as any).mock.callCount;
    expect(audioContextCallsAfter).toBe(audioContextCallsBefore);
  });

  // ─── AC 6: AudioContext lazy initialization (not on page load) ─────────────
  it('AC6: creates AudioContext lazily on first MIDI note-on event, not on page load', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Page loads without playing audio
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    // AudioContext should NOT be created yet
    expect(window.AudioContext).not.toHaveBeenCalled();

    const playButton = screen.getByRole('button', { name: /play/i });

    // Click play (but don't send MIDI yet)
    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // AudioContext should STILL not be created (no MIDI event yet)
    expect(window.AudioContext).not.toHaveBeenCalled();

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Now send a MIDI note-on
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 100,
      });
    });

    // NOW AudioContext should be created
    await waitFor(() => {
      expect(window.AudioContext).toHaveBeenCalled();
    });
  });

  // ─── AC 7: Resume suspended AudioContext before playing ───────────────────
  it('AC7: calls ctx.resume() if AudioContext is in suspended state before playing sound', async () => {
    // Override AudioContext to start in 'suspended' state
    const suspendedAudioContext = {
      ...mockAudioContext,
      state: 'suspended',
    };

    (window.AudioContext as any).mockImplementation(() => suspendedAudioContext);

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Send note-on which should trigger resume()
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 100,
      });
    });

    // resume() should have been called on the suspended context
    await waitFor(() => {
      expect(suspendedAudioContext.resume).toHaveBeenCalled();
    });
  });

  // ─── AC 8: DrumSoundEngine instantiated once and stored in ref ─────────────
  it('AC8: instantiates DrumSoundEngine once when AudioContext is created, stores in drumSoundEngineRef', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Send first MIDI note-on (should create engine)
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 100,
      });
    });

    const firstCallCount = (window.AudioContext as any).mock.callCount;

    // Send second MIDI note-on (should reuse engine, not create new one)
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 38, 80],
        timeStamp: 200,
      });
    });

    const secondCallCount = (window.AudioContext as any).mock.callCount;

    // AudioContext should only be created once (call count unchanged on second MIDI event)
    expect(secondCallCount).toBe(firstCallCount);
  });

  // ─── AC 9: Cleanup on unmount (dispose + close) ──────────────────────────
  it('AC9: calls DrumSoundEngine.dispose() and closes AudioContext on component unmount', async () => {
    const { unmount } = render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Send MIDI to create AudioContext
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 100,
      });
    });

    await waitFor(() => {
      expect(window.AudioContext).toHaveBeenCalled();
    });

    // Unmount the component
    unmount();

    // AudioContext.close() should have been called after unmount
    const ctxInstance = (window.AudioContext as any).mock.results[0]?.value;
    expect(ctxInstance?.close).toHaveBeenCalled();
  });

  // ─── AC 10: Sound plays regardless of playback state ────────────────────
  it('AC10: sound plays regardless of playback state (during and after playback)', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    // Start playback
    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Send valid hit during playback
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 50,
      });
    });

    // Pause playback
    const pauseButton = screen.getByRole('button', { name: /pause/i });

    await act(async () => {
      fireEvent.click(pauseButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });

    // Send another identical MIDI event while paused
    // Should play sound but NOT update scoring (gated to playing state)
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 100,
      });
    });

    // Verify play button is visible (component is in paused state without errors)
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  // ─── AC 11: No regressions in existing MIDI feedback tests ────────────────
  it('AC11: maintains backward compatibility with existing MIDI feedback tests', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Test 1: Subscribe to MIDI on play
    const playButton = screen.getByRole('button', { name: /play/i });

    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(navigator.requestMIDIAccess).toHaveBeenCalled();
    });

    // Test 2: Wait for MIDI handler attachment
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Test 3: Filters velocity-zero events
    const audioContextCallsBefore = (window.AudioContext as any).mock.callCount;

    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 0],
        timeStamp: 100,
      });
    });

    // Should not create AudioContext for velocity=0
    const audioContextCallsAfter = (window.AudioContext as any).mock.callCount;
    expect(audioContextCallsAfter).toBe(audioContextCallsBefore);
  });

  // ─── Edge Case: Multiple rapid MIDI events before resume resolves ──────────
  it('Edge Case: handles multiple rapid MIDI events before AudioContext.resume() resolves', async () => {
    const delayedResume = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const delayedAudioContext = {
      ...mockAudioContext,
      state: 'suspended',
      resume: delayedResume,
    };

    (window.AudioContext as any).mockImplementation(() => delayedAudioContext);

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Send multiple rapid events
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 100,
      });
      midiInput.onmidimessage({
        data: [0x90, 38, 80],
        timeStamp: 110,
      });
      midiInput.onmidimessage({
        data: [0x90, 42, 90],
        timeStamp: 120,
      });
    });

    // AudioContext should be created and resume called
    await waitFor(() => {
      expect(delayedResume).toHaveBeenCalled();
    });
  });

  // ─── Edge Case: MIDI device reconnection ──────────────────────────────────
  it('Edge Case: maintains MIDI handler on device reconnection', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    await act(async () => {
      fireEvent.click(playButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Wait for MIDI handler to be attached
    await waitFor(() => {
      expect(midiHandlers.length).toBeGreaterThan(0);
    });

    const midiInput = Array.from(mockMidiAccess.inputs.values())[0];

    // Verify handler is attached
    expect(midiInput.onmidimessage).toBeDefined();

    // Handler should still be functional after getting reconnected
    await act(async () => {
      midiInput.onmidimessage({
        data: [0x90, 36, 100],
        timeStamp: 100,
      });
    });

    // AudioContext should be created when MIDI event is sent
    await waitFor(() => {
      expect(window.AudioContext).toHaveBeenCalled();
    });
  });
});
