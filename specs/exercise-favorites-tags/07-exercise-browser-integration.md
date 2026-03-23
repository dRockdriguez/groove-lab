# Spec: Exercise Browser Integration

**Status:** Draft
**Last updated:** 2026-03-23

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

- [ ] Add `showFavoritesOnly: boolean` state (default: false)
- [ ] Add `selectedFilterTags: string[]` state (from sessionStorage key `'groovelab_filter_tags'`)
- [ ] Initialize `selectedFilterTags` from sessionStorage on mount
- [ ] Persist `selectedFilterTags` to sessionStorage on every change
- [ ] Clear `selectedFilterTags` when component unmounts (optional, or on manual "Clear All")

### Favorites Toggle Button

- [ ] New button/toggle: "♥ Favorites Only" (heart icon + text)
- [ ] Clicking toggles `showFavoritesOnly` state (true ↔ false)
- [ ] Button visual state changes based on toggle (filled/unfilled, color change)
- [ ] Button has accessible label (e.g., "Show favorites only")
- [ ] Button has `aria-pressed` attribute reflecting state

### Clear Filters Button

- [ ] "Clear All" or "Reset Filters" button visible if any filter active
  - At least one tag selected, OR
  - Favorites toggle is ON
- [ ] Clicking clears all filters:
  - Sets `showFavoritesOnly = false`
  - Sets `selectedFilterTags = []`
  - Updates sessionStorage
- [ ] Button has clear visual style (e.g., secondary color)
- [ ] Button is hidden when no filters active

### Tag Filter Integration

- [ ] TagFilter component (spec 05) imported and rendered
- [ ] TagFilter receives `selectedTags={selectedFilterTags}`
- [ ] TagFilter receives `onSelectedTagsChange={(tags) => setSelectedFilterTags(tags)}`
- [ ] TagFilter callback updates sessionStorage immediately
- [ ] TagFilter displays all available tags (distinct, sorted)
- [ ] User can select/deselect multiple tags

### Exercise Filtering

- [ ] Call `filterExercises()` from spec 02 with:
  - Current `exercisesByInstrument`
  - Current `selectedInstrument`
  - Current `showFavoritesOnly`
  - Current `selectedFilterTags`
- [ ] Display filtered results (sections + exercises)
- [ ] Empty sections included in structure (exercises list may be empty)
- [ ] If all exercises filtered out, shows appropriate message (e.g., "No exercises match selected filters")
- [ ] Filtering happens in real-time (no loading states)

### Filter Results Feedback

- [ ] Optional: Show count of matching exercises (e.g., "Showing 5 exercises")
- [ ] Optional: Show active filter summary (e.g., "Favorites + rock + fast")
- [ ] Feedback updates immediately as filters change
- [ ] Feedback is helpful but not required (nice-to-have)

### Section Expansion State

- [ ] Existing section expand/collapse toggle preserved
- [ ] Expand state independent of filters (filters don't auto-expand/collapse sections)
- [ ] User can expand/collapse sections while filters active
- [ ] Expanded sections state persists across filter changes (within session)

### Backward Compatibility

- [ ] Existing ExerciseBrowserProps interface unchanged
- [ ] Existing component behavior unchanged (all filters default to "show all")
- [ ] Instrument selector works as before
- [ ] Section expand/collapse works as before
- [ ] Link navigation to exercise playback unaffected
- [ ] Existing tests still pass (no regression)

### Accessibility

- [ ] Filter section has clear heading or `aria-label`
- [ ] Favorites toggle has `aria-pressed`
- [ ] "Clear All" button has clear `aria-label`
- [ ] TagFilter component provides accessibility (spec 05)
- [ ] Keyboard navigation works throughout
- [ ] No hidden content unless visually hidden (dark color, off-screen)

### Styling

- [ ] Filters section uses TailwindCSS classes only
- [ ] Favorites toggle button matches app theme
- [ ] "Clear All" button matches app theme
- [ ] Filter UI responsive (wraps on mobile)
- [ ] Dark mode supported
- [ ] No visual regression from existing browser

### SessionStorage Management

- [ ] On component mount: read `groovelab_filter_tags` from sessionStorage
- [ ] On filter change: write updated tags to sessionStorage immediately
- [ ] On component unmount or manually: clear sessionStorage key (optional)
- [ ] If sessionStorage unavailable (private browsing): gracefully degrade to in-memory state
- [ ] SessionStorage key: `'groovelab_filter_tags'`

### Mobile Responsiveness

- [ ] Filters section responsive (stacks on small screens)
- [ ] Tag filter buttons wrap naturally
- [ ] Favorites toggle stays accessible on mobile
- [ ] "Clear All" button prominent and clickable

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

- [ ] Spec reviewed and accepted
- [ ] ExerciseBrowser component modified at `packages/ui/src/components/organisms/ExerciseBrowser/`
- [ ] New state added: `showFavoritesOnly`, `selectedFilterTags`
- [ ] Favorites toggle button implemented
- [ ] "Clear All" button implemented
- [ ] TagFilter component imported and integrated
- [ ] `filterExercises()` function called with current filter state
- [ ] Exercise list displays filtered results
- [ ] SessionStorage integration working (persist/restore filter tags)
- [ ] Component still exports from `packages/ui/src/index.ts`
- [ ] Component tests updated/added (12+ new tests expected):
  - [ ] Favorites toggle works
  - [ ] "Clear All" works
  - [ ] Tag filter updates
  - [ ] Combined filters work (favorites + tags)
  - [ ] Empty results message shows
  - [ ] SessionStorage read/write
  - [ ] Mobile responsive
  - [ ] Keyboard navigation
  - [ ] Dark mode works
  - [ ] Instrument switching with filters active
  - [ ] No regressions in existing browser tests
- [ ] All tests pass (existing + new)
- [ ] No regressions in parent/sibling component tests
- [ ] Linting passes
- [ ] TypeScript compiles without errors
