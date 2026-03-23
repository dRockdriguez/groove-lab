# Drum Hit Visual Feedback — Overview

## Problem

The timeline needs richer, more granular visual feedback when the user plays drum pads. Currently:
- Row glow provides full-row feedback for the most recent hit on each note
- Individual notes don't change appearance to show whether they were hit correctly, early, late, or missed
- Playhead position makes it hard for players to see what "now" looks like on the screen
- Row glow opacity can compete visually with the new per-note color feedback

## Solution Architecture

Five independent enhancements to the timeline visualization and controls:

```
1. Note Color Feedback (per-played note)
   ├─ Modify note appearance after MIDI input
   ├─ Green = hit, Orange = late, Purple = early
   └─ Track which individual notes have been played

2. Playhead Offset
   ├─ Shift playhead position right by 200-300px
   ├─ Constant visual offset (not time-based)
   └─ Better "now playing" visibility

3. Row Glow Opacity Reduction
   ├─ Reduce row glow opacity from 0.4 to ~0.15-0.2
   ├─ Let note colors be primary feedback
   └─ Keep row glow as supporting visual

4. Integration Test
   ├─ Wire all 3 together in ExercisePlaybackPage
   ├─ Ensure no conflicts or z-index issues
   └─ Test in isolation + together

5. Hit Counter Display
   ├─ Real-time counter below PlaybackControls
   ├─ 4 colored boxes: Hits, Early, Late, Violations
   └─ Instant updates from validatedHits state
```

## Mini-Specs

| # | Spec | Scope | Dependencies |
|---|------|-------|-------------|
| 01 | note-color-feedback | Map validatedHits to per-note colors in timeline | None (reads existing validatedHits state) |
| 02 | playhead-offset | Add configurable playhead x-offset prop | None |
| 03 | row-glow-opacity | Reduce activeGlows opacity in fade calculation | None |
| 04 | integration-test | Integration test: all 3 features together | 01, 02, 03 |
| 05 | hit-counter | Real-time hit counter below PlaybackControls | None (reads validatedHits + isPlaying) |

## Execution Order

```
01 note-color-feedback (parallel)
02 playhead-offset      (parallel)
03 row-glow-opacity     (parallel)
05 hit-counter          (parallel)
└─ 04 integration-test (depends on 01, 02, 03; can also include 05)
```

Specs 01–03, 05 are independent and can be implemented in parallel. Spec 04 is the integration test that verifies all features work together.

## Data Model

### validatedHits (existing state in ExercisePlaybackPage)

```typescript
interface DrumHitValidation {
  note: number;               // MIDI note number
  detectedMs: number;         // When user hit it
  expectedTimeMs: number;     // When it was scheduled
  classification: 'hit' | 'early' | 'late' | 'miss' | 'violation';
  offset: number;             // ms offset (negative=early, positive=late)
}
```

### activeGlows (existing prop in ExercisePlaybackTimeline)

```typescript
Map<number, ScoringEvent>  // note → most recent event with classification + timestamp
```

## Color Mapping

| Classification | Timeline Note Color | Row Glow |
|---|---|---|
| `hit` | Green (#22C55E) | Green (reduced opacity) |
| `early` | Purple (#A855F7) | Yellow (reduced opacity) |
| `late` | Orange (#FB923C) | Orange (reduced opacity) |
| `miss` | Original rudiment color | Red (reduced opacity) |
| `violation` | Original rudiment color | Purple (reduced opacity) |
| Not played | Original rudiment color | None |

## Constraints

- Note color feedback only applies to notes that were **actually played** (in validatedHits)
- Playhead offset is **constant**, not time-based
- Row glow fade curve stays the same (0 → 800ms); only opacity amplitude changes
- Existing loop, metronome, and note rendering must continue to work
- No breaking changes to ExercisePlaybackTimeline API

## Notes

- `getDrumColor()` already defined in `packages/utils` and used for rudiment colors
- `validatedHits` state exists in ExercisePlaybackPage; no new state needed
- Playhead offset requires new optional prop: `playheadOffsetPx?: number`
- Row glow opacity factor should be extracted to a constant or configurable
