# Overview: Drum Scoring Improvements

## Problem Summary

The drum hit detection system (spec: drum-hit-detection, v1.1) has five confirmed logic bugs and one UX regression. Each bug independently produces incorrect scoring, misleading feedback, or visual glitches. The UX improvement replaces a distracting full-width banner with subtle per-track inline glow feedback anchored to the timeline.

## Affected Files

- `packages/utils/src/index.ts` — `validateDrumHit`, `buildHitLookup`
- `packages/ui/src/components/molecules/DrumHitFeedback/DrumHitFeedback.tsx`
- `packages/ui/src/components/organisms/ExercisePlaybackPage/ExercisePlaybackPage.tsx`
- `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.tsx`

## Architecture

```
MIDI event (e.timeStamp) → convert to exercise timeline ms
    ↓
validateDrumHit(note, exerciseMs, lookup, tolerance)
    ↓
classification: 'hit' | 'early' | 'late' | 'miss' | 'violation'
    ↓ (accumulated per loop iteration)
validatedHits[] (reset on loop jump)
    ↓                       ↓
DrumHitFeedback         ExercisePlaybackTimeline
(stats grid only)       (per-track row glow overlays)
```

## Mini-Specs and Execution Order

Specs 01–05 are independent bug fixes and can be implemented in any order.
Spec 06 (UX) depends on spec 04 being done first (it removes the banner that 04 touches).

| # | File | Scope | Dependency |
|---|------|-------|------------|
| 01 | `01-fix-hit-classification.md` | Fix `validateDrumHit` classification logic | none |
| 02 | `02-fix-midi-timestamp.md` | Fix MIDI event timestamp staleness | none |
| 03 | `03-fix-loop-hit-tracking.md` | Reset `validatedHits` and consumed timestamps per loop iteration | none |
| 04 | `04-fix-accuracy-denominator.md` | Use `totalExpectedHits` as accuracy denominator | none |
| 05 | `05-fix-overlay-fade-after-loop.md` | Fix overlay fade opacity going negative after loop jump | none |
| 06 | `06-ux-inline-track-glow.md` | Replace banner with per-track row glow in timeline | after 04 |
