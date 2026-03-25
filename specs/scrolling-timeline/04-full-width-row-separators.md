# Spec: Full-Width Row Separators

**Status:** Implemented
**Last updated:** 2026-03-25

## Scope

Move row separator lines out of the inner scrolling container and into the outer `tracksRef` container as absolutely-positioned elements. This ensures separator lines span the full visible width of the tracks area at all times, regardless of the `scrollTranslateX` offset applied to scrolling content.

The change is limited to `ExercisePlaybackTimeline.tsx`. No changes to props, state, `ExercisePlaybackPage`, or any other component.

## Inputs

- `uniqueNotes: number[]` — the ordered list of unique MIDI note numbers, one per row
- `ROW_HEIGHT_PX: number` — the pixel height of each track row (constant: 40, matching the `h-10` Tailwind class currently applied to track rows)
- Outer container: `<div ref={tracksRef} className="relative flex-1 overflow-hidden">`
- Inner container: `<div style={{ transform: `translateX(${scrollTranslateX}px)` }}>` — the existing scrolling div

## Outputs

- One full-width separator div per row gap, rendered as absolute children of `tracksRef`
- Separators are always visible at the correct vertical positions regardless of scroll offset
- The `border-b` class on inner track row divs is removed or made transparent so it no longer produces a duplicate or misaligned line
- The `border-b` class on label column divs (`w-32 shrink-0`) remains unchanged

## Acceptance Criteria

- A constant `ROW_HEIGHT_PX = 40` is defined at the module level or component top
- For each row gap at index `i` (where `i` goes from 0 to `uniqueNotes.length - 1`), one separator div is rendered as an absolute child of the outer `tracksRef` container with:
  - `position: absolute`
  - `top: (i + 1) * ROW_HEIGHT_PX` pixels
  - `left: 0`, `right: 0` (full width)
  - `height: 1px`
  - `background-color` matching the existing border color: `bg-gray-200` in light mode, `dark:bg-gray-700` in dark mode
  - `pointer-events: none`
  - `aria-hidden="true"`
  - `data-testid="row-separator"`
- The `border-b` class is removed from the inner scrolling container's track row divs
- Separator count equals `uniqueNotes.length` (one separator per row, including the last row to close the bottom edge)
- Each separator's `top` value equals `(rowIndex + 1) * 40` in pixels
- Separator divs are siblings of the inner scrolling div, not children of it
- The `border-b` on the labels column remains unchanged

## Edge Cases

- `uniqueNotes.length = 0`: no separators rendered, no crash (component already returns early with an empty-state message before reaching this code)
- `uniqueNotes.length = 1`: one separator rendered at `top: 40px`
- `scrollTranslateX` is very large positive (start of playback): separators remain at correct vertical positions (they are outside the scrolling container)
- `scrollTranslateX` is very large negative (near end of exercise): separators remain correctly positioned

## Notes

The `h-10` class on both the labels column rows and the track rows encodes 40px height (Tailwind: `h-10 = 2.5rem = 40px` at base 16px font). The constant `ROW_HEIGHT_PX = 40` must match this. If the row height ever changes, both the Tailwind class and this constant must be updated together.

The labels column (`w-32 shrink-0`) is outside `tracksRef` entirely — it is a flex sibling. The separator divs live inside `tracksRef`, so they do not extend into the labels column. This is acceptable: the labels column already has its own `border-b` which aligns with the separator positions vertically.

Using Tailwind `bg-gray-200 dark:bg-gray-700` on absolute separators is correct because the parent `tracksRef` div uses `overflow-hidden` which only clips horizontal overflow. Vertical clipping does not affect separators, so they will display correctly.

## Definition of Done

- [x] `ROW_HEIGHT_PX = 40` constant defined at the component top
- [x] Separator divs rendered as absolute children of the outer `tracksRef` container, one per `uniqueNotes` entry, at `top: (i + 1) * ROW_HEIGHT_PX`
- [x] `border-b border-gray-200 dark:border-gray-700` removed from inner track row divs
- [x] `border-b` on labels column left unchanged
- [x] New test file `ExercisePlaybackTimeline.separators.test.tsx` added with 18 tests:
  - ResizeObserver mock (reuse pattern from existing tests) ✅
  - Test: correct number of separators rendered (equals `uniqueNotes.length`) ✅ (3 tests)
  - Test: separator at index 0 has `top: 40px` ✅
  - Test: separator at index 1 has `top: 80px` ✅
  - Test: separator at index N-1 has `top: N * 40 px` ✅
  - Test: separators are NOT children of the inner scrolling div ✅ (2 tests)
  - Test: separators have `aria-hidden="true"` ✅
  - Test: separators have `pointer-events: none` ✅
  - Test: separator positions are identical when `currentTimeMs = 0` vs `currentTimeMs = durationMs / 2` (scroll-invariance) ✅ (2 tests)
  - Test: separators have `height: 1px` and `position: absolute` ✅ (2 tests)
  - Test: inner track row divs do not have `border-b` class ✅
  - Test: labels column divs retain `border-b` class ✅
- [x] All existing ExercisePlaybackTimeline tests pass (1436/1437 tests passing, 1 todo) — **no regressions** ✅
- [x] No changes to other components ✅
- [x] Spec metadata updated to `Status: Implemented` and `Last updated: 2026-03-25` ✅
