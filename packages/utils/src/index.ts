import type { FavoritesStore, InstrumentExercises, InstrumentType, TagsStore } from '@groovelab/types';
import { LocalStorageNotifier } from './notifier/LocalStorageNotifier';

// ─── Re-exports ───────────────────────────────────────────────────────────────
export { LocalStorageNotifier } from './notifier/LocalStorageNotifier';
export { useLocalStorageListener } from './hooks/useLocalStorageListener';

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

// ─── Note Matching Engine ─────────────────────────────────────────────────────

export type HitClassification = 'correct' | 'early' | 'late' | 'wrong_note';

export interface NoteMatchResult {
  classification: HitClassification;
  matchedNote: number;
  matchedTimeMs: number;
  detectedTimeMs: number;
  offsetMs: number;
}

export type TolerancePreset = 'easy' | 'medium' | 'hard';

export const TOLERANCE_PRESETS: Record<TolerancePreset, number> = {
  easy: 300,
  medium: 200,
  hard: 100,
};

export const PERFECT_THRESHOLD_MS = 30;

export type ExpectedNoteLookup = Record<number, number[]>;

/** Build a lookup table mapping MIDI note → sorted unique timestamps */
export function buildExpectedNoteLookup(
  midiEvents: Array<{ note: number; timestamp: number }>
): ExpectedNoteLookup {
  const grouped: Record<number, Set<number>> = {};
  for (const event of midiEvents) {
    if (!grouped[event.note]) {
      grouped[event.note] = new Set();
    }
    grouped[event.note].add(event.timestamp);
  }
  const result: ExpectedNoteLookup = {};
  for (const noteKey of Object.keys(grouped)) {
    const note = Number(noteKey);
    result[note] = Array.from(grouped[note]).sort((a, b) => a - b);
  }
  return result;
}

/**
 * Match a detected MIDI hit against expected notes in the lookup.
 * Returns a NoteMatchResult with classification and timing data.
 * Does NOT mutate the consumedKeys set — caller is responsible for updates.
 */
export function matchNote(
  detectedNote: number,
  detectedTimeMs: number,
  lookup: ExpectedNoteLookup,
  toleranceMs: number,
  consumedKeys?: Set<string>
): NoteMatchResult {
  const wrongNote: NoteMatchResult = {
    classification: 'wrong_note',
    matchedNote: detectedNote,
    matchedTimeMs: detectedTimeMs,
    detectedTimeMs,
    offsetMs: 0,
  };

  const timestamps = lookup[detectedNote];
  if (!timestamps || timestamps.length === 0) {
    return wrongNote;
  }

  let nearestTs: number | null = null;
  let nearestDist = Infinity;

  for (const ts of timestamps) {
    const dist = Math.abs(detectedTimeMs - ts);
    if (dist > toleranceMs) continue;
    const key = `${detectedNote}_${ts}`;
    if (consumedKeys?.has(key)) continue;
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestTs = ts;
    }
  }

  if (nearestTs === null) {
    return wrongNote;
  }

  const offsetMs = detectedTimeMs - nearestTs;
  const absOffset = Math.abs(offsetMs);

  let classification: HitClassification;
  if (absOffset <= PERFECT_THRESHOLD_MS) {
    classification = 'correct';
  } else if (offsetMs < 0) {
    classification = 'early';
  } else {
    classification = 'late';
  }

  return {
    classification,
    matchedNote: detectedNote,
    matchedTimeMs: nearestTs,
    detectedTimeMs,
    offsetMs,
  };
}

// ─── Realtime Scoring Tracker ─────────────────────────────────────────────────

export type ScoringClassification = HitClassification | 'missed';

export interface ScoringEvent {
  classification: ScoringClassification;
  note: number;
  expectedTimeMs: number;
  detectedTimeMs?: number; // undefined for 'missed'
  offsetMs: number; // 0 for 'missed' and 'wrong_note'
  timestamp: number; // performance.now() when event was created (for glow fade)
}

export class ScoringTracker {
  private _lookup: ExpectedNoteLookup;
  private _toleranceMs: number;
  private _events: ScoringEvent[] = [];
  private _consumedKeys: Set<string> = new Set();
  private _missedKeys: Set<string> = new Set();

  constructor(lookup: ExpectedNoteLookup, toleranceMs: number) {
    this._lookup = lookup;
    this._toleranceMs = toleranceMs;
  }

