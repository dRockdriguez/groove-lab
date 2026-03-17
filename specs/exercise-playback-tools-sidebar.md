# Spec: Exercise Playback Tools Sidebar

**Status:** In Progress
**Version:** 0.1.0
**Last updated:** 2026-03-17

## Problem

The ExercisePlaybackPage UI is becoming crowded with MetronomeControl and LoopControls stacked vertically below the seek slider. This creates several issues:
- Limited vertical space for the main timeline visualization
- Controls take attention away from the exercise playback feedback
- Long scroll required to see both controls and playback timeline
- Mobile users face significant screen clutter
- No clear visual hierarchy between primary (playback) and secondary (tools) controls

Musicians need quick access to metronome and loop controls without sacrificing visibility of the main playback timeline where MIDI notes and visual feedback are displayed.

## User Stories

### As a drummer practicing,
I want the metronome and loop controls in a collapsible sidebar so that I can focus on the main timeline without scrolling, and quickly toggle tools on/off without distracting from playback.

### As a mobile user,
I want tools hidden by default and accessible via a toggle button so that I can see more of the timeline on a small screen.

### As a teacher using the app,
I want to show students the main timeline and playback without tool clutter so that they can focus on the exercise structure and their performance feedback.

### As the system,
I should provide a smooth, non-disruptive way to access tools while keeping the primary playback UI clean and spacious.

## Acceptance Criteria

- [ ] Tools sidebar appears as a fixed left-side panel (desktop) or bottom drawer (mobile)
- [ ] Sidebar contains MetronomeControl and LoopControls stacked vertically
- [ ] Sidebar has a toggle button (hamburger icon or chevron) to show/hide
- [ ] Sidebar is hidden by default on page load (or remembers last state via sessionStorage)
- [ ] Sidebar animates smoothly (slide-in/slide-out) with 300ms duration
- [ ] Sidebar width is responsive: 320px (desktop), full-width drawer (mobile < 640px)
- [ ] Main timeline expands to fill available space when sidebar is closed
- [ ] Sidebar has a semi-transparent backdrop on mobile when open (click to close)
- [ ] Toggle button remains visible/accessible at all times
- [ ] Keyboard shortcut to toggle sidebar (e.g., Ctrl+T or Alt+T)
- [ ] Sidebar does not interfere with timeline interaction (z-index managed correctly)
- [ ] All controls in sidebar remain fully functional (no loss of features)
- [ ] Sidebar is accessible: aria-labels, keyboard navigation, screen reader support
- [ ] Sidebar respects color scheme (dark/light mode)
- [ ] Sidebar state persists within session (sessionStorage, NOT localStorage)
- [ ] On very small screens (< 320px), sidebar becomes a modal instead of drawer
- [ ] Sidebar is responsive and smooth even with 100+ metronome markers on timeline
- [ ] **Loop repetition counter appears on main playback screen** (NOT in sidebar)
- [ ] Counter displays "Repeat N / M" format for finite repetitions (e.g., "Repeat 1 / 5")
- [ ] Counter displays "Repeat N / ∞" format for infinite repetitions
- [ ] Counter is positioned between PlaybackControls and Timeline area
- [ ] Counter is visible only when loop is active, hidden when loop is disabled
- [ ] Counter updates in real-time as loop repeats progress
- [ ] Counter is styled with high contrast for visibility during playback

## Technical Notes

### Integration Points

- **New Sidebar Component** (`packages/ui/src/components/organisms/ToolsSidebar/`)
  - Wrapper component that manages sidebar state
  - Contains MetronomeControl and LoopControls as children
  - Handles show/hide animation
  - Receives toggle callback from parent (ExercisePlaybackPage)
  - Props:
    - `isOpen: boolean` — whether sidebar is visible
    - `onToggle: () => void` — callback when toggle button clicked
    - `metronomeProps: MetronomeControlProps` — pass-through to MetronomeControl
    - `loopProps: LoopControlsProps` — pass-through to LoopControls

- **Toggle Button** (`ToolsSidebar` header)
  - Icon: hamburger (≡) or chevron (◀/▶) depending on state
  - Label: "Show Tools" or "Hide Tools"
  - Keyboard accessible (Tab to focus, Enter to toggle)
  - Aria-label: "Toggle tools sidebar"

- **ExercisePlaybackPage** (Updated)
  - Add `toolsSidebarOpen` state (default: false)
  - Add `handleToggleToolsSidebar` callback
  - Use sessionStorage to persist state:
    ```typescript
    useEffect(() => {
      const stored = sessionStorage.getItem('exerciseTools_sidebarOpen');
      if (stored !== null) {
        setToolsSidebarOpen(JSON.parse(stored));
      }
    }, []);

    const handleToggleToolsSidebar = useCallback(() => {
      setToolsSidebarOpen(prev => {
        const next = !prev;
        sessionStorage.setItem('exerciseTools_sidebarOpen', JSON.stringify(next));
        return next;
      });
    }, []);
    ```
  - Wrap MetronomeControl and LoopControls in ToolsSidebar
  - Pass all relevant props to sidebar

