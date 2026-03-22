# Spec: Row Glow Opacity Reduction

**Status:** Implemented
**Last updated:** 2026-03-22

## Scope

Reduce the opacity of row glow overlays (existing Spec 06 feature) so they are less visually prominent, allowing per-note color feedback (Spec 01) to be the primary feedback mechanism.

Current row glow opacity is calculated as:
```typescript
const opacity = Math.max(0, 1 - elapsed / 800) * 0.4  // max opacity = 0.4
```

This spec reduces the max opacity from **0.4** to **0.15–0.2**.

## Inputs

- `activeGlows?: Map<number, ScoringEvent>` — Most recent scoring event per note (existing prop)
- `currentTimeMs: number` — Current playback time (for reference, but opacity is not time-dependent)

## Outputs

- Glow overlays rendered with reduced max opacity (0.15–0.2 instead of 0.4)
- Glow color mapping unchanged (green, yellow, orange, red, purple)
- Glow fade duration unchanged (800ms from event.timestamp)

## Acceptance Criteria

### Opacity adjustment
- [x] Row glow opacity formula changed from:
  - `opacity = Math.max(0, 1 - elapsed / 800) * 0.4` (old)
  - To: `opacity = Math.max(0, 1 - elapsed / 800) * 0.15` (new)
- [x] At `elapsed = 0`: opacity = 0.15 (15% visible, very subtle)
- [x] At `elapsed = 400`: opacity = 0.075 (7.5% visible)
- [x] At `elapsed = 800`: opacity = 0 (invisible)
- [x] At `elapsed > 800`: overlay not rendered

### Constant definition
- [x] New constant defined: `const GLOW_OPACITY_FACTOR = 0.15` at top of ExercisePlaybackTimeline.tsx
  - Purpose: Make the factor easily configurable (can be tuned post-launch)
  - Can be extracted to utils if needed later
- [x] Opacity calculation uses the constant:
  ```typescript
  const opacity = Math.max(0, 1 - elapsed / 800) * GLOW_OPACITY_FACTOR;
  ```

### Color mapping (unchanged)
- [x] `correct` → green rgba(34, 197, 94, opacity)
- [x] `early` → yellow rgba(234, 179, 8, opacity)
- [x] `late` → orange rgba(249, 115, 22, opacity)
- [x] `missed` → red rgba(239, 68, 68, opacity)
- [x] `wrong_note` → purple rgba(168, 85, 247, opacity)

### Glow rendering logic (unchanged)
- [x] Glow overlay is still positioned with `position: absolute`, `inset: 0`, `z-index: 1`
- [x] Glow overlay still has `data-testid="track-glow-overlay"`
- [x] Glow overlay still has `aria-hidden="true"`
- [x] Glow overlay still has `pointer-events: none`

## Edge Cases

- `activeGlows` is undefined or empty: No glow overlays rendered (unchanged)
- `elapsed > 800`: Overlay not rendered (unchanged)
- Multiple glows on different notes: Each with reduced opacity (unchanged behavior)
- Overlapping glows on same note (shouldn't happen): Only one glow per note rendered

## Notes

- Modified file: `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.tsx`
  - Update line ~361: opacity calculation
  - Add constant at top of file
- Existing test file: `ExercisePlaybackTimeline.scoring-glow.test.tsx` (tests for row glow rendering)
  - Tests should be updated to verify new opacity value (0.15)
  - Snapshot tests may need regeneration if they capture opacity values
- New or modified tests: `ExercisePlaybackTimeline.row-glow-opacity.test.tsx`

### Implementation hint

```typescript
// At top of ExercisePlaybackTimeline component/file:
const GLOW_OPACITY_FACTOR = 0.15;

// In glow rendering logic (around line 361):
if (glowEvent !== undefined) {
  const elapsed = performance.now() - glowEvent.timestamp;
  if (elapsed >= 0 && elapsed < 800) {
    const opacity = Math.max(0, 1 - elapsed / 800) * GLOW_OPACITY_FACTOR;
    glowOverlay = (
      <div
        data-testid="track-glow-overlay"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
          backgroundColor: getGlowColor(glowEvent.classification, opacity),
        }}
      />
    );
  }
}
```

## Test Plan

### Unit tests: Opacity calculation
- Opacity factor is 0.15
- At elapsed = 0: opacity = 0.15
- At elapsed = 400: opacity = 0.075
- At elapsed = 800: opacity = 0
- At elapsed = 1000: opacity = 0 (clamped)

### Component tests: Glow rendering
- Glow overlay renders with correct opacity at different elapsed times
- Glow overlay color matches classification (unchanged from Spec 06)
- Glow overlay has correct data-testid and aria-hidden
- Glow overlay has pointer-events: none

### Integration tests
- Row glow with reduced opacity doesn't visually obscure note colors
- Row glow + note colors + playhead all render together without conflicts
- Glow fades smoothly over 800ms (opacity decreasing)
- Multiple simultaneous glows (different notes) each have reduced opacity

### Visual/Behavioral tests
- Glow is noticeably more subtle than before (visual inspection)
- Glow is still visible at elapsed = 0 (not completely invisible)
- Glow is invisible by elapsed = 800 (no lingering overlay)
- No performance degradation from opacity calculation
