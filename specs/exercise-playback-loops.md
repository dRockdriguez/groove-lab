# Spec: Exercise Playback Loops

**Status:** Draft
**Version:** 0.1.0
**Last updated:** 2026-03-17

## Problem

Musicians practicing exercises benefit from the ability to repeat specific sections of an exercise rather than playing the entire exercise each time. This is especially useful for:
- Isolating difficult passages within an exercise
- Practicing transitions between different sections
- Building muscle memory on specific patterns without replaying the full exercise
- Adjusting tempo and practicing gradual speed increases on smaller sections

Currently, users must manually play through the entire exercise, making targeted practice on specific sections inefficient.

## User Stories

### As a drummer practicing exercises,
I want to define a loop by selecting a start and end point within the exercise so that I can focus on and repeat just the difficult passage without playing the entire exercise.

### As a learner building speed gradually,
I want to loop a specific section while adjusting the metronome BPM so that I can practice the passage at increasing tempos before playing the full exercise.

### As a practice session optimizer,
I want to set how many times a loop repeats (or loop infinitely) so that I can control my practice session flow without manual restart.

### As a visual learner,
I want to see loop boundary markers on both the mini timeline and the instrument timeline so that I can clearly identify the loop region and stay focused on the repeated section.

### As a system,
I should detect and prevent invalid loop ranges (start >= end) and provide clear feedback to the user when loop parameters are adjusted.

## Acceptance Criteria

### Loop Selection Interaction

- [x] On desktop/tablet: user can drag horizontally on MiniTimeline to create a loop region (left to right)
  - Dragging creates a visual green region showing [start...end]
  - Region appears in real-time as user drags
  - On mouse release, loop is created with start/end at drag boundaries
- [x] On mobile/touchpad: user can tap to set loop start, then tap to set loop end (fallback for drag gesture)
  - First tap shows "[" marker and "Set Loop End" hint
  - Second tap completes the loop with "]" marker
  - Tap target must be at least 48x48px for accessibility
- [x] After drag or tap selection, loop appears on both MiniTimeline and ExercisePlaybackTimeline
- [x] Users can adjust loop start/end by dragging the "[" and "]" bracket markers on either timeline
- [x] Users can adjust loop start/end via numeric input fields in LoopControls (mm:ss or ms format)
  - Start input shows current loop start time
  - End input shows current loop end time
  - Inputs support spinner buttons (↑↓) for ±100ms micro-adjustments
  - Inputs validate in real-time and prevent invalid ranges

### Loop Visualization & Behavior

- [x] Loop boundary markers appear on the MiniTimeline with distinct visual styling (green brackets [ and ], semi-transparent fill)
- [x] Loop boundary markers appear on the ExercisePlaybackTimeline spanning the full height of instrument tracks
- [x] Loop start marker is visually distinct from loop end marker (left bracket "[" vs right bracket "]")
- [x] When a loop is active and playback reaches the end point, playback automatically jumps back to the loop start point
- [x] Users can set the number of repetitions (1–999 or infinite via radio/dropdown)
- [x] A counter or indicator shows how many repetitions remain when loop count is finite (updates in real-time during playback)
  - Format: "Repeat 3 of 5" or "Repeat 3 / ∞"
- [x] Loop toggle button enables/disables the loop without clearing the start/end points
- [x] When a loop is disabled, playback continues normally past the end point without jumping
- [x] Loop parameters are not lost when toggling loop on/off
- [x] Loop parameters do not interfere with metronome functionality (metronome clicks remain synchronized)
- [x] Loop is cleared when exercise playback ends or user manually clears via "Clear Loop" button
- [x] Loop visual markers respect the current playback zoom level (scale with timeline width)
- [x] Loop parameters are not persisted across sessions (cleared on page reload)
- [x] Invalid loop ranges (start >= end) show a validation error and prevent activation
- [x] Loop does not interfere with MIDI note interaction (user can still click notes to inspect details)
- [x] Loop boundary markers are rendered efficiently (no frame drops) even with 100+ repetitions

### Accessibility & Responsiveness

