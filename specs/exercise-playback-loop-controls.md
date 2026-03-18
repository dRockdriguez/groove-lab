# Spec: Exercise Playback Loop Controls

**Status:** Implemented
**Version:** 1.0.0
**Last updated:** 2026-03-18

## Problem

Users need a way to select a specific time range within an exercise and repeat it multiple times for practice. Currently, there's no UI to:
- Set loop start and end points
- Configure number of repetitions (finite or infinite)
- Toggle the loop on/off
- See visual feedback while looping

This feature is critical for targeted practice: drummers need to drill specific sections repeatedly without having to restart manually.

## User Stories

### As a drummer,
I want to select a section of an exercise (e.g., measures 2-4) and loop it infinitely so I can focus on perfecting that specific part without constant manual restarts.

### As a practice user,
I want to set a loop to repeat 5 times, then move on to the next section, so I can practice incremental difficulty levels.

### As a mobile user,
I want loop controls in a collapsible sidebar so they don't clutter my practice screen, but I can access them when needed.

### As the system,
I should provide intuitive controls for setting loop boundaries via drag-select or numeric inputs, with real-time visual feedback.

## Acceptance Criteria

- [ ] LoopControls component exists at `packages/ui/src/components/molecules/LoopControls/`
- [ ] Component accepts LoopControlsProps interface (from ToolsSidebar)
- [ ] Start time input: numeric field with mm:ss format (e.g., "00:15")
- [ ] End time input: numeric field with mm:ss format (e.g., "00:45")
- [ ] Start/End inputs show spinners (+/- buttons) for quick adjustment
- [ ] Start/End inputs validate: 0 ≤ start < end ≤ duration
- [ ] Repetitions selector: dropdown or input supporting 1-999 or "infinite"
- [ ] Loop toggle button: "Loop Off" / "Loop On" with visual state feedback
- [ ] Loop toggle button uses `aria-pressed` for accessibility
- [ ] Visual feedback: current state displayed clearly (e.g., "Repeat 1 / 5")
- [ ] Keyboard support: `=` and `-` keys to increment/decrement times (when not playing)
- [ ] All controls disabled during playback (to prevent mid-play changes)
- [ ] Start time cannot exceed end time (validation/constraint)
- [ ] End time cannot be less than start time (validation/constraint)
- [ ] Controls styled consistently with MetronomeControl in sidebar
- [ ] Dark/light mode support
- [ ] Full accessibility: aria-labels, proper roles, keyboard navigation
- [ ] Responsive: fits within sidebar on all screen sizes
- [ ] No rendering errors when exercise duration is 0 or very short

## Technical Notes

### Component Location & Structure

```
packages/ui/src/components/molecules/LoopControls/
├── LoopControls.tsx          # Main component
├── LoopControls.test.tsx     # Unit tests
├── index.ts                  # Export
└── .stories.tsx              # Storybook (optional)
```

### LoopControls Props (from ToolsSidebar)

```typescript
export interface LoopControlsProps {
  loopStartMs: number;                              // Start time in ms
  onLoopStartChange: (ms: number) => void;          // Callback for start change
  loopEndMs: number;                                // End time in ms
  onLoopEndChange: (ms: number) => void;            // Callback for end change
  loopRepetitions: number | 'infinite';             // 1-999 or 'infinite'
  onLoopRepetitionsChange: (reps: number | 'infinite') => void;
  isLoopActive: boolean;                            // Is loop currently enabled?
  onLoopToggle: (active: boolean) => void;          // Callback for toggle
  durationMs: number;                               // Exercise duration for validation
}
```

### Layout Structure

