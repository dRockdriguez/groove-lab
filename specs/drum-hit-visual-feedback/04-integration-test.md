# Spec: Integration Test — All Three Features Together

**Status:** Draft
**Last updated:** 2026-03-22

## Scope

Verify that note color feedback (Spec 01), playhead offset (Spec 02), and row glow opacity reduction (Spec 03) work together without conflicts or visual interference.

## Inputs

- `validatedHits?: DrumHitValidation[]` — Per-note hit validations
- `playheadOffsetPx?: number` — Playhead horizontal offset (default: 250px)
- `activeGlows?: Map<number, ScoringEvent>` — Row glow data
- All existing props (midiEvents, currentTimeMs, durationMs, etc.)

## Outputs

- Timeline rendering with:
  - Note colors based on validatedHits (Spec 01)
  - Playhead shifted right by playheadOffsetPx (Spec 02)
  - Row glows with reduced opacity (Spec 03)
  - No visual conflicts, z-index issues, or timing problems

## Acceptance Criteria

### Visual layering (z-index correctness)
- [ ] Note colors are visible and readable
- [ ] Row glow (reduced opacity) does not completely obscure note colors
- [ ] Playhead appears on top of glow and note colors (z-index: 10)
- [ ] Loop markers (if present) remain visible and draggable (z-index: 15)
- [ ] Metronome markers (if present) visible (z-index: auto)

### Color mapping with glow
- [ ] Hit note (green) + green glow → both green, readable
- [ ] Hit note (green) + yellow glow (early on same note) → not possible (only one glow per note)
- [ ] Late note (orange) + orange glow → both orange, readable
- [ ] Early note (purple) + yellow glow → if different notes, both visible
- [ ] Missed note (rudiment color) + red glow → rudiment color visible through glow

### Playhead with glow and colors
- [ ] Playhead position is offset by playheadOffsetPx (default 250px)
- [ ] Playhead is visible above note colors and glow
- [ ] Playhead offset does not prevent loop dragging or time seeking

### Data integration (ExercisePlaybackPage wiring)
- [ ] ExercisePlaybackPage passes:
  - `validatedHits={validatedHits}` to ExercisePlaybackTimeline
  - `playheadOffsetPx={250}` (or configurable) to ExercisePlaybackTimeline
  - `activeGlows={scoringTracker.getActiveGlows()}` to ExercisePlaybackTimeline
- [ ] All three props are optional and default gracefully:
  - No validatedHits → all rudiment colors
  - No playheadOffsetPx → default 250px
  - No activeGlows → no glow overlays

### Time accuracy (no regressions)
- [ ] Note colors are applied to correct notes (matches midiEvents)
- [ ] Playhead percentage position is correct (based on currentTimeMs / durationMs)
- [ ] Loop boundaries remain at correct times
- [ ] Metronome markers remain at correct times
- [ ] Click-to-seek time is unaffected by offset

### Rendering performance
- [ ] No flickering or jank when scrolling timeline
- [ ] Smooth fade of glow over 800ms
- [ ] Playhead moves smoothly as time advances
- [ ] Note colors are applied once (no re-renders per note)

## Edge Cases

### Complex scenario 1: Full playback with feedback
- [ ] User plays drum exercise
- [ ] Each hit generates validatedHit (green, purple, or orange)
- [ ] ScoringTracker updates activeGlows (with reduced opacity)
- [ ] Playhead advances smoothly with offset
- [ ] Result: Timeline shows note colors + subtle glow + offset playhead

### Complex scenario 2: Loop with feedback
- [ ] User sets loop region (loop start/end brackets at correct positions)
- [ ] User plays notes in loop
- [ ] Note colors, glow, and playhead all work correctly within loop region
- [ ] Playhead offset does not affect loop boundaries or seeking

### Complex scenario 3: Metronome + feedback
- [ ] Metronome markers visible
- [ ] User plays with metronome
- [ ] Note colors, glow, and offset playhead all coexist
- [ ] Metronome markers not obscured by glow or offset

### Complex scenario 4: Many simultaneous events
- [ ] Multiple notes at once (e.g., kick + snare on same beat)
- [ ] Each note renders correct color (lookup by note number works)
- [ ] Different notes can have different feedback colors simultaneously
- [ ] Glows on different notes don't interfere (each glow is per-note)

## Notes

- Modified files:
  - `packages/ui/src/components/organisms/ExercisePlaybackPage/ExercisePlaybackPage.tsx` — Wire props to timeline
  - `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.tsx` — Already updated by Specs 01–03
- New test file: `ExercisePlaybackTimeline.integration-visual.test.tsx`
  - Tests for z-index correctness (use `getComputedStyle`)
  - Tests for color rendering with glow
  - Tests for playhead offset with other features
  - Snapshot tests may be helpful for visual regression

### Implementation hint (ExercisePlaybackPage)

```typescript
<ExercisePlaybackTimeline
  midiEvents={exercise.midiEvents}
  durationMs={exercise.durationMs}
  currentTimeMs={currentTimeMs}
  bpm={bpm}
  metronomeEnabled={metronomeEnabled}
  loopStartMs={loopStartMs}
  loopEndMs={loopEndMs}
  isLoopActive={isLoopActive}
  onLoopStartChange={handleLoopStartChange}
  onLoopEndChange={handleLoopEndChange}
  onLoopDragStart={handleLoopDragStart}
  onLoopDragEnd={handleLoopDragEnd}
  // NEW: Pass validatedHits for note color feedback (Spec 01)
  validatedHits={validatedHits}
  // NEW: Pass playhead offset (Spec 02)
  playheadOffsetPx={250}
  // Already exists: Pass activeGlows with reduced opacity (Spec 03)
  activeGlows={scoringTracker.getActiveGlows()}
/>
```

## Test Plan

### Unit tests (indirect)
- Specs 01, 02, 03 each have their own unit tests
- This spec focuses on integration

### Component tests: Visual layering
- Render timeline with validatedHits + activeGlows + offset
- Query glow overlay, note markers, playhead
- Verify z-index via getComputedStyle()
- Verify colors are applied correctly

### Component tests: Color with glow
- Render hit note (green) with matching glow (green)
- Query note marker color and glow color
- Verify both are visible (glow opacity low enough)

### Component tests: Playhead with offset and features
- Render timeline with all props
- Query playhead position
- Verify offset is applied (transform: translateX)
- Verify playhead is above glow (z-index check)

### Integration tests: Full scenario
- Create mock exercise with midiEvents
- Create validatedHits with multiple classifications
- Create activeGlows with multiple entries
- Render timeline with all props
- Verify notes, glow, playhead all render correctly
- Simulate time advancement (advance currentTimeMs)
- Verify playhead moves smoothly with offset
- Verify glow fades over 800ms

### Regression tests
- All existing ExercisePlaybackTimeline tests continue to pass
- Loop dragging still works (not affected by offset)
- Click-to-seek still works (not affected by offset)
- Metronome markers visible (not obscured by reduced glow)
- Note rendering unchanged (z-index, position, opacity)
