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
- [ ] Delegates to `matchNote()` with internal `consumedKeys` set
- [ ] On `correct`/`early`/`late`: adds the matched key (`"note_timeMs"`) to `consumedKeys`
- [ ] Returns a `ScoringEvent` with `timestamp = performance.now()`
- [ ] Appends the event to `events` array
- [ ] `wrong_note` result: does NOT add to consumedKeys

### advancePlayhead — miss detection
- [ ] For each expected note in `lookup`: if `expectedTimeMs + toleranceMs < currentTimeMs` AND that note was not consumed → emit `ScoringEvent` with `classification: 'missed'`
- [ ] Missed events have `detectedTimeMs: undefined`, `offsetMs: 0`
- [ ] Does NOT re-emit misses for notes already marked missed
- [ ] Returns array of newly detected missed events (can be empty)
- [ ] Appends missed events to `events` array

### getActiveGlows
- [ ] Returns `Map<number, ScoringEvent>` — keyed by MIDI note number
- [ ] Only includes events where `now - event.timestamp < glowDurationMs` (default 800ms)
- [ ] If multiple events exist for the same note within the glow window, returns the most recent one
- [ ] Expired events (older than glowDurationMs) are excluded

### reset
- [ ] Clears `events` array
- [ ] Clears `consumedKeys` set
- [ ] Clears internal miss-tracking state
- [ ] After reset, the tracker behaves as if freshly constructed

### events
- [ ] Read-only array — cannot be mutated externally
- [ ] Preserves insertion order

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
