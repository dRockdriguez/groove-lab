# Spec: Storage Layer for Favorites & Tags

**Status:** Implemented
**Last updated:** 2026-03-23

---

## Scope

Define the localStorage/sessionStorage layer for persisting user favorites and tags. Create types in `packages/types` and utility functions in `packages/utils` for safe, consistent access to stored data.

---

## Inputs

None — foundation spec. Establishes the contract for all downstream specs.

---

## Outputs

### New Types (packages/types/src/index.ts)

```ts
/** Record<exerciseId, true> */
export type FavoritesStore = Record<string, boolean>;

/** Record<exerciseId, string[]> — tags for each exercise */
export type TagsStore = Record<string, string[]>;
```

### New Utilities (packages/utils/src/index.ts)

All functions use `localStorage` directly (Web Storage API).

**Favorites Management:**
```ts
getFavorites(): FavoritesStore
setFavorites(favorites: FavoritesStore): void
isFavorite(exerciseId: string): boolean
toggleFavorite(exerciseId: string): boolean  // Returns new state
```

**Tags Management:**
```ts
getTags(): TagsStore
setTags(tags: TagsStore): void
getExerciseTags(exerciseId: string): string[]
addTag(exerciseId: string, tag: string): void  // Idempotent
removeTag(exerciseId: string, tag: string): void  // No-op if not found
setExerciseTags(exerciseId: string, tags: string[]): void
getDistinctTags(): string[]  // All unique tags across all exercises, sorted A-Z
```

**Session Filter State (sessionStorage):**
```ts
getSelectedFilterTags(): string[]  // For multi-tag filter UI state
setSelectedFilterTags(tags: string[]): void
clearSelectedFilterTags(): void  // On unmount or refresh
```

---

## Acceptance Criteria

### Storage Keys
- [x] Favorites stored at key `'groovelab_favorites'` as JSON
- [x] Tags stored at key `'groovelab_tags'` as JSON
- [x] Filter tags stored at key `'groovelab_filter_tags'` in sessionStorage
- [x] Keys follow naming convention `groovelab_*`

### Favorites Functions
- [x] `getFavorites()` returns `{}` if key doesn't exist (graceful fallback)
- [x] `getFavorites()` returns valid FavoritesStore on success
- [x] `setFavorites(fav)` persists to localStorage; subsequent `getFavorites()` returns same data
- [x] `isFavorite(id)` returns `true` if id in store, `false` otherwise
- [x] `toggleFavorite(id)` sets to true if false, false if true; returns new state
- [x] `toggleFavorite(id)` persists change immediately to localStorage
- [x] `setFavorites({})` clears all favorites

### Tags Functions
- [x] `getTags()` returns `{}` if key doesn't exist (graceful fallback)
- [x] `getTags()` returns valid TagsStore on success
- [x] `setTags(tags)` persists to localStorage; subsequent `getTags()` returns same data
- [x] `getExerciseTags(id)` returns `[]` if exercise not in store
- [x] `getExerciseTags(id)` returns array of tags (never null)
- [x] `addTag(id, tag)` adds tag if not already present (idempotent)
- [x] `addTag(id, tag)` trims whitespace from tag, ignores empty strings
- [x] `removeTag(id, tag)` removes tag if present, no-op if not found
- [x] `setExerciseTags(id, tags)` replaces all tags for exercise; persists immediately
- [x] `getDistinctTags()` returns all unique tags across all exercises
- [x] `getDistinctTags()` returns sorted alphabetically (case-insensitive)
- [x] `getDistinctTags()` returns empty array if no tags exist
- [x] Modifying (add/remove/set) tags persists to localStorage immediately

### Session Filter State
- [x] `getSelectedFilterTags()` returns `[]` if sessionStorage key doesn't exist
- [x] `getSelectedFilterTags()` returns valid string array
- [x] `setSelectedFilterTags(tags)` persists array to sessionStorage
- [x] `clearSelectedFilterTags()` removes key from sessionStorage
- [x] Filter tags do NOT persist across page refresh

### Error Handling
- [x] Invalid JSON in localStorage is caught; functions return safe defaults (`{}` or `[]`)
- [x] No exceptions thrown on read/write (user experience unaffected by storage errors)
- [x] Graceful degradation: if localStorage unavailable (private browsing), data still works in-memory for session

### Type Safety
- [x] All functions have TypeScript signatures matching outputs above
- [x] `FavoritesStore` and `TagsStore` exported from `@groovelab/types`
- [x] All new utilities exported from `@groovelab/utils`

---

## Edge Cases

1. **Empty storage** — First-time user has no favorites or tags; functions return empty objects/arrays
2. **Corrupted JSON** — localStorage contains invalid JSON; functions treat as empty and proceed
3. **Private browsing** — localStorage unavailable; functions fallback to in-memory storage (no persistence)
4. **Tag whitespace** — `addTag(id, '  hello  ')` trims and stores `'hello'`
5. **Duplicate tags** — `addTag(id, tag)` is idempotent; adding same tag twice doesn't create duplicates
6. **Case-sensitive tags** — `'Groove'` and `'groove'` are different tags
7. **Special characters** — Tags can contain any characters (no validation at storage layer)
8. **Large datasets** — No limit on number of exercises or tags enforced at storage layer (browser quota applies)
9. **Clearing favorites** — If all exercises unfavorited, store becomes `{}`; `isFavorite(id)` returns false for all
10. **Clearing tags** — If all tags removed from all exercises, `getDistinctTags()` returns `[]`

---

## Notes

- **No encryption** — localStorage is plaintext (user's own browser, acceptable security level)
- **No backend sync** — This spec is localStorage-only; sync would be a separate spec
- **No quota checking** — Assume browser quota sufficient for reasonable number of exercises/tags
- **No eviction logic** — No automatic cleanup of old data; manual clear only
- **Synchronous API** — All functions are sync (no async I/O)
- **Single-tab scope** — sessionStorage for filter state is per-tab (not shared across tabs)
- **Type coercion** — Tags stored as strings; no type coercion on retrieval

---

## Definition of Done

- [x] Spec reviewed and accepted
- [x] New types added to `packages/types/src/index.ts`
- [x] All utility functions implemented in `packages/utils/src/index.ts`
- [x] All functions exported from `@groovelab/utils`
- [x] Unit tests written covering all acceptance criteria + edge cases
- [x] Error handling verified (corrupt JSON, unavailable storage)
- [x] All tests pass (at least 45+ tests expected)
- [x] No regressions in existing utils tests
- [x] Linting passes
- [x] Types compile without errors