- [x] Screen readers announce loop status (active, paused, repeat count) and boundary positions
- [x] Loop is responsive and performs smoothly for exercises up to 10 minutes with any BPM range (40–300)
- [x] Keyboard shortcuts available: Ctrl+L to toggle loop, keyboard navigation through LoopControls inputs

## Technical Notes

### Integration Points

- **MiniTimeline Component** (`packages/ui/src/components/molecules/MiniTimeline/`)
  - Add loop boundary visualization layer
  - Left bracket "[" at loop start position, right bracket "]" at loop end position
  - Visual styling: green color (`#10B981` or `#059669`), semi-transparent background fill (opacity 0.15) between start/end
  - **Primary interaction: Drag to create loop**
    - Add `onMouseDown` handler to timeline track area
    - Track mouse movement: `onMouseMove` captures current X position
    - On `onMouseUp`, calculate start/end from drag range
    - Create visual preview during drag (blue outline, not final green)
    - On release, convert drag range to `[loopStartMs, loopEndMs]`
  - **Secondary interaction: Drag bracket markers to adjust**
    - Add `onMouseDown` handlers to "[" and "]" markers
    - Allow horizontal drag to resize loop boundaries
    - Prevent dragging start past end (validate continuously)
    - Update state on `onMouseUp`
  - **Fallback for mobile: Click start, then click end**
    - Detect touch/mobile environment
    - First tap: create "[" at tapped position, show hint "Tap to set loop end"
    - Second tap: create "]" at tapped position, activate loop
  - Markers proportional to exercise duration (percent-based positioning)
  - Receive `loopStartMs`, `loopEndMs`, `isLoopActive`, `isDraggingLoop` as props
  - Receive callback props: `onLoopStartChange(ms)`, `onLoopEndChange(ms)`, `onLoopDragStart()`, `onLoopDragEnd()`

- **ExercisePlaybackTimeline Component** (`packages/ui/src/components/organisms/ExercisePlaybackTimeline/`)
  - Add loop boundary overlay spanning full height above all MIDI tracks
  - Left bracket marker "[" at loop start, right bracket marker "]" at loop end
  - Semi-transparent green background fill (opacity 0.15) between start/end across all tracks
  - **Secondary interaction: Drag bracket markers to adjust**
    - Allow dragging "[" and "]" markers horizontally to resize loop
    - Visual feedback during drag (change cursor to resize, highlight bracket)
    - Validate continuously (prevent start >= end)
  - Receive `loopStartMs`, `loopEndMs`, `isLoopActive`, `isDraggingLoop` as props
  - Receive callbacks: `onLoopStartChange(ms)`, `onLoopEndChange(ms)`, `onLoopDragStart()`, `onLoopDragEnd()`
  - Use `z-index` to ensure loop markers are visible but do not block note interaction
  - Use `pointer-events: auto` on brackets (for dragging), `pointer-events: none` on fill

- **LoopControls Component** (New) (`packages/ui/src/components/molecules/LoopControls/`)
  - Sub-component of PlaybackControls for precise numeric adjustment
  - **Layout (two rows):**
    - Row 1: "Start: [mm:ss ↕]" | "End: [mm:ss ↕]"
    - Row 2: "Repeat: [1-999 ↕]" | "◯ Infinite" | "[Loop Toggle]" "[Clear]"
  - **Numeric inputs (Start & End):**
    - Display format: mm:ss (e.g., "01:23")
    - Accept user input in mm:ss format or plain ms
    - Spinner buttons (↕): ±100ms per click, ±1000ms per Shift+click
    - On change: validate start < end, call `onLoopStartChange`/`onLoopEndChange`
    - Visual feedback: red border if invalid range
  - **Repetitions selector:**
    - Number input: 1–999
    - Radio button or toggle: "∞ Infinite"
    - Display current repetition during playback (read-only, updated via prop)
    - Receive `currentLoopRepetition` prop to show "Repeat 3 of 5"
  - **Toggle button:**
    - Text: "Enable Loop" or "Disable Loop" (changes based on `isLoopActive`)
    - Disabled if invalid range
    - Aria-pressed attribute
  - **Clear button:**
    - Resets loop to default (clears start/end, resets repetitions)
    - Call `onLoopClear()`