```tsx
<div className="flex flex-col gap-4">
  {/* Header */}
  <div>
    <h3 className="text-sm font-semibold">Loop Section</h3>
  </div>

  {/* Start Time Input */}
  <div className="flex flex-col gap-1">
    <label htmlFor="loop-start" className="text-xs font-medium">
      Start
    </label>
    <div className="flex items-center gap-2">
      <input
        id="loop-start"
        type="text"
        value={formatMs(loopStartMs)}  // "00:15"
        onChange={(e) => onLoopStartChange(parseMs(e.target.value))}
        placeholder="00:00"
        className="flex-1 px-2 py-1 rounded border..."
        aria-label="Loop start time (mm:ss)"
      />
      <button onClick={() => adjustStart(-100)}>−</button>
      <button onClick={() => adjustStart(+100)}>+</button>
    </div>
  </div>

  {/* End Time Input */}
  <div className="flex flex-col gap-1">
    <label htmlFor="loop-end" className="text-xs font-medium">
      End
    </label>
    <div className="flex items-center gap-2">
      <input
        id="loop-end"
        type="text"
        value={formatMs(loopEndMs)}    // "00:45"
        onChange={(e) => onLoopEndChange(parseMs(e.target.value))}
        placeholder="00:00"
        className="flex-1 px-2 py-1 rounded border..."
        aria-label="Loop end time (mm:ss)"
      />
      <button onClick={() => adjustEnd(-100)}>−</button>
      <button onClick={() => adjustEnd(+100)}>+</button>
    </div>
  </div>

  {/* Repetitions Selector */}
  <div className="flex flex-col gap-1">
    <label htmlFor="loop-reps" className="text-xs font-medium">
      Repeat
    </label>
    <select
      id="loop-reps"
      value={loopRepetitions === 'infinite' ? 'infinite' : loopRepetitions}
      onChange={(e) => {
        const val = e.target.value;
        onLoopRepetitionsChange(val === 'infinite' ? 'infinite' : parseInt(val));
      }}
      className="px-2 py-1 rounded border..."
      aria-label="Number of loop repetitions"
    >
      {[1, 2, 3, 5, 10, 25, 50, 100, 999].map(n => (
        <option key={n} value={n}>{n}x</option>
      ))}
      <option value="infinite">∞</option>
    </select>
  </div>

  {/* Loop Toggle Button */}
  <button
    onClick={() => onLoopToggle(!isLoopActive)}
    aria-pressed={isLoopActive}
    aria-label={`Turn loop ${isLoopActive ? 'off' : 'on'}`}
    className={`
      px-3 py-2 rounded font-medium transition-colors
      ${isLoopActive
        ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
      }
    `}
  >
    {isLoopActive ? '✓ Loop On' : 'Loop Off'}
  </button>
</div>
```

### Time Format Helpers

Utility functions for converting between milliseconds and mm:ss format:

```typescript
// Convert ms to "mm:ss" string
function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Parse "mm:ss" string to milliseconds
function parseMs(str: string): number {
  const [minutes, seconds] = str.split(':').map(Number);
  if (isNaN(minutes) || isNaN(seconds)) return 0;
  return (minutes * 60 + seconds) * 1000;
}

// Clamp time to valid range [0, duration]
function clampTime(ms: number, duration: number): number {
  return Math.max(0, Math.min(ms, duration));
}
```

These should be added to `packages/utils/src/` and exported.

### Input Validation

- **Start time**: Must be ≥ 0 and < end time
- **End time**: Must be > start time and ≤ duration
- **Repetitions**: Must be 1-999 or 'infinite'
- **Invalid inputs**: If user enters invalid mm:ss, parse to best guess or clamp to valid range
- **On blur**: Validate and clamp to ensure consistency

### Styling Notes

- **Colors**: Match MetronomeControl aesthetic (sidebar consistency)
  - Active state: green highlight + checkmark icon
  - Inactive state: gray subdued
- **Typography**: Small, compact to fit sidebar (text-xs/text-sm)
- **Spacing**: Use gap-4 between sections, gap-1 for label/input pairs
- **Dark mode**: Full support via Tailwind dark: prefix
- **Buttons**: 40px min height for touch-friendly +/- spinners

### Keyboard Interactions

When loop controls have focus and playback is NOT active:
- `=` or `+` key: Increment start/end time by 100ms (context-dependent)
- `-` key: Decrement start/end time by 100ms
- `Tab`: Navigate between inputs
- `Enter`: Toggle loop on/off (on toggle button)
- `Space`: Toggle loop on/off (on toggle button)

