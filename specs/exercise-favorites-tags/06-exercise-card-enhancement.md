# Spec: Exercise Card Enhancement

**Status:** Implemented
**Last updated:** 2026-03-24

---

## Scope

Enhance the existing ExerciseCard component to integrate the FavoriteButton component. FavoriteButton is rendered inline with the exercise title/description, and a TagInput modal is triggered when the user clicks the tag badge.

Depends on Spec 03 (FavoriteButton).

---

## Inputs

Modify existing component:
```ts
interface ExerciseCardProps {
  exercise: Exercise;
  instrumentType: InstrumentType;
  // No new required props
}
```

No new inputs required; component maintains existing interface.

---

## Outputs

Modified `ExerciseCard.tsx` at `packages/ui/src/components/molecules/ExerciseCard/`

Updated layout:
```
┌─────────────────────────────────────────────────┐
│ ♡ Exercise Title              [3 Tags]  →       │  (FavoriteButton + title + tag count)
│ Exercise description text here...              │  (unchanged)
└─────────────────────────────────────────────────┘

With TagInput modal below/near:
┌─────────────────────────────┐
│ Tags for "Exercise Title"    │
├─────────────────────────────┤
│ [rock] [fast]               │
│ + Add Tag: [input]          │
│ [Cancel]                    │
└─────────────────────────────┘
```

---

## Acceptance Criteria

### Layout Integration

- [x] FavoriteButton is positioned at the start of title row (left side)
- [x] Exercise title follows immediately after FavoriteButton
- [x] Tag badge (if present) appears to the right of title
- [x] Right arrow (navigation) remains at far right
- [x] Layout is responsive: flex-based, wraps on mobile if needed
- [x] No change to exercise description rendering
- [x] Card link navigation still works (arrow click or entire card clickable)

### FavoriteButton Integration

- [x] FavoriteButton component (spec 03) imported and rendered
- [x] FavoriteButton receives `exerciseId` prop
- [x] FavoriteButton receives `onTagsClick` callback to open TagInput modal
- [x] FavoriteButton styling matches card aesthetic (colors, sizing)
- [x] Heart icon and tag badge visible and functional

### TagInput Modal

- [x] TagInput modal (spec 04) is rendered with `isOpen` state
- [x] Modal opens when user clicks tag badge (via `onTagsClick` callback)
- [x] Modal closes when user clicks Cancel or presses Escape
- [x] Modal title shows exercise name
- [x] Modal is positioned near FavoriteButton (popover style) or centered (modal style)
- [x] Modal overlay doesn't interfere with card navigation

### State Management

- [x] Add `tagInputOpen: boolean` state (local to ExerciseCard)
- [x] Add handler to open/close modal: `const handleOpenTagInput = () => setTagInputOpen(true)`
- [x] Add handler to close modal: `const handleCloseTagInput = () => setTagInputOpen(false)`
- [x] Pass handlers to FavoriteButton and TagInput
- [x] Modal state isolated per ExerciseCard instance (no global state)

### Backward Compatibility

- [x] Existing ExerciseCardProps interface unchanged (no breaking changes)
- [x] Existing tests still pass (no regression)
- [x] Card link navigation unaffected
- [x] Card styling unchanged (only additions to layout)
- [x] Existing accessibility attributes preserved

### Accessibility

- [x] FavoriteButton is keyboard-accessible (Tab key)
- [x] FavoriteButton has proper `aria-label`
- [x] TagInput modal has proper focus management (focus on input when opened)
- [x] Card link still keyboard-navigable
- [x] No hidden content; `aria-hidden` not used on functional elements

### Styling

- [x] Uses existing TailwindCSS classes from original card
- [x] FavoriteButton sizing matches card text (not oversized or undersized)
- [x] Heart color (filled/unfilled) matches app theme
- [x] Tag badge color matches app theme
- [x] Dark mode works correctly (colors visible in dark theme)
- [x] No visual regression from original card

### Props

- [x] `exercise: Exercise` — Unchanged
- [x] `instrumentType: InstrumentType` — Unchanged
- [x] No new required props
- [x] Component signature remains compatible with existing usage

---

## Edge Cases

1. **No tags on exercise** — FavoriteButton shows heart only; clicking heart doesn't open modal
2. **Heart icon is entire favorite button** — Clicking heart opens modal (alternative interaction pattern)
3. **Card navigation conflict** — Card is still a link (`<a>` element); clicking FavoriteButton shouldn't navigate (use event.stopPropagation())
4. **Multiple cards open modals** — Each card's modal state is independent
5. **Exercise title very long** — FavoriteButton wraps gracefully with title

---

## Notes

- **No changes to exercise data structure** — Exercise type remains unchanged
- **Modal styling separate** — TagInput component (spec 04) handles its own styling
- **Event handling** — Use `event.stopPropagation()` on FavoriteButton if necessary to prevent card link navigation
- **Popover positioning** — If using popover, position calculated relative to FavoriteButton (complex; consider modal instead)
- **Focus management** — TagInput component handles focus on open/close

---

## Definition of Done

- [x] Spec reviewed and accepted
- [x] ExerciseCard component modified at `packages/ui/src/components/molecules/ExerciseCard/`
- [x] FavoriteButton imported and integrated
- [x] TagInput modal state and handlers added
- [x] Component still exports from `packages/ui/src/index.ts`
- [x] Component tests updated (5+ new tests expected):
  - [x] FavoriteButton is rendered
  - [x] Tag badge visible when tags exist
  - [x] Tag badge click opens modal
  - [x] Modal close handler works
  - [x] Card navigation unaffected
  - [x] Dark mode works
  - [x] No regressions in existing card tests
- [x] All tests pass (existing + new)
- [x] No regressions in parent component tests
- [x] Linting passes
- [x] TypeScript compiles without errors
