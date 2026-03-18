# Spec: Fix Hit Overlay Fade After Loop Jump

## Scope

In `ExercisePlaybackTimeline.tsx` (lines 377–378), the fade calculation is:

```ts
const elapsed = currentTimeMs - event.timestamp;
const overlayOpacity = Math.max(0, 1 - elapsed / 800);
```

After a loop jump, `currentTimeMs` resets to `loopStartMs` (e.g., 0ms). If a hit was
validated at `expectedTimeMs = 1500ms`, then `elapsed = 0 - 1500 = -1500`, making
`overlayOpacity = 1 - (-1500/800) = 2.875`. The `Math.max(0, ...)` does not prevent
values above 1, so the overlay snaps to fully visible for the next 1200ms.

Fix: clamp `overlayOpacity` to `[0, 1]` before multiplying by 0.85. Additionally, treat
any negative `elapsed` value as meaning the overlay has expired (return null).

## Inputs

- `currentTimeMs: number` — current playhead position in exercise timeline ms
- `event.timestamp: number` — expected note time from `midiEvents`
- `hitOverlayMap` — existing `Map<string, classification>` built from `validatedHits`

## Outputs

- `overlayOpacity: number` — clamped to `[0, 1]`
- When `elapsed < 0`, the overlay is not rendered (return `null` immediately)

## Acceptance Criteria

- [ ] When `currentTimeMs = 200` and `event.timestamp = 500` (elapsed = -300, negative),
      the hit overlay component for that note is not rendered (returns `null`)
- [ ] When `currentTimeMs = 100` and `event.timestamp = 0` (elapsed = 100),
      `overlayOpacity = Math.max(0, Math.min(1, 1 - 100/800)) * 0.85 ≈ 0.744`
- [ ] When `currentTimeMs = 800` and `event.timestamp = 0` (elapsed = 800),
      `overlayOpacity = Math.max(0, Math.min(1, 1 - 800/800)) * 0.85 = 0`
      and the overlay is not rendered
- [ ] When `currentTimeMs = 0` and `event.timestamp = 1500` (elapsed = -1500, loop jump
      scenario), the overlay is not rendered (returns `null` before opacity calculation)
- [ ] The formula is: `if (elapsed < 0) return null; const overlayOpacity = Math.max(0, Math.min(1, 1 - elapsed / 800)) * 0.85;`
- [ ] Existing overlays with `elapsed` between 0 and 800ms continue to fade correctly

## Edge Cases

- `elapsed === 0` (hit just occurred): `overlayOpacity = 1 * 0.85 = 0.85` — rendered
- `elapsed > 800`: `1 - elapsed/800 < 0`, clamped to 0, overlay not rendered — same as now
- Multiple loop iterations: after reset, new `validatedHits` array produces a new
  `hitOverlayMap`; stale entries from previous iteration are gone (handled by spec 03)

## Notes

- Only `ExercisePlaybackTimeline.tsx` is modified (lines 377–379)
- The `hitOverlayMap` useMemo and all other overlay rendering logic is unchanged
- Tests in `ExercisePlaybackTimeline.hit-overlays.test.tsx` should add a test case:
  "does not render overlay when currentTimeMs is before event.timestamp"
