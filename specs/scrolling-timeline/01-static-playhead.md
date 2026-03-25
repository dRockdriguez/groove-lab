# Spec: Static Playhead Position

**Status:** Implemented
**Last updated:** 2026-03-25

## Scope

Change the green playhead element to render at a fixed pixel position relative to the left edge of the timeline container, independent of the current playback time. The playhead should always be at `left: playheadOffsetPx` (default 250px) with no additional transform.

## Inputs

- `playheadOffsetPx: number` — prop passed to ExercisePlaybackTimeline (default 250)
- `currentTimeMs: number` — prop, used elsewhere but NOT for playhead positioning
- Playhead DOM element with `data-testid="playhead"`

## Outputs

- Playhead div styled with `left: '<playheadOffsetPx>px'`
- No `transform` style applied to playhead
- Visual: green bar appears at fixed horizontal position on screen

## Acceptance Criteria

- [x] Playhead `style.left` equals `playheadOffsetPx` (as a pixel string, e.g., `'250px'`)
- [x] Playhead `style.left` remains constant regardless of `currentTimeMs` value
- [x] Playhead `style.transform` is either absent or `'none'`
- [x] Playhead is removed from any parent container that will scroll in future specs (will be moved outside inner scrolling div in Spec 02)
- [x] All existing playhead-related test assertions are updated to expect constant pixel position

## Edge Cases

- `playheadOffsetPx = 0` — playhead at left edge (valid edge case)
- `playheadOffsetPx > containerWidth` — playhead off-screen to the right (valid, no special handling)
- `currentTimeMs` changes from 0 to durationMs — playhead position unchanged (this is the core behavioral change)

## Notes

This spec is a prerequisite for Spec 02 (scrolling container). After this spec, the playhead is a fixed visual anchor. In Spec 02, all other timeline content scrolls under this fixed playhead.

The `clamp` utility function imported from `@groovelab/utils` may become unused after removing the `playheadPercent` variable. Verify and remove from imports if unused elsewhere in the file.

## Definition of Done

- [x] Lines 171–172 deleted (`rawPlayheadPercent` and `playheadPercent` variables)
- [x] Playhead div `style` changed to `{ left: \`${playheadOffsetPx}px\` }`
- [x] No `transform` property in playhead style
- [x] `clamp` import removed (if unused)
- [x] `ExercisePlaybackTimeline.playhead-sync.test.tsx` rewritten: all 13 tests assert `left: '250px'` (constant)
- [x] `ExercisePlaybackTimeline.playhead-offset.test.tsx` AC2/AC3/AC5 rewrites (~35 assertions)
- [x] `ExercisePlaybackTimeline.test.tsx` line 60 changed to `'250px'`
- [x] `ExercisePlaybackTimeline.integration-visual.test.tsx` (~6 sites) `toHaveStyle({ left: '250px' })` instead of transform check
- [x] All ExercisePlaybackTimeline tests pass
- [x] No changes to other components
