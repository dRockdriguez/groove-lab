# Test Plan: Exercise Playback Loops (Spec 11)

## Test Coverage Matrix

This document maps all acceptance criteria to test cases across components.

---

## 1. Loop Selection Interaction Tests

### Criterion 1: Desktop/Tablet Drag to Create Loop
**Component:** `MiniTimeline.loop.test.tsx`

```typescript
- [ ] Test: Drag horizontally on MiniTimeline creates visual preview (blue outline)
- [ ] Test: Preview updates in real-time during drag
- [ ] Test: On mouse release, loop created with start/end at drag boundaries
- [ ] Test: Dragging left-to-right creates loop correctly
- [ ] Test: Dragging right-to-left creates loop with correct min/max
- [ ] Test: Minimum 500ms loop duration enforced (prevent accidental tiny loops)
- [ ] Test: Drag preview shows "Minimum 500ms" message for too-short drags
```

### Criterion 2: Mobile/Touchpad Tap Fallback
**Component:** `MiniTimeline.loop.test.tsx`

```typescript
- [ ] Test: First tap on timeline shows "[" marker at tapped position
- [ ] Test: First tap shows "Tap to set loop end" hint message
- [ ] Test: Second tap shows "]" marker and creates loop
- [ ] Test: Tap target is at least 48x48px for accessibility
- [ ] Test: Mobile/touch environment detected and fallback enabled
- [ ] Test: Tap on earlier position then later position creates loop in correct order
```

### Criterion 3: Loop Appears on Both Timelines
**Component:** `ExercisePlaybackPage.loop-playback.test.tsx`

```typescript
- [ ] Test: After drag-selection on MiniTimeline, loop markers appear on MiniTimeline
- [ ] Test: After drag-selection on MiniTimeline, loop markers appear on ExercisePlaybackTimeline
- [ ] Test: Loop markers on both timelines show same start/end positions
```

### Criterion 4: Drag Bracket Markers to Adjust
**Component:** `MiniTimeline.loop.test.tsx`, `ExercisePlaybackTimeline.loop.test.tsx`

```typescript
- [ ] Test: "[" bracket on MiniTimeline is draggable to adjust loop start
- [ ] Test: "]" bracket on MiniTimeline is draggable to adjust loop end
- [ ] Test: "[" bracket on ExercisePlaybackTimeline is draggable
- [ ] Test: "]" bracket on ExercisePlaybackTimeline is draggable
- [ ] Test: Dragging start bracket updates loopStartMs
- [ ] Test: Dragging end bracket updates loopEndMs
- [ ] Test: Cursor changes to col-resize on bracket hover
- [ ] Test: Cannot drag start bracket past end bracket (validation prevents)
- [ ] Test: Cannot drag end bracket before start bracket (validation prevents)
```

### Criterion 5: Numeric Inputs in LoopControls
**Component:** `LoopControls.test.tsx`

```typescript
- [ ] Test: Start input displays current loop start time in mm:ss format
- [ ] Test: End input displays current loop end time in mm:ss format
- [ ] Test: User can type mm:ss format and update start time
- [ ] Test: User can type mm:ss format and update end time
- [ ] Test: Spinner buttons (↕) provide ±100ms adjustments on start
- [ ] Test: Spinner buttons (↕) provide ±100ms adjustments on end
- [ ] Test: Shift+click spinner buttons provide ±1000ms adjustments
- [ ] Test: Real-time validation prevents invalid ranges during input
```

---

## 2. Loop Visualization & Behavior Tests

### Criterion 6: Loop Markers on MiniTimeline
**Component:** `MiniTimeline.loop.test.tsx`

```typescript
- [ ] Test: Loop boundary markers appear with green color (#10B981 or #059669)
- [ ] Test: Left bracket "[" appears at loop start position
- [ ] Test: Right bracket "]" appears at loop end position
- [ ] Test: Semi-transparent green background fill (opacity 0.15) between brackets
- [ ] Test: Markers have distinct visual styling from other timeline elements
```

### Criterion 7: Loop Markers on ExercisePlaybackTimeline
**Component:** `ExercisePlaybackTimeline.loop.test.tsx`

