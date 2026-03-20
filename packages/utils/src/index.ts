// ─── Time ─────────────────────────────────────────────────────────────────────

/** Format milliseconds to human-readable mm:ss */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/** Calculate BPM from the interval between two beats in milliseconds */
export function intervalToBpm(intervalMs: number): number {
  if (intervalMs <= 0) throw new Error('intervalMs must be positive');
  return Math.round(60_000 / intervalMs);
}

/** Calculate the expected interval in ms between beats at a given BPM */
export function bpmToInterval(bpm: number): number {
  if (bpm <= 0) throw new Error('bpm must be positive');
  return 60_000 / bpm;
}

// ─── Math ─────────────────────────────────────────────────────────────────────

/** Clamp a number between min and max (inclusive) */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Linear interpolation between a and b by t (0–1) */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Map a value from one range to another */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

// ─── MIDI ─────────────────────────────────────────────────────────────────────

/** Standard General MIDI drum map (note → name) */
export const GM_DRUM_MAP: Record<number, string> = {
  35: 'acoustic-bass-drum',
  36: 'kick-drum',
  37: 'side-stick',
  38: 'snare-drum',
  39: 'hand-clap',
  40: 'electric-snare',
  41: 'low-floor-tom',
  42: 'closed-hi-hat',
  43: 'high-floor-tom',
  44: 'pedal-hi-hat',
  45: 'low-tom',
  46: 'open-hi-hat',
  47: 'low-mid-tom',
  48: 'high-mid-tom',
  49: 'crash-cymbal-1',
  50: 'high-tom',
  51: 'ride-cymbal-1',
  52: 'chinese-cymbal',
  53: 'ride-bell',
  54: 'tambourine',
  55: 'splash-cymbal',
  56: 'cowbell',
  57: 'crash-cymbal-2',
  59: 'ride-cymbal-2',
};

/** Look up a drum pad name from a MIDI note number */
export function getDrumName(note: number): string | undefined {
  return GM_DRUM_MAP[note];
}

/** Validate that a MIDI velocity value is in range (0–127) */
export function isValidVelocity(velocity: number): boolean {
  return Number.isInteger(velocity) && velocity >= 0 && velocity <= 127;
}

/** Validate that a MIDI note number is in range (0–127) */
export function isValidNote(note: number): boolean {
  return Number.isInteger(note) && note >= 0 && note <= 127;
}

/**
 * Color palette for GM drum kit rudiments.
 * Each MIDI note maps to a distinct hex color for visual identification.
 */
const DRUM_COLOR_MAP: Record<number, string> = {
  36: '#DC2626', // Kick Drum — Deep Red
  38: '#3B82F6', // Snare Drum — Blue
  40: '#60A5FA', // Electric Snare — Light Blue
  41: '#4F46E5', // Tom (Floor/Low) — Indigo
  42: '#FBBF24', // Closed Hi-Hat — Bright Yellow
  43: '#7C3AED', // High Floor Tom — Violet
  44: '#FCD34D', // Pedal Hi-Hat — Pale Yellow
  45: '#8B5CF6', // Low Tom — Purple-Light
  46: '#F59E0B', // Open Hi-Hat — Golden Yellow
  47: '#7C3AED', // Tom (Mid/Low-Mid) — Violet
  48: '#A855F7', // Tom (High-Mid) — Purple
  49: '#06B6D4', // Crash Cymbal — Cyan
  50: '#A855F7', // Tom (High) — Purple
  51: '#0891B2', // Ride Cymbal — Teal
  52: '#0EA5E9', // Chinese Cymbal — Sky Blue
  55: '#22D3EE', // Splash Cymbal — Light Cyan
  57: '#67E8F9', // Crash Cymbal 2 — Pale Cyan
  59: '#0E7490', // Ride Cymbal 2 — Dark Teal
};

/** Default color for drum notes not found in the color map */
const DRUM_COLOR_DEFAULT = '#6B7280'; // Gray

