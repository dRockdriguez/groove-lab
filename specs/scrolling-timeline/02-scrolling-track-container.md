# Spec: Scrolling Track Container with ResizeObserver

**Status:** Implemented
**Last updated:** 2026-03-25
**Verified:** 2026-03-25

## Scope

Wrap all scrollable timeline content (note tracks, beat markers, loop overlay, drag preview, loop brackets) in an inner container div. Apply a CSS `translateX` transform to this inner div based on `currentTimeMs`, `durationMs`, `containerWidth`, and `playheadOffsetPx`. Measure `containerWidth` using `ResizeObserver` on the outer container.

## Inputs

- `currentTimeMs: number` — current playback position (ms)
- `durationMs: number` — total exercise duration (ms)
- `playheadOffsetPx: number` — fixed playhead position (px)
- Outer tracks container `ref={tracksRef}` — measured for width

## Outputs

- Inner scrolling container div with `transform: translateX(Npx)` style
- All child elements (note tracks, beat markers, loop region, brackets) scroll left as `currentTimeMs` increases
- `containerWidth` state updated whenever the outer container is resized

## Acceptance Criteria

- `containerWidth` is measured from `tracksRef.getBoundingClientRect().width` on component mount and whenever ResizeObserver fires
- `scrollTranslateX` calculated as:
  ```
  containerWidth > 0 && durationMs > 0
    ? -(currentTimeMs / durationMs) * containerWidth + playheadOffsetPx
    : playheadOffsetPx
  ```
- Inner container div has `style={{ transform: \`translateX(${scrollTranslateX}px)\`, position: 'relative', width: '100%' }}`
- Inner container includes `willChange: 'transform'` for CSS optimization
- Outer `tracksRef` container has `overflow: hidden` to clip scrolled content
- When `currentTimeMs = 0`: note at timestamp T=0 appears at `left: playheadOffsetPx + 'px'`
- When `currentTimeMs = T`: note at timestamp T appears at `left: playheadOffsetPx + 'px'`
- Note markers inside inner container still render with `left: (timestamp / durationMs) * 100%` (unchanged formula)
- Loop fill / loop brackets still render with their percentage-based positions (unchanged)
- Beat markers still render with percentage-based positions (unchanged)
- Playhead (from Spec 01) is a sibling of the inner container, not a child (stays fixed during scroll)

## Edge Cases

- `containerWidth = 0` on first render (JSDOM): `scrollTranslateX = playheadOffsetPx` (no scroll, content appears at original positions). This is acceptable in test environments and does not crash.
- `durationMs = 0` or `durationMs <= 0`: `scrollTranslateX = playheadOffsetPx` (no scroll). Prevents division by zero.
- `currentTimeMs > durationMs`: scroll continues past the end (no clamping). The exercise is assumed to be paused or stopped before this point.
- ResizeObserver not supported in old browsers: Use a polyfill or fallback (projects typically include this in test setup or polyfill bundles).

## Notes

**JSX Structure after this spec:**
```tsx
<div ref={tracksRef} className="relative flex-1 overflow-hidden" [mouse handlers]>
  {/* Playhead: FIXED at left: playheadOffsetPx px */}
  <div data-testid="playhead" className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10 pointer-events-none"
       style={{ left: \`${playheadOffsetPx}px\` }} />

  {/* Inner scrolling container */}
  <div style={{ transform: \`translateX(${scrollTranslateX}px)\`, position: 'relative', width: '100%', willChange: 'transform' }}>
    {/* Metronome markers overlay */}
    {/* Drag preview */}
    {/* Loop overlay fill */}
    {/* Loop start bracket */}
    {/* Loop end bracket */}
    {/* Track rows with note markers and glow overlays */}
  </div>
</div>
```

**ResizeObserver setup:**
```tsx
useEffect(() => {
  if (!tracksRef.current) return;
  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (entry) setContainerWidth(entry.contentRect.width);
  });
  observer.observe(tracksRef.current);
  // Initial measurement
  setContainerWidth(tracksRef.current.getBoundingClientRect().width);
  return () => observer.disconnect();
}, []);
```

## Definition of Done

- [x] State `containerWidth: number` added, initialized to 0
- [x] `useEffect` with ResizeObserver added to measure container width
- [x] Initial width measurement via `getBoundingClientRect()` on mount
- [x] `scrollTranslateX` calculated correctly (formula verified)
- [x] Inner container div created with correct `transform`, `position: 'relative'`, `width: '100%'`, `willChange: 'transform'`
- [x] Playhead moved outside inner container (sibling position)
- [x] Outer `tracksRef` div has `overflow: hidden` added
- [x] All note/loop/beat markers still render with their original `%` positioning (no changes to internal positioning logic)
- [x] ResizeObserver mocked in all test files that need it (`ExercisePlaybackTimeline.scrolling.test.tsx` — 29 tests)
- [x] All ExercisePlaybackTimeline tests pass (1407 total, 0 regressions)
- [x] No changes to other components