```typescript
- [ ] Test: Loop markers span full height of instrument tracks
- [ ] Test: Left bracket "[" at loop start position
- [ ] Test: Right bracket "]" at loop end position
- [ ] Test: Semi-transparent green fill between boundaries (full height)
- [ ] Test: Markers do not block MIDI note interaction (z-index correctly set)
- [ ] Test: Brackets have pointer-events: auto, fill has pointer-events: none
```

### Criterion 8: Start/End Markers Visually Distinct
**Component:** `MiniTimeline.loop.test.tsx`, `ExercisePlaybackTimeline.loop.test.tsx`

```typescript
- [ ] Test: "[" bracket (start) has different visual appearance than "]" (end)
- [ ] Test: Bracket shapes are recognizable as start/end delimiters
```

### Criterion 9: Playback Jumps on Loop End Reached
**Component:** `ExercisePlaybackPage.loop-playback.test.tsx`

```typescript
- [ ] Test: When playback reaches loopEndMs and isLoopActive=true, playhead jumps to loopStartMs
- [ ] Test: Jump happens smoothly without pause
- [ ] Test: Playback continues automatically from loop start (no manual restart)
- [ ] Test: Jump occurs in requestAnimationFrame BEFORE audio.onEnded fires
```

### Criterion 10: Set Repetitions (1–999 or Infinite)
**Component:** `LoopControls.test.tsx`

```typescript
- [ ] Test: User can set repetitions from 1 to 999
- [ ] Test: User can toggle infinite mode via checkbox
- [ ] Test: Infinite checkbox input exists and is functional
```

### Criterion 11: Repetition Counter Display
**Component:** `LoopControls.test.tsx`

```typescript
- [ ] Test: Counter displays "Repeat X of Y" format when loop active and finite
- [ ] Test: Counter is hidden when loop inactive
- [ ] Test: Counter is hidden when repetitions = infinite
- [ ] Test: Counter updates immediately when currentLoopRepetition changes
- [ ] Test: Counter has large font (text-lg or larger) for visibility
- [ ] Test: Counter has aria-live region for screen reader announcements
- [ ] Test: Visual emphasis (yellow/orange highlight) when approaching final repetition
```

### Criterion 12: Toggle Button Preserves Parameters
**Component:** `LoopControls.test.tsx`, `ExercisePlaybackPage.loop-playback.test.tsx`

```typescript
- [ ] Test: Loop toggle button enables/disables loop
- [ ] Test: Toggling off does not clear loopStartMs or loopEndMs
- [ ] Test: Toggling off does not clear loopRepetitions
- [ ] Test: Toggling back on restores previous parameters
```

### Criterion 13: Disabled Loop Allows Normal Playback
**Component:** `ExercisePlaybackPage.loop-playback.test.tsx`

```typescript
- [ ] Test: When isLoopActive=false, playback continues past loopEndMs without jumping
- [ ] Test: Playback plays normally through rest of exercise when loop disabled
```

### Criterion 14: Loop Parameters Preserved on Toggle
**Component:** `ExercisePlaybackPage.loop-playback.test.tsx`

```typescript
- [ ] Test: loopStartMs preserved when toggling on/off multiple times
- [ ] Test: loopEndMs preserved when toggling on/off multiple times
- [ ] Test: loopRepetitions preserved when toggling on/off multiple times
```

### Criterion 15: Metronome Synchronization (CRITICAL)
**Component:** `ExercisePlaybackPage.metronome-sync.test.tsx`

```typescript
- [ ] Test: Metronome clicks sound on EVERY loop repetition (not just first)
- [ ] Test: Click timing resets when playhead jumps to loopStartMs
- [ ] Test: No gap or silence in metronome during loop jump
- [ ] Test: Click frequency locked to originalBpm during loop repetitions
- [ ] Test: Clicks fire at correct beat positions relative to loopStartMs
- [ ] Test: Edge case: click scheduled outside loop does not fire after jump
- [ ] Test: Different BPM values (40, 120, 300) all sync correctly with loop
```

### Criterion 16: Loop Cleared on Exercise End or Manual Clear
**Component:** `ExercisePlaybackPage.loop-playback.test.tsx`, `LoopControls.test.tsx`