  processHit(note: number, detectedTimeMs: number): ScoringEvent {
    const result = matchNote(
      note,
      detectedTimeMs,
      this._lookup,
      this._toleranceMs,
      this._consumedKeys
    );

    const event: ScoringEvent = {
      classification: result.classification,
      note: result.matchedNote,
      expectedTimeMs: result.matchedTimeMs,
      detectedTimeMs,
      offsetMs: result.offsetMs,
      timestamp: performance.now(),
    };

    if (
      result.classification === 'correct' ||
      result.classification === 'early' ||
      result.classification === 'late'
    ) {
      const key = `${result.matchedNote}_${result.matchedTimeMs}`;
      this._consumedKeys.add(key);
    }

    this._events.push(event);
    return event;
  }

  advancePlayhead(currentTimeMs: number): ScoringEvent[] {
    const newMisses: ScoringEvent[] = [];

    for (const noteKey of Object.keys(this._lookup)) {
      const note = Number(noteKey);
      const timestamps = this._lookup[note];
      for (const expectedTimeMs of timestamps) {
        if (expectedTimeMs + this._toleranceMs >= currentTimeMs) {
          continue;
        }
        const key = `${note}_${expectedTimeMs}`;
        if (this._consumedKeys.has(key) || this._missedKeys.has(key)) {
          continue;
        }
        this._missedKeys.add(key);
        const event: ScoringEvent = {
          classification: 'missed',
          note,
          expectedTimeMs,
          detectedTimeMs: undefined,
          offsetMs: 0,
          timestamp: performance.now(),
        };
        newMisses.push(event);
        this._events.push(event);
      }
    }

    return newMisses;
  }

  getActiveGlows(now: number, glowDurationMs: number = 800): Map<number, ScoringEvent> {
    const glowMap = new Map<number, ScoringEvent>();

    for (const event of this._events) {
      if (now - event.timestamp >= glowDurationMs) {
        continue;
      }
      const existing = glowMap.get(event.note);
      if (!existing || event.timestamp > existing.timestamp) {
        glowMap.set(event.note, event);
      }
    }

    return glowMap;
  }

  reset(): void {
    this._events = [];
    this._consumedKeys = new Set();
    this._missedKeys = new Set();
  }

  get events(): ReadonlyArray<ScoringEvent> {
    return this._events;
  }
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

// ─── Favorites & Tags Storage ─────────────────────────────────────────────────

const FAVORITES_KEY = 'groovelab_favorites';
const TAGS_KEY = 'groovelab_tags';
const FILTER_TAGS_KEY = 'groovelab_filter_tags';

// In-memory fallbacks for when localStorage/sessionStorage is unavailable
let _favoritesMemory: FavoritesStore = {};
let _tagsMemory: TagsStore = {};
let _filterTagsMemory: string[] = [];

function _readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function _writeLocalStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable — data lives only in-memory for this session
  }
}

function _isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__groovelab_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// ── Favorites ──────────────────────────────────────────────────────────────

/** Read all favorites from localStorage (or in-memory fallback). Returns {} on error or empty. */
export function getFavorites(): FavoritesStore {
  if (!_isLocalStorageAvailable()) return _favoritesMemory;
  return _readLocalStorage<FavoritesStore>(FAVORITES_KEY, {});
}

/** Persist a FavoritesStore. Subsequent getFavorites() returns this data. */
export function setFavorites(favorites: FavoritesStore): void {
  if (!_isLocalStorageAvailable()) {
    _favoritesMemory = favorites;
    LocalStorageNotifier.notifyChange(FAVORITES_KEY, null);
    return;
  }
  _writeLocalStorage(FAVORITES_KEY, favorites);
  LocalStorageNotifier.notifyChange(FAVORITES_KEY, localStorage.getItem(FAVORITES_KEY));
}

/** Returns true if the given exerciseId is marked as favorite. */
export function isFavorite(exerciseId: string): boolean {
  return getFavorites()[exerciseId] === true;
}

/**
 * Toggle favorite status for an exercise.
 * Returns the new state (true = now favorited, false = now unfavorited).
 * Persists immediately to localStorage.
 */
export function toggleFavorite(exerciseId: string): boolean {
  const favorites = getFavorites();
  const next = !favorites[exerciseId];
  if (next) {
    favorites[exerciseId] = true;
  } else {
    delete favorites[exerciseId];
  }
  setFavorites(favorites);
  return next;
}

// ── Tags ───────────────────────────────────────────────────────────────────

/** Read all tags from localStorage (or in-memory fallback). Returns {} on error or empty. */
export function getTags(): TagsStore {
  if (!_isLocalStorageAvailable()) return _tagsMemory;
  return _readLocalStorage<TagsStore>(TAGS_KEY, {});
}

/** Persist a TagsStore. Subsequent getTags() returns this data. */
export function setTags(tags: TagsStore): void {
  if (!_isLocalStorageAvailable()) {
    _tagsMemory = tags;
    LocalStorageNotifier.notifyChange(TAGS_KEY, null);
    return;
  }
  _writeLocalStorage(TAGS_KEY, tags);
  LocalStorageNotifier.notifyChange(TAGS_KEY, localStorage.getItem(TAGS_KEY));
}