/** Get the display color for a drum MIDI note number */
export function getDrumColor(midiNote: number): string {
  return DRUM_COLOR_MAP[midiNote] ?? DRUM_COLOR_DEFAULT;
}

// ─── Drum Sound Engine ────────────────────────────────────────────────────────

/** Tom notes in ascending pitch order for frequency mapping */
const TOM_NOTES = new Set([41, 43, 45, 47, 48, 50]);

/**
 * Synthesizes drum sounds using the Web Audio API.
 * Accepts an AudioContext via constructor injection for testability.
 */
export class DrumSoundEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private noiseBuffer: AudioBuffer | null = null;
  private masterVolume: number = 0.7;
  private disposed: boolean = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.masterVolume;
    this.masterGain.connect(ctx.destination);
    this._initNoiseBuffer();
  }

  private _initNoiseBuffer(): void {
    const sampleRate = this.ctx.sampleRate ?? 44100;
    const bufferSize = sampleRate; // 1 second of mono white noise
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  /** Set master volume (0.0–1.0, default 0.7) */
  setVolume(level: number): void {
    this.masterVolume = clamp(level, 0.0, 1.0);
    this.masterGain.gain.value = this.masterVolume;
  }

  /** Trigger synthesized drum sound for the given MIDI note and velocity */
  play(note: number, velocity: number): void {
    if (this.disposed) return;
    if (velocity <= 0) return;

    const gain = (velocity / 127) * this.masterVolume;
    const now = this.ctx.currentTime;

    if (note === 36 || note === 35) {
      this._playKick(gain, now);
    } else if (note === 38 || note === 40) {
      this._playSnare(gain, now);
    } else if (note === 42 || note === 44) {
      this._playClosedHiHat(gain, now);
    } else if (note === 46) {
      this._playOpenHiHat(gain, now);
    } else if (TOM_NOTES.has(note)) {
      this._playTom(note, gain, now);
    } else if (note === 49 || note === 57 || note === 55) {
      this._playCrash(gain, now);
    } else if (note === 51 || note === 59 || note === 53) {
      this._playRide(gain, now);
    } else {
      this._playFallback(gain, now);
    }
  }

  private _playKick(gain: number, now: number): void {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gainNode);
    gainNode.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private _playSnare(gain: number, now: number): void {
    // Noise component with bandpass at 3000Hz
    if (this.noiseBuffer) {
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3000;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(gain, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSource.start(now);
      noiseSource.stop(now + 0.15);
    }
    // Triangle oscillator at 200Hz
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = 200;
    oscGain.gain.setValueAtTime(gain, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  private _playClosedHiHat(gain: number, now: number): void {
    if (!this.noiseBuffer) return;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8000;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + 0.05);
  }

  private _playOpenHiHat(gain: number, now: number): void {
    if (!this.noiseBuffer) return;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 8000;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + 0.3);
  }

  private _playTom(note: number, gain: number, now: number): void {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    // Map note 41–50 proportionally to 80Hz–200Hz (lower note = lower freq)
    const freq = mapRange(note, 41, 50, 80, 200);
    osc.type = 'sine';
    osc.frequency.value = freq;
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gainNode);
    gainNode.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  private _playCrash(gain: number, now: number): void {
    if (!this.noiseBuffer) return;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 5000;
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + 0.5);
  }

  private _playRide(gain: number, now: number): void {
    if (!this.noiseBuffer) return;
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 10000;
    filter.Q.value = 15; // narrow band for ride characteristic
    const gainNode = this.ctx.createGain();
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    noiseSource.start(now);
    noiseSource.stop(now + 0.4);
  }

  private _playFallback(gain: number, now: number): void {
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440;
    gainNode.gain.setValueAtTime(gain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gainNode);
    gainNode.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  /** Disconnect the master gain node from the audio context destination */
  dispose(): void {
    if (this.disposed) return;
    this.masterGain.disconnect();
    this.disposed = true;
  }
}
