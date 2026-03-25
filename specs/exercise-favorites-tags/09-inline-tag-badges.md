# Spec: Inline Tag Badges in Exercise Card

**Status:** Implemented
**Last updated:** 2026-03-25

---

## Scope

Replace the FavoriteButton's numeric tag count badge (currently showing "❤️ 1", "❤️ 3", etc.) with inline tag badges displayed directly in the ExerciseCard. Show the first 3 tags as clickable pill/badge elements next to the exercise title. If more than 3 tags exist, show a "+X more" indicator. Tag badges are display-only (not interactive), but clicking them or the "+more" indicator can open the TagInput popover for tag management.

Depends on Spec 01 (storage layer), Spec 03 (FavoriteButton), and Spec 08 (real-time tag updates).

---

## Inputs

Existing ExerciseCard props:
```ts
interface ExerciseCardProps {
  exercise: Exercise;
  isSelected?: boolean;
  onNavigate?: (exerciseId: string) => void;
  onFavoriteClick?: (exerciseId: string) => void;  // from Spec 03
  onTagsClick?: (exerciseId: string) => void;      // new: opens TagInput
}
```

Storage utilities from Spec 01:
- `getExerciseTags(exerciseId): string[]`

Real-time hook from Spec 08:
- `useLocalStorageListener(keys: string[], callback?: (key, value) => void)`

---

## Outputs

Modified `ExerciseCard.tsx` at `packages/ui/src/components/molecules/ExerciseCard/`

New rendering (title + tags):
```
┌─────────────────────────────────────────────────┐
│ ♡ Exercise Name [rock] [fast] [+2 more]        │  (title line with inline badges)
│ <exercise description>                          │
│ <exercise meta info>                            │
└─────────────────────────────────────────────────┘
```

