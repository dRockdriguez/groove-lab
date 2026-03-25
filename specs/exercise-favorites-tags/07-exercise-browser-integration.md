# Spec: Exercise Browser Integration

**Status:** Implemented
**Last updated:** 2026-03-25

---

## Scope

Integrate all favorites & tags features into the ExerciseBrowser organism component. Add state management for favorites filter toggle and tag filter selection. Wire up filtering logic. Update exercise list to show only matching exercises. Manage sessionStorage for filter state.

Depends on Specs 02, 03, 04, 05, 06 (all previous specs).

---

## Inputs

Existing component props (no changes):
```ts
interface ExerciseBrowserProps {
  exercisesByInstrument: InstrumentExercises[];
}
```

---

## Outputs

Modified `ExerciseBrowser.tsx` at `packages/ui/src/components/organisms/ExerciseBrowser/`

New UI sections:
```
┌──────────────────────────────────────────────────────┐
│ [Drums] [Bass] [Guitar]                              │  (instrument tabs)
├──────────────────────────────────────────────────────┤
│ [♥ Favorites Only]  [Clear Filters]                 │  (new: favorites toggle + clear)
├──────────────────────────────────────────────────────┤
│ Filter by Tags:                                      │  (new: tag filter)
│ [rock] [fast] [solo] [warm-up] [×Clear All]         │
├──────────────────────────────────────────────────────┤
│ Showing X exercises (filtered results summary)      │  (optional feedback)
├──────────────────────────────────────────────────────┤
│ Section 1                                            │  (existing: sections)
│ ├─ Exercise 1                                        │
│ └─ Exercise 2                                        │
│                                                      │
│ Section 2                                            │
│ ├─ Exercise 3                                        │
│ └─ Exercise 4                                        │
└──────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### New State

- [x] Add `showFavoritesOnly: boolean` state (default: false)
- [x] Add `selectedFilterTags: string[]` state (from sessionStorage key `'groovelab_filter_tags'`)
- [x] Initialize `selectedFilterTags` from sessionStorage on mount
- [x] Persist `selectedFilterTags` to sessionStorage on every change
- [x] Clear `selectedFilterTags` when component unmounts (optional, or on manual "Clear All")

### Favorites Toggle Button

- [x] New button/toggle: "♥ Favorites Only" (heart icon + text)
- [x] Clicking toggles `showFavoritesOnly` state (true ↔ false)
- [x] Button visual state changes based on toggle (filled/unfilled, color change)
- [x] Button has accessible label (e.g., "Show favorites only")
- [x] Button has `aria-pressed` attribute reflecting state

### Clear Filters Button

- [x] "Clear All" or "Reset Filters" button visible if any filter active
  - At least one tag selected, OR
  - Favorites toggle is ON
- [x] Clicking clears all filters:
  - Sets `showFavoritesOnly = false`
  - Sets `selectedFilterTags = []`
  - Updates sessionStorage
- [x] Button has clear visual style (e.g., secondary color)
- [x] Button is hidden when no filters active

### Tag Filter Integration

- [x] TagFilter component (spec 05) imported and rendered
- [x] TagFilter receives `selectedTags={selectedFilterTags}`
- [x] TagFilter receives `onSelectedTagsChange={(tags) => setSelectedFilterTags(tags)}`
- [x] TagFilter callback updates sessionStorage immediately
- [x] TagFilter displays all available tags (distinct, sorted)
- [x] User can select/deselect multiple tags

### Exercise Filtering

- [x] Call `filterExercises()` from spec 02 with:
  - Current `exercisesByInstrument`
  - Current `selectedInstrument`
  - Current `showFavoritesOnly`
  - Current `selectedFilterTags`
- [x] Display filtered results (sections + exercises)
- [x] Empty sections included in structure (exercises list may be empty)
- [x] If all exercises filtered out, shows appropriate message (e.g., "No exercises match selected filters")
- [x] Filtering happens in real-time (no loading states)

### Filter Results Feedback

- [x] Optional: Show count of matching exercises (e.g., "Showing 5 exercises")
- [x] Optional: Show active filter summary (e.g., "Favorites + rock + fast")
- [x] Feedback updates immediately as filters change
- [x] Feedback is helpful but not required (nice-to-have)

### Section Expansion State

- [x] Existing section expand/collapse toggle preserved
- [x] Expand state independent of filters (filters don't auto-expand/collapse sections)
- [x] User can expand/collapse sections while filters active
- [x] Expanded sections state persists across filter changes (within session)

### Backward Compatibility

- [x] Existing ExerciseBrowserProps interface unchanged
- [x] Existing component behavior unchanged (all filters default to "show all")
- [x] Instrument selector works as before
- [x] Section expand/collapse works as before
- [x] Link navigation to exercise playback unaffected
- [x] Existing tests still pass (no regression)

### Accessibility

- [x] Filter section has clear heading or `aria-label`
- [x] Favorites toggle has `aria-pressed`
- [x] "Clear All" button has clear `aria-label`
- [x] TagFilter component provides accessibility (spec 05)
- [x] Keyboard navigation works throughout
- [x] No hidden content unless visually hidden (dark color, off-screen)

### Styling

- [x] Filters section uses TailwindCSS classes only
- [x] Favorites toggle button matches app theme
- [x] "Clear All" button matches app theme
- [x] Filter UI responsive (wraps on mobile)
- [x] Dark mode supported
- [x] No visual regression from existing browser

### SessionStorage Management

- [x] On component mount: read `groovelab_filter_tags` from sessionStorage
- [x] On filter change: write updated tags to sessionStorage immediately
- [x] On component unmount or manually: clear sessionStorage key (optional)
- [x] If sessionStorage unavailable (private browsing): gracefully degrade to in-memory state
- [x] SessionStorage key: `'groovelab_filter_tags'`

### Mobile Responsiveness

- [x] Filters section responsive (stacks on small screens)
- [x] Tag filter buttons wrap naturally
- [x] Favorites toggle stays accessible on mobile
- [x] "Clear All" button prominent and clickable

---

## Edge Cases

1. **No exercises match filters** — Shows "No exercises match your filters" message
2. **All exercises in all sections filtered out** — All sections shown with empty exercise lists
3. **User selects tags, then switches instrument** — Tags persist; only exercises for new instrument shown with tags applied
4. **Favorites toggle ON, no exercises favorited** — Shows empty list with "No favorites" message
5. **Multiple tags selected (AND logic)** — Only exercises with ALL tags shown
6. **Tags created after filters applied** — New tags appear in TagFilter; exercises dynamically re-filtered

---

## Notes

- **Filter logic separate** — `filterExercises()` is pure function from spec 02
- **No backend API** — All data from localStorage/sessionStorage only
- **Real-time filtering** — No debouncing or async operations
- **Single instance** — ExerciseBrowser component assumes single mount per page
- **SessionStorage scope** — Filter state per-tab, not per-browser
- **Instrument filtering orthogonal** — Selected instrument is independent filter (existing feature)

---

## Definition of Done

- [x] Spec reviewed and accepted
- [x] ExerciseBrowser component modified at `packages/ui/src/components/organisms/ExerciseBrowser/`
- [x] New state added: `showFavoritesOnly`, `selectedFilterTags`
- [x] Favorites toggle button implemented
- [x] "Clear All" button implemented
- [x] TagFilter component imported and integrated
- [x] `filterExercises()` function called with current filter state
- [x] Exercise list displays filtered results
- [x] SessionStorage integration working (persist/restore filter tags)
- [x] Component still exports from `packages/ui/src/index.ts`
- [x] Component tests updated/added (12+ new tests expected):
  - [x] Favorites toggle works
  - [x] "Clear All" works
  - [x] Tag filter updates
  - [x] Combined filters work (favorites + tags)
  - [x] Empty results message shows
  - [x] SessionStorage read/write
  - [x] Mobile responsive
  - [x] Keyboard navigation
  - [x] Dark mode works
  - [x] Instrument switching with filters active
  - [x] No regressions in existing browser tests
- [x] All tests pass (existing + new)
- [x] No regressions in parent/sibling component tests
- [x] Linting passes (fixed 2 unused variable warnings)
- [x] TypeScript compiles without errors