- **PlaybackControls Component** (Updated)
  - Integrate LoopControls as a sub-component below the seek slider
  - No changes to playback slider itself
  - LoopControls is always visible, can be collapsed optionally

- **ExercisePlaybackPage** (`packages/ui/src/components/organisms/ExercisePlaybackPage/`)
  - Add loop state: `loopStartMs`, `loopEndMs`, `isLoopActive`, `loopRepetitions`, `currentLoopRepetition`
  - Add callback handlers:
    - `handleLoopStartChange(ms)` → update state
    - `handleLoopEndChange(ms)` → update state
    - `handleLoopToggle(enabled)` → set isLoopActive
    - `handleLoopRepetitionsChange(count)` → set loopRepetitions
  - Modify playback logic in `updatePlayhead`:
    - When `isLoopActive === true` and `currentTimeMs >= loopEndMs`:
      - If `loopRepetitions === 'infinite'` or `currentLoopRepetition < loopRepetitions`:
        - Jump playhead to `loopStartMs` and increment `currentLoopRepetition`
        - Continue playback (no pause)
      - If repetitions exhausted:
        - Stop playback (or continue past loop end if user prefers)
  - Pass loop props to MiniTimeline and ExercisePlaybackTimeline
  - Pass loop handlers to PlaybackControls

- **MetronomeControl Compatibility**
  - Loop playback does not affect metronome click timing
  - Metronome clicks should align correctly when playhead jumps to loop start
  - Ensure metronome state persists across loop jumps

### Loop State Model

```typescript
interface LoopState {
  loopStartMs: number;
  loopEndMs: number;
  isLoopActive: boolean;
  loopRepetitions: number | 'infinite';
  currentLoopRepetition: number; // only relevant during active loop playback
}
```

### Drag Interaction Implementation Details

**For MiniTimeline drag-to-select (primary interaction):**

```typescript
// Track state during drag
const [dragStartMs, setDragStartMs] = useState<number | null>(null);
const [dragCurrentMs, setDragCurrentMs] = useState<number | null>(null);
const [isDraggingLoop, setIsDraggingLoop] = useState(false);

// Mouse down: start tracking
const handleMouseDown = (e: React.MouseEvent) => {
  const rect = e.currentTarget.getBoundingClientRect();
  const percentX = (e.clientX - rect.left) / rect.width;
  const timeMs = (percentX / 100) * durationMs;
  setDragStartMs(timeMs);
  setIsDraggingLoop(true);
};

// Mouse move: update preview
const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDraggingLoop || dragStartMs === null) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const percentX = (e.clientX - rect.left) / rect.width;
  const timeMs = (percentX / 100) * durationMs;
  setDragCurrentMs(timeMs);
};

// Mouse up: finalize loop
const handleMouseUp = () => {
  if (dragStartMs === null || dragCurrentMs === null) return;
  const start = Math.min(dragStartMs, dragCurrentMs);
  const end = Math.max(dragStartMs, dragCurrentMs);
  if (end - start >= 500) { // Minimum 500ms loop
    onLoopStartChange(start);
    onLoopEndChange(end);
  }
  setDragStartMs(null);
  setDragCurrentMs(null);
  setIsDraggingLoop(false);
};

// Visual feedback during drag
const dragPreviewPercent = dragCurrentMs !== null
  ? (dragCurrentMs / durationMs) * 100
  : null;
const loopStartPercent = Math.min(dragStartMs ?? 0, dragCurrentMs ?? 0) / durationMs * 100;
const loopEndPercent = Math.max(dragStartMs ?? 0, dragCurrentMs ?? 0) / durationMs * 100;
```

**For bracket dragging (resize adjustment):**

