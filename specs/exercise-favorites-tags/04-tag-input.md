# Spec: Tag Input Component

**Status:** Implemented
**Last updated:** 2026-03-24

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

- [x] Component opens when `isOpen === true`
- [x] Component is hidden when `isOpen === false`
- [x] Clicking "Cancel" or clicking outside calls `onClose()`
- [x] Pressing Escape key calls `onClose()`
- [x] Modal/popover has backdrop (semi-transparent overlay) on mobile or full modal on desktop
- [x] Modal/popover is positioned near FavoriteButton (popover) or centered (modal)
- [x] Focus management: focus moves to input on open, returns to trigger on close

### Displaying Existing Tags

- [x] Component loads existing tags for exercise via `getExerciseTags(exerciseId)`
- [x] Each tag displays as a removable chip/pill (with X button or click-to-remove)
- [x] Tags are sorted alphabetically (case-insensitive)
- [x] Tags are displayed inline or as flex-wrapped list
- [x] If no tags, shows "No tags yet" or similar message

### Adding Tags

- [x] Text input field for typing new tag name
- [x] User types tag name (any characters, including spaces)
- [x] User clicks "Add" button or presses Enter to add tag
- [x] Input text is trimmed (whitespace removed)
- [x] Empty strings rejected (no-op on add if input blank)
- [x] Duplicate tags rejected (user can't add same tag twice; idempotent)
- [x] On successful add, input field clears
- [x] New tag appears in list immediately (sorted alphabetically)
- [x] Storage is updated immediately (`addTag()` called)

### Removing Tags

- [x] Each tag has removable button (X, trash icon, or click-anywhere)
- [x] Clicking remove button deletes tag from exercise
- [x] Tag disappears from list immediately
- [x] Storage is updated immediately (`removeTag()` called)
- [x] If multiple removes in sequence, each updates correctly

### Input Validation

- [x] Whitespace-only tags rejected (e.g., "   " becomes "" and is rejected)
- [x] Special characters allowed in tags (no validation at component level)
- [x] Case-sensitive tags (`'Rock'` and `'rock'` are different)
- [x] No tag length limit enforced (user can type long tags)
- [x] No tag count limit enforced (user can add many tags)

### Accessibility

- [x] Modal/popover has `role="dialog"` or `role="alertdialog"`
- [x] Modal has `aria-labelledby` pointing to title element
- [x] Input field has `aria-label` (e.g., "New tag input")
- [x] Close button has `aria-label` (e.g., "Close tag editor")
- [x] Tag chips have `aria-label` (e.g., "Remove tag 'rock'")
- [x] Tab key navigates through input, buttons, and tag removers
- [x] Tab order logical: input → Add button → existing tags → Cancel button
- [x] All interactive elements keyboard-accessible

### Styling

- [x] Uses TailwindCSS classes only
- [x] Dark mode support (readable in light and dark themes)
- [x] Tag chips: subtle background, text color, remove button
- [x] Input field: focused state with outline/ring
- [x] "Add" button: accent color, hover state
- [x] "Cancel" button: secondary color, hover state
- [x] Modal/popover backdrop: semi-transparent dark color
- [x] Responsive: works on mobile (full-width modal) and desktop (popover)

### Props

- [x] `exerciseId: string` — Required, identifies exercise in storage
- [x] `isOpen: boolean` — Required, controls visibility
- [x] `onClose: () => void` — Required callback to close
- [x] `className?: string` — Optional, appended to root element
- [x] All props have type annotations

### State & Side Effects

- [x] Component derives tag list from storage on open
- [x] No local state for tags; always reads from storage
- [x] Calls `getExerciseTags()` on open to get current tags
- [x] Calls `addTag()` or `removeTag()` immediately when user acts
- [x] No async operations (all storage is sync)

### Error Handling

- [x] No exceptions thrown if exercise doesn't exist
- [x] No exceptions thrown if storage unavailable
- [x] Graceful degradation if localStorage fails

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

- [x] Spec reviewed and accepted
- [x] Component created at `packages/ui/src/components/molecules/TagInput/`
- [x] Component exported via `packages/ui/src/index.ts`
- [x] All props documented in JSDoc
- [x] Component tests written (20+ tests expected):
  - [x] Open/close behavior
  - [x] Display existing tags
  - [x] Add new tag
  - [x] Remove tag
  - [x] Input validation (empty, whitespace)
  - [x] Duplicate tag rejection
  - [x] Accessibility attributes
  - [x] Keyboard interaction (Enter, Escape, Tab)
  - [x] Dark mode rendering
  - [x] Edge cases (no tags, many tags)
- [x] All tests pass
- [x] No regressions in existing UI tests
- [x] Linting passes
- [x] Storybook story created (optional but recommended)
