# Spec: Exercise Playback Loop Controls

**Status:** In Progress (UI redesign: remove numeric inputs, use timeline drag-select)
**Version:** 2.0.0
**Last updated:** 2026-03-18

## Problem

The original LoopControls with numeric start/end time inputs was redundant and cluttered the sidebar. Users should define loop boundaries visually by dragging on the timeline (MiniTimeline or ExercisePlaybackTimeline), not through text inputs.

The sidebar should only contain:
- Loop toggle (on/off)
- Repetitions selector (1-999 or infinite)
- Clear button (to reset loop bounds)
- Current loop status display

This keeps the sidebar clean and defers visual selection to where it makes sense: the timeline itself.

## User Stories

### As a drummer,
I want to click and drag on the timeline to select a loop region, then toggle the loop on in the sidebar and set how many times to repeat it.

### As a practice user,
I want a simple "Loop On/Off" toggle with repetition options in the sidebar, while loop boundaries are set visually on the timeline.

### As a mobile user,
I want the sidebar to show only essential controls (toggle, reps, clear) so I can quickly enable/disable the loop without complex inputs.

## Acceptance Criteria

- [ ] LoopControls component exists at `packages/ui/src/components/molecules/LoopControls/`
- [ ] Component accepts LoopControlsProps interface (simplified, no start/end inputs)
- [ ] **NO numeric start/end time inputs** — loop boundaries are set via timeline drag-select
- [ ] Loop toggle button: "Loop Off" / "Loop On" with visual state feedback
- [ ] Loop toggle button uses `aria-pressed` for accessibility
- [ ] Repetitions selector: dropdown supporting 1-999 or "infinite"
- [ ] Repetitions default to 1 (or last used value)
- [ ] Clear button: resets loop start/end to 0 and disables loop
- [ ] Current loop status displayed: "Loop 0:00-0:15, 5 reps" (if active)
- [ ] Loop status shows "∞" for infinite repetitions
- [ ] Loop status only shown when loop region is selected (loopStartMs < loopEndMs)
- [ ] Controls styled consistently with MetronomeControl in sidebar
- [ ] Dark/light mode support
- [ ] Full accessibility: aria-labels, proper roles, keyboard navigation
- [ ] Responsive: fits within sidebar on all screen sizes
- [ ] MiniTimeline supports drag-select to define loop bounds (visual highlight)
- [ ] ExercisePlaybackTimeline supports drag-select to define loop bounds (visual highlight)
- [ ] Drag-select updates parent state: loopStartMs, loopEndMs
- [ ] Drag-select is disabled when loop is already active (prevent mid-loop changes)
- [ ] Visual feedback on timeline: loop region highlighted in color (e.g., green overlay)

## Technical Notes

### Component Location & Structure

```
packages/ui/src/components/molecules/LoopControls/
├── LoopControls.tsx          # Main component (simplified)
├── LoopControls.test.tsx     # Unit tests
├── index.ts                  # Export
└── .stories.tsx              # Storybook (optional)
```

### LoopControls Props (Simplified)

**Removed:** `loopStartMs`, `onLoopStartChange`, `loopEndMs`, `onLoopEndChange`
(These are still managed by ExercisePlaybackPage, but NOT controlled via LoopControls inputs)

```typescript
export interface LoopControlsProps {
  loopStartMs: number;                              // Display only (read-only)
  loopEndMs: number;                                // Display only (read-only)
  loopRepetitions: number | 'infinite';             // 1-999 or 'infinite'
  onLoopRepetitionsChange: (reps: number | 'infinite') => void;
  isLoopActive: boolean;                            // Is loop currently enabled?
  onLoopToggle: (active: boolean) => void;          // Callback for toggle
  onLoopClear: () => void;                          // Clear loop bounds + disable
  durationMs: number;                               // For display formatting
}
```

### Layout Structure

