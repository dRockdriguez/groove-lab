# Spec: Drag-to-Seek on Main Timeline (Alt+Drag When Paused)

**Status:** Implemented
**Last updated:** 2026-03-25

## Scope

Add a mouse drag gesture to `ExercisePlaybackTimeline` that allows the user to scrub the playback position when the exercise is paused. The gesture is activated by holding Alt and dragging horizontally on the tracks area. Dragging left moves playback time forward; dragging right moves it backward. The feature requires a new `onSeek` prop and a new `isPlaying` prop on the component. All existing drag behaviors (loop creation, bracket drag) are unaffected.

## Inputs

- New prop `onSeek?: (timeMs: number) => void` — called continuously during drag with the new seek position
- New prop `isPlaying?: boolean` (default `false`) — when `true`, the drag-to-seek gesture is disabled
- `currentTimeMs: number` — existing prop; used as the reference time at drag start
- `durationMs: number` — existing prop; used for time clamping
- `containerWidth: number` — existing state; the measured width of the outer `tracksRef` container in pixels
- `tracksRef` — existing ref; used for capturing drag start and positioning
- Mouse events: `mousedown` (on `tracksRef`), `mousemove` (on `document`), `mouseup` (on `document`)

## Outputs

- When drag is active: `onSeek(newTimeMs)` called on every `mousemove` with `newTimeMs` clamped to `[0, durationMs]`
- When drag ends: cleanup of document-level event listeners, cursor restored
- `document.body.style.cursor = 'grabbing'` during drag; restored to `''` on `mouseup`
- No state changes to loop markers; `onLoopStartChange` and `onLoopEndChange` are never called from this gesture

## Acceptance Criteria

- [x] `onSeek` and `isPlaying` are added to `ExercisePlaybackTimelineProps` as optional fields; the component renders correctly with neither prop provided (backward-compatible)
- [x] `mousedown` on `tracksRef` with `event.altKey === true` AND `isPlaying === false` AND `onSeek` defined starts the drag-to-seek gesture
- [x] `mousedown` on `tracksRef` with `altKey === false` does NOT start drag-to-seek (existing loop-creation drag is unaffected)
- [x] `mousedown` on `tracksRef` with `altKey === true` AND `isPlaying === true` does NOT start drag-to-seek
- [x] `mousedown` on `tracksRef` with `altKey === true` AND `onSeek` undefined does NOT start drag-to-seek
- [x] On drag start: capture `dragStartX = event.clientX` and `dragStartTimeMs = currentTimeMs`
- [x] On `mousemove` during drag:
  - `deltaX = event.clientX - dragStartX`
  - `newTimeMs = clamp(dragStartTimeMs - (deltaX / containerWidth) * durationMs, 0, durationMs)`
  - Note: negative `deltaX` (dragging left) increases time (scrolling content forward); positive `deltaX` (dragging right) decreases time. This matches the existing scroll direction convention.
  - `onSeek(Math.round(newTimeMs))` is called
- [x] On `mouseup` during drag: document-level listeners removed, `document.body.style.cursor` restored to `''`
- [x] `document.body.style.cursor = 'grabbing'` is set on drag start
- [x] When `containerWidth = 0`: `onSeek` is not called (guard clause prevents division by zero)
- [x] When `durationMs = 0`: `onSeek` is not called (guard clause prevents division by zero)
- [x] `onSeek` receives values clamped to `[0, durationMs]`: dragging far left yields 0, dragging far right yields `durationMs`
- [x] Bracket drag behavior is unchanged — `handleBracketMouseDown` calls `e.stopPropagation()` which prevents the seek handler from firing on the same event
- [x] Loop creation drag behavior is unchanged — it fires only when `altKey === false` (the Alt check in the seek handler guards against overlap)
- [x] The `isPlaying` prop defaults to `false` when not provided

## Edge Cases

- `onSeek` is `undefined`: drag-to-seek gesture does not activate (guard clause: `if (!onSeek) return`)
- Drag starts near `currentTimeMs = 0` and user drags right (toward earlier time): clamped to 0
- Drag starts near `currentTimeMs = durationMs` and user drags left (toward later time): clamped to `durationMs`
- User presses Alt mid-drag: not relevant — gesture only starts on `mousedown` with `altKey` at that moment
- User releases Alt key during drag: gesture continues until `mouseup` (captured at start)
- `isPlaying` changes to `true` mid-drag: drag is not stopped (state captured at `mousedown`; the exercise cannot start playing while paused without an explicit user action)
- Bracket `mousedown` with Alt held: `e.stopPropagation()` in `handleBracketMouseDown` prevents the outer `tracksRef` `onMouseDown` from firing — bracket drag takes priority

