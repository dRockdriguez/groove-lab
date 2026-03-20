# Spec: Note Matching Engine

## Scope

Implement a pure, stateless function `matchNote()` that compares a single detected MIDI hit against an exercise's expected notes. Also implement `buildExpectedNoteLookup()` to create the lookup structure, and export tolerance preset constants.

## Inputs

- `detectedNote: number` — MIDI note the user played (e.g., 36=kick, 38=snare)
- `detectedTimeMs: number` — When the user hit the note (ms from exercise start)
- `lookup: ExpectedNoteLookup` — Map of MIDI note → sorted array of expected timestamps
- `toleranceMs: number` — Tolerance window in ms
- `consumedKeys?: Set<string>` — Optional set of already-matched notes (format: `"note_timeMs"`)

## Outputs

- `NoteMatchResult` object with classification, timing data

## Types and Exports

```typescript
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

export function buildExpectedNoteLookup(
  midiEvents: Array<{ note: number; timestamp: number }>
): ExpectedNoteLookup;

export function matchNote(
  detectedNote: number,
  detectedTimeMs: number,
  lookup: ExpectedNoteLookup,
  toleranceMs: number,
  consumedKeys?: Set<string>
): NoteMatchResult;
```

## Acceptance Criteria

### buildExpectedNoteLookup
- [ ] Groups events by MIDI note number
- [ ] Each note's timestamp array is sorted ascending
- [ ] Ignores duplicate timestamps for the same note

### matchNote — correct hit
- [ ] `matchNote(36, 500, {36:[500]}, 200)` → `{ classification: 'correct', offsetMs: 0 }`
- [ ] `matchNote(36, 520, {36:[500]}, 200)` → `{ classification: 'correct', offsetMs: 20 }` (within ±30ms threshold)
- [ ] `matchNote(36, 480, {36:[500]}, 200)` → `{ classification: 'correct', offsetMs: -20 }` (within ±30ms threshold)

### matchNote — early hit
- [ ] `matchNote(36, 440, {36:[500]}, 200)` → `{ classification: 'early', offsetMs: -60 }` (beyond 30ms, within tolerance)

### matchNote — late hit
- [ ] `matchNote(36, 560, {36:[500]}, 200)` → `{ classification: 'late', offsetMs: 60 }` (beyond 30ms, within tolerance)

### matchNote — wrong note
- [ ] `matchNote(36, 500, {42:[500]}, 200)` → `{ classification: 'wrong_note' }` (note 36 not in lookup)
- [ ] `matchNote(36, 500, {}, 200)` → `{ classification: 'wrong_note' }` (empty lookup)
- [ ] `matchNote(36, 900, {36:[500]}, 200)` → `{ classification: 'wrong_note' }` (outside tolerance window)

### matchNote — consumed notes
- [ ] With `consumedKeys` containing `"36_500"`, `matchNote(36, 500, {36:[500]}, 200)` → `{ classification: 'wrong_note' }` (already consumed, no other match available)
- [ ] `matchNote` does NOT mutate the `consumedKeys` set (caller is responsible)

### matchNote — nearest hit selection
- [ ] When multiple expected timestamps exist for the same note within tolerance, matches the nearest one
- [ ] `matchNote(36, 510, {36:[400, 500, 600]}, 200)` → matches 500 (closest), `offsetMs: 10`

### Tolerance presets
- [ ] `TOLERANCE_PRESETS.easy === 300`
- [ ] `TOLERANCE_PRESETS.medium === 200`
- [ ] `TOLERANCE_PRESETS.hard === 100`
- [ ] `PERFECT_THRESHOLD_MS === 30`

## Edge Cases

- User hits exactly at expected time (offsetMs = 0): classified as `correct`
- User hits exactly at ±30ms boundary: classified as `correct` (inclusive)
- User hits at ±toleranceMs boundary: classified as `early` or `late` (inclusive)
- Empty lookup: always `wrong_note`
- Note exists in lookup but no timestamps within tolerance: `wrong_note`
- Multiple notes of same type close together: matches nearest unconsumed

## Notes

- This is a pure function with no side effects and no React dependency
- Lives in `packages/utils/src/index.ts` after `getDrumColor` section
- The `consumedKeys` set allows the caller (ScoringTracker) to prevent double-matching
- `offsetMs = detectedTimeMs - matchedTimeMs` (negative = early, positive = late)
- For `wrong_note`: `matchedTimeMs = detectedTimeMs`, `offsetMs = 0`