/** Returns tags for a specific exercise. Returns [] if not found. */
export function getExerciseTags(exerciseId: string): string[] {
  return getTags()[exerciseId] ?? [];
}

/**
 * Add a tag to an exercise. Idempotent — adding the same tag twice is a no-op.
 * Trims whitespace; ignores empty strings after trimming.
 * Persists immediately.
 */
export function addTag(exerciseId: string, tag: string): void {
  const trimmed = tag.trim();
  if (!trimmed) return;
  const store = getTags();
  const existing = store[exerciseId] ?? [];
  if (existing.includes(trimmed)) return;
  store[exerciseId] = [...existing, trimmed];
  setTags(store);
}

/**
 * Remove a tag from an exercise. No-op if tag not present.
 * Persists immediately.
 */
export function removeTag(exerciseId: string, tag: string): void {
  const store = getTags();
  const existing = store[exerciseId];
  if (!existing) return;
  const updated = existing.filter((t) => t !== tag);
  if (updated.length === 0) {
    delete store[exerciseId];
  } else {
    store[exerciseId] = updated;
  }
  setTags(store);
}

/**
 * Replace all tags for a specific exercise with the provided array.
 * Persists immediately.
 */
export function setExerciseTags(exerciseId: string, tags: string[]): void {
  const store = getTags();
  if (tags.length === 0) {
    delete store[exerciseId];
  } else {
    store[exerciseId] = tags;
  }
  setTags(store);
}

/**
 * Returns all unique tags across all exercises, sorted alphabetically (case-insensitive).
 * Returns [] if no tags exist.
 */
export function getDistinctTags(): string[] {
  const store = getTags();
  const seen = new Set<string>();
  for (const tags of Object.values(store)) {
    for (const tag of tags) {
      seen.add(tag);
    }
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

// ── Session Filter State ───────────────────────────────────────────────────

function _isSessionStorageAvailable(): boolean {
  try {
    const testKey = '__groovelab_test__';
    sessionStorage.setItem(testKey, '1');
    sessionStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** Returns currently selected filter tags from sessionStorage. Returns [] if not set. */
export function getSelectedFilterTags(): string[] {
  if (!_isSessionStorageAvailable()) return _filterTagsMemory;
  try {
    const raw = sessionStorage.getItem(FILTER_TAGS_KEY);
    if (raw === null) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/** Persist selected filter tags to sessionStorage. */
export function setSelectedFilterTags(tags: string[]): void {
  if (!_isSessionStorageAvailable()) {
    _filterTagsMemory = tags;
    return;
  }
  try {
    sessionStorage.setItem(FILTER_TAGS_KEY, JSON.stringify(tags));
  } catch {
    _filterTagsMemory = tags;
  }
}

/** Remove selected filter tags from sessionStorage. */
export function clearSelectedFilterTags(): void {
  if (!_isSessionStorageAvailable()) {
    _filterTagsMemory = [];
    return;
  }
  try {
    sessionStorage.removeItem(FILTER_TAGS_KEY);
  } catch {
    _filterTagsMemory = [];
  }
}

// ─── Exercise Filter Logic ─────────────────────────────────────────────────────

/**
 * Filter exercises by instrument, favorites, and tags.
 *
 * Returns a new InstrumentExercises[] containing only the section(s) for the
 * selected instrument. Within each section, exercises are filtered to those that:
 *   - are favorites (when showFavoritesOnly is true)
 *   - have ALL selectedFilterTags (AND logic; no-op when array is empty)
 *
 * Section structure is always preserved — sections with no matching exercises
 * are returned with an empty exercises array. Input arguments are not mutated.
 *
 * Performance: O(n) where n = total exercises across all sections.
 */
export function filterExercises(
  exercisesByInstrument: InstrumentExercises[],
  selectedInstrument: InstrumentType,
  showFavoritesOnly: boolean,
  selectedFilterTags: string[]
): InstrumentExercises[] {
  const hasTags = selectedFilterTags.length > 0;

  return exercisesByInstrument
    .filter((item) => item.instrumentType === selectedInstrument)
    .map((item) => ({
      ...item,
      sections: item.sections.map((section) => ({
        ...section,
        exercises: section.exercises.filter((exercise) => {
          if (showFavoritesOnly && !isFavorite(exercise.id)) {
            return false;
          }
          if (hasTags) {
            const exerciseTags = getExerciseTags(exercise.id);
            if (!selectedFilterTags.every((tag) => exerciseTags.includes(tag))) {
              return false;
            }
          }
          return true;
        }),
      })),
    }));
}