```tsx
<div className="flex flex-col gap-3">
  {/* Header */}
  <div>
    <h3 className="text-sm font-semibold">Loop Control</h3>
  </div>

  {/* Loop Status Display (only if loop region selected) */}
  {loopStartMs < loopEndMs && (
    <div className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
      Loop: {formatMs(loopStartMs)}–{formatMs(loopEndMs)}
      {' • '}
      {loopRepetitions === 'infinite' ? '∞ reps' : `${loopRepetitions}x`}
    </div>
  )}

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
      <option value="infinite">∞ Infinite</option>
    </select>
  </div>

  {/* Toggle + Clear Buttons */}
  <div className="flex gap-2">
    {/* Toggle Button */}
    <button
      onClick={() => onLoopToggle(!isLoopActive)}
      disabled={loopStartMs >= loopEndMs}  // Disable if no region selected
      aria-pressed={isLoopActive}
      aria-label={`Turn loop ${isLoopActive ? 'off' : 'on'}`}
      className={`
        flex-1 px-3 py-2 rounded font-medium transition-colors disabled:opacity-50
        ${isLoopActive
          ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        }
      `}
    >
      {isLoopActive ? '✓ Loop On' : 'Loop Off'}
    </button>

    {/* Clear Button */}
    <button
      onClick={onLoopClear}
      disabled={loopStartMs === 0 && loopEndMs === 0}
      aria-label="Clear loop region"
      className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
    >
      Clear
    </button>
  </div>
</div>
```

### Time Format Helpers

Keep these utilities in `packages/utils/src/`:

```typescript
// Convert ms to "mm:ss" string
function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Clamp time to valid range [0, duration]
function clampTime(ms: number, duration: number): number {
  return Math.max(0, Math.min(ms, duration));
}
```

### Timeline Drag-Select Implementation

**MiniTimeline** (`packages/ui/src/components/molecules/MiniTimeline/MiniTimeline.tsx`):

```tsx
const [isDragging, setIsDragging] = useState(false);
const [dragStartMs, setDragStartMs] = useState<number | null>(null);

const handleMouseDown = (e: React.MouseEvent) => {
  if (isLoopActive || !timelineRef.current) return; // Prevent selection while looping

  const rect = timelineRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = x / rect.width;
  const timeMs = percentage * durationMs;

  setIsDragging(true);
  setDragStartMs(timeMs);
};

const handleMouseMove = (e: React.MouseEvent) => {
  if (!isDragging || dragStartMs === null || !timelineRef.current) return;

  const rect = timelineRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  const timeMs = percentage * durationMs;

  // Visual preview: show selection region
  setDragPreview({
    startMs: Math.min(dragStartMs, timeMs),
    endMs: Math.max(dragStartMs, timeMs),
  });
};

const handleMouseUp = (e: React.MouseEvent) => {
  if (!isDragging || dragStartMs === null || !timelineRef.current) return;

  const rect = timelineRef.current.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, x / rect.width));
  const timeMs = percentage * durationMs;

  const startMs = Math.min(dragStartMs, timeMs);
  const endMs = Math.max(dragStartMs, timeMs);

  // Enforce minimum loop duration (e.g., 500ms)
  if (endMs - startMs >= 500) {
    onLoopStartChange?.(startMs);
    onLoopEndChange?.(endMs);
  }

  setIsDragging(false);
  setDragStartMs(null);
  setDragPreview(null);
};
```

**ExercisePlaybackTimeline**: Same logic (or extract to shared hook)

**Visual Feedback**:
- Show a semi-transparent green overlay/highlight for selected region during drag
- After release, keep the highlight visible if loop region is set
- Highlight color: `bg-green-200 dark:bg-green-800 opacity-40`

### Integration with ExercisePlaybackPage

Loop state in ExercisePlaybackPage:

```typescript
const [isLoopActive, setIsLoopActive] = useState(false);
const [loopStartMs, setLoopStartMs] = useState(0);
const [loopEndMs, setLoopEndMs] = useState(0);
const [loopRepetitions, setLoopRepetitions] = useState<number | 'infinite'>(1);

const handleLoopClear = useCallback(() => {
  setLoopStartMs(0);
  setLoopEndMs(0);
  setIsLoopActive(false);
  setCurrentLoopRepetition(0);
}, []);
```

Pass to LoopControls:

```tsx
loopProps={{
  loopStartMs,
  loopEndMs,
  loopRepetitions,
  onLoopRepetitionsChange: setLoopRepetitions,
  isLoopActive,
  onLoopToggle: setIsLoopActive,
  onLoopClear: handleLoopClear,
  durationMs: exercise.durationMs,
}}
```

Pass drag-select callbacks to MiniTimeline/ExercisePlaybackTimeline:

```tsx
<MiniTimeline
  {...otherProps}
  loopStartMs={loopStartMs}
  loopEndMs={loopEndMs}
  onLoopStartChange={setLoopStartMs}
  onLoopEndChange={setLoopEndMs}
  isLoopActive={isLoopActive}
/>

<ExercisePlaybackTimeline
  {...otherProps}
  loopStartMs={loopStartMs}
  loopEndMs={loopEndMs}
  onLoopStartChange={setLoopStartMs}
  onLoopEndChange={setLoopEndMs}
  isLoopActive={isLoopActive}
/>
```

