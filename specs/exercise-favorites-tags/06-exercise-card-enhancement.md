# Spec: Exercise Card Enhancement

**Status:** Draft
**Last updated:** 2026-03-23

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

- [ ] FavoriteButton is positioned at the start of title row (left side)
- [ ] Exercise title follows immediately after FavoriteButton
- [ ] Tag badge (if present) appears to the right of title
- [ ] Right arrow (navigation) remains at far right
- [ ] Layout is responsive: flex-based, wraps on mobile if needed
- [ ] No change to exercise description rendering
- [ ] Card link navigation still works (arrow click or entire card clickable)

### FavoriteButton Integration

- [ ] FavoriteButton component (spec 03) imported and rendered
- [ ] FavoriteButton receives `exerciseId` prop
- [ ] FavoriteButton receives `onTagsClick` callback to open TagInput modal
- [ ] FavoriteButton styling matches card aesthetic (colors, sizing)
- [ ] Heart icon and tag badge visible and functional

### TagInput Modal

- [ ] TagInput modal (spec 04) is rendered with `isOpen` state
- [ ] Modal opens when user clicks tag badge (via `onTagsClick` callback)
- [ ] Modal closes when user clicks Cancel or presses Escape
- [ ] Modal title shows exercise name
- [ ] Modal is positioned near FavoriteButton (popover style) or centered (modal style)
- [ ] Modal overlay doesn't interfere with card navigation

### State Management

- [ ] Add `tagInputOpen: boolean` state (local to ExerciseCard)
- [ ] Add handler to open/close modal: `const handleOpenTagInput = () => setTagInputOpen(true)`
- [ ] Add handler to close modal: `const handleCloseTagInput = () => setTagInputOpen(false)`
- [ ] Pass handlers to FavoriteButton and TagInput
- [ ] Modal state isolated per ExerciseCard instance (no global state)

### Backward Compatibility

- [ ] Existing ExerciseCardProps interface unchanged (no breaking changes)
- [ ] Existing tests still pass (no regression)
- [ ] Card link navigation unaffected
- [ ] Card styling unchanged (only additions to layout)
- [ ] Existing accessibility attributes preserved

### Accessibility

- [ ] FavoriteButton is keyboard-accessible (Tab key)
- [ ] FavoriteButton has proper `aria-label`
- [ ] TagInput modal has proper focus management (focus on input when opened)
- [ ] Card link still keyboard-navigable
- [ ] No hidden content; `aria-hidden` not used on functional elements

### Styling

- [ ] Uses existing TailwindCSS classes from original card
- [ ] FavoriteButton sizing matches card text (not oversized or undersized)
- [ ] Heart color (filled/unfilled) matches app theme
- [ ] Tag badge color matches app theme
- [ ] Dark mode works correctly (colors visible in dark theme)
- [ ] No visual regression from original card

### Props

- [ ] `exercise: Exercise` — Unchanged
- [ ] `instrumentType: InstrumentType` — Unchanged
- [ ] No new required props
- [ ] Component signature remains compatible with existing usage

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

- [ ] Spec reviewed and accepted
- [ ] ExerciseCard component modified at `packages/ui/src/components/molecules/ExerciseCard/`
- [ ] FavoriteButton imported and integrated
- [ ] TagInput modal state and handlers added
- [ ] Component still exports from `packages/ui/src/index.ts`
- [ ] Component tests updated (5+ new tests expected):
  - [ ] FavoriteButton is rendered
  - [ ] Tag badge visible when tags exist
  - [ ] Tag badge click opens modal
  - [ ] Modal close handler works
  - [ ] Card navigation unaffected
  - [ ] Dark mode works
  - [ ] No regressions in existing card tests
- [ ] All tests pass (existing + new)
- [ ] No regressions in parent component tests
- [ ] Linting passes
- [ ] TypeScript compiles without errors
