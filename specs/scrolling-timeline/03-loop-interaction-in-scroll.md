# Spec: Loop Drag Interaction in Scrolled Timeline

**Status:** Implemented
**Last updated:** 2026-03-25

## Scope

Update the mouse event handler for drag-to-create loop interactions to correctly map click positions to time values in the scrolled timeline context. The playhead is now fixed at `playheadOffsetPx`, and content scrolls underneath it; click time must account for this offset and the container width.

## Inputs

- `getTimeFromMouseEvent(e: MouseEvent): number` — handler function that converts mouse client position to timeline milliseconds
- Mouse events: `mousedown`, `mousemove` on the timeline tracks container
- `containerWidth: number` — outer container width (px), from Spec 02 state
- `currentTimeMs: number` — current playback position (ms)
- `playheadOffsetPx: number` — fixed playhead position (px)
- `durationMs: number` — total exercise duration (ms)
- Outer container ref: `tracksRef.getBoundingClientRect()`

## Outputs

- `getTimeFromMouseEvent(e)` returns a time in milliseconds that correctly represents the note at the clicked position
- Clicking at the playhead position returns `currentTimeMs`
- Clicking to the right of the playhead returns a time > `currentTimeMs`
- Clicking to the left of the playhead returns a time < `currentTimeMs`
- Returned time is clamped to `[0, durationMs]`
- Bracket drag (delta-based) remains unchanged and requires no formula updates

## Acceptance Criteria

- `getTimeFromMouseEvent` formula:
  ```
  if (containerWidth <= 0 || durationMs <= 0) return currentTimeMs;
  const relativeX = e.clientX - rect.left;
  const ms = (relativeX - playheadOffsetPx) / (containerWidth / durationMs) + currentTimeMs;
  return Math.round(Math.max(0, Math.min(durationMs, ms)));
  ```
- Clicking at `clientX = rect.left + playheadOffsetPx` returns `currentTimeMs` (click at playhead = now)
- Clicking at `clientX = rect.left + playheadOffsetPx + (containerWidth / 2)` returns `currentTimeMs + durationMs / 2` (click halfway right)
- Clicking at `clientX = rect.left + playheadOffsetPx - 100` returns `currentTimeMs - (100 / pixelsPerMs)` (click left of playhead)
- Returned time never exceeds `durationMs` (clamped to max)
- Returned time is never negative (clamped to min 0)
- Bracket drag delta-based formula is unchanged (no update required)

## Edge Cases

- `containerWidth = 0`: return `currentTimeMs` (no time calculation possible)
- `durationMs = 0`: return `currentTimeMs` (no time calculation possible; prevents division by zero)
- Click outside timeline bounds (far left/right): returned time is clamped to `[0, durationMs]`
- `currentTimeMs` near loop jump reset (e.g., just jumped from `loopEndMs` back to `loopStartMs`): click time calculation is relative to new `currentTimeMs`, which is correct

## Notes

**Why bracket drag doesn't need updating:**
Bracket drag is delta-based: it calculates `deltaX = currentMouseX - initialMouseX` and converts that to `deltaMs = deltaX / (containerWidth / durationMs)`. This formula is scroll-position-independent. The `tracksRef` outer container width is used, which is the same `containerWidth` from Spec 02 state. Therefore, no formula change is needed for bracket drag.

**Derivation of formula:**
In the scrolled timeline, a note at timestamp T appears at x-position:
```
x = (T / durationMs) * containerWidth + scrollTranslateX
x = (T / durationMs) * containerWidth - (currentTimeMs / durationMs) * containerWidth + playheadOffsetPx
x = ((T - currentTimeMs) / durationMs) * containerWidth + playheadOffsetPx
```

Given x (= `relativeX` = `clientX - rect.left`), solve for T:
```
x = ((T - currentTimeMs) / durationMs) * containerWidth + playheadOffsetPx
x - playheadOffsetPx = ((T - currentTimeMs) / durationMs) * containerWidth
(x - playheadOffsetPx) / containerWidth = (T - currentTimeMs) / durationMs
(x - playheadOffsetPx) / (containerWidth / durationMs) = T - currentTimeMs
T = (x - playheadOffsetPx) / (containerWidth / durationMs) + currentTimeMs
```

## Definition of Done

- [x] `getTimeFromMouseEvent` handler function body replaced with new formula
- [x] Guard clause added: `if (containerWidth <= 0 || durationMs <= 0) return currentTimeMs;`
- [x] `relativeX`, `pixelsPerMs`, `ms` calculated as per formula
- [x] Time clamped to `[0, durationMs]` using `Math.max(0, Math.min(durationMs, ms))`
- [x] Bracket drag handler left unchanged (delta-based formula is correct)
- [x] `ExercisePlaybackTimeline.loop.test.tsx` drag-to-create tests (~8 tests) updated:
  - ResizeObserver mocked with `contentRect.width = 1000`
  - Test click clientX values adjusted to match new formula expectations
  - E.g., to click at currentTime: `clientX = rect.left + playheadOffsetPx`
  - Bracket drag tests (~6 tests) remain unchanged, no assertions modified
- [x] All ExercisePlaybackTimeline tests pass
- [x] No changes to other components
