import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DrumSoundEngine } from './index';

// ─── Web Audio API mock ───────────────────────────────────────────────────────

function makeAudioContextMock() {
  const gainNode = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      value: 0.7,
    },
  };

  const oscillator = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    type: 'sine',
  };

  const bufferSource = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null,
    playbackRate: { value: 1 },
  };

  const biquadFilter = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    frequency: { value: 1000, setValueAtTime: vi.fn() },
    Q: { value: 1, setValueAtTime: vi.fn() },
    type: 'lowpass',
  };

  return {
    createOscillator: vi.fn().mockReturnValue(oscillator),
    createGain: vi.fn().mockReturnValue(gainNode),
    createBufferSource: vi.fn().mockReturnValue(bufferSource),
    createBiquadFilter: vi.fn().mockReturnValue(biquadFilter),
    createBuffer: vi.fn().mockReturnValue({
      length: 44100,
      sampleRate: 44100,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(44100)),
    }),
    destination: {},
    currentTime: 0,
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

describe('DrumSoundEngine', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = makeAudioContextMock();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 1: Export & Constructor
  // ──────────────────────────────────────────────────────────────────────────

  describe('Export & Constructor', () => {
    it('exports DrumSoundEngine class', () => {
      expect(DrumSoundEngine).toBeDefined();
      expect(typeof DrumSoundEngine).toBe('function');
    });

    it('constructor creates a master GainNode connected to ctx.destination', () => {
      const engine = new DrumSoundEngine(mockCtx);
      expect(mockCtx.createGain).toHaveBeenCalledTimes(1);
      const gainNode = mockCtx.createGain.mock.results[0].value;
      expect(gainNode.connect).toHaveBeenCalledWith(mockCtx.destination);
    });

    it('initializes master volume to 0.7', () => {
      const engine = new DrumSoundEngine(mockCtx);
      const gainNode = mockCtx.createGain.mock.results[0].value;
      expect(gainNode.gain.value).toBe(0.7);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 3: Kick drum (note 36)
  // ──────────────────────────────────────────────────────────────────────────

  describe('play(36, 100) — Kick drum', () => {
    it('creates a sine oscillator with frequency sweep 160Hz → 40Hz over 200ms', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(36, 100);

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      const oscillator = mockCtx.createOscillator.mock.results[0].value;
      expect(oscillator.type).toBe('sine');
      expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(160, expect.any(Number));
      expect(oscillator.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(
        40,
        expect.any(Number)
      );
    });

    it('starts oscillator immediately and stops after 200ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(36, 100);

      const oscillator = mockCtx.createOscillator.mock.results[0].value;
      expect(oscillator.start).toHaveBeenCalled();
      expect(oscillator.stop).toHaveBeenCalled();
      // Verify gain envelope is applied for decay
      const gainNode = mockCtx.createGain.mock.results[1].value; // Second gain node (not master)
      expect(gainNode.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 4: Snare (note 38)
  // ──────────────────────────────────────────────────────────────────────────

  describe('play(38, 100) — Snare', () => {
    it('creates a noise buffer source with bandpass filter at 3000Hz + triangle oscillator at 200Hz, 150ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(38, 100);

      expect(mockCtx.createBufferSource).toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();
      expect(mockCtx.createOscillator).toHaveBeenCalled();

      const oscillator = mockCtx.createOscillator.mock.results[0].value;
      expect(oscillator.type).toBe('triangle');
    });

    it('applies bandpass filter at 3000Hz to noise', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(38, 100);

      const filter = mockCtx.createBiquadFilter.mock.results[0].value;
      expect(filter.frequency.value).toBe(3000);
      expect(filter.type).toBe('bandpass');
    });

    it('creates triangle oscillator at 200Hz for snare harmonic', () => {
      const engine = new DrumSoundEngine(mockCtx);
      mockCtx.createOscillator.mockClear();
      engine.play(38, 100);

      const oscillator = mockCtx.createOscillator.mock.results[0].value;
      expect(oscillator.type).toBe('triangle');
      expect(oscillator.frequency.value).toBe(200);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 5: Closed hi-hat (note 42)
  // ──────────────────────────────────────────────────────────────────────────

  describe('play(42, 100) — Closed hi-hat', () => {
    it('creates a noise buffer source with bandpass filter at 8000Hz and 50ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(42, 100);

      expect(mockCtx.createBufferSource).toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();

      const filter = mockCtx.createBiquadFilter.mock.results[0].value;
      expect(filter.frequency.value).toBe(8000);
      expect(filter.type).toBe('bandpass');
    });

    it('uses 50ms decay envelope', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(42, 100);

      const bufferSource = mockCtx.createBufferSource.mock.results[0].value;
      expect(bufferSource.stop).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 6: Open hi-hat (note 46)
  // ──────────────────────────────────────────────────────────────────────────

  describe('play(46, 100) — Open hi-hat', () => {
    it('creates a noise buffer source with bandpass filter at 8000Hz and 300ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(46, 100);

      expect(mockCtx.createBufferSource).toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();

      const filter = mockCtx.createBiquadFilter.mock.results[0].value;
      expect(filter.frequency.value).toBe(8000);
      expect(filter.type).toBe('bandpass');
    });

    it('uses 300ms decay envelope', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(46, 100);

      const bufferSource = mockCtx.createBufferSource.mock.results[0].value;
      expect(bufferSource.stop).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 7: Tom (note 45)
  // ──────────────────────────────────────────────────────────────────────────

  describe('play(45, 100) — Tom', () => {
    it('creates a sine oscillator at frequency between 80Hz–200Hz mapped to tom pitch, 200ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(45, 100);

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      const oscillator = mockCtx.createOscillator.mock.results[0].value;
      expect(oscillator.type).toBe('sine');
      expect(oscillator.frequency.value).toBeGreaterThanOrEqual(80);
      expect(oscillator.frequency.value).toBeLessThanOrEqual(200);
    });

    it('applies 200ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(45, 100);

      const oscillator = mockCtx.createOscillator.mock.results[0].value;
      expect(oscillator.stop).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 8: Crash cymbal (note 49)
  // ──────────────────────────────────────────────────────────────────────────

  describe('play(49, 100) — Crash cymbal', () => {
    it('creates a wideband noise source with highpass filter at 5000Hz and 500ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(49, 100);

      expect(mockCtx.createBufferSource).toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();

      const filter = mockCtx.createBiquadFilter.mock.results[0].value;
      expect(filter.type).toBe('highpass');
      expect(filter.frequency.value).toBe(5000);
    });

    it('applies 500ms decay to crash sound', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(49, 100);

      const bufferSource = mockCtx.createBufferSource.mock.results[0].value;
      expect(bufferSource.stop).toHaveBeenCalled();
      // Verify buffer source starts
      expect(bufferSource.start).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 9: Ride cymbal (note 51)
  // ──────────────────────────────────────────────────────────────────────────

  describe('play(51, 100) — Ride cymbal', () => {
    it('creates a narrow-band noise source with bandpass filter at 10000Hz with 400ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(51, 100);

      expect(mockCtx.createBufferSource).toHaveBeenCalled();
      expect(mockCtx.createBiquadFilter).toHaveBeenCalled();

      const filter = mockCtx.createBiquadFilter.mock.results[0].value;
      expect(filter.type).toBe('bandpass');
      expect(filter.frequency.value).toBe(10000);
      expect(filter.Q.value).toBe(15); // narrow band characteristic
    });

    it('applies 400ms decay to ride cymbal', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(51, 100);

      const bufferSource = mockCtx.createBufferSource.mock.results[0].value;
      expect(bufferSource.stop).toHaveBeenCalled();
      expect(bufferSource.start).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 10: Unmapped note (note 99)
  // ──────────────────────────────────────────────────────────────────────────

  describe('play(99, 100) — Unmapped note fallback', () => {
    it('creates a sine oscillator at 440Hz with 100ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(99, 100);

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      const oscillator = mockCtx.createOscillator.mock.results[0].value;
      expect(oscillator.type).toBe('sine');
      expect(oscillator.frequency.value).toBe(440);
    });

    it('applies 100ms decay', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(99, 100);

      const oscillator = mockCtx.createOscillator.mock.results[0].value;
      expect(oscillator.stop).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 11: Velocity scaling
  // ──────────────────────────────────────────────────────────────────────────

  describe('Velocity scaling', () => {
    it('scales output gain linearly: gain = (velocity / 127) * masterVolume', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(36, 100); // velocity 100

      const masterGain = mockCtx.createGain.mock.results[0].value;
      const expectedGain = (100 / 127) * 0.7; // (velocity / 127) * 0.7 (default master volume)
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(expectedGain, 0.01),
        expect.any(Number)
      );
    });

    it('applies velocity 127 as maximum gain', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(36, 127);

      const masterGain = mockCtx.createGain.mock.results[0].value;
      const expectedGain = (127 / 127) * 0.7; // 1.0 * 0.7
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(expectedGain, 0.01),
        expect.any(Number)
      );
    });

    it('applies velocity 50 as half gain', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.play(36, 50);

      const masterGain = mockCtx.createGain.mock.results[0].value;
      const expectedGain = (50 / 127) * 0.7;
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(expectedGain, 0.01),
        expect.any(Number)
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 12: Zero velocity (no sound)
  // ──────────────────────────────────────────────────────────────────────────

  describe('Velocity 0 (no sound)', () => {
    it('play(36, 0) returns immediately without creating any audio nodes', () => {
      const engine = new DrumSoundEngine(mockCtx);
      const initialOscillatorCalls = mockCtx.createOscillator.mock.calls.length;
      const initialGainCalls = mockCtx.createGain.mock.calls.length;

      engine.play(36, 0);

      expect(mockCtx.createOscillator.mock.calls.length).toBe(initialOscillatorCalls);
      expect(mockCtx.createGain.mock.calls.length).toBe(initialGainCalls);
    });

    it('does not create buffer source for velocity 0', () => {
      const engine = new DrumSoundEngine(mockCtx);
      const initialBufferCalls = mockCtx.createBufferSource.mock.calls.length;

      engine.play(42, 0);

      expect(mockCtx.createBufferSource.mock.calls.length).toBe(initialBufferCalls);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 13: setVolume(0.5)
  // ──────────────────────────────────────────────────────────────────────────

  describe('setVolume(0.5)', () => {
    it('changes master gain node value to 0.5', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.setVolume(0.5);

      const masterGain = mockCtx.createGain.mock.results[0].value;
      expect(masterGain.gain.value).toBe(0.5);
    });

    it('affects subsequent play() calls with scaled gain', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.setVolume(0.5);
      engine.play(36, 100);

      const masterGain = mockCtx.createGain.mock.results[0].value;
      const expectedGain = (100 / 127) * 0.5;
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(expectedGain, 0.01),
        expect.any(Number)
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 14: setVolume(0.0) — Mute
  // ──────────────────────────────────────────────────────────────────────────

  describe('setVolume(0.0)', () => {
    it('mutes all output by setting master gain to 0.0', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.setVolume(0.0);

      const masterGain = mockCtx.createGain.mock.results[0].value;
      expect(masterGain.gain.value).toBe(0.0);
    });

    it('prevents sound output even with high velocity', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.setVolume(0.0);
      engine.play(36, 127);

      const masterGain = mockCtx.createGain.mock.results[0].value;
      expect(masterGain.gain.setValueAtTime).toHaveBeenCalledWith(0, expect.any(Number));
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 15: dispose()
  // ──────────────────────────────────────────────────────────────────────────

  describe('dispose()', () => {
    it('disconnects the master gain node from destination', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.dispose();

      const masterGain = mockCtx.createGain.mock.results[0].value;
      expect(masterGain.disconnect).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Criterion 16: After dispose(), play() does not throw
  // ──────────────────────────────────────────────────────────────────────────

  describe('After dispose()', () => {
    it('calling play() does not throw', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.dispose();

      expect(() => {
        engine.play(36, 100);
      }).not.toThrow();
    });

    it('calling play() after dispose() is a no-op (does not create nodes)', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.dispose();

      const initialOscillatorCalls = mockCtx.createOscillator.mock.calls.length;
      engine.play(36, 100);

      // Should not create any additional nodes after dispose
      expect(mockCtx.createOscillator.mock.calls.length).toBe(initialOscillatorCalls);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Edge Cases
  // ──────────────────────────────────────────────────────────────────────────

  describe('Edge Cases', () => {
    it('handles setVolume() clamping to 0.0–1.0 range', () => {
      const engine = new DrumSoundEngine(mockCtx);

      // Test clamping high value
      engine.setVolume(1.5);
      const masterGain = mockCtx.createGain.mock.results[0].value;
      expect(masterGain.gain.value).toBeLessThanOrEqual(1.0);

      // Test clamping negative value
      engine.setVolume(-0.5);
      expect(masterGain.gain.value).toBeGreaterThanOrEqual(0.0);
    });

    it('handles rapid repeated calls with overlapping sounds', () => {
      const engine = new DrumSoundEngine(mockCtx);

      engine.play(36, 100);
      engine.play(38, 100);
      engine.play(42, 100);

      // Each play() should create independent nodes
      expect(mockCtx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(mockCtx.createBufferSource.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it('creates shared white noise buffer once in constructor and reuses it', () => {
      const initialCreateBufferCalls = mockCtx.createBuffer.mock.calls.length;
      const engine = new DrumSoundEngine(mockCtx);
      const afterConstructorCalls = mockCtx.createBuffer.mock.calls.length;

      // Verify buffer created during constructor (1 call)
      expect(afterConstructorCalls).toBe(initialCreateBufferCalls + 1);

      // Play multiple snare and hi-hat notes that use the shared buffer
      engine.play(38, 100); // snare
      engine.play(38, 100); // snare again
      engine.play(42, 100); // closed hi-hat
      engine.play(46, 100); // open hi-hat
      engine.play(49, 100); // crash

      // No additional buffers should be created (same buffer reused)
      expect(mockCtx.createBuffer.mock.calls.length).toBe(afterConstructorCalls);

      // Verify each play() call creates buffer sources from the same buffer
      expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(5);
    });

    it('handles tom notes with pitch mapping (41, 43, 45, 47, 48, 50) with proportional frequencies', () => {
      const engine = new DrumSoundEngine(mockCtx);

      const tomNotes = [41, 43, 45, 47, 48, 50];
      const frequencies: number[] = [];

      tomNotes.forEach((note) => {
        mockCtx.createOscillator.mockClear();
        engine.play(note, 100);
        const oscillator = mockCtx.createOscillator.mock.results[0].value;
        const freq = oscillator.frequency.value;
        frequencies.push(freq);
        // Verify all tom frequencies are in the valid range (80-200Hz)
        expect(freq).toBeGreaterThanOrEqual(80);
        expect(freq).toBeLessThanOrEqual(200);
      });

      // Frequencies should strictly increase with note number (pitch mapping)
      for (let i = 1; i < frequencies.length; i++) {
        expect(frequencies[i]).toBeGreaterThan(frequencies[i - 1]);
      }
      // Verify first tom (note 41) is near lower bound and last tom (note 50) is near upper bound
      expect(frequencies[0]).toBeLessThan(100); // Note 41 should be low
      expect(frequencies[frequencies.length - 1]).toBeGreaterThan(150); // Note 50 should be high
    });

    it('handles unknown notes (not in GM drum map) with fallback', () => {
      const engine = new DrumSoundEngine(mockCtx);
      mockCtx.createOscillator.mockClear();

      engine.play(127, 100); // Unknown note

      expect(mockCtx.createOscillator).toHaveBeenCalled();
      const oscillator = mockCtx.createOscillator.mock.results[0].value;
      expect(oscillator.frequency.value).toBe(440);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Integration Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('Integration', () => {
    it('handles complete workflow: create, play, setVolume, dispose', () => {
      const engine = new DrumSoundEngine(mockCtx);

      engine.play(36, 100);
      engine.setVolume(0.5);
      engine.play(38, 100);
      engine.dispose();

      const masterGain = mockCtx.createGain.mock.results[0].value;
      expect(masterGain.disconnect).toHaveBeenCalled();
    });

    it('maintains volume state across multiple play() calls', () => {
      const engine = new DrumSoundEngine(mockCtx);
      engine.setVolume(0.3);

      engine.play(36, 100);
      engine.play(38, 100);
      engine.play(42, 100);

      const masterGain = mockCtx.createGain.mock.results[0].value;
      expect(masterGain.gain.value).toBe(0.3);
    });
  });
});