```typescript
// Detect which bracket was clicked
const handleBracketMouseDown = (e: React.MouseEvent, bracketType: 'start' | 'end') => {
  e.stopPropagation(); // Don't trigger timeline drag
  const rect = e.currentTarget.parentElement?.getBoundingClientRect();
  if (!rect) return;

  const initialX = e.clientX;
  const initialMs = bracketType === 'start' ? loopStartMs : loopEndMs;

  const handleDrag = (moveEvent: MouseEvent) => {
    const deltaX = moveEvent.clientX - initialX;
    const deltaPercent = deltaX / rect.width;
    const deltaMs = deltaPercent * durationMs;
    const newMs = Math.max(0, Math.min(durationMs, initialMs + deltaMs));

    if (bracketType === 'start') {
      if (newMs < loopEndMs) onLoopStartChange(newMs);
    } else {
      if (newMs > loopStartMs) onLoopEndChange(newMs);
    }
  };

  const handleDragEnd = () => {
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', handleDragEnd);
};
```

### Loop Playback Logic

**Pseudocode in ExercisePlaybackPage.updatePlayhead():**
```typescript
if (isLoopActive && currentTimeMs >= loopEndMs && loopStartMs < loopEndMs) {
  if (loopRepetitions === 'infinite' || currentLoopRepetition < loopRepetitions) {
    // Jump to loop start and increment counter
    audioRef.current.currentTime = loopStartMs / 1000;
    setCurrentTimeMs(loopStartMs);
    setCurrentLoopRepetition(prev => prev + 1);
  } else {
    // Repetitions exhausted: continue past loop normally
    setIsLoopActive(false);
  }
}
```

### Marker Calculation

**Loop boundary positions (as % of timeline):**
- Loop start position = `(loopStartMs / exerciseDuration) * 100`
- Loop end position = `(loopEndMs / exerciseDuration) * 100`
- Background fill = from start position to end position

**Visual representation:**
- Left bracket (loop start): `[` shape in green at start position
- Right bracket (loop end): `]` shape in green at end position
- Fill between: semi-transparent green background (opacity 0.1–0.2)

### User Interaction Flow

**Desktop/Tablet (Primary):**
```
User wants to create a loop from 15s to 45s:

1. Sees MiniTimeline with exercise waveform
2. Drags horizontally from 15s to 45s position
   → Visual preview appears: blue outline showing range
3. Releases mouse
   → Loop is created with green brackets [ and ]
   → Green semi-transparent fill between brackets
4. (Optional) Fine-tunes via LoopControls:
   - Sees "Start: 00:15" and "End: 00:45"
   - Clicks End input, types "00:46" for 1 second adjustment
5. Clicks "Enable Loop" to activate (if not auto-active)
6. Clicks Play → audio loops 1 time, then continues
7. (Optional) Changes "Repeat" from 1 to 5, clicks Play again
```

**Mobile/Touchpad (Fallback):**
```
1. Taps on MiniTimeline at 15s
   → Shows "[" marker, hint text "Tap to set loop end"
2. Taps at 45s
   → Shows "]" marker, loop is created
3. Adjusts via LoopControls if needed
4. Plays with loop enabled
```

### Component Structure

```
ExercisePlaybackPage
  ├─ PlaybackControls (updated)
  │   ├─ Seek slider (unchanged)
  │   └─ LoopControls (new sub-component)
  │       ├─ Loop start input (mm:ss with ↕)
  │       ├─ Loop end input (mm:ss with ↕)
  │       ├─ Repetitions input/toggle (1-999 or ∞)
  │       ├─ Repetition counter (read-only during playback)
  │       ├─ Toggle button ("Enable Loop" / "Disable Loop")
  │       └─ Clear button
  │
  ├─ MiniTimeline (updated)
  │   └─ LoopMarkerTrack (new layer)
  │       ├─ Left bracket "[" at start (draggable)
  │       ├─ Right bracket "]" at end (draggable)
  │       ├─ Semi-transparent fill between
  │       └─ Drag detection for region selection (primary interaction)
  │
  └─ ExercisePlaybackTimeline (updated)
      └─ LoopMarkerOverlay (new layer)
          ├─ Left bracket "[" (draggable, full height)
          ├─ Right bracket "]" (draggable, full height)
          └─ Semi-transparent fill (full height)
```

### State Management

- Loop parameters are **session-scoped**: stored in React state on ExercisePlaybackPage, not persisted to localStorage or database
- Loop state is **independent** of:
  - Metronome state (BPM changes, click tone)
  - Playback rate (loops respect current playback rate)
  - Seek position outside loop (user can seek freely; loop only activates when playing into loop region)
