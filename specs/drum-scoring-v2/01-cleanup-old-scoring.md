# Spec: Cleanup Old Scoring

## Scope

Remove the entire old scoring/hit-detection system — code, components, exports, and test files. Leave a clean slate for the new system. All non-scoring functionality must continue working.

## Inputs

- Current codebase with old scoring system

## Outputs

- Codebase with zero references to old scoring types, functions, and components
- All non-scoring tests pass without regressions

## Acceptance Criteria

### Delete from `packages/utils/src/index.ts`
- [x] `HIT_PERFECT_THRESHOLD_MS` constant removed
- [x] `DrumHitValidation` interface removed
- [x] `HitLookup` type removed
- [x] `buildHitLookup()` function removed
- [x] `findNearestHit()` function removed
- [x] `validateDrumHit()` function removed
- [x] `getDrumColor()`, `DRUM_COLOR_MAP`, `DrumSoundEngine` and all other exports remain intact

### Delete `DrumHitFeedback` component
- [x] Delete entire folder `packages/ui/src/components/molecules/DrumHitFeedback/`
- [x] Remove `DrumHitFeedback` export from `packages/ui/src/components/molecules/index.ts`
- [x] Remove `DrumHitFeedback` export from `packages/ui/src/index.ts`

### Clean `ExercisePlaybackPage.tsx`
- [x] Remove `validatedHits` state
- [x] Remove `hitLookupRef` ref
- [x] Remove `consumedHitTimestampsRef` ref
- [x] Remove `lastHitTimePerNoteRef` ref (ONLY if used exclusively for scoring debounce — keep if used for sound debounce too)
- [x] Remove `playbackStartPerfTimeRef` and `playbackStartAudioOffsetRef` (ONLY if used exclusively for scoring timestamp calculation — keep if used for sound/MIDI timing too)
- [x] Remove `HIT_TOLERANCE_MS` constant
- [x] Remove scoring section of `handleMidiMessage` (keep sound playback section)
- [x] Remove `hitLookup` useMemo
- [x] Remove `<DrumHitFeedback>` JSX element
- [x] Remove `validatedHits` prop passed to `<ExercisePlaybackTimeline>`
- [x] Remove any effects that sync scoring refs or clear scoring state
- [x] Keep: sound playback, loop logic, MIDI capture setup, metronome, sidebar

### Clean `ExercisePlaybackTimeline.tsx`
- [x] Remove `validatedHits` from props interface
- [x] Remove `DrumHitValidation` import
- [x] Remove `hitOverlayMap` useMemo
- [x] Remove `rowGlowMap` useMemo
- [x] Remove hit overlay rendering inside note bars
- [x] Remove row glow rendering
- [x] Keep: note bars, playhead, loop markers, drag interactions, drum colors

### Delete test files
- [x] `packages/utils/src/drum-hit-detection.test.ts`
- [x] `packages/ui/src/components/molecules/DrumHitFeedback/DrumHitFeedback.test.tsx`
- [x] `packages/ui/.../ExercisePlaybackTimeline/ExercisePlaybackTimeline.hit-overlays.test.tsx`
- [x] `packages/ui/.../ExercisePlaybackTimeline/ExercisePlaybackTimeline.track-glow.test.tsx`
- [x] `packages/ui/.../ExercisePlaybackPage/ExercisePlaybackPage.midi-feedback.test.tsx`
- [x] `packages/ui/.../ExercisePlaybackPage/ExercisePlaybackPage.loop-hit-tracking.test.tsx`
- [x] `packages/ui/.../ExercisePlaybackPage/ExercisePlaybackPage.midi-timestamp.test.tsx`

### Verification
- [x] `pnpm test` passes — no regressions in non-scoring tests (709 UI + 168 web = 877 tests passing)
- [x] No references to `DrumHitValidation`, `validateDrumHit`, `buildHitLookup`, `HitLookup` remain in source code (test files excluded since they're deleted)
- [x] ExercisePlaybackPage still functions: playback, MIDI sound, loops, metronome, sidebar

## Edge Cases

- Some refs (e.g., `playbackStartPerfTimeRef`) may be used by both scoring AND sound timing. Check before deleting — if shared, keep them.
- The MIDI handler's debounce logic (50ms per note) may be needed for sound too. If so, keep the debounce, just remove the validation call.
- `getDrumColor` is NOT part of scoring — it must remain.

## Notes

- This spec MUST be implemented first before any other spec in this folder.
- After this spec, the app should work exactly as before minus scoring feedback.
- **Status: Implemented** (2026-03-20)
