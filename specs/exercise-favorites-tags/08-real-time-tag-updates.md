# Spec: Real-Time Tag Updates

**Status:** Implemented
**Last updated:** 2026-03-25

---

## Scope

Implement a real-time synchronization mechanism to ensure that tag changes in localStorage are immediately reflected across all components that display or manage tags (FavoriteButton, TagFilter, ExerciseCard, ExerciseBrowser). Currently, when TagInput updates tags in localStorage, other components don't re-render until the page is manually refreshed.

Solution: Create a custom hook (`useLocalStorageListener`) and/or event notification system that allows components to subscribe to changes in specific localStorage keys and trigger re-renders when changes occur.

Depends on Spec 01 (storage layer).

---

## Inputs

Existing components that need real-time sync:
- `FavoriteButton` — displays tag count, needs to update when tags change
- `TagFilter` — displays available tags, needs to show new tags immediately
- `ExerciseCard` — may display tags inline (from Spec 09), needs live updates
- `ExerciseBrowser` — re-filters when tags change

Existing storage utilities from Spec 01:
- `isFavorite(exerciseId)`, `toggleFavorite(exerciseId)`
- `getExerciseTags(exerciseId)`, `setExerciseTags(exerciseId, tags)`
- `getAllDistinctTags()`

---

## Outputs

New custom hook: `useLocalStorageListener` (exported from `@groovelab/utils`)

Location: `packages/utils/src/hooks/useLocalStorageListener.ts`

```ts
/**
 * Hook that subscribes to localStorage changes for specified keys.
 * Triggers a re-render when the key's value changes (even from other tabs).
 *
 * @param keys - Array of localStorage keys to listen for (e.g., ['groovelab_tags', 'groovelab_favorites'])
 * @param callback - Optional callback fired when any watched key changes
 */
export function useLocalStorageListener(
  keys: string[],
  callback?: (changedKey: string, newValue: string | null) => void
): void;
```

Alternative/additional approach (if custom hook insufficient):
- Custom event dispatcher system: `LocalStorageNotifier` class with `subscribe(key, listener)` and `notify(key, value)` methods
- Used internally by storage utilities when they write to localStorage

Export from `packages/utils/src/index.ts`:
- `useLocalStorageListener` hook
- (Optional) `LocalStorageNotifier` singleton

---

## Acceptance Criteria

### Custom Hook Implementation

- [x] Hook created at `packages/utils/src/hooks/useLocalStorageListener.ts`
- [x] Hook exported from `packages/utils/src/index.ts`
- [x] Hook accepts `keys: string[]` parameter (e.g., `['groovelab_tags', 'groovelab_favorites']`)
- [x] Hook accepts optional `callback?: (key: string, value: string | null) => void` parameter
- [x] Hook listens to browser's native `storage` event (cross-tab communication)
- [x] When a watched key changes, hook re-renders the component
- [x] Callback (if provided) is called with `(changedKey, newValue)` when a watched key changes
- [x] Hook works correctly with multiple keys (watches all of them)
- [x] Hook properly cleans up listeners on unmount
- [x] Hook handles missing `window.addEventListener` gracefully (SSR-safe)

### Storage Notifier (Optional, enhances in-tab sync)

- [x] (Optional) Create `LocalStorageNotifier` singleton class
- [x] (Optional) `notifyChange(key: string, value: string | null): void` method
- [x] (Optional) `subscribe(key: string, listener: (value: string | null) => void): () => void` method (returns unsubscribe function)
- [x] (Optional) All storage utility functions (`setExerciseTags`, `toggleFavorite`) call `LocalStorageNotifier.notifyChange()` after updating localStorage
- [x] (Optional) Hook uses both native `storage` event and `LocalStorageNotifier` for comprehensive in-tab + cross-tab sync

### FavoriteButton Integration

- [x] FavoriteButton imports and uses `useLocalStorageListener` hook
- [x] Hook watches `['groovelab_tags', 'groovelab_favorites']` keys
- [x] When tags change (including from external sources), component re-renders immediately
- [x] Tag count badge updates in real-time
- [x] No additional state variable needed; hook triggers natural re-render
- [x] Component still works without hook (graceful degradation if hook unavailable)

### TagFilter Integration

- [x] TagFilter imports and uses `useLocalStorageListener` hook
- [x] Hook watches `'groovelab_tags'` key
- [x] When new tags added anywhere, TagFilter's available tags list updates immediately
- [x] New tags appear in the filter UI without page refresh
- [x] Tag list is re-derived from storage on each change

### ExerciseCard Integration (Spec 09 prerequisite)

