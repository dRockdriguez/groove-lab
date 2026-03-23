# Spec: Tag Filter Logic

**Status:** Implemented
**Last updated:** 2026-03-23

---

## Scope

Implement filter functions that combine favorites toggle, tag selection, and instrument selection to return a filtered list of exercises. These are pure functions—no side effects, no UI.

Depends on Spec 01 (storage layer).

---

## Inputs

- `exercisesByInstrument: InstrumentExercises[]` (existing type)
- `selectedInstrument: InstrumentType` (existing)
- `showFavoritesOnly: boolean` (new)
- `selectedFilterTags: string[]` (new, from sessionStorage)

---

## Outputs

```ts
function filterExercises(
  exercisesByInstrument: InstrumentExercises[],
  selectedInstrument: InstrumentType,
  showFavoritesOnly: boolean,
  selectedFilterTags: string[]
): InstrumentExercises[]
```

Returns a filtered `InstrumentExercises` structure with matching exercises only.

---

## Acceptance Criteria

### Filter Function: `filterExercises()`

- [x] Function signature matches above
- [x] Returns InstrumentExercises for the selected instrument only
- [x] If `showFavoritesOnly === true`, returns only exercises marked as favorites (via `isFavorite()`)
- [x] If `selectedFilterTags.length > 0`, returns only exercises having ALL selected tags (AND logic)
- [x] If no filters applied, returns all exercises for instrument
- [x] Returns empty sections if no exercises match criteria
- [x] Section structure preserved (empty sections still included with `exercises: []`)
- [x] Order of exercises within section unchanged
- [x] Order of sections unchanged

### Filter Logic: AND Operation for Tags

- [x] Single selected tag → exercise must have that tag
- [x] Two selected tags `['rock', 'fast']` → exercise must have BOTH 'rock' AND 'fast'
- [x] Empty selected tags `[]` → no tag filtering applied
- [x] Non-matching tags → section remains in structure but exercise list may be empty

### Filter Combinations

- [x] Favorites + Tags → exercise must be favorite AND have all selected tags
- [x] Favorites only (no tags) → returns all favorites regardless of tags
- [x] Tags only (favorites off) → returns all exercises with selected tags, favorite or not
- [x] Neither (defaults) → returns all exercises for instrument

### Edge Cases

- [x] `selectedFilterTags` contains tag that doesn't exist on any exercise → section exercises empty
- [x] Exercise has no tags; `selectedFilterTags = ['rock']` → exercise filtered out
- [x] Exercise has tags `['fast', 'rock']`; `selectedFilterTags = ['fast']` → exercise included
- [x] Exercise has tags `['fast', 'rock']`; `selectedFilterTags = ['fast', 'rock', 'solo']` → exercise filtered out (doesn't have 'solo')
- [x] All exercises filtered out → section remains with `exercises: []`
- [x] Multiple sections, some empty after filtering → all sections returned, some with empty arrays

### Type Safety

- [x] Function returns type `InstrumentExercises[]`
- [x] Function uses exported types from `@groovelab/types`
- [x] All function parameters and return types have TypeScript annotations

### Performance

- [x] Function is O(n) where n = total exercises across all sections
- [x] No unnecessary iterations over sections/exercises
- [x] No mutation of input arguments

---

## Notes

- **Storage layer integration** — Function calls `isFavorite(id)` and `getExerciseTags(id)` from spec 01
- **UI layer separate** — This spec is pure logic; no React hooks, no DOM access
- **Immutable** — Function returns new structure; doesn't modify input
- **Instrument filtering assumed** — Function assumes `selectedInstrument` is valid; doesn't validate
- **Tag case-sensitivity** — Tag matching is case-sensitive (exact string match)
- **No sorting** — Filter preserves original order; doesn't sort by favorites, tags, or name

---

## Definition of Done

- [x] Spec reviewed and accepted
- [x] Function implemented in `packages/utils/src/index.ts`
- [x] Function exported from `@groovelab/utils`
- [x] Unit tests written covering all acceptance criteria + edge cases (59 tests implemented)
- [x] Tests verify AND logic with multiple tags
- [x] Tests verify favorite + tag combinations
- [x] Tests verify empty results
- [x] All tests pass (59/59 PASSING ✅)
- [x] No regressions in existing utils tests (259/259 PASSING ✅)
- [x] Linting passes
- [x] TypeScript compiles without errors
