# Spec: Hit Counter Display

**Status:** Implemented
**Last updated:** 2026-03-23

## Scope

Render a real-time hit counter component that displays the current breakdown of drum hit validation results as 4 colored boxes. The counter updates instantly after each MIDI hit is detected and validated. This component is placed directly below the `PlaybackControls` molecule on the exercise playback page.

## Inputs

Component receives these props:

```typescript
interface HitCounterProps {
  scoringEvents: ScoringEvent[];
  isPlaying: boolean;
  className?: string;
}
```

Where `ScoringEvent` (from @groovelab/utils):
```typescript
interface ScoringEvent {
  note: number;               // MIDI note number
  detectedMs: number;         // When user hit it
  expectedTimeMs: number;     // When it was scheduled
  classification: 'correct' | 'early' | 'late' | 'missed' | 'wrong_note';
  offset: number;             // ms offset (negative=early, positive=late)
  timestamp: number;          // Event timestamp
}
```

## Outputs

- 4 colored count boxes displayed horizontally: Hits, Early, Late, Violations
- Real-time numeric counts that update immediately after each MIDI input
- Disabled/muted appearance when `isPlaying === false`
- Proper layout and spacing using Tailwind

## Acceptance Criteria

### Component structure
- [x] Component name: `HitCounter` located at `packages/ui/src/components/molecules/HitCounter/`
- [x] File structure: `HitCounter.tsx`, `index.ts`, `HitCounter.test.tsx`
- [x] Exported from `packages/ui/src/index.ts`

### Visual layout
- [x] 4 boxes arranged horizontally (flex row), evenly spaced
- [x] Each box contains a colored dot/square and a count number
- [x] Box styling:
  - Width: 80–100px each (responsive)
  - Padding: 8px
  - Border radius: 6px
  - Background: light gray (`bg-gray-100`) when playing, lighter (`bg-gray-50`) when stopped
  - Font: bold numeric count (text-lg)
  - Label text below count (text-sm, text-gray-600)
- [x] Responsive: stacks vertically on mobile (<640px), horizontally on desktop

### Color scheme
- [x] **Hits**: Green dot/square (`#22C55E`) + count label "Hits"
- [x] **Early**: Purple dot/square (`#A855F7`) + count label "Early"
- [x] **Late**: Orange dot/square (`#FB923C`) + count label "Late"
- [x] **Violations**: Red dot/square (`#EF4444`) + count label "Violations"
- [x] Colored dot dimensions: 12×12px, border-radius: 50% (circle)

### Count calculation
- [x] Count "Hits": `scoringEvents.filter(e => e.classification === 'correct').length`
- [x] Count "Early": `scoringEvents.filter(e => e.classification === 'early').length`
- [x] Count "Late": `scoringEvents.filter(e => e.classification === 'late').length`
- [x] Count "Violations": `scoringEvents.filter(e => e.classification === 'wrong_note').length`
- [x] "Missed" classification is **not** displayed (not part of the 4 boxes)

### Real-time updates
- [x] Counts update instantly when `validatedHits` prop changes
- [x] No debouncing or delay between MIDI input and UI update
- [x] Memoized count calculation using `useMemo` for performance

### Disabled state
- [x] When `isPlaying === false`: opacity reduced to 0.6, cursor not-allowed on hover
- [x] When `isPlaying === true`: opacity 1.0, normal appearance
- [x] Disabled state is visual only (no interaction expected, not a button)

### Accessibility
- [x] `role="status"` on root container (announce count updates)
- [x] `aria-live="polite"` (announce changes without interrupting)
- [x] `aria-label` on component: "Hit counter: X hits, Y early, Z late, W violations"
- [x] No interactive elements (not buttons, not clickable)

### Edge cases
- [x] Empty `scoringEvents` array: all counts show 0
- [x] `scoringEvents` undefined: treat as empty array (all counts 0)
- [x] Single event in array: count is 1, others are 0
- [x] Multiple events of same classification: correct cumulative count
- [x] Unknown/unexpected classification in scoringEvents: silently ignore (filter doesn't match)

## Notes

### Integration point
- Placed in `ExercisePlaybackPage` directly below `PlaybackControls` in the flex layout
- Receives `scoringEvents` state from `ExercisePlaybackPage` (populated from drum hit detection MIDI handler)
- Receives `isPlaying` boolean from playback state
- No callbacks or event handlers needed (read-only display)

### Implementation hints
```typescript
// useCallback or useMemo for count calculations
const hitCount = useMemo(
  () => scoringEvents.filter(e => e.classification === 'correct').length,
  [scoringEvents]
);
// Same for early, late, wrong_note counts

// Color mapping
const colorMap = {
  hits: '#22C55E',
  early: '#A855F7',
  late: '#FB923C',
  violations: '#EF4444',
};

// Conditional styling based on isPlaying
const boxClass = isPlaying ? 'bg-gray-100 opacity-100' : 'bg-gray-50 opacity-60';
```

### Relationship to other specs
- **Spec 01** (note-color-feedback): Uses same `validatedHits` data
- **DrumHitFeedback**: Shows accuracy % and averages; HitCounter shows raw counts
- **Spec 04** (integration-test): Tests HitCounter + all other specs together
- No conflicts or overlaps with specs 01–04

### No state management
- This component is **stateless** and **read-only**
- All state lives in `ExercisePlaybackPage`
- Component is pure presentation layer

### Test file structure (HitCounter.test.tsx)
- Rendering tests: mount with various event counts
- Count calculation tests: verify filter logic for each classification (correct, early, late, wrong_note, missed)
- Disabled state tests: opacity/styling changes with isPlaying
- Accessibility tests: role, aria-live, aria-label
- Edge case tests: empty array, undefined, single event, mixed classifications
- No snapshot tests (brittle; use visual assertion instead)

## Definition of Done

- [x] Component implemented at `packages/ui/src/components/molecules/HitCounter/`
- [x] Props interface (`HitCounterProps`) defined in component file
- [x] Count calculations memoized with `useMemo`
- [x] Color scheme applied to dots/squares (not backgrounds)
- [x] Responsive layout: row on desktop, column on mobile (if needed)
- [x] Accessibility attributes: `role="status"`, `aria-live="polite"`, `aria-label`
- [x] Tests written (`HitCounter.test.tsx`): 45 tests covering all acceptance criteria
- [x] Integration in `ExercisePlaybackPage`: placed below `PlaybackControls`
- [x] Exported from `packages/ui/src/index.ts`
- [x] All tests passing (45 HitCounter tests + 1022 total tests, no regressions)
- [x] Spec metadata updated: `Status: Implemented`, `Last updated: 2026-03-23`