- Loop **survives** toggling on/off (parameters preserved)
- Loop is **cleared**:
  - When exercise playback ends
  - When user seeks outside [loopStart, loopEnd] and explicitly clears via button
  - On page reload

### Validation

- **Invalid states:**
  - `loopStartMs >= loopEndMs` → show error, disable loop toggle
  - `loopStartMs < 0` or `loopEndMs > exerciseDuration` → clamp to valid range, show warning
  - Drag range < 500ms (too short) → ignore, show hint "Minimum 500ms loop"
  - `loopRepetitions < 1` and not 'infinite' → reset to 1 or 'infinite'

- **User feedback during interaction:**
  - **Drag preview:** Show blue outline (not final green) while dragging on timeline
  - **Invalid range during drag:** Visual feedback (e.g., red tint on preview) if user tries to create start >= end
  - **Too short range:** Gray out preview, show inline message "Minimum 500ms"
  - **Bracket drag:** Cursor changes to `col-resize` on bracket hover
  - **Invalid bracket drag:** Prevent dragging if it would create invalid range (start >= end)

- **User feedback in LoopControls:**
  - Validation error message below inputs (aria-live="polite")
  - Red border on invalid input field
  - Red text: "Start must be before end"
  - Disabled loop toggle button until valid range entered
  - Input spinner buttons (↕) prevent setting invalid values (disable button if at boundary)

### Accessibility

**Keyboard Navigation:**
- Tab/Shift+Tab: Navigate through all loop controls (start input → end input → repetitions → toggle → clear)
- Arrow Up/Down: Adjust values in numeric inputs (±100ms per keystroke, ±1000ms with Shift)
- Enter: Toggle loop on/off
- Escape: Cancel drag interaction, clear focus from inputs
- Ctrl+L: Toggle loop (global shortcut, useful during playback)
- Space on loop marker: Focus the corresponding LoopControls input (start/end)

**Screen Reader Support:**
- Aria-labels on all controls:
  - `aria-label="Loop start time, mm:ss format"` on start input
  - `aria-label="Loop end time, mm:ss format"` on end input
  - `aria-label="Loop repetitions, 1 to 999 or infinite"` on repetitions control
  - `aria-label="Toggle loop on or off"` on toggle button
  - `aria-label="Clear loop boundaries and reset"` on clear button
- Aria-live region for:
  - Validation errors: `aria-live="polite"` with `aria-atomic="true"`
  - Repetition counter: `aria-live="polite"` (announces "Repeat 3 of 5" updates)
  - Drag feedback: When drag preview created, announce "Loop preview from X to Y"
- Loop markers:
  - MiniTimeline: `role="presentation"` on visual elements (markers are visual only)
  - Aria-label on parent container: "Loop region from 15 seconds to 45 seconds, set to repeat 3 times"
  - ExercisePlaybackTimeline: same pattern, add "spanning instrument tracks"
- Aria-pressed on toggle button (reflects `isLoopActive` state)
- Aria-disabled on inputs/buttons when invalid range or playback is active (certain controls disabled during play)

### Performance Considerations

- **Marker rendering:** Use CSS classes and transforms (GPU-accelerated) for positioning
- **Memoize loop calculations:** Cache loop boundary positions and validation results
- **Efficient loop logic:** Check loop condition only during playback (no polling)
- **Avoid re-renders:** Loop state changes should not trigger full page re-renders (use useCallback)

### Visual Design & UI Layout

**MiniTimeline with Loop Interaction:**
```
┌─────────────────────────────────────────────────────────────┐
│ MiniTimeline (with waveform or simple bars)                 │
│                                                              │
│ ▂▄▆▇█▇▆▄▂▂▄▆▇█▇▆▄▂▂▄▆[████████████]▆▄▂▂▄▆▇█▇▆▄▂▂▄▆▇█▇▆▄  │
│                    ↓ Drag to create loop   ↑                │
│                                                              │
│ Status: Ready to create loop                               │
│ (Or after selection:)                                       │
│ ▂▄▆▇█▇▆▄▂▂▄▆▇█▇▆▄▂ ┌──────────────────┐ ▆▇█▇▆▄▂▂▄▆▇█▇▆▄  │
│                  [ ░░░░░░░░░░░░░░░░░░ ]                      │
│                  Loop: 15s to 45s (30s)                     │
└─────────────────────────────────────────────────────────────┘
```

