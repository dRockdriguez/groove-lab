# Spec: Tag Input Component

**Status:** Draft
**Last updated:** 2026-03-23

---

## Scope

Create a TagInput component for adding and removing tags to an exercise. Renders as a modal/popover near the FavoriteButton. Manages tag creation (user can type custom tags) and removal. Integrates with storage layer.

Depends on Spec 01 (storage layer).

---

## Inputs

```ts
interface TagInputProps {
  exerciseId: string;
  isOpen: boolean;
  onClose: () => void;  // Parent calls this to close modal
  className?: string;
}
```

---

## Outputs

React component: `TagInput.tsx` at `packages/ui/src/components/molecules/TagInput/`

Renders:
```
┌─────────────────────────────────┐
│ Tags for "Exercise Title"       │ (header)
├─────────────────────────────────┤
│ Existing Tags: [rock] [fast]    │ (clickable removable)
│                                 │
│ Add Tag:                        │
│ [________________] [Add]        │ (input + button)
│                                 │
│ [Cancel]                        │ (footer button)
└─────────────────────────────────┘
```

---

## Acceptance Criteria

### Modal/Popover Behavior

- [ ] Component opens when `isOpen === true`
- [ ] Component is hidden when `isOpen === false`
- [ ] Clicking "Cancel" or clicking outside calls `onClose()`
- [ ] Pressing Escape key calls `onClose()`
- [ ] Modal/popover has backdrop (semi-transparent overlay) on mobile or full modal on desktop
- [ ] Modal/popover is positioned near FavoriteButton (popover) or centered (modal)
- [ ] Focus management: focus moves to input on open, returns to trigger on close

### Displaying Existing Tags

- [ ] Component loads existing tags for exercise via `getExerciseTags(exerciseId)`
- [ ] Each tag displays as a removable chip/pill (with X button or click-to-remove)
- [ ] Tags are sorted alphabetically (case-insensitive)
- [ ] Tags are displayed inline or as flex-wrapped list
- [ ] If no tags, shows "No tags yet" or similar message

### Adding Tags

- [ ] Text input field for typing new tag name
- [ ] User types tag name (any characters, including spaces)
- [ ] User clicks "Add" button or presses Enter to add tag
- [ ] Input text is trimmed (whitespace removed)
- [ ] Empty strings rejected (no-op on add if input blank)
- [ ] Duplicate tags rejected (user can't add same tag twice; idempotent)
- [ ] On successful add, input field clears
- [ ] New tag appears in list immediately (sorted alphabetically)
- [ ] Storage is updated immediately (`addTag()` called)

### Removing Tags

- [ ] Each tag has removable button (X, trash icon, or click-anywhere)
- [ ] Clicking remove button deletes tag from exercise
- [ ] Tag disappears from list immediately
- [ ] Storage is updated immediately (`removeTag()` called)
- [ ] If multiple removes in sequence, each updates correctly

### Input Validation

- [ ] Whitespace-only tags rejected (e.g., "   " becomes "" and is rejected)
- [ ] Special characters allowed in tags (no validation at component level)
- [ ] Case-sensitive tags (`'Rock'` and `'rock'` are different)
- [ ] No tag length limit enforced (user can type long tags)
- [ ] No tag count limit enforced (user can add many tags)

### Accessibility

- [ ] Modal/popover has `role="dialog"` or `role="alertdialog"`
- [ ] Modal has `aria-labelledby` pointing to title element
- [ ] Input field has `aria-label` (e.g., "New tag input")
- [ ] Close button has `aria-label` (e.g., "Close tag editor")
- [ ] Tag chips have `aria-label` (e.g., "Remove tag 'rock'")
- [ ] Tab key navigates through input, buttons, and tag removers
- [ ] Tab order logical: input → Add button → existing tags → Cancel button
- [ ] All interactive elements keyboard-accessible

### Styling

- [ ] Uses TailwindCSS classes only
- [ ] Dark mode support (readable in light and dark themes)
- [ ] Tag chips: subtle background, text color, remove button
- [ ] Input field: focused state with outline/ring
- [ ] "Add" button: accent color, hover state
- [ ] "Cancel" button: secondary color, hover state
- [ ] Modal/popover backdrop: semi-transparent dark color
- [ ] Responsive: works on mobile (full-width modal) and desktop (popover)

### Props

- [ ] `exerciseId: string` — Required, identifies exercise in storage
- [ ] `isOpen: boolean` — Required, controls visibility
- [ ] `onClose: () => void` — Required callback to close
- [ ] `className?: string` — Optional, appended to root element
- [ ] All props have type annotations

### State & Side Effects

- [ ] Component derives tag list from storage on open
- [ ] No local state for tags; always reads from storage
- [ ] Calls `getExerciseTags()` on open to get current tags
- [ ] Calls `addTag()` or `removeTag()` immediately when user acts
- [ ] No async operations (all storage is sync)

### Error Handling

- [ ] No exceptions thrown if exercise doesn't exist
- [ ] No exceptions thrown if storage unavailable
- [ ] Graceful degradation if localStorage fails

---

## Edge Cases

1. **No existing tags** — Shows empty state message; input ready for new tag
2. **Many existing tags** — Scrollable list or flex-wrapped; all visible
3. **Adding same tag after removing** — Works correctly (idempotent)
4. **Rapid clicks on remove** — Each remove updates correctly; no race conditions
5. **Multiple modals open** — Only affects this exercise's tags
6. **Modal open while tags updated elsewhere** — Click Add or Remove to refresh display (next spec iteration: auto-refresh with polling or external event listener)

---

## Notes

- **Popover positioning** — If implemented as popover (not modal), position near FavoriteButton; parent component responsible for positioning
- **No tag autocomplete** — User types freely; no suggestions (could be future enhancement)
- **No tag descriptions** — Tags are simple strings; no metadata
- **No tag deletion/deprecation** — Tags removed only from individual exercises, not globally
- **Storage integration** — Calls `getExerciseTags()`, `addTag()`, `removeTag()` from spec 01
- **Parent-driven lifecycle** — Parent (ExerciseCard or ExerciseBrowser) controls open/close state

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [ ] Component created at `packages/ui/src/components/molecules/TagInput/`
- [ ] Component exported via `packages/ui/src/index.ts`
- [ ] All props documented in JSDoc
- [ ] Component tests written (20+ tests expected):
  - [ ] Open/close behavior
  - [ ] Display existing tags
  - [ ] Add new tag
  - [ ] Remove tag
  - [ ] Input validation (empty, whitespace)
  - [ ] Duplicate tag rejection
  - [ ] Accessibility attributes
  - [ ] Keyboard interaction (Enter, Escape, Tab)
  - [ ] Dark mode rendering
  - [ ] Edge cases (no tags, many tags)
- [ ] All tests pass
- [ ] No regressions in existing UI tests
- [ ] Linting passes
- [ ] Storybook story created (optional but recommended)