### Styling Notes

- **Colors**: Match MetronomeControl aesthetic
  - Active: green highlight with checkmark
  - Inactive: gray subdued
  - Loop region overlay: semi-transparent green
- **Typography**: Small, compact (text-xs/text-sm)
- **Dark mode**: Full support via Tailwind dark: prefix
- **Buttons**: 40px min height for touch-friendly

### Keyboard Interactions

When sidebar is focused:
- `Space` or `Enter` on toggle button: enable/disable loop
- `Tab`: navigate between selector and buttons
- `Escape`: close sidebar (existing behavior)

When timeline is focused:
- `Escape`: cancel current drag selection

**No text input keyboard shortcuts** (since inputs removed)

### Testing Strategy

**Unit Tests** (`LoopControls.test.tsx`):
- Rendering (toggle, reps selector, clear button)
- Props flow (loopStartMs, loopEndMs read-only display)
- Toggle state (aria-pressed)
- Disabled state (when no region selected)
- Clear button clears loop
- Repetitions selector updates
- Accessibility (aria-labels, roles)
- Dark/light mode class presence

**Integration Tests** (with MiniTimeline/ExercisePlaybackTimeline):
- Drag-select sets loop bounds
- Drag-select disabled while looping
- Visual highlight appears on selection
- LoopControls toggle enables loop after region selected
- Clear button resets bounds

## Out of Scope

- Numeric time inputs (removed by design)
- Keyboard shortcuts for time adjustment (no longer needed)
- Loop preset buttons (1x, 2x, 5x shortcuts)
- MIDI-triggered loop start/end
- Loop fade-in/fade-out at boundaries
- Swing/swing-less repeat modes
- Looping with different playback rates per repetition

## Definition of Done

1. [x] Spec reviewed and approved by team (v2.0 with removal of numeric inputs)
2. [ ] LoopControls rewritten without start/end time inputs
3. [ ] LoopControls.tsx: simplified layout (toggle, reps, clear only)
4. [ ] Loop status display: shows "0:00–0:15, 5x" format
5. [ ] Repetitions selector with 1-999 and infinite options
6. [ ] Loop toggle button with aria-pressed and visual feedback
7. [ ] Clear button: resets bounds and disables loop
8. [ ] LoopControls disabled when no region selected (loopStartMs >= loopEndMs)
9. [ ] MiniTimeline: drag-select implementation for loop bounds
10. [ ] ExercisePlaybackTimeline: drag-select implementation for loop bounds
11. [ ] Visual highlight on timeline during drag and after selection
12. [ ] Drag-select disabled when loop is already active
13. [ ] Minimum loop duration enforced (e.g., 500ms)
14. [ ] Time format helpers in @groovelab/utils (formatMs, clampTime)
15. [ ] Accessibility: aria-labels, proper semantic HTML, keyboard navigation
16. [ ] Dark/light mode styling (Tailwind dark: prefix)
17. [ ] Responsive: fits in sidebar on desktop/tablet/mobile
18. [ ] Styled to match MetronomeControl (sidebar consistency)
19. [ ] LoopControls.test.tsx: 20+ unit tests
20. [ ] MiniTimeline/ExercisePlaybackTimeline: 15+ integration tests for drag-select
21. [ ] Manual testing: drag-select on both timelines
22. [ ] Manual testing: toggle/clear/reps in sidebar
23. [ ] Manual testing: drag disabled while looping
24. [ ] Manual testing: visual highlight appears/disappears
25. [ ] Manual testing: all major browsers (Chrome, Firefox, Safari)
26. [ ] Accessibility audit: screen reader, keyboard nav, contrast
27. [ ] All tests passing
28. [ ] PR merged and deployed

## Implementation Notes for Developer

1. **Remove numeric inputs first**: Delete start/end time input sections from the component.
2. **Add drag-select to timelines**: This is the core feature now—loop bounds are set visually, not via text.
3. **Keep it simple in sidebar**: Just toggle, reps, clear, and status display.
4. **Test drag-select thoroughly**: Ensure it works on both MiniTimeline and ExercisePlaybackTimeline, and respects the "disabled while looping" constraint.
5. **Visual feedback is critical**: Users need to see the selection region clearly (green overlay).
6. **Keyboard support is minimal**: No text input shortcuts needed anymore.

---

Ready to implement! This is a cleaner, more intuitive design.
