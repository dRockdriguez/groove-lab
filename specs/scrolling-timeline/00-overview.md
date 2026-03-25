# Scrolling Timeline Playback

## Problem

Currently, the `ExercisePlaybackTimeline` renders notes statically and moves a green playhead over them. This creates the impression that notes are being "scrolled past" by the playhead moving right. The desired UX is the opposite: the playhead (green bar) is fixed at a constant position ("Moment 0" / "Now"), and notes scroll left as playback advances.

## Benefits

- More natural real-time visualization: the current moment is always at the same visual location
- On loop jump, `currentTimeMs` resets, so notes visually snap back to future positions and scroll toward the playhead again
- Aligns with typical DAW (Digital Audio Workstation) and music production tool UX (e.g., Ableton, Logic)

## Architecture

The component currently calculates two independent percentages:
- Playhead: `left = (currentTimeMs / durationMs) * 100%`
- Notes: `left = (event.timestamp / durationMs) * 100%`

The new approach:
- **Playhead**: fixed at `left: playheadOffsetPx` (default 250px), outside a scrolling inner container
- **Inner container**: receives a CSS `translateX` transform that scrolls all content left
  ```
  translateX = -(currentTimeMs / durationMs) * containerWidth + playheadOffsetPx
  ```
- **Notes/loop/markers inside inner container**: unchanged positioning (`left: (timestamp / durationMs) * 100%`)

This ensures the note at time `T` always appears at the playhead position when `currentTimeMs = T`.

## High-Level Data Flow

```
ExercisePlaybackPage
  ↓
  currentTimeMs (updated ~60fps via rAF)
  ↓
ExercisePlaybackTimeline
  ↓ measureContainerWidth via ResizeObserver
  ↓
  scrollTranslateX = -(currentTimeMs / durationMs) * containerWidth + playheadOffsetPx
  ↓ apply via CSS transform on inner container
  ↓
Visual: notes scroll left, playhead fixed

On loop jump (currentTimeMs resets):
  scrollTranslateX jumps back → notes snap to future positions
```

## Mini-Specs (Execution Order)

1. **01-static-playhead.md** — Change playhead to render at fixed `left: playheadOffsetPx px`, no transform. Requires test rewrites to assert constant position instead of varying percentage.

2. **02-scrolling-track-container.md** — Add `containerWidth` state measured via `ResizeObserver`. Wrap scrollable content in an inner div with `translateX` transform. Restructure JSX so playhead is outside the inner div.

3. **03-loop-interaction-in-scroll.md** — Update `getTimeFromMouseEvent` drag handler to account for scroll offset and `containerWidth`. Bracket drag delta calculation is unchanged (delta-based).

## Test Strategy

- Spec 01 tests: All "playhead position" assertions become "playhead always at 250px" assertions
- Spec 02 tests: Add ResizeObserver mock in `beforeEach`; note/loop marker position tests are unaffected (still `%` inside inner container)
- Spec 03 tests: Drag-to-create click time calculation changes; bracket drag is unchanged

## Acceptance Criteria

- [ ] Playhead renders at fixed pixel position `left: playheadOffsetPx px`
- [ ] Notes scroll left as `currentTimeMs` increases
- [ ] Playhead offset defaults to 250px and is configurable via prop
- [ ] On loop jump, `currentTimeMs` resets and notes snap back
- [ ] Drag-to-create loop works correctly in scrolled context (clicking at playhead = `currentTimeMs`)
- [ ] Bracket drag works correctly in scrolled context
- [ ] All existing ExercisePlaybackTimeline tests pass
- [ ] No changes to ExercisePlaybackPage, MiniTimeline, or other components
