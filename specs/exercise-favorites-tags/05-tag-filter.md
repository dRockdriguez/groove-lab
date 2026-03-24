# Spec: Tag Filter Component

**Status:** Implemented
**Last updated:** 2026-03-24

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

- [x] Component loads distinct tags via `getDistinctTags()` from storage layer (spec 01)
- [x] All unique tags are displayed as clickable buttons/pills
- [x] Tags are sorted alphabetically (case-insensitive)
- [x] Tags are displayed inline or as flex-wrapped grid
- [x] If no tags exist in library, shows "No tags available" message
- [x] Each tag button is clearly labeled with tag name
- [x] No duplicates shown

### Tag Selection

- [x] Single click on tag toggles selection (selected ↔ unselected)
- [x] Selected tags appear visually distinct (e.g., filled, highlighted, accent color)
- [x] Unselected tags appear muted or gray
- [x] Multiple tags can be selected simultaneously
- [x] Selection state is stored in `selectedTags` prop
- [x] Clicking selected tag deselects it (toggle)
- [x] Clicking unselected tag selects it (toggle)

### Selection Callback

- [x] Each tag toggle calls `onSelectedTagsChange(updatedTags: string[])`
- [x] Callback receives all currently selected tags (not just the one toggled)
- [x] Callback allows parent to update filter state (sessionStorage)
- [x] Callback is debounced or immediate (no delay required)

### Clear Button

- [x] "Clear All" button is visible only if tags are selected
- [x] Clicking "Clear All" calls `onSelectedTagsChange([])`
- [x] Button has clear visual style (e.g., red, trash icon)
- [x] Button has `aria-label` describing action

### User Feedback

- [x] Selected tags visually distinct from unselected
- [x] Optionally shows feedback text like "Filtering by: rock AND fast" when tags selected
- [x] Feedback updates immediately as user selects/deselects tags
- [x] Clear indication of AND logic (not OR)

### Accessibility

- [x] Each tag button has `aria-pressed` attribute (true if selected, false otherwise)
- [x] "Clear All" button has `aria-label` (e.g., "Clear all tag filters")
- [x] Component container has `role="region"` or `aria-label` describing purpose
- [x] Tab key navigates through all tag buttons
- [x] Enter/Space activates tag toggle
- [x] Keyboard navigation logical (left-to-right, top-to-bottom)

### Styling

- [x] Uses TailwindCSS classes only
- [x] Dark mode support (readable in light and dark themes)
- [x] Selected tag: accent color (e.g., green), filled background, white text
- [x] Unselected tag: gray, outlined or filled light background
- [x] Hover state: tag brightens or scales on hover
- [x] Focus state: outline or ring visible (WCAG)
- [x] "Clear All" button: secondary or destructive color
- [x] Responsive: tags wrap on small screens; works on mobile and desktop

### Props

- [x] `selectedTags: string[]` — Current selected tags (from parent/sessionStorage)
- [x] `onSelectedTagsChange: (tags: string[]) => void` — Callback for tag selection changes
- [x] `className?: string` — Optional, appended to root element
- [x] All props have type annotations

### State & Effects

- [x] Component derives tag list from storage on mount
- [x] Component re-renders when `selectedTags` prop changes
- [x] No local state for tag list; always reads from storage
- [x] Calls `getDistinctTags()` to get available tags
- [x] Updates `selectedTags` via callback (parent manages state)

### Performance

- [x] Tag list retrieved once on mount (or when storage updates externally)
- [x] No unnecessary re-renders when user toggles tags
- [x] No memory leaks on unmount

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

- [x] Spec reviewed and accepted
- [x] Component created at `packages/ui/src/components/molecules/TagFilter/`
- [x] Component exported via `packages/ui/src/index.ts`
- [x] All props documented in JSDoc
- [x] Component tests written (18+ tests expected):
  - [x] Display all available tags
  - [x] Toggle tag selection
  - [x] Multiple tag selection
  - [x] Clear all button visibility
  - [x] Clear all functionality
  - [x] Callback called with correct data
  - [x] Accessibility attributes (`aria-pressed`)
  - [x] Keyboard interaction (Tab, Enter/Space)
  - [x] Dark mode rendering
  - [x] Edge cases (no tags, many tags, very long names)
  - [x] Alphabetical sorting
- [x] All tests pass
- [x] No regressions in existing UI tests
- [x] Linting passes
- [ ] Storybook story created (optional but recommended)
