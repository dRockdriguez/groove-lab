# Spec: Tag Filter Component

**Status:** Draft
**Last updated:** 2026-03-23

---

## Scope

Create a TagFilter component that displays all available tags and allows users to select multiple tags to filter exercises. Implements AND logic (user selects multiple tags; only exercises with ALL selected tags are shown). Integrates with sessionStorage for filter state.

Depends on Spec 02 (tag filter logic).

---

## Inputs

```ts
interface TagFilterProps {
  selectedTags: string[];
  onSelectedTagsChange: (tags: string[]) => void;
  className?: string;
}
```

---

## Outputs

React component: `TagFilter.tsx` at `packages/ui/src/components/molecules/TagFilter/`

Renders:
```
┌──────────────────────────────────────┐
│ Tags (Filter by multiple tags)       │ (header)
├──────────────────────────────────────┤
│ [rock] [fast] [solo] [warm-up]       │ (selectable tags)
│ [groove] [rhythm] [rudiments]        │ (more tags...)
│                                      │
│ [×Clear All]                         │ (clear button, visible if any selected)
│                                      │
│ Selected: "rock" AND "fast"          │ (feedback text, if any selected)
└──────────────────────────────────────┘
```

---

## Acceptance Criteria

### Tag Display

- [ ] Component loads distinct tags via `getDistinctTags()` from storage layer (spec 01)
- [ ] All unique tags are displayed as clickable buttons/pills
- [ ] Tags are sorted alphabetically (case-insensitive)
- [ ] Tags are displayed inline or as flex-wrapped grid
- [ ] If no tags exist in library, shows "No tags available" message
- [ ] Each tag button is clearly labeled with tag name
- [ ] No duplicates shown

### Tag Selection

- [ ] Single click on tag toggles selection (selected ↔ unselected)
- [ ] Selected tags appear visually distinct (e.g., filled, highlighted, accent color)
- [ ] Unselected tags appear muted or gray
- [ ] Multiple tags can be selected simultaneously
- [ ] Selection state is stored in `selectedTags` prop
- [ ] Clicking selected tag deselects it (toggle)
- [ ] Clicking unselected tag selects it (toggle)

### Selection Callback

- [ ] Each tag toggle calls `onSelectedTagsChange(updatedTags: string[])`
- [ ] Callback receives all currently selected tags (not just the one toggled)
- [ ] Callback allows parent to update filter state (sessionStorage)
- [ ] Callback is debounced or immediate (no delay required)

### Clear Button

- [ ] "Clear All" button is visible only if tags are selected
- [ ] Clicking "Clear All" calls `onSelectedTagsChange([])`
- [ ] Button has clear visual style (e.g., red, trash icon)
- [ ] Button has `aria-label` describing action

### User Feedback

- [ ] Selected tags visually distinct from unselected
- [ ] Optionally shows feedback text like "Filtering by: rock AND fast" when tags selected
- [ ] Feedback updates immediately as user selects/deselects tags
- [ ] Clear indication of AND logic (not OR)

### Accessibility

- [ ] Each tag button has `aria-pressed` attribute (true if selected, false otherwise)
- [ ] "Clear All" button has `aria-label` (e.g., "Clear all tag filters")
- [ ] Component container has `role="region"` or `aria-label` describing purpose
- [ ] Tab key navigates through all tag buttons
- [ ] Enter/Space activates tag toggle
- [ ] Keyboard navigation logical (left-to-right, top-to-bottom)

### Styling

- [ ] Uses TailwindCSS classes only
- [ ] Dark mode support (readable in light and dark themes)
- [ ] Selected tag: accent color (e.g., green), filled background, white text
- [ ] Unselected tag: gray, outlined or filled light background
- [ ] Hover state: tag brightens or scales on hover
- [ ] Focus state: outline or ring visible (WCAG)
- [ ] "Clear All" button: secondary or destructive color
- [ ] Responsive: tags wrap on small screens; works on mobile and desktop

### Props

- [ ] `selectedTags: string[]` — Current selected tags (from parent/sessionStorage)
- [ ] `onSelectedTagsChange: (tags: string[]) => void` — Callback for tag selection changes
- [ ] `className?: string` — Optional, appended to root element
- [ ] All props have type annotations

### State & Effects

- [ ] Component derives tag list from storage on mount
- [ ] Component re-renders when `selectedTags` prop changes
- [ ] No local state for tag list; always reads from storage
- [ ] Calls `getDistinctTags()` to get available tags
- [ ] Updates `selectedTags` via callback (parent manages state)

### Performance

- [ ] Tag list retrieved once on mount (or when storage updates externally)
- [ ] No unnecessary re-renders when user toggles tags
- [ ] No memory leaks on unmount

---

## Edge Cases

1. **No tags in library** — Shows "No tags available"; no tag buttons rendered
2. **Many tags** — All tags visible and selectable; scrollable area or flex-wrap
3. **Very long tag names** — Displayed without truncation; wraps on small screens
4. **All tags selected** — "Clear All" visible; feedback shows all tags with AND
5. **Tags created/deleted externally** — Component should refresh (automatic or manual; next iteration)
6. **Same tag selected twice** — Not possible (user can only toggle once)

---

## Notes

- **Storage integration** — Calls `getDistinctTags()` from spec 01
- **Filter logic separate** — This component displays tags; spec 02 implements actual filtering logic
- **Parent-driven state** — Parent (ExerciseBrowser) manages `selectedTags` state and sessionStorage persistence
- **AND logic** — Component displays selected tags as AND combination; filtering logic in spec 02
- **No search field** — This spec doesn't include tag search; could be future enhancement
- **Case-sensitivity** — Tag matching is case-sensitive (exact strings)

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [ ] Component created at `packages/ui/src/components/molecules/TagFilter/`
- [ ] Component exported via `packages/ui/src/index.ts`
- [ ] All props documented in JSDoc
- [ ] Component tests written (18+ tests expected):
  - [ ] Display all available tags
  - [ ] Toggle tag selection
  - [ ] Multiple tag selection
  - [ ] Clear all button visibility
  - [ ] Clear all functionality
  - [ ] Callback called with correct data
  - [ ] Accessibility attributes (`aria-pressed`)
  - [ ] Keyboard interaction (Tab, Enter/Space)
  - [ ] Dark mode rendering
  - [ ] Edge cases (no tags, many tags, very long names)
  - [ ] Alphabetical sorting
- [ ] All tests pass
- [ ] No regressions in existing UI tests
- [ ] Linting passes
- [ ] Storybook story created (optional but recommended)
