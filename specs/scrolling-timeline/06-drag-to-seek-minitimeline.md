# Spec: Drag-to-Seek on MiniTimeline (Alt+Drag When Paused)

**Status:** Draft
**Last updated:** 2026-03-25

## Scope

Add a mouse drag gesture to `MiniTimeline` that allows the user to scrub the playback position when the exercise is paused. The gesture is activated by holding Alt and dragging horizontally. Dragging left moves playback time forward; dragging right moves it backward. This feature requires a new `isPlaying` prop. All existing drag behaviors (loop creation via drag, bracket drag, click-to-seek) are unaffected.

## Inputs

- New prop `isPlaying?: boolean` (default `false`) — when `true`, the drag-to-seek gesture is disabled
- Existing prop `onSeek: (timeMs: number) => void` (already required on MiniTimeline) — called during drag
- `currentTimeMs: number` — existing prop; used as the reference time at drag start
- `durationMs: number` — existing prop; used for time clamping
- `containerRef` — existing ref; used for `getBoundingClientRect()` to measure container width
- Mouse events: `mousedown` (on container), `mousemove` (on `document`), `mouseup` (on `document`)

## Outputs

- When drag is active: `onSeek(newTimeMs)` called on every `mousemove` with `newTimeMs` clamped to `[0, durationMs]`
- When drag ends: cleanup of document-level event listeners, cursor restored
- `document.body.style.cursor = 'grabbing'` during drag; restored to `''` on `mouseup`
- No state changes to loop markers; `onLoopStartChange` and `onLoopEndChange` are never called from this gesture

## Acceptance Criteria

- `isPlaying` is added to `MiniTimelineProps` as an optional field; the component renders correctly without it (backward-compatible, default `false`)
- `mousedown` on container with `event.altKey === true` AND `!isPlaying` starts the drag-to-seek gesture
- `mousedown` with `altKey === false` does NOT start drag-to-seek:
  - If `hasLoopCallbacks` (both `onLoopStartChange` and `onLoopEndChange` provided): drag-to-create-loop fires instead
  - Otherwise: click-to-seek fires via `handleClick` (existing behavior)
- `mousedown` with `altKey === true` AND `isPlaying === true` does NOT start drag-to-seek
- On drag start: capture `dragStartX = event.clientX` and `dragStartTimeMs = currentTimeMs`
- On `mousemove` during drag:
  - Get container width: `containerWidth = containerRef.current?.getBoundingClientRect().width || 0`
  - `deltaX = event.clientX - dragStartX`
  - `newTimeMs = clamp(dragStartTimeMs - (deltaX / containerWidth) * durationMs, 0, durationMs)`
  - `onSeek(Math.round(newTimeMs))` is called
- On `mouseup` during drag: document-level listeners removed, `document.body.style.cursor` restored to `''`
- `document.body.style.cursor = 'grabbing'` is set on drag start
- When `containerWidth = 0`: `onSeek` is not called (guard clause prevents division by zero)
- When `durationMs = 0`: `onSeek` is not called (guard clause prevents division by zero)
- `onSeek` receives values clamped to `[0, durationMs]`
- Bracket drag behavior is unchanged — `handleBracketMouseDown` calls `e.stopPropagation()` which prevents the seek handler from firing
- Loop creation drag behavior is unchanged — it fires only when `altKey === false`
- Click-to-seek behavior is unchanged — `handleClick` fires when not dragging and loop callbacks are not both present

## Edge Cases

- Drag starts near `currentTimeMs = 0` and user drags right (toward earlier time): clamped to 0
- Drag starts near `currentTimeMs = durationMs` and user drags left (toward later time): clamped to `durationMs`
- User presses Alt mid-drag: not relevant — gesture only starts on `mousedown` with `altKey`
- User releases Alt key during drag: gesture continues until `mouseup` (captured at start)
- `isPlaying` changes to `true` mid-drag: drag is not stopped (state captured at `mousedown`)
- Bracket `mousedown` with Alt held: `e.stopPropagation()` in `handleBracketMouseDown` prevents the outer container `onMouseDown` from firing — bracket drag takes priority
- Loop bracket drag starts during loop creation drag: `handleBracketMouseDown` calls `stopPropagation()` immediately, preventing seek handler
- `containerRef.current` is `null`: guard with `containerRef.current?.getBoundingClientRect()` or similar

## Notes

**Drag direction convention:**
Same as spec 05: the formula produces time advances when dragging left, time reductions when dragging right. This is consistent with the existing scroll convention (content scrolls left as time advances).

**Why document-level listeners:**
Same as spec 05: `mousemove` and `mouseup` on `document` allow drag to continue outside the component bounds without losing the gesture.

**MiniTimeline-specific design:**
MiniTimeline already has `onSeek` as a required prop. The new `isPlaying` prop is optional and defaults to `false`, making the gesture always available when not explicitly disabled. The `hasLoopCallbacks` guard already exists in MiniTimeline to decide between loop creation and click-to-seek; the Alt modifier cleanly extends this pattern to gesture drag.

## Definition of Done

- [ ] `isPlaying?: boolean` (default `false`) added to `MiniTimelineProps`
- [ ] Seek drag internal state added: `seekDragStartX` and `seekDragStartTimeMs` via `useRef`
- [ ] Main container `onMouseDown` handler updated: when `event.altKey === true` AND `!isPlaying`, start seek drag; capture `dragStartX` and `dragStartTimeMs`; set `document.body.style.cursor = 'grabbing'`; attach document-level `mousemove` and `mouseup` handlers; return early (do not fall through to existing drag/click logic)
- [ ] Document-level `mousemove` handler: compute `deltaX`, get `containerWidth` from `containerRef.current?.getBoundingClientRect().width`, compute `newTimeMs`, call `onSeek(Math.round(clamp(newTimeMs, 0, durationMs)))`
- [ ] Document-level `mouseup` handler: reset refs, restore cursor, remove listeners
- [ ] `ExercisePlaybackPage` (or equivalent): add `isPlaying={playbackState === 'playing'}` to `<MiniTimeline>`
- [ ] New test file `MiniTimeline.seek-drag.test.tsx` added with the following tests:
  - Props: `isPlaying` is optional; component renders without it
  - Drag start: `mousedown` with `altKey=true`, `isPlaying=false` → `onSeek` called on subsequent `mousemove`
  - Drag start: `mousedown` with `altKey=false`, `hasLoopCallbacks=true` → loop create drag fires instead (no seek)
  - Drag start: `mousedown` with `altKey=false`, `hasLoopCallbacks=false` → click-to-seek fires (no drag seek)
  - Drag start: `mousedown` with `altKey=true`, `isPlaying=true` → `onSeek` NOT called
  - Seek formula: drag left by 50px (containerWidth=800, durationMs=8000) → `onSeek` called with value 500ms ahead
  - Seek formula: drag right by 50px → `onSeek` called with value 500ms behind
  - Clamp: drag far left → `onSeek(durationMs)`, far right → `onSeek(0)`
  - Cursor: `grabbing` during drag, `''` after mouseup
  - Cleanup: document listeners removed after mouseup
  - Bracket drag regression: Alt+drag on bracket handle → bracket drag takes priority
  - Loop create regression: drag without Alt with `hasLoopCallbacks=true` → loop drag still works
  - Click seek regression: click without drag with `hasLoopCallbacks=false` → `onSeek` called via `handleClick`
- [ ] All existing MiniTimeline tests pass (no regressions)
- [ ] Spec metadata updated to `Status: Implemented`