- [x] If ExerciseCard displays inline tags, it uses `useLocalStorageListener` hook
- [x] Hook watches `'groovelab_tags'` key for the specific exercise
- [x] Tag badges update immediately when tags change

### ExerciseBrowser Integration

- [x] ExerciseBrowser uses `useLocalStorageListener` hook (or relies on child components)
- [x] Hook watches `'groovelab_tags'` key
- [x] When tags change, exercise list is re-filtered automatically
- [x] No manual refresh needed

### Cross-Tab Synchronization

- [x] Tag changes in one tab are visible in another tab immediately (native `storage` event)
- [x] Favorite changes in one tab update other tabs immediately
- [x] All tabs stay in sync without manual refresh

### In-Tab Synchronization

- [x] Tag changes within the same tab are visible immediately (via hook or notifier)
- [x] Example: User opens TagInput (Spec 04), adds tag, closes popover → FavoriteButton updates instantly (same tab)
- [x] No race conditions or stale state

### Backward Compatibility

- [x] Existing components work without the hook (no breaking changes)
- [x] Components that don't use the hook continue to function (read-only)
- [x] Spec 03, 04, 05, 06, 07 acceptance criteria still pass
- [x] All existing tests still pass (no regression)

### Performance

- [x] Hook does not cause unnecessary re-renders (only when watched keys change)
- [x] No memory leaks from uncleaned event listeners
- [x] Hook performance acceptable (< 1ms overhead per update)
- [x] Debouncing not required (updates are instant and infrequent)

### Error Handling

- [x] Hook gracefully handles `window` being undefined (SSR)
- [x] Hook gracefully handles missing `localStorage` (private browsing, some browsers)
- [x] No errors thrown if key doesn't exist in localStorage
- [x] No errors thrown if callback is not provided

### Testing

- [x] Hook unit tests (at least 6 tests):
  - [x] Hook re-renders when watched key changes
  - [x] Hook calls callback with correct arguments
  - [x] Hook handles multiple keys
  - [x] Hook cleans up listeners on unmount
  - [x] Hook handles missing window (SSR)
  - [x] Hook handles missing localStorage gracefully
- [x] Component integration tests (FavoriteButton, TagFilter):
  - [x] Tag count updates in real-time
  - [x] Available tags update in real-time
  - [x] Cross-tab updates visible

---

## Edge Cases

1. **localStorage unavailable** — Hook gracefully degrades; components still render with initial state
2. **Key not in localStorage** — Hook returns undefined/null; components handle missing data
3. **Rapid successive updates** — Hook batches updates; no duplicate renders
4. **Hook used in multiple components** — Each component has its own listener; no conflicts
5. **Component unmounts during update** — Listener cleaned up properly; no memory leaks
6. **SSR environment** — Hook checks for `window` before accessing `localStorage` or `addEventListener`
7. **Private browsing mode** — localStorage may throw error on write; hook handles gracefully
8. **Very large localStorage values** — Parsing/comparing values is fast; no performance impact

---

## Notes

- **Hook vs Notifier trade-off**: Hook alone (using native `storage` event) handles cross-tab sync but NOT in-tab sync. Optional `LocalStorageNotifier` handles in-tab sync. Consider implementing both for comprehensive sync.
- **Spec 04 (TagInput)** should use `useLocalStorageListener` or call `LocalStorageNotifier.notifyChange()` after writing tags
- **No central state manager**: This spec avoids Redux/Zustand; keeps state local to localStorage
- **Immediate updates**: Updates happen within milliseconds; no polling or debouncing needed
- **Browser compatibility**: `storage` event works in all modern browsers; graceful fallback for older/SSR
- **Testing strategy**: Mock `storage` event in tests; use `userEvent` to trigger tag updates

---

## Definition of Done

- [x] Spec reviewed and accepted
- [x] `useLocalStorageListener` hook created at `packages/utils/src/hooks/useLocalStorageListener.ts`
- [x] Hook exported from `packages/utils/src/index.ts`
- [x] (Optional) `LocalStorageNotifier` singleton created at `packages/utils/src/notifier/LocalStorageNotifier.ts`
- [x] Hook unit tests written (6+ tests expected)
- [x] (Optional) Notifier unit tests written (4+ tests expected)
- [x] FavoriteButton updated to use hook
- [x] TagFilter updated to use hook
- [x] ExerciseBrowser updated to use hook (if needed)
- [x] Component integration tests updated to verify real-time sync
- [x] All existing tests still pass (no regression)
- [x] Linting passes
- [x] TypeScript compiles without errors
- [x] Documentation added to hook (JSDoc comments)
- [x] Ready for integration with Spec 09 (inline tag badges)

