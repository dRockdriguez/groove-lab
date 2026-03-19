# Spec: Fix Loop Hit Tracking (Reset Per Iteration)

## Scope

In `ExercisePlaybackPage.tsx`, the `validatedHits` array accumulates across all loop
iterations without ever being reset. On iteration 2+, hits validate against the same
unmodified lookup timestamps and are counted again, inflating accuracy and hit count.
This spec makes `validatedHits` track hits scoped to the current loop iteration and
introduces consumed-timestamp tracking to prevent re-validation.

## Inputs

- `validatedHits: DrumHitValidation[]` — current React state
- `currentLoopRepetitionRef: React.MutableRefObject<number>` — existing ref tracking
  current loop repetition count
- `hitLookupRef: React.MutableRefObject<HitLookup>` — existing ref; stays as-is
- Loop jump signal: occurs in the `updatePlayhead` rAF callback when the loop end is
  reached and `audioRef.current.currentTime` is reset to `loopStartMs / 1000`

## Outputs

- `validatedHits` is cleared (set to `[]`) at the moment a loop jump occurs
- A new ref `consumedHitTimestampsRef: React.MutableRefObject<Map<string, true>>` tracks
  which `${note}_${expectedTimeMs}` keys have been matched in the current iteration
- `validateDrumHit` is called only if the nearest expected hit's key is not in
  `consumedHitTimestampsRef`; if it is, the hit is classified as `'violation'` (extra note)
- On loop jump, `consumedHitTimestampsRef` is cleared (new `Map()`)

## Acceptance Criteria

- [x] When a loop jump occurs in `updatePlayhead`, `setValidatedHits([])` is called before
      `setCurrentLoopRepetition(newRep)`
- [x] `consumedHitTimestampsRef` is a `useRef(new Map<string, true>())` added to the
      component alongside existing hit detection refs
- [x] In `handleMidiMessage`, after `validateDrumHit` returns a non-null result with
      a non-violation classification, the key `${result.expectedNote}_${result.expectedTimeMs}`
      is added to `consumedHitTimestampsRef.current`
- [x] In `handleMidiMessage`, if the nearest expected timestamp produces a key already in
      `consumedHitTimestampsRef.current`, the result is overridden to `'violation'` before
      being appended to `validatedHits`
- [x] On loop jump, `consumedHitTimestampsRef.current = new Map()` executes in the same
      rAF callback branch that calls `setValidatedHits([])`
- [x] On playback restart from `'stopped'` state, `consumedHitTimestampsRef.current` is
      cleared (existing `lastHitTimePerNoteRef.current = {}` block, add adjacent clear)
- [x] On exercise change, `consumedHitTimestampsRef.current` is cleared in the existing
      `useEffect` that clears `validatedHits` and `lastHitTimePerNoteRef`
- [x] Given a 2-second loop [0ms, 2000ms] with 1 kick at 500ms: after completing iteration
      1 (kick validated as 'hit'), on iteration 2 the hit counter starts at 0 and the same
      kick, when replayed within tolerance, is classified as 'hit' again (not a duplicate
      violation)

## Edge Cases

- If loop jumps while a MIDI message is in flight: the consumed map is cleared after the
  jump; the in-flight hit will validate against the new iteration's empty consumed map
  (acceptable; timing resolution is coarser than the race window)
- Infinite loop mode: same reset logic applies each iteration
- Loop with 0 repetitions configured: loop is disabled before jump occurs (existing logic);
  no hit reset needed

## Notes

- `findNearestHit` in `packages/utils/src/index.ts` is not modified; consumed-hit
  filtering is done at the call site in `ExercisePlaybackPage`
- `DrumHitFeedback` continues to receive the full `validatedHits` array for the current
  iteration only (since it is reset on jump)
- `ExercisePlaybackTimeline` overlay map (`hitOverlayMap`) rebuilds automatically from
  the reset `validatedHits` array — no additional changes needed there

---

## Definition of Done

**Status:** Implemented

**Last updated:** 2026-03-19

- [x] All 8 acceptance criteria implemented and verified
- [x] All hits validated against correct iteration's consumed set
- [x] Loop jump clears both `validatedHits` and `consumedHitTimestampsRef` in same rAF callback
- [x] Playback restart clears consumed map for fresh session tracking
- [x] Exercise change clears consumed map for new exercise
- [x] 18 tests written and all passing:
  - 1 ref initialization test
  - 4 consumed hit tracking tests
  - 3 loop jump clearing tests
  - 5 state change clearing tests
  - 4 integration tests
  - 1 edge case test
- [x] No regressions: all 759+ frontend tests passing
- [x] Code follows spec requirements: `consumedHitTimestampsRef` pattern, violation override, proper cleanup
- [x] Acceptance criteria map 1:1 to implementation locations (ExercisePlaybackPage.tsx lines 119-127, 283-284, 328-330, 487-488, 464)
