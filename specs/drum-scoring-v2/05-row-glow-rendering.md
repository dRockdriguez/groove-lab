# Spec: Row Glow Rendering

## Scope

Add row glow visualization to `ExercisePlaybackTimeline`. Each track row glows with a color corresponding to the most recent scoring classification for that note. The glow fades over 800ms.

## Inputs

- `activeGlows?: Map<number, ScoringEvent>` — Map of MIDI note → most recent ScoringEvent (from `ScoringTracker.getActiveGlows()`)
- `currentTimeMs: number` — Current playhead position (already a prop)

## Outputs

- Colored full-row overlay for each note with an active glow

## Glow Color Mapping

| Classification | Color (rgba) | Hex equivalent |
|---|---|---|
| `correct` | `rgba(34, 197, 94, opacity)` | Green-500 |
| `early` | `rgba(234, 179, 8, opacity)` | Yellow-500 |
| `late` | `rgba(249, 115, 22, opacity)` | Orange-500 |
| `missed` | `rgba(239, 68, 68, opacity)` | Red-500 |
| `wrong_note` | `rgba(168, 85, 247, opacity)` | Purple-500 |

## Acceptance Criteria

### New prop
- [ ] `ExercisePlaybackTimeline` accepts optional `activeGlows?: Map<number, ScoringEvent>`
- [ ] When `activeGlows` is undefined or empty, no glow elements are rendered

### Glow rendering
- [ ] For each entry in `activeGlows`, renders a full-width overlay div on the matching track row
- [ ] Overlay has `position: absolute`, `inset: 0`, `pointer-events: none`, `z-index: 1`
- [ ] Overlay `data-testid="track-glow-overlay"`
- [ ] Overlay `aria-hidden="true"` (decorative)
- [ ] Background color matches the classification color from the table above

### Glow fade
- [ ] `elapsed = performance.now() - event.timestamp`
- [ ] `opacity = max(0, 1 - elapsed / 800) * 0.4`
- [ ] At `elapsed = 0`: opacity = 0.4 (40% visible)
- [ ] At `elapsed = 400`: opacity = 0.2
- [ ] At `elapsed = 800`: opacity = 0 (invisible)
- [ ] At `elapsed > 800`: overlay not rendered (or opacity = 0)

### Multiple simultaneous glows
- [ ] Different notes can glow simultaneously with different colors
- [ ] Example: kick row glows green while hi-hat row glows red

### Color correctness
- [ ] `correct` → green glow
- [ ] `early` → yellow glow
- [ ] `late` → orange glow
- [ ] `missed` → red glow
- [ ] `wrong_note` → purple glow

## Edge Cases

- Note in `activeGlows` that doesn't exist as a track row: overlay not rendered (skip silently)
- `activeGlows` contains event with `elapsed > 800`: overlay not rendered
- All glows expired: no overlay elements in DOM
- Row glow does not interfere with note bar colors (`getDrumColor`) — glow is behind note bars (z-index 1, note bars higher)

## Notes

- Modified file: `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.tsx`
- New test file: `ExercisePlaybackTimeline.scoring-glow.test.tsx`
- The glow uses `performance.now()` for fade calculation (the `timestamp` field on ScoringEvent)
- This replaces the old `rowGlowMap` and `hitOverlayMap` system with a simpler, single glow mechanism
- The glow opacity animation should be driven by the existing `requestAnimationFrame` loop (re-render each frame while glows are active)