- **Layout Structure**
  ```typescript
  <div className="flex h-screen">
    {/* Tools Sidebar (fixed left, or bottom drawer on mobile) */}
    <ToolsSidebar
      isOpen={toolsSidebarOpen}
      onToggle={handleToggleToolsSidebar}
      metronomeProps={{ /* ... */ }}
      loopProps={{ /* ... */ }}
    />

    {/* Main content area (flex-1 to expand) */}
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Playback controls (compact) */}
      <PlaybackControls /* ... */ />

      {/* Loop repetition counter (visible always, on main timeline) */}
      {isLoopActive && (
        <LoopRepetitionCounter
          currentRepetition={currentLoopRepetition}
          totalRepetitions={loopRepetitions}
        />
      )}

      {/* Timeline area (expands to fill space) */}
      <div className="flex-1 overflow-auto">
        <MiniTimeline /* ... */ />
        <ExercisePlaybackTimeline /* ... */ />
      </div>

      {/* Statistics (fixed bottom) */}
      <SessionStatisticsPanel /* ... */ />
    </div>
  </div>
  ```

#### LoopRepetitionCounter Component
- **Purpose**: Display current loop repetition progress on main playback screen
- **Location**: Main content area, between PlaybackControls and Timeline (visible only when loop is active)
- **Props**:
  - `currentRepetition: number` — current repetition count (0-based, displayed as 1-based)
  - `totalRepetitions: number | 'infinite'` — total repetitions or 'infinite'
- **Styling**:
  - Prominent, easy to read while playing (e.g., "Repeat 1 / 5" or "Repeat 2 / ∞")
  - Position: compact bar below PlaybackControls
  - Color: blue highlight (similar to current LoopControls styling)
  - Visibility: only shown when `isLoopActive === true`
- **Behavior**:
  - Updates in real-time as loops progress
  - Disappears when loop is disabled
  - High contrast for accessibility

### Sidebar Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│ ≡ Tools        │ ▶ 00:01 ├───●─────┤ 00:02                      │
│                │                                                  │
│ ┌────────────┐ │ Start: 00:00  End: 00:02                        │
│ │ Metronome  │ │ Repeat: ∞ Infinite  [Disable Loop] [Clear]      │
│ │            │ │                                                  │
│ │ 120 ▁▁▁▁  │ │ ┌──────────────────────────────────────────────┐│
│ │ -   120  + │ │ │ Metronome beats │ Loop region               ││
│ │ [On]       │ │ │   │    │    │    │ [════════════════════]  ││
│ │            │ │ │                                              ││
│ │ Loop       │ │ │ Kick Drum  • • • •[•   •   •   •   •   •]  ││
│ │            │ │ │            (green loop overlay, full height) ││
│ │ Start 00:00│ │ │                                              ││
│ │ End   00:02│ │ │ Snare     •   •[•   •   •   •   •   •]•   • ││
│ │            │ │ │                                              ││
│ │ Repeat: ∞ │ │ │ Hi-Hat ●●●●●[●●●●●●●●●●●●●●●●●●●●]●●●●●● ││
│ │ [Loop On]  │ │ └──────────────────────────────────────────────┘│
│ │            │ │                                                  │
│ │ Repeat ∞ / │ │ Accuracy: 0%   Hits: 0/0   Timing: 0ms  Violations: 0
│ └────────────┘ │                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Sidebar Styling (Desktop)**:
- Width: 320px (fixed, can be adjusted via CSS variable)
- Position: `fixed` left: 0, top: 0, height: 100vh
- Background: `bg-gray-50 dark:bg-gray-900` (matches page background)
- Border right: `border-r border-gray-200 dark:border-gray-700`
- Shadow: `shadow-lg` for depth
- Padding: `p-4` inside
- Overflow: `overflow-y-auto` for scrolling if controls exceed height

**Toggle Button**:
- Position: Top-left of sidebar (in header row with "Tools" label)
- Size: 40x40px (touch-friendly)
- Icon: hamburger (≡) or chevron (◀/▶)
- Hover: background color change for feedback
- Aria-label: "Toggle tools sidebar" or "Show/Hide tools"

**Animation**:
- Slide-in: `translate-x-0` (visible)
- Slide-out: `translate-x-[-100%]` (hidden off-screen left)
- Duration: 300ms
- Easing: `ease-in-out`
- Use CSS transitions or Framer Motion for smooth animation

### Mobile Layout

