# Spec: Realtime Scoring Tracker

## Scope

Implement a `ScoringTracker` class that accumulates scoring results during playback. It processes user hits via the matching engine, detects missed notes when the playhead advances past them, and provides a glow map for the UI. This is a plain TypeScript class with no React dependency.

## Inputs

- `lookup: ExpectedNoteLookup` — Expected notes from the exercise
- `toleranceMs: number` — Active tolerance window

## Outputs

- `ScoringEvent` objects for each classification
- `activeGlows` map for UI rendering

## Types and API

```typescript
export type ScoringClassification = HitClassification | 'missed';

export interface ScoringEvent {
  classification: ScoringClassification;
  note: number;
  expectedTimeMs: number;
  detectedTimeMs?: number;   // undefined for 'missed'
  offsetMs: number;          // 0 for 'missed' and 'wrong_note'
  timestamp: number;         // performance.now() when event was created (for glow fade)
}

export class ScoringTracker {
  constructor(lookup: ExpectedNoteLookup, toleranceMs: number);

  processHit(note: number, detectedTimeMs: number): ScoringEvent;
  advancePlayhead(currentTimeMs: number): ScoringEvent[];
  getActiveGlows(now: number, glowDurationMs?: number): Map<number, ScoringEvent>;
  reset(): void;
  readonly events: ReadonlyArray<ScoringEvent>;
}
```

## Acceptance Criteria

### processHit
- [x] Delegates to `matchNote()` with internal `consumedKeys` set
- [x] On `correct`/`early`/`late`: adds the matched key (`"note_timeMs"`) to `consumedKeys`
- [x] Returns a `ScoringEvent` with `timestamp = performance.now()`
- [x] Appends the event to `events` array
- [x] `wrong_note` result: does NOT add to consumedKeys

### advancePlayhead — miss detection
- [x] For each expected note in `lookup`: if `expectedTimeMs + toleranceMs < currentTimeMs` AND that note was not consumed → emit `ScoringEvent` with `classification: 'missed'`
- [x] Missed events have `detectedTimeMs: undefined`, `offsetMs: 0`
- [x] Does NOT re-emit misses for notes already marked missed
- [x] Returns array of newly detected missed events (can be empty)
- [x] Appends missed events to `events` array

### getActiveGlows
- [x] Returns `Map<number, ScoringEvent>` — keyed by MIDI note number
- [x] Only includes events where `now - event.timestamp < glowDurationMs` (default 800ms)
- [x] If multiple events exist for the same note within the glow window, returns the most recent one
- [x] Expired events (older than glowDurationMs) are excluded

### reset
- [x] Clears `events` array
- [x] Clears `consumedKeys` set
- [x] Clears internal miss-tracking state
- [x] After reset, the tracker behaves as if freshly constructed

### events
- [x] Read-only array — cannot be mutated externally
- [x] Preserves insertion order

## Edge Cases

- `processHit` called when not playing: caller is responsible for gating (tracker always processes)
- Same note hit twice rapidly (within 50ms): caller debounces before calling `processHit`
- `advancePlayhead` called with time going backwards (after loop jump without reset): no new misses emitted (expectedTimeMs + tolerance > currentTimeMs)
- Empty lookup (no expected notes): `processHit` always returns `wrong_note`, `advancePlayhead` returns empty
- `getActiveGlows` called with no events: returns empty map

## Notes

- Lives in `packages/utils/src/index.ts` after the `matchNote` section
- No React dependency — testable with plain TypeScript tests
- The caller (ExercisePlaybackPage) is responsible for:
  - Calling `reset()` on loop jump and playback restart
  - Calling `advancePlayhead()` each animation frame
  - Gating `processHit()` to only during active playback
  - Debouncing MIDI hits (50ms per note)
- `getActiveGlows` uses `now` parameter (not `Date.now()`) so tests can control time

## Status

**Status:** Implemented

**Last updated:** 2026-03-20

## Definition of Done

- [x] All 20 acceptance criteria implemented in `packages/utils/src/index.ts`
- [x] `ScoringTracker` class properly exported with all methods
- [x] `ScoringEvent` interface and `ScoringClassification` type defined
- [x] Types align with spec signature (lines 233-342)
- [x] `processHit` delegates to `matchNote` with consumedKeys tracking
- [x] `advancePlayhead` emits misses and prevents re-emission
- [x] `getActiveGlows` returns filtered, last-wins map with 800ms default
- [x] `reset` clears all state (events, consumedKeys, missedKeys)
- [x] `events` getter returns ReadonlyArray preserving insertion order
- [x] No React dependencies — plain TypeScript class
- [x] Architecture rules respected (lives in packages/utils)
- [x] Test generation completed (80+ tests covering all criteria)