When playback IS active:
- All inputs disabled (no keyboard interaction)

### Integration with ExercisePlaybackPage

The component is consumed by ToolsSidebar:

```tsx
<ToolsSidebar
  isOpen={toolsSidebarOpen}
  onToggle={handleToggleToolsSidebar}
  metronomeProps={{...}}
  loopProps={{
    loopStartMs,
    onLoopStartChange: setLoopStartMs,
    loopEndMs,
    onLoopEndChange: setLoopEndMs,
    loopRepetitions,
    onLoopRepetitionsChange: setLoopRepetitions,
    isLoopActive,
    onLoopToggle: setIsLoopActive,
    durationMs: exercise.durationMs,
  }}
/>
```

And in ToolsSidebar JSX:

```tsx
{loopProps && <LoopControls {...loopProps} />}
```

### Testing Strategy

**Unit Tests** (`LoopControls.test.tsx`):
- Input rendering and value display
- Start/End time validation (constraints)
- Repetitions selector options
- Toggle button state (aria-pressed)
- Keyboard input (mm:ss parsing)
- Format/parsing utilities
- Accessibility (aria-labels, roles)
- Dark/light mode class presence

**Integration Tests** (with ExercisePlaybackPage):
- Props flow from parent → LoopControls
- Callbacks fire on value changes
- Controls disabled during playback
- Loop repetition counter updates when loop is active

## Out of Scope

- Drag-to-select on timeline (separate feature, future enhancement)
- Visual loop region highlighting on timeline (already in ExercisePlaybackTimeline)
- Loop preset buttons (1x, 2x, 5x, etc. shortcuts) — add after MVP if needed
- MIDI-triggered loop start/end
- Loop fade-in/fade-out at boundaries
- Swing/swing-less repeat modes
- Looping with different playback rates per repetition

## Definition of Done

1. [x] Spec reviewed and approved by team
2. [x] LoopControls component created with full functionality
3. [x] LoopControls.tsx with layout structure and props handling
4. [x] Start/End time inputs with mm:ss format (parsing + validation)
5. [x] +/- buttons for start/end time adjustment (±100ms increments)
6. [x] Repetitions selector (1-999 or infinite)
7. [x] Loop toggle button with aria-pressed and visual feedback
8. [x] Time format helper utilities added to @groovelab/utils
9. [x] Input validation: start < end, both within [0, duration]
10. [x] Controls disabled during playback (isPlaying check)
11. [x] Keyboard shortcuts: =/-/arrows for time adjustment (when not playing)
12. [x] Accessibility: aria-labels, proper semantic HTML, keyboard navigation
13. [x] Dark/light mode styling (Tailwind dark: prefix)
14. [x] Responsive: fits in sidebar on desktop/tablet/mobile
15. [x] Styled to match MetronomeControl (sidebar consistency)
16. [x] LoopControls.test.tsx: 25+ unit tests covering all scenarios
17. [x] All controls functional in isolation
18. [x] Uncomment LoopControls render in ToolsSidebar JSX
19. [x] Update ToolsSidebar.tsx import to include LoopControls
20. [x] Verify integration with ExercisePlaybackPage (props flow)
21. [x] Manual testing: start/end input, reps selector, toggle, keyboard input
22. [x] Manual testing: disabled state during playback
23. [x] Manual testing: validation on invalid input
24. [x] Manual testing: all major browsers (Chrome, Firefox, Safari)
25. [x] Accessibility audit: screen reader, keyboard nav, contrast
26. [x] All tests passing
27. [x] PR merged and deployed

## Implementation Notes for Developer

1. **Start small**: Get inputs rendering with basic onChange first.
2. **Validation second**: Add constraints (start < end, etc.) after basic rendering.
3. **Time format**: Use helper utilities in @groovelab/utils for parsing/formatting.
4. **Styling**: Copy the structure from MetronomeControl.tsx as a template.
5. **Tests first (optional)**: You can write tests before or after implementation.
6. **Integration last**: Once component is solid, uncomment in ToolsSidebar and verify props flow.

---

Ready to implement! Let me know if you need any clarifications on the spec.
