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

// ─── Drum Hit Detection ────────────────────────────────────────────────────

/** Timing offset threshold (ms) within which a hit is classified as 'hit' vs 'early'/'late' */
export const HIT_PERFECT_THRESHOLD_MS = 20;

/** Result of validating a detected drum hit against expected notes */
export interface DrumHitValidation {
  /** Expected MIDI note from the exercise */
  expectedNote: number;
  /** Time of the expected hit in milliseconds */
  expectedTimeMs: number;
  /** Time of the detected hit in milliseconds */
  detectedTimeMs: number;
  /** Timing offset: detected - expected (negative = early, positive = late) */
  offsetMs: number;
  /** Classification of the hit */
  classification: 'hit' | 'miss' | 'violation' | 'early' | 'late';
}

/** Lookup structure: note → sorted timestamps of expected hits */
export type HitLookup = Record<number, number[]>;

/**
 * Build a hit lookup structure from MIDI events for fast validation.
 * Maps each MIDI note to a sorted array of expected hit times.
 */
export function buildHitLookup(midiEvents: Array<{ note: number; timestamp: number }>): HitLookup {
  const lookup: HitLookup = {};
  for (const event of midiEvents) {
    if (!lookup[event.note]) {
      lookup[event.note] = [];
    }
    lookup[event.note].push(event.timestamp);
  }
  // Ensure all arrays are sorted
  for (const note in lookup) {
    lookup[Number(note)].sort((a, b) => a - b);
  }
  return lookup;
}

/**
 * Find the nearest expected hit time for a given note within tolerance window.
 * Returns the closest match if within ±tolerance, or undefined if not found.
 */
function findNearestHit(
  note: number,
  detectedTimeMs: number,
  lookup: HitLookup,
  toleranceMs: number
): number | undefined {
  const expectedTimes = lookup[note];
  if (!expectedTimes || expectedTimes.length === 0) return undefined;

  let nearest: number | undefined;
  let nearestDistance = toleranceMs + 1;

  for (const expectedTime of expectedTimes) {
    const distance = Math.abs(detectedTimeMs - expectedTime);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = expectedTime;
    }
  }

  return nearestDistance <= toleranceMs ? nearest : undefined;
}

/**
 * Validate a detected drum hit against expected notes.
 * @param detectedNote MIDI note number of the detected hit
 * @param detectedTimeMs Time when the hit was detected (ms from exercise start)
 * @param lookup Hit lookup structure from buildHitLookup()
 * @param toleranceMs Timing tolerance window (default: 150ms)
 * @returns Validation result with classification and timing offset
 */
export function validateDrumHit(
  detectedNote: number,
  detectedTimeMs: number,
  lookup: HitLookup,
  toleranceMs: number = 150
): DrumHitValidation | null {
  const expectedTimeMs = findNearestHit(detectedNote, detectedTimeMs, lookup, toleranceMs);

  if (expectedTimeMs === undefined) {
    // No expected hit found for this note — it's a violation
    return {
      expectedNote: detectedNote,
      expectedTimeMs: detectedTimeMs,
      detectedTimeMs,
      offsetMs: 0,
      classification: 'violation',
    };
  }

  const offsetMs = detectedTimeMs - expectedTimeMs;
  let classification: 'hit' | 'early' | 'late';

  if (Math.abs(offsetMs) <= HIT_PERFECT_THRESHOLD_MS) {
    classification = 'hit';
  } else if (offsetMs < 0) {
    classification = 'early';
  } else {
    classification = 'late';
  }

  return {
    expectedNote: detectedNote,
    expectedTimeMs,
    detectedTimeMs,
    offsetMs,
    classification,
  };
}
