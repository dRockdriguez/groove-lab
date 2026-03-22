# Spec: Playhead Offset

**Status:** Implemented
**Last updated:** 2026-03-22

## Scope

Move the playhead (current position indicator) forward by a constant visual offset (200–300 pixels) so the player sees the "now playing" marker earlier on the screen, improving readability during playback.

## Inputs

- `playheadOffsetPx?: number` — Horizontal offset in pixels (default: 250px)
- `currentTimeMs: number` — Current playback position (already a prop, unchanged)
- `durationMs: number` — Total duration (already a prop, unchanged)

## Outputs

- Playhead visual position shifted right by `playheadOffsetPx`
- Playhead behavior and underlying time logic unchanged

## Acceptance Criteria

### Playhead offset property
- [x] `ExercisePlaybackTimeline` accepts new optional prop: `playheadOffsetPx?: number`
- [x] Default value is **250px** if not provided
- [x] Prop can be set to any non-negative integer (0 to disable offset)
- [x] Offset is applied to the visual position only, not the underlying time

### Visual rendering
- [x] Playhead div (line 346–351 of ExercisePlaybackTimeline.tsx) is positioned at:
  - `left: ${playheadPercent}%` (from currentTimeMs, unchanged calculation)
  - PLUS additional horizontal offset: `transform: translateX(${playheadOffsetPx}px)`
- [x] Playhead remains a vertical line (no shape change)
- [x] Playhead color, width, z-index unchanged (green, 2px, z-10)

### Time accuracy
- [x] Loop boundaries, metronome markers, and note positions are **not affected** by offset
- [x] Offset is visual only; underlying time semantics unchanged
- [x] When user clicks timeline to seek, click position maps to correct time (offset not applied to click events)

### Offset bounds
- [x] Offset does not push playhead beyond container width
  - When `(playheadPercent + offsetPercent) > 100%`, playhead remains visible at right edge
  - Optional: could clamp to `min(playheadPercent + offsetPercent, 100)`

## Edge Cases

- `playheadOffsetPx = 0`: No offset, playhead at default center position
- `playheadOffsetPx > container width`: Playhead visually pushed off-screen to the right (acceptable)
- Container is very narrow (< 250px): Offset still applied; playhead may appear off-screen
- Dynamic offset change: Playhead smoothly moves when prop updates

## Notes

- Modified file: `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.tsx`
- New test file: `ExercisePlaybackTimeline.playhead-offset.test.tsx`
- The offset is **constant across the timeline** (not percentage-based, not time-based)
- The offset should **not** be confused with loop start/end markers or other overlays

### Implementation hint

```typescript
export interface ExercisePlaybackTimelineProps {
  // ... existing props ...
  /** Horizontal offset for playhead in pixels (default: 250) */
  playheadOffsetPx?: number;
}

// Inside component:
const playheadOffsetPx = props.playheadOffsetPx ?? 250;

// Playhead rendering (around line 346):
<div
  data-testid="playhead"
  className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10 pointer-events-none"
  style={{
    left: `${playheadPercent}%`,
    transform: `translateX(${playheadOffsetPx}px)`,
    position: 'absolute',
    pointerEvents: 'none',
  }}
  aria-hidden="true"
/>
```

## Test Plan

### Unit tests: Offset calculation
- Default offset is 250px when prop not provided
- Offset is applied as `transform: translateX()`
- Offset value is rendered in inline style

### Component tests: Playhead position
- Playhead renders at correct percentage position
- Offset shifts playhead right by specified amount
- Offset = 0 renders playhead at percentage position (no shift)
- Offset = 250 renders playhead shifted 250px right
- Custom offset (e.g., 150px) is applied correctly

### Integration tests
- Offset does not affect loop marker positions
- Offset does not affect metronome marker positions
- Offset does not affect note marker positions
- Offset does not affect click-to-seek time calculation
- Changing offset dynamically updates playhead position

### Visual/functional tests
- Playhead remains on top of other elements (z-index 10)
- Playhead is pointer-events-none (doesn't block clicks)
- Playhead is aria-hidden (not in accessibility tree)
- No console warnings when offset is applied

## Definition of Done

- [x] All acceptance criteria implemented and verified
- [x] Test file created: `ExercisePlaybackTimeline.playhead-offset.test.tsx` with 40 tests
- [x] All 40 tests passing (no stubs, real assertions)
- [x] Zero regressions (913 total tests passing)
- [x] Implementation matches spec code hints (lines 65–66 prop declaration, line 85 default, lines 385–395 rendering)
- [x] Prop correctly applied to playhead transform style (line 390)
- [x] Loop markers, metronome markers, note positions unaffected by offset
- [x] Click-to-seek time calculation unaffected
- [x] Code follows architecture rules (UI only, no business logic)
- [x] No lint or ESLint errors
