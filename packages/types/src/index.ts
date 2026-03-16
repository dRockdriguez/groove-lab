// ─── Instruments ────────────────────────────────────────────────────────────

export type InstrumentType = 'electronic-drums' | 'bass-guitar' | 'guitar';

export interface Instrument {
  id: string;
  type: InstrumentType;
  name: string;
  midiChannel?: number;
}

// ─── MIDI ────────────────────────────────────────────────────────────────────

export type MidiEventType = 'noteOn' | 'noteOff' | 'controlChange';

export interface MidiEvent {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** MIDI note number (0–127) */
  note: number;
  /** Velocity (0–127) */
  velocity: number;
  /** MIDI channel (1–16) */
  channel: number;
  type: MidiEventType;
}

// ─── Exercises ──────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  title: string;
  description: string;
}

export interface ExerciseSection {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface InstrumentExercises {
  instrumentType: InstrumentType;
  sections: ExerciseSection[];
}

// ─── Practice Sessions ───────────────────────────────────────────────────────

export interface PracticeSession {
  id: string;
  instrumentId: string;
  startedAt: Date;
  endedAt?: Date;
  /** Target BPM for this session */
  bpm: number;
  events: MidiEvent[];
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export interface TimingFeedback {
  sessionId: string;
  /** Average deviation from the grid in milliseconds */
  averageDeviation: number;
  /** Accuracy percentage (0–100) */
  accuracy: number;
  suggestions: string[];
}

// ─── Playback ────────────────────────────────────────────────────────────────

/** Represents the current state of exercise playback */
export type PlaybackState = 'stopped' | 'playing' | 'paused';

/** Exercise with full playback data */
export interface ExercisePlaybackData extends Exercise {
  bpm: number;
  durationMs: number;
  audioUrl: string;
  midiEvents: MidiEvent[];
  instrumentType: InstrumentType;
}

/** Feedback type for a single note capture */
export type FeedbackType = 'hit' | 'miss' | 'wrongNote' | 'early' | 'late' | 'weak' | 'strong';

/** Feedback for a single MIDI event capture */
export interface NoteFeedback {
  expectedEvent: MidiEvent;
  capturedEvent?: MidiEvent;
  feedbackType: FeedbackType;
  deviationMs?: number;
  velocityDifference?: number;
  /** When feedback was generated */
  timestamp: number;
}

/** Summary statistics for a practice session */
export interface SessionStatistics {
  /** 0–100 percentage */
  accuracy: number;
  hitCount: number;
  expectedNoteCount: number;
  averageTimingOffsetMs: number;
  strikeViolationCount: number;
}

// ─── API ─────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
}