Alternative layout (tags below title):
```
┌─────────────────────────────────────────────────┐
│ ♡ Exercise Name                                 │
│ [rock] [fast] [+2 more]                         │  (tags on separate line)
│ <exercise description>                          │
│ <exercise meta info>                            │
└─────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Tag Badge Rendering

- [x] ExerciseCard displays up to 3 tags as inline badges next to exercise title
- [x] Tags are displayed as pill/badge elements with subtle background color
- [x] Each badge shows the tag text (e.g., "rock", "fast", "warm-up")
- [x] Badges use TailwindCSS classes only (no inline styles)
- [x] Badge styling: rounded-full, small padding, light gray background (dark mode: darker)
- [x] Badges are horizontally laid out (flex row, wrapping allowed on mobile)
- [x] No hover effect on individual badges (display-only)

### "+X More" Indicator

- [x] If exercise has more than 3 tags, show "+X more" text/button after the 3rd badge
- [x] "+X more" calculated as: `totalTags - 3` (e.g., "+2 more", "+5 more")
- [x] "+X more" styled differently from tag badges (e.g., secondary color, subtle)
- [x] Clicking "+X more" opens TagInput popover for tag management (calls `onTagsClick`)
- [x] "+X more" is clickable only if `onTagsClick` callback provided
- [x] If `onTagsClick` not provided, "+X more" is display-only (non-interactive)

### Integration with FavoriteButton

- [x] FavoriteButton still displayed (heart icon)
- [x] Tag count badge removed from FavoriteButton (numeric count no longer shown)
- [x] FavoriteButton renders heart icon only (no tag count)
- [x] Layout: `[♡] [Exercise Name] [rock] [fast] [+2 more]`

### Empty State

- [x] If exercise has no tags, no badges or "+more" shown
- [x] ExerciseCard still renders normally (title, description, meta)
- [x] No visual change if tags exist vs. don't exist (no weird spacing)

### Real-Time Updates

- [x] ExerciseCard uses `useLocalStorageListener` hook from Spec 08
- [x] Hook watches `'groovelab_tags'` key
- [x] When tags are added/removed for this exercise, badges update immediately
- [x] User doesn't need to refresh page to see new tags
- [x] When all tags removed, badges disappear gracefully

### Tag Management Flow

- [x] User can click "+X more" to open TagInput popover (Spec 04)
- [x] TagInput popover shows all tags for the exercise (not just first 3)
- [x] User can add/remove tags in popover
- [x] On close, badge count updates immediately (via Spec 08 hook)
- [x] If user adds tag and closes popover, new tag visible in badge list (within 3-tag limit)

### Responsive Design

- [x] On desktop (>640px): badges inline with title, all on one line or wrapping naturally
- [x] On mobile (<640px): badges may wrap to next line if space constrained
- [x] "+X more" always visible and tappable (min 44px tap target)
- [x] No overflow; tags truncate or wrap appropriately

### Accessibility

- [x] Tag badges have `aria-label` describing their purpose (e.g., "Tags: rock, fast")
- [x] "+X more" button (if interactive) has `aria-label` (e.g., "Show 2 more tags")
- [x] "+X more" button (if interactive) has `role="button"` or is actual `<button>` element
- [x] Badges are not tab-reachable (display-only); only "+X more" is interactive
- [x] Keyboard users can reach and activate "+X more" with Tab+Enter
- [x] Screen readers can understand that tags are associated with the exercise

### Styling

- [x] Tag badges use TailwindCSS only (e.g., `bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300`)
- [x] Color scheme distinct from FavoriteButton (not red/pink)
- [x] Dark mode support (colors work in dark theme)
- [x] No visual regression from existing ExerciseCard
- [x] Badges don't interfere with existing card elements (description, meta, etc.)

### Props

- [x] `onTagsClick?: (exerciseId: string) => void` — New optional prop for tag management
- [x] Passed down from parent (ExerciseBrowser, ExerciseCard consumer)
- [x] Component renders correctly with/without `onTagsClick`

### State Management

- [x] ExerciseCard reads tags from localStorage on mount (via `getExerciseTags`)
- [x] Component subscribes to `'groovelab_tags'` changes via `useLocalStorageListener` hook
- [x] No additional state variables; updates triggered by hook
- [x] Tags derived from storage only; no local state drift

### Backward Compatibility

- [x] FavoriteButton still works without tag badges (graceful degradation)
- [x] If Spec 08 hook unavailable, badges still render with initial tags (no real-time sync, but functional)
- [x] ExerciseCard props unchanged (new `onTagsClick` is optional)
- [x] Existing ExerciseBrowser tests still pass
- [x] No breaking changes to component API

### Initial Render

- [x] First render shows up to 3 tags correctly
- [x] No flashing or visual jank
- [x] "+X more" count correct on initial render
- [x] Loading state handled (if tags loaded async)

---

## Edge Cases

1. **No tags** — No badges shown; card looks same as before
2. **1–3 tags** — Badges shown; no "+more" indicator
3. **Exactly 4 tags** — 3 badges + "+1 more"
4. **Many tags (20+)** — First 3 badges + "+17 more" (no truncation)
5. **Very long tag names** — Tag text truncated or badge resizes to fit
6. **Tags added while popover open** — ExerciseCard re-renders; new tag visible when popover closed
7. **Tag removed while popover open** — Badges update; if that tag shown in badges, removed from display
8. **Exercise has no tags, user adds first tag** — Badges appear automatically (Spec 08 hook triggers re-render)
9. **Storage unavailable** — Component renders without badges (graceful degradation)
10. **Tag name with special characters** (e.g., "#fast", "c++") — Rendered as-is, no HTML escaping issues

---

## Notes

- **Display-only badges**: Clicking on individual tag badges does nothing; they're purely informational
- **"+X more" is the interaction point**: Only "+X more" or possibly a dedicated edit icon should open TagInput
- **Integration with Spec 04**: This spec assumes TagInput exists and can be opened via callback
- **No tag autocomplete**: Tags displayed as-is; no suggestions or categorization
- **Tag color coding** (optional): Could color-code badges by tag category, but out of scope unless specified
- **Tag deletion**: User deletes tags via TagInput (Spec 04), not by clicking individual badges
- **Tablet/mobile**: Layout should be responsive; consider full-width badges if space constrained
- **Performance**: Reading `getExerciseTags()` is O(1) (localStorage lookup); no performance issues expected

---

## Definition of Done

- [x] Spec reviewed and accepted
- [x] ExerciseCard component modified at `packages/ui/src/components/molecules/ExerciseCard/`
- [x] `useLocalStorageListener` hook from Spec 08 imported and used
- [x] `getExerciseTags()` function from Spec 01 imported and called
- [x] Tag badges rendered inline (up to 3 tags)
- [x] "+X more" indicator shown when > 3 tags
- [x] Tag badges styled with TailwindCSS (pill/badge design)
- [x] "+X more" is interactive (calls `onTagsClick` callback if provided)
- [x] Real-time updates working (tags update when changed elsewhere)
- [x] FavoriteButton updated to remove numeric tag count badge
- [x] Component exported from `packages/ui/src/index.ts`
- [x] Component tests updated/added (62 tests implemented):
  - [x] Render 0 tags (no badges)
  - [x] Render 1–3 tags (badges only)
  - [x] Render 4+ tags (3 badges + "+X more")
  - [x] "+X more" click behavior
  - [x] Real-time tag updates (hook integration)
  - [x] Long tag names (truncation/wrapping)
  - [x] Responsive design (mobile/desktop)
  - [x] Accessibility (aria-labels, keyboard nav)
  - [x] Dark mode
  - [x] Integration with FavoriteButton (no numeric badge)
- [x] All existing ExerciseCard tests pass (no regression)
- [x] All existing FavoriteButton tests pass (no regression)
- [x] TypeScript compiles without errors
- [x] Storybook story updated (optional but recommended)