```typescript
- [ ] Test: Clear button clears loopStartMs, loopEndMs
- [ ] Test: Clear button resets loopRepetitions to 1
- [ ] Test: Clear button sets isLoopActive=false
- [ ] Test: Loop cleared when exercise playback naturally ends
```

### Criterion 17: Loop Markers Respect Playback Zoom Level
**Component:** `MiniTimeline.loop.test.tsx`, `ExercisePlaybackTimeline.loop.test.tsx`

```typescript
- [ ] Test: Loop marker positions scale proportionally with timeline width
- [ ] Test: Loop markers update when timeline is resized
```

### Criterion 18: Parameters Not Persisted Across Sessions
**Component:** `ExercisePlaybackPage.loop-playback.test.tsx`

```typescript
- [ ] Test: Loop state not stored in localStorage
- [ ] Test: Loop state not stored in sessionStorage
- [ ] Test: Page reload clears loop parameters
```

### Criterion 19: Invalid Range Shows Validation Error
**Component:** `LoopControls.test.tsx`

```typescript
- [ ] Test: When loopStartMs >= loopEndMs, validation error displayed
- [ ] Test: Error message text is "Start must be before end"
- [ ] Test: Invalid range prevents toggle button activation (disabled)
- [ ] Test: Red border shown on invalid input fields
- [ ] Test: Error message has aria-live="polite"
```

### Criterion 20: Loop Doesn't Interfere with MIDI Notes
**Component:** `ExercisePlaybackTimeline.loop.test.tsx`

```typescript
- [ ] Test: MIDI note click events fire even when loop active
- [ ] Test: Loop overlay doesn't block pointer events to notes
- [ ] Test: User can inspect note details during loop playback
```

### Criterion 21: Efficient Marker Rendering
**Component:** `MiniTimeline.loop.test.tsx`, `ExercisePlaybackTimeline.loop.test.tsx`

```typescript
- [ ] Test: No frame drops during drag interactions
- [ ] Test: Marker rendering uses CSS transforms (GPU-accelerated)
- [ ] Test: Loop calculation cached (memoized) to prevent unnecessary recalculation
```

### Criterion 22: Edge Case - Loop at Exercise End
**Component:** `ExercisePlaybackPage.loop-playback.test.tsx`

```typescript
- [ ] Test: Loop correctly jumps when loopEndMs at exerciseDuration
- [ ] Test: Loop correctly jumps when loopEndMs very close to exerciseDuration
- [ ] Test: Jump happens BEFORE audio.onEnded fires
- [ ] Test: No gap or silence between jump and resumed playback
```

---

## 3. Accessibility & Responsiveness Tests

### Criterion 23: Screen Reader Announcements
**Component:** `LoopControls.test.tsx`, `ExercisePlaybackPage.loop-playback.test.tsx`

```typescript
- [ ] Test: Aria-labels on all loop controls (start, end, repetitions, toggle, clear)
- [ ] Test: Aria-live region announces loop status changes
- [ ] Test: Aria-live region announces repetition count updates
- [ ] Test: Aria-pressed attribute on toggle button reflects isLoopActive
- [ ] Test: Aria-disabled on invalid inputs
```

### Criterion 24: Performance for 10+ Minute Exercises
**Component:** Integration tests

```typescript
- [ ] Test: Loop creation/adjustment responsive for 10-minute exercise
- [ ] Test: Marker rendering smooth for exercises with BPM 40–300
- [ ] Test: No frame drops with 100+ loop repetitions
- [ ] Test: Playback jump executes within 16ms (60 FPS frame time)
```

### Criterion 25: Keyboard Shortcuts
**Component:** `ExercisePlaybackPage.loop-playback.test.tsx`, `LoopControls.test.tsx`

```typescript
- [ ] Test: Ctrl+L toggles loop on/off
- [ ] Test: Arrow Up/Down in numeric inputs adjust by ±100ms
- [ ] Test: Shift+Arrow adjusts by ±1000ms
- [ ] Test: Tab/Shift+Tab navigate through loop controls
- [ ] Test: Enter toggles loop on/off (when toggle button focused)
- [ ] Test: Escape cancels drag interaction
- [ ] Test: Space on loop marker focuses corresponding input
- [ ] Test: Keyboard shortcuts disabled during playback (for certain controls)
```