**PlaybackControls with LoopControls:**
```
┌─────────────────────────────────────────────────────────────┐
│ Playback Controls                                           │
│ ▶  00:15 ├─────●──────────────────────────┤ 01:00          │
│         [Seek slider - unchanged]                           │
│                                                              │
│ Loop Controls                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Start: [00:15 ↕]  End: [00:45 ↕]                        │ │
│ │ Repeat: [3 ↕] | ◯ Infinite  [Enable Loop] [Clear]       │ │
│ │ Status: Repeat 3 of 3                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**ExercisePlaybackTimeline with Loop Overlay:**
```
┌──────────────────────────────────────────────────────────────┐
│ ExercisePlaybackTimeline                                    │
│                                                              │
│ Labels │ ▁▁▁▁▁▁▁▁[ ░░░░░░░░░░░░░░░░░░░░ ]▁▁▁▁▁▁▁▁        │
│ Kick   │ ●   ●   ●[●   ●   ●   ●   ●   ●]●   ●   ●        │
│        │ (green loop overlay, full height, behind notes)   │
│        │                                                    │
│ Snare  │ ▁▁▁▁▁▁▁▁[ ░░░░░░░░░░░░░░░░░░░░ ]▁▁▁▁▁▁▁▁        │
│        │   ●   ●[●   ●   ●   ●   ●   ●]●   ●             │
│        │                                                    │
│ Hihat  │ ▁▁▁▁▁▁▁▁[ ░░░░░░░░░░░░░░░░░░░░ ]▁▁▁▁▁▁▁▁        │
│        │ ● ● ● ●[●●●●●●●●●●●●●●●●●●●●]●●●●●●●●●        │
│        │        ↑ brackets span all tracks                 │
└──────────────────────────────────────────────────────────────┘
```

**Color Scheme:**
- Loop bracket markers: Green (`#10B981` or `#059669`)
- Loop fill background: Green with opacity 0.15 (very subtle, not distracting)
- Drag preview outline: Blue (`#3B82F6`) while dragging (to distinguish from final loop)
- Error state: Red border (`#EF4444`) on LoopControls inputs if invalid range

**Responsive Behavior:**
- Desktop (>768px): Full LoopControls visible, layout as shown above
- Tablet (600-768px): LoopControls may collapse into an expandable section
- Mobile (<600px): LoopControls may be in a modal or drawer (decision deferred to design review)

## Out of Scope

- Loop presets or save/load functionality (loops are session-only)
- Nested loops or multiple simultaneous loops
- Loop fade-in/fade-out at boundaries
- Automatic loop detection based on MIDI patterns
- Loops persisted across sessions or synced to cloud
- Custom loop marker colors or styling options
- Haptic feedback synchronized with loop boundaries
- Loop recording or export as separate audio file
- Tempo change automation within loops
- Visualization of loop density or note distribution within loop region

## Definition of Done

1. [ ] Spec reviewed and approved by team
2. [ ] Acceptance criteria are testable and unambiguous
3. [ ] LoopControls sub-component created (`packages/ui/src/components/molecules/LoopControls/`)
   - Start/end numeric inputs with mm:ss formatter and spinner buttons
   - Repetitions selector (1–999 or infinite)
   - Repetition counter display (read-only during playback)
   - Toggle button and clear button
   - Real-time validation with error messages
   - Aria-labels and aria-live support
4. [ ] MiniTimeline updated with loop drag-to-select interaction
   - Drag horizontally to create loop region (primary interaction)
   - Visual preview during drag (blue outline, not final green)
   - Drag creates `[loopStartMs, loopEndMs]` on mouse release
   - Minimum loop duration: 500ms (prevents accidental tiny loops)