**Small Screens (< 640px)**:
- Sidebar becomes a bottom drawer instead of left panel
- Position: `fixed` bottom: 0, left: 0, right: 0, height: auto (or max 60vh)
- Slides up from bottom instead of in from left
- Semi-transparent backdrop: `bg-black/50` when open
- Clicking backdrop closes drawer
- Swipe-down gesture to close (optional enhancement)

**Very Small Screens (< 320px)**:
- Sidebar becomes a modal overlay (full screen)
- Position: `fixed` inset: 0
- Close button and backdrop for accessibility

### State Management

- Sidebar state: `isOpen: boolean` (default: false)
- Persisted via `sessionStorage` (not localStorage, so state resets on page reload)
- Key: `exerciseTools_sidebarOpen`

**Why sessionStorage instead of localStorage**:
- Users may want fresh start after closing/reopening browser tab
- Prevents annoying persistent UI state across sessions
- Aligns with practice session lifecycle (tools reset between sessions)

### Accessibility

- Toggle button:
  - `aria-label="Toggle tools sidebar"` or `aria-label="Show tools"` / `aria-label="Hide tools"`
  - Keyboard: Tab to focus, Enter/Space to toggle
  - Visual focus indicator (outline or highlight)

- Sidebar itself:
  - `role="complementary"` or `role="navigation"` (depending on purpose)
  - Aria-label: `aria-label="Tools sidebar containing metronome and loop controls"`

- Backdrop (mobile):
  - `aria-hidden="true"` on backdrop (not focusable, click closes)

- Keyboard shortcut:
  - Ctrl+T or Alt+T to toggle (document in help or tooltip)
  - Aria-label on toggle button should mention shortcut: `"Toggle tools sidebar (Ctrl+T)"`

### Performance Considerations

- Use CSS transforms for animation (GPU-accelerated): `transform: translateX(...)`
- Avoid re-rendering sidebar when timeline updates
- Memoize MetronomeControl and LoopControls to prevent unnecessary re-renders
- Consider lazy-loading sidebar content if it's not immediately visible

### Responsive Behavior

| Breakpoint | Layout | Sidebar Position | Width |
|---|---|---|---|
| Desktop (≥ 1024px) | Left sidebar | Fixed left | 320px |
| Tablet (640-1024px) | Left sidebar (narrower) | Fixed left | 280px |
| Mobile (< 640px) | Bottom drawer | Bottom | Full width, max 60vh |
| Very small (< 320px) | Modal | Fullscreen | Full screen |

## Out of Scope

- Draggable/resizable sidebar width
- Docking sidebar to different edges (right, top, etc.)
- Multiple sidebar panels or tabs
- Sidebar animations with spring physics (CSS transitions sufficient)
- Persistent sidebar state across browser sessions (sessionStorage only)
- Sidebar collapsing into mini icons/drawer when narrow
- Customizable sidebar content or reordering of controls

## Definition of Done

1. [ ] Spec reviewed and approved by team
2. [x] ToolsSidebar component created with MetronomeControl (LoopControls pending Spec 11 merge)
3. [x] LoopRepetitionCounter component created (separate, main screen component)
4. [x] Toggle button with hamburger/chevron icon and aria-label
5. [x] Sidebar animates smoothly (slide-in/slide-out 300ms ease-in-out)
6. [x] sessionStorage persistence: sidebar state saved and restored
7. [x] Desktop layout: fixed left sidebar 320px wide
8. [x] Mobile layout: bottom drawer on screens < 640px
9. [x] Very small screens: modal overlay on screens < 320px
10. [x] Backdrop on mobile: semi-transparent, closes on click
11. [x] Keyboard shortcut: Ctrl+T to toggle
12. [x] Main content expands when sidebar is closed (flex-1)
13. [x] Z-index managed: sidebar above timeline, but not blocking interaction
14. [x] **Loop repetition counter displayed on main screen** (NOT in sidebar)
15. [x] Counter shows "Repeat N / M" or "Repeat N / ∞" format
16. [x] Counter visible only when loop is active, hides when loop disabled
17. [x] Counter positioned between PlaybackControls and Timeline area
18. [x] All controls remain fully functional (no feature loss in sidebar move)
19. [x] Accessibility: aria-labels, keyboard navigation, screen reader support
20. [x] Dark/light mode support: sidebar and counter respect theme
21. [ ] Performance: no frame drops during sidebar animation
22. [ ] Responsive testing: verified on desktop, tablet, mobile, very small screens
23. [ ] Unit tests: toggle state, persistence, animation triggers, counter updates
24. [ ] Integration tests: sidebar + metronome sync, sidebar + loop interaction, counter visibility
25. [ ] Accessibility audit: keyboard nav, screen reader, contrast
26. [ ] Manual testing: all major browsers (Chrome, Firefox, Safari)
27. [ ] Visual regression tests: sidebar in open/closed states, counter in active/inactive states
28. [x] All tests passing
29. [ ] PR merged and deployed
