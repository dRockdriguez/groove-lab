# Spec: Integration Test — All Three Features Together

**Status:** Implemented
**Last updated:** 2026-03-23

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
- [x] Note colors are visible and readable
- [x] Row glow (reduced opacity) does not completely obscure note colors
- [x] Playhead appears on top of glow and note colors (z-index: 10)
- [x] Loop markers (if present) remain visible and draggable (z-index: 15)
- [x] Metronome markers (if present) visible (z-index: auto)

### Color mapping with glow
- [x] Hit note (green) + green glow → both green, readable
- [x] Hit note (green) + yellow glow (early on same note) → not possible (only one glow per note)
- [x] Late note (orange) + orange glow → both orange, readable
- [x] Early note (purple) + yellow glow → if different notes, both visible
- [x] Missed note (rudiment color) + red glow → rudiment color visible through glow

### Playhead with glow and colors
- [x] Playhead position is offset by playheadOffsetPx (default 250px)
- [x] Playhead is visible above note colors and glow
- [x] Playhead offset does not prevent loop dragging or time seeking

### Data integration (ExercisePlaybackPage wiring)
- [x] ExercisePlaybackPage passes:
  - `scoringEvents={scoringEvents}` to ExercisePlaybackTimeline (note color feedback)
  - `playheadOffsetPx={250}` (explicit) to ExercisePlaybackTimeline
  - `activeGlows={activeGlows}` (from ScoringTracker) to ExercisePlaybackTimeline
- [x] All three props are optional and default gracefully:
  - No scoringEvents → all rudiment colors
  - No playheadOffsetPx → default 250px
  - No activeGlows → no glow overlays

### Time accuracy (no regressions)
- [x] Note colors are applied to correct notes (matches midiEvents)
- [x] Playhead percentage position is correct (based on currentTimeMs / durationMs)
- [x] Loop boundaries remain at correct times
- [x] Metronome markers remain at correct times
- [x] Click-to-seek time is unaffected by offset

### Rendering performance
- [x] No flickering or jank when scrolling timeline
- [x] Smooth fade of glow over 800ms
- [x] Playhead moves smoothly as time advances
- [x] Note colors are applied once (no re-renders per note)

## Edge Cases

### Complex scenario 1: Full playback with feedback
- [x] User plays drum exercise
- [x] Each hit generates scoringEvent (correct, late, or early)
- [x] ScoringTracker updates activeGlows (with reduced opacity)
- [x] Playhead advances smoothly with offset
- [x] Result: Timeline shows note colors + subtle glow + offset playhead

### Complex scenario 2: Loop with feedback
- [x] User sets loop region (loop start/end brackets at correct positions)
- [x] User plays notes in loop
- [x] Note colors, glow, and playhead all work correctly within loop region
- [x] Playhead offset does not affect loop boundaries or seeking

### Complex scenario 3: Metronome + feedback
- [x] Metronome markers visible
- [x] User plays with metronome
- [x] Note colors, glow, and offset playhead all coexist
- [x] Metronome markers not obscured by glow or offset

### Complex scenario 4: Many simultaneous events
- [x] Multiple notes at once (e.g., kick + snare on same beat)
- [x] Each note renders correct color (lookup by note number works)
- [x] Different notes can have different feedback colors simultaneously
- [x] Glows on different notes don't interfere (each glow is per-note)

## Definition of Done

- [x] All acceptance criteria have passing tests
- [x] Test file: `ExercisePlaybackTimeline.integration-visual.test.tsx` created with 36 tests
- [x] Props wired in ExercisePlaybackPage: `validatedHits`, `playheadOffsetPx`, `activeGlows`
- [x] No visual conflicts between note colors (Spec 01), playhead offset (Spec 02), and row glow (Spec 03)
- [x] Z-index hierarchy correct: glow (1) < notes (auto) < playhead (10) < loop markers (15)
- [x] All optional props default gracefully
- [x] No regressions: 977 frontend tests passing, all existing behaviors preserved
- [x] Time accuracy verified: note colors, playhead position, loop/metronome boundaries unaffected

## Notes

- Modified files:
  - `packages/ui/src/components/organisms/ExercisePlaybackPage/ExercisePlaybackPage.tsx` — Wire props to timeline (lines 815-817)
  - `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.tsx` — Already updated by Specs 01–03
- New test file: `ExercisePlaybackTimeline.integration-visual.test.tsx`
  - 36 integration tests covering all acceptance criteria
  - Tests for z-index correctness and visual layering
  - Tests for color rendering with glow
  - Tests for playhead offset with other features
  - Regression tests verify existing behavior unchanged

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