5. [ ] MiniTimeline loop boundary markers rendering
   - Left bracket "[" at loop start, right bracket "]" at loop end
   - Semi-transparent green fill between boundaries
   - Brackets draggable to resize loop (secondary interaction)
   - Cursor changes to `col-resize` on bracket hover
   - Prevent dragging start past end (continuous validation)
   - Receive `loopStartMs`, `loopEndMs`, `isLoopActive` as props
   - Receive callbacks: `onLoopStartChange`, `onLoopEndChange`, `onLoopDragStart`, `onLoopDragEnd`
6. [ ] Mobile fallback interaction on MiniTimeline
   - Detect touch/mobile environment
   - First tap: create "[" marker, show hint
   - Second tap: create "]" marker, activate loop
   - Same visual feedback as desktop
7. [ ] ExercisePlaybackTimeline updated with loop boundary overlay
   - Left bracket "[" and right bracket "]" spanning full height
   - Semi-transparent green fill between boundaries (full height, behind notes)
   - Brackets draggable to resize loop (same as MiniTimeline)
   - Does not interfere with MIDI note interaction
   - Same visual style as MiniTimeline markers
8. [ ] ExercisePlaybackPage loop state management:
   - `loopStartMs`, `loopEndMs`, `isLoopActive`, `loopRepetitions`, `currentLoopRepetition`
   - Handlers: `handleLoopStartChange`, `handleLoopEndChange`, `handleLoopToggle`, `handleLoopRepetitionsChange`, `handleLoopClear`
9. [ ] Playback logic updated to jump to loop start when end reached
   - Increment repetition counter
   - Respect repetition limit or 'infinite' mode
   - Continue playback smoothly after jump (no pause)
10. [ ] LoopControls integrated into PlaybackControls below seek slider
11. [ ] Validation logic prevents invalid ranges and shows error messages
    - Real-time validation during drag and input
    - Minimum 500ms loop enforcement
    - Start < end validation (prevents start >= end)
    - Visual feedback: red border, error messages
12. [ ] Loop state does not interfere with metronome (metronome clicks remain synchronized)
13. [ ] Keyboard shortcuts implemented:
    - Ctrl+L to toggle loop
    - Arrow keys to adjust numeric inputs (±100ms, ±1000ms with Shift)
    - Tab/Shift+Tab to navigate controls
    - Escape to cancel drag
14. [ ] Loop performance tested: no frame drops even with long exercises and multiple drag interactions
15. [ ] Unit tests for loop calculation logic (edge cases: very short loops, edge of exercise, drag ranges)
16. [ ] Unit tests for LoopControls: input validation, toggle, repetition updates, numerical input parsing
17. [ ] Unit tests for bracket drag logic: resize boundaries, prevent invalid ranges, continuous validation
18. [ ] Unit tests for MiniTimeline drag-to-select: preview rendering, finalizing loop, minimum duration enforcement
19. [ ] Integration tests verify loop playback (jump to start, increment counter, stop at repetition limit)
20. [ ] Integration tests verify loop + metronome sync (clicks aligned when playhead jumps)
21. [ ] Integration tests verify markers appear/disappear when loop toggled
22. [ ] Integration tests verify drag on MiniTimeline creates correct loop boundaries
23. [ ] Integration tests verify bracket drag on both timelines resizes loop correctly
24. [ ] Accessibility tests: aria-labels, aria-live announcements, keyboard navigation (Tab, arrows, Ctrl+L)
25. [ ] Accessibility tests: screen reader announces loop status, boundaries, repetition count
26. [ ] Visual regression tests showing loop markers across different exercise durations
27. [ ] Visual regression tests showing drag preview and final loop visualization
28. [ ] Manual testing on Chrome, Firefox, Safari (mobile and desktop)
29. [ ] Manual testing: drag-to-select on different screen sizes and timeline widths
30. [ ] Manual testing: bracket drag for fine adjustments
31. [ ] Manual testing: mobile tap-to-set fallback interaction
32. [ ] Design review: loop marker colors (#10B981 or #059669), bracket shape, fill opacity approved
33. [ ] Spec marked complete on all acceptance criteria
34. [ ] All tests passing
35. [ ] PR merged and deployed