## Notes

**Drag direction convention:**
The formula `newTimeMs = dragStartTimeMs - (deltaX / containerWidth) * durationMs` produces:
- `deltaX > 0` (mouse moved right): `newTimeMs < dragStartTimeMs` — time decreases, content scrolls right (playhead moves backward)
- `deltaX < 0` (mouse moved left): `newTimeMs > dragStartTimeMs` — time increases, content scrolls left (playhead moves forward)

This is consistent with the existing scroll convention: content scrolls left as time advances.

**Why document-level listeners:**
`mousemove` and `mouseup` are attached to `document` (not to `tracksRef`) so that dragging outside the component boundaries continues to seek without losing the gesture. This matches the existing `handleBracketMouseDown` pattern.

**Existing loop-create guard:**
The existing `handleMouseDown` returns early if `isLoopActive || !onLoopStartChange || !onLoopEndChange`. The new seek handler fires in `handleMouseDown`'s position when `event.altKey === true`, so the two gestures are mutually exclusive on the same event.

**Props added to `ExercisePlaybackPage`:**
`ExercisePlaybackPage` already wires `handleSeek` to `PlaybackControls` and `MiniTimeline`. This spec adds `onSeek={handleSeek}` and `isPlaying={playbackState === 'playing'}` to the `ExercisePlaybackTimeline` usage in the page component.

## Definition of Done

- [x] `onSeek?: (timeMs: number) => void` added to `ExercisePlaybackTimelineProps`
- [x] `isPlaying?: boolean` (default `false`) added to `ExercisePlaybackTimelineProps`
- [x] Seek drag internal state added: `seekDragStartX` and `seekDragStartTimeMs` via `useRef` (preferred to avoid unnecessary re-renders during drag)
- [x] `handleMouseDown` on `tracksRef` updated: when `event.altKey === true` AND `!isPlaying` AND `onSeek` is defined, start seek drag; capture `dragStartX` and `dragStartTimeMs`; set `document.body.style.cursor = 'grabbing'`; attach document-level `mousemove` and `mouseup` handlers; return early (do not fall through to loop-create logic)
- [x] Document-level `mousemove` handler: compute `deltaX`, compute `newTimeMs` with the formula above, call `onSeek(Math.round(clamp(newTimeMs, 0, durationMs)))`
- [x] Document-level `mouseup` handler: reset refs to `null`, restore `document.body.style.cursor = ''`, remove both document-level listeners
- [x] `ExercisePlaybackPage` (or equivalent page component): add `onSeek={handleSeek}` and `isPlaying={playbackState === 'playing'}` to `<ExercisePlaybackTimeline>`
- [x] New test file `ExercisePlaybackTimeline.seek-drag.test.tsx` added with ResizeObserver mock (containerWidth = 1000) and the following tests:
  - [x] Props: `onSeek` and `isPlaying` are optional; component renders without them
  - [x] Drag start: `mousedown` with `altKey=true`, `isPlaying=false`, `onSeek` defined → `onSeek` called on subsequent `mousemove`
  - [x] Drag start: `mousedown` with `altKey=false` → `onSeek` NOT called (loop create path fires instead)
  - [x] Drag start: `mousedown` with `altKey=true`, `isPlaying=true` → `onSeek` NOT called
  - [x] Drag start: `onSeek` undefined → no error thrown, gesture does not activate
  - [x] Seek formula: drag left by 250px (containerWidth=1000, durationMs=8000) → `onSeek` called with value 2000ms ahead of drag start
  - [x] Seek formula: drag right by 250px → `onSeek` called with value 2000ms behind drag start
  - [x] Clamp: drag far left (deltaX = -10000) → `onSeek` called with `durationMs` (clamped to max)
  - [x] Clamp: drag far right (deltaX = +10000) → `onSeek` called with `0` (clamped to min)
  - [x] Cursor: `document.body.style.cursor` equals `'grabbing'` during drag
  - [x] Cursor: `document.body.style.cursor` restored to `''` after `mouseup`
  - [x] Cleanup: document listeners removed after `mouseup` (second `mousemove` does not call `onSeek` after `mouseup`)
  - [x] Loop create regression: `mousedown` without `altKey` with `onLoopStartChange` provided → loop creation still works
  - [x] Bracket drag regression: `mousedown` on loop bracket with `altKey=true` → seek does NOT fire (bracket `stopPropagation` takes priority)
- [x] All existing ExercisePlaybackTimeline tests pass (no regressions)
- [x] Spec metadata updated to `Status: Implemented`
