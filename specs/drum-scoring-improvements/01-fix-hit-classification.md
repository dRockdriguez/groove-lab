# Spec: Fix Hit Classification Logic in validateDrumHit

## Scope

Fix the classification branch in `validateDrumHit` (`packages/utils/src/index.ts`, lines
219–228). The condition `hitIndex === 0` incorrectly classifies the first expected timestamp
for every note as `'hit'` regardless of timing offset. Replace it with a timing-based
threshold: offsetMs within ±20ms of 0 = `'hit'`, offsetMs < 0 = `'early'`, offsetMs > 0 =
`'late'`.

## Inputs

- `detectedNote: number` — MIDI note number
- `detectedTimeMs: number` — exercise timeline position of the detected hit (ms)
- `lookup: HitLookup` — `Record<number, number[]>` from `buildHitLookup`
- `toleranceMs: number` (default 150) — outer window for match

## Outputs

`DrumHitValidation | null` with `classification` field set as follows:
- `'hit'` when `Math.abs(offsetMs) <= 20`
- `'early'` when `offsetMs < -20`
- `'late'` when `offsetMs > 20`
- `'violation'` when no match found in lookup within `toleranceMs`
- `null` when note exists in lookup but nearest match is outside `toleranceMs` (miss
  — currently returns `violation`; behavior is unchanged here, no scope change)

## Acceptance Criteria

- [x] `validateDrumHit(36, 500, { 36: [500] }, 150)` returns `classification: 'hit'`
      (offsetMs = 0, within ±20ms threshold)
- [x] `validateDrumHit(36, 515, { 36: [500] }, 150)` returns `classification: 'hit'`
      (offsetMs = +15, within ±20ms threshold)
- [x] `validateDrumHit(36, 485, { 36: [500] }, 150)` returns `classification: 'hit'`
      (offsetMs = -15, within ±20ms threshold)
- [x] `validateDrumHit(36, 530, { 36: [500] }, 150)` returns `classification: 'late'`
      (offsetMs = +30, outside ±20ms threshold, within tolerance)
- [x] `validateDrumHit(36, 470, { 36: [500] }, 150)` returns `classification: 'early'`
      (offsetMs = -30, outside ±20ms threshold, within tolerance)
- [x] `validateDrumHit(36, 1000, { 36: [500, 1000] }, 150)` returns `classification: 'hit'`
      (second expected timestamp, offsetMs = 0 — was previously broken when hitIndex !== 0)
- [x] `validateDrumHit(36, 970, { 36: [500, 1000] }, 150)` returns `classification: 'early'`
      (second expected timestamp, offsetMs = -30 — was previously broken)
- [x] `validateDrumHit(36, 1040, { 36: [500, 1000] }, 150)` returns `classification: 'late'`
      (second expected timestamp, offsetMs = +40 — was previously broken)
- [x] `validateDrumHit(36, 500, { 42: [500] }, 150)` returns `classification: 'violation'`
      (note 36 not in lookup)
- [x] The constant `HIT_PERFECT_THRESHOLD_MS = 20` is exported from `packages/utils/src/index.ts`
      or defined as a named constant at module scope (not a magic number)

## Edge Cases

- `hitIndex` variable is removed from the classification branch entirely; the `indexOf`
  lookup is no longer needed for classification
- `offsetMs === 0` is covered by `Math.abs(offsetMs) <= 20`, so explicit check is removed
- The `toleranceMs` parameter still controls the outer match window; `HIT_PERFECT_THRESHOLD_MS`
  only affects how a matched hit is labeled

## Notes

- Only `packages/utils/src/index.ts` is modified
- Existing unit tests in `packages/utils/src/drum-hit-detection.test.ts` that assert
  `classification: 'hit'` for offset=0 continue passing
- Tests asserting `classification: 'hit'` for the first note hit with offset > 20ms must be
  updated to `'late'` or `'early'` as appropriate
- No changes to `ExercisePlaybackPage` or `DrumHitFeedback` in this spec

## Definition of Done

- [x] `HIT_PERFECT_THRESHOLD_MS` constant exported from `packages/utils/src/index.ts`
- [x] `validateDrumHit` classification logic updated to use timing-based thresholds
- [x] All 10 acceptance criteria have corresponding passing tests
- [x] Edge cases tested (boundary conditions at ±20ms, multiple timestamps)
- [x] No regressions in frontend tests (722 tests passing)
- [x] Only `packages/utils/src/index.ts` modified; no changes to components

## Status

**Implemented**

Last updated: 2026-03-18
