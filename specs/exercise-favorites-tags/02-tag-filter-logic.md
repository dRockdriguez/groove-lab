# Spec: Tag Filter Logic

**Status:** Draft
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

- [ ] Function signature matches above
- [ ] Returns InstrumentExercises for the selected instrument only
- [ ] If `showFavoritesOnly === true`, returns only exercises marked as favorites (via `isFavorite()`)
- [ ] If `selectedFilterTags.length > 0`, returns only exercises having ALL selected tags (AND logic)
- [ ] If no filters applied, returns all exercises for instrument
- [ ] Returns empty sections if no exercises match criteria
- [ ] Section structure preserved (empty sections still included with `exercises: []`)
- [ ] Order of exercises within section unchanged
- [ ] Order of sections unchanged

### Filter Logic: AND Operation for Tags

- [ ] Single selected tag → exercise must have that tag
- [ ] Two selected tags `['rock', 'fast']` → exercise must have BOTH 'rock' AND 'fast'
- [ ] Empty selected tags `[]` → no tag filtering applied
- [ ] Non-matching tags → section remains in structure but exercise list may be empty

### Filter Combinations

- [ ] Favorites + Tags → exercise must be favorite AND have all selected tags
- [ ] Favorites only (no tags) → returns all favorites regardless of tags
- [ ] Tags only (favorites off) → returns all exercises with selected tags, favorite or not
- [ ] Neither (defaults) → returns all exercises for instrument

### Edge Cases

- [ ] `selectedFilterTags` contains tag that doesn't exist on any exercise → section exercises empty
- [ ] Exercise has no tags; `selectedFilterTags = ['rock']` → exercise filtered out
- [ ] Exercise has tags `['fast', 'rock']`; `selectedFilterTags = ['fast']` → exercise included
- [ ] Exercise has tags `['fast', 'rock']`; `selectedFilterTags = ['fast', 'rock', 'solo']` → exercise filtered out (doesn't have 'solo')
- [ ] All exercises filtered out → section remains with `exercises: []`
- [ ] Multiple sections, some empty after filtering → all sections returned, some with empty arrays

### Type Safety

- [ ] Function returns type `InstrumentExercises[]`
- [ ] Function uses exported types from `@groovelab/types`
- [ ] All function parameters and return types have TypeScript annotations

### Performance

- [ ] Function is O(n) where n = total exercises across all sections
- [ ] No unnecessary iterations over sections/exercises
- [ ] No mutation of input arguments

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

- [ ] Spec reviewed and accepted
- [ ] Function implemented in `packages/utils/src/index.ts`
- [ ] Function exported from `@groovelab/utils`
- [ ] Unit tests written covering all acceptance criteria + edge cases (15+ tests expected)
- [ ] Tests verify AND logic with multiple tags
- [ ] Tests verify favorite + tag combinations
- [ ] Tests verify empty results
- [ ] All tests pass
- [ ] No regressions in existing utils tests
- [ ] Linting passes
- [ ] TypeScript compiles without errors
