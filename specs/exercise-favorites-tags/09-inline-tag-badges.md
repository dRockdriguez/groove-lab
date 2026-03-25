# Spec: Inline Tag Badges in Exercise Card

**Status:** Draft
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

- [ ] ExerciseCard displays up to 3 tags as inline badges next to exercise title
- [ ] Tags are displayed as pill/badge elements with subtle background color
- [ ] Each badge shows the tag text (e.g., "rock", "fast", "warm-up")
- [ ] Badges use TailwindCSS classes only (no inline styles)
- [ ] Badge styling: rounded-full, small padding, light gray background (dark mode: darker)
- [ ] Badges are horizontally laid out (flex row, wrapping allowed on mobile)
- [ ] No hover effect on individual badges (display-only)

### "+X More" Indicator

- [ ] If exercise has more than 3 tags, show "+X more" text/button after the 3rd badge
- [ ] "+X more" calculated as: `totalTags - 3` (e.g., "+2 more", "+5 more")
- [ ] "+X more" styled differently from tag badges (e.g., secondary color, subtle)
- [ ] Clicking "+X more" opens TagInput popover for tag management (calls `onTagsClick`)
- [ ] "+X more" is clickable only if `onTagsClick` callback provided
- [ ] If `onTagsClick` not provided, "+X more" is display-only (non-interactive)

### Integration with FavoriteButton

- [ ] FavoriteButton still displayed (heart icon)
- [ ] Tag count badge removed from FavoriteButton (numeric count no longer shown)
- [ ] FavoriteButton renders heart icon only (no tag count)
- [ ] Layout: `[♡] [Exercise Name] [rock] [fast] [+2 more]`

### Empty State

- [ ] If exercise has no tags, no badges or "+more" shown
- [ ] ExerciseCard still renders normally (title, description, meta)
- [ ] No visual change if tags exist vs. don't exist (no weird spacing)

### Real-Time Updates

- [ ] ExerciseCard uses `useLocalStorageListener` hook from Spec 08
- [ ] Hook watches `'groovelab_tags'` key
- [ ] When tags are added/removed for this exercise, badges update immediately
- [ ] User doesn't need to refresh page to see new tags
- [ ] When all tags removed, badges disappear gracefully

### Tag Management Flow

- [ ] User can click "+X more" to open TagInput popover (Spec 04)
- [ ] TagInput popover shows all tags for the exercise (not just first 3)
- [ ] User can add/remove tags in popover
- [ ] On close, badge count updates immediately (via Spec 08 hook)
- [ ] If user adds tag and closes popover, new tag visible in badge list (within 3-tag limit)

### Responsive Design

- [ ] On desktop (>640px): badges inline with title, all on one line or wrapping naturally
- [ ] On mobile (<640px): badges may wrap to next line if space constrained
- [ ] "+X more" always visible and tappable (min 44px tap target)
- [ ] No overflow; tags truncate or wrap appropriately

### Accessibility

- [ ] Tag badges have `aria-label` describing their purpose (e.g., "Tags: rock, fast")
- [ ] "+X more" button (if interactive) has `aria-label` (e.g., "Show 2 more tags")
- [ ] "+X more" button (if interactive) has `role="button"` or is actual `<button>` element
- [ ] Badges are not tab-reachable (display-only); only "+X more" is interactive
- [ ] Keyboard users can reach and activate "+X more" with Tab+Enter
- [ ] Screen readers can understand that tags are associated with the exercise

### Styling

- [ ] Tag badges use TailwindCSS only (e.g., `bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300`)
- [ ] Color scheme distinct from FavoriteButton (not red/pink)
- [ ] Dark mode support (colors work in dark theme)
- [ ] No visual regression from existing ExerciseCard
- [ ] Badges don't interfere with existing card elements (description, meta, etc.)

### Props

- [ ] `onTagsClick?: (exerciseId: string) => void` — New optional prop for tag management
- [ ] Passed down from parent (ExerciseBrowser, ExerciseCard consumer)
- [ ] Component renders correctly with/without `onTagsClick`

### State Management

- [ ] ExerciseCard reads tags from localStorage on mount (via `getExerciseTags`)
- [ ] Component subscribes to `'groovelab_tags'` changes via `useLocalStorageListener` hook
- [ ] No additional state variables; updates triggered by hook
- [ ] Tags derived from storage only; no local state drift

### Backward Compatibility

- [ ] FavoriteButton still works without tag badges (graceful degradation)
- [ ] If Spec 08 hook unavailable, badges still render with initial tags (no real-time sync, but functional)
- [ ] ExerciseCard props unchanged (new `onTagsClick` is optional)
- [ ] Existing ExerciseBrowser tests still pass
- [ ] No breaking changes to component API

### Initial Render

- [ ] First render shows up to 3 tags correctly
- [ ] No flashing or visual jank
- [ ] "+X more" count correct on initial render
- [ ] Loading state handled (if tags loaded async)

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

- [ ] Spec reviewed and accepted
- [ ] ExerciseCard component modified at `packages/ui/src/components/molecules/ExerciseCard/`
- [ ] `useLocalStorageListener` hook from Spec 08 imported and used
- [ ] `getExerciseTags()` function from Spec 01 imported and called
- [ ] Tag badges rendered inline (up to 3 tags)
- [ ] "+X more" indicator shown when > 3 tags
- [ ] Tag badges styled with TailwindCSS (pill/badge design)
- [ ] "+X more" is interactive (calls `onTagsClick` callback if provided)
- [ ] Real-time updates working (tags update when changed elsewhere)
- [ ] FavoriteButton updated to remove numeric tag count badge
- [ ] Component exported from `packages/ui/src/index.ts`
- [ ] Component tests updated/added (15+ new tests expected):
  - [ ] Render 0 tags (no badges)
  - [ ] Render 1–3 tags (badges only)
  - [ ] Render 4+ tags (3 badges + "+X more")
  - [ ] "+X more" click behavior
  - [ ] Real-time tag updates (hook integration)
  - [ ] Long tag names (truncation/wrapping)
  - [ ] Responsive design (mobile/desktop)
  - [ ] Accessibility (aria-labels, keyboard nav)
  - [ ] Dark mode
  - [ ] Integration with FavoriteButton (no numeric badge)
- [ ] All existing ExerciseCard tests pass (no regression)
- [ ] All existing FavoriteButton tests pass (no regression)
- [ ] Linting passes
- [ ] TypeScript compiles without errors
- [ ] Storybook story updated (optional but recommended)