---

## Test File Locations

```
packages/ui/src/components/molecules/
  LoopControls/
    └─ LoopControls.test.tsx ........................ LoopControls unit tests
  PlaybackControls/
    └─ PlaybackControls.loop.test.tsx ............. PlaybackControls integration
  MiniTimeline/
    └─ MiniTimeline.loop.test.tsx ................. Drag, markers, bracket drag

packages/ui/src/components/organisms/
  ExercisePlaybackTimeline/
    └─ ExercisePlaybackTimeline.loop.test.tsx ..... Timeline loop overlay
  ExercisePlaybackPage/
    └─ ExercisePlaybackPage.loop-playback.test.tsx  Loop playback logic, metronome sync

apps/web/src/
  (No additional tests needed — covered by UI lib tests)
```

---

## Test Criteria Summary

| Criterion # | Category | Status | Notes |
|-----------|----------|--------|-------|
| 1 | Selection | LoopControls.test.tsx | Desktop drag interaction |
| 2 | Selection | LoopControls.test.tsx | Mobile tap fallback |
| 3 | Selection | ExercisePlaybackPage | Both timelines display |
| 4 | Selection | MiniTimeline, ExercisePlaybackTimeline | Bracket drag |
| 5 | Selection | LoopControls.test.tsx | Numeric inputs |
| 6 | Visualization | MiniTimeline.loop.test.tsx | Marker styling |
| 7 | Visualization | ExercisePlaybackTimeline.loop.test.tsx | Full-height markers |
| 8 | Visualization | MiniTimeline, ExercisePlaybackTimeline | Bracket distinction |
| 9 | Behavior | ExercisePlaybackPage.loop-playback.test.tsx | Jump on end reached |
| 10 | Behavior | LoopControls.test.tsx | Repetitions selector |
| 11 | Behavior | LoopControls.test.tsx | Counter display |
| 12 | Behavior | LoopControls, ExercisePlaybackPage | Toggle preserves params |
| 13 | Behavior | ExercisePlaybackPage | Disabled allows normal playback |
| 14 | Behavior | ExercisePlaybackPage | Parameters preserved |
| 15 | Behavior | ExercisePlaybackPage.metronome-sync | Metronome sync (CRITICAL) |
| 16 | Behavior | LoopControls, ExercisePlaybackPage | Clear button & exercise end |
| 17 | Behavior | MiniTimeline, ExercisePlaybackTimeline | Zoom respect |
| 18 | Behavior | ExercisePlaybackPage | No persistence |
| 19 | Behavior | LoopControls.test.tsx | Validation errors |
| 20 | Behavior | ExercisePlaybackTimeline | MIDI note interaction |
| 21 | Behavior | MiniTimeline, ExercisePlaybackTimeline | Efficient rendering |
| 22 | Behavior | ExercisePlaybackPage | Edge case: loop at end |
| 23 | Accessibility | LoopControls, ExercisePlaybackPage | Aria labels & live regions |
| 24 | Responsiveness | Integration tests | 10+ minute exercises |
| 25 | Responsiveness | LoopControls, ExercisePlaybackPage | Keyboard shortcuts |

---

## Critical Tests (Must Pass)

1. **Criterion 15 (Metronome Sync)** — CRITICAL BUG FIX
   - Metronome clicks must sound on EVERY loop repetition
   - No gap or silence during loop jump
   - Click timing must resync immediately after jump

2. **Criterion 22 (Edge Case - Loop at Exercise End)**
   - Jump must happen BEFORE audio.onEnded fires
   - No silent gap between jump and resumed playback

3. **Criterion 9 (Playback Jump Logic)**
   - Jump must execute in requestAnimationFrame (~60 FPS)
   - Should happen smoothly without pause

---

## Test Generation Status

- ✅ Acceptance criteria extracted and organized
- ✅ Test cases mapped to components and files
- ✅ Critical tests identified
- ⏳ Generate test files from this plan

