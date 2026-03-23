# Spec: Favorite Button Component

**Status:** Draft
**Last updated:** 2026-03-23

---

## Scope

Create a reusable FavoriteButton component that displays a toggleable heart icon and tag count badge. Single click toggles favorite state; optional callback for tag management (e.g., opening TagInput modal).

Depends on Spec 01 (storage layer).

---

## Inputs

```ts
interface FavoriteButtonProps {
  exerciseId: string;
  onTagsClick?: () => void;  // Called when user wants to manage tags (e.g., click badge)
  className?: string;
}
```

---

## Outputs

React component: `FavoriteButton.tsx` at `packages/ui/src/components/molecules/FavoriteButton/`

Renders:
```
┌─────────────────────────────┐
│ [♡] Favorite   [3 Tags] ↓   │  (compact mode)
└─────────────────────────────┘

or

┌─────────────┐
│  ♡          │  (icon only, if no tags)
└─────────────┘
```

---

## Acceptance Criteria

### Rendering

- [ ] Component renders a heart icon (SVG or icon library)
- [ ] Heart is unfilled/hollow when exercise NOT favorited
- [ ] Heart is filled/solid and colored (e.g., red or accent color) when favorited
- [ ] Component displays tag count as badge if tags exist (e.g., "[3]" next to heart)
- [ ] Tag badge shows in a small circle or inline text
- [ ] Component is small and inline-friendly (no extra spacing)

### Favorite Toggle

- [ ] Single click on heart icon toggles favorite state (on → off, off → on)
- [ ] Click immediately updates visual state (filled/unfilled)
- [ ] Click calls `toggleFavorite(exerciseId)` from storage layer
- [ ] localStorage is updated on click
- [ ] Multiple clicks work correctly (toggle multiple times)
- [ ] No errors thrown if localStorage unavailable

### Tag Count Display

- [ ] If exercise has tags, shows count (e.g., "[3 Tags]", "[1]")
- [ ] If no tags, no badge is shown (heart only)
- [ ] Count updates immediately if tags added/removed elsewhere
- [ ] Clicking badge area (if present) calls `onTagsClick` callback

### Tag Click Handler

- [ ] If `onTagsClick` prop provided, clicking tag badge fires callback
- [ ] If `onTagsClick` not provided, tag area is not interactive (display-only)
- [ ] Callback has no arguments (parent component responsible for state)

### Accessibility

- [ ] Heart icon has `aria-label` (e.g., "Add to favorites" or "Remove from favorites")
- [ ] Label updates based on favorite state
- [ ] Component is keyboard-accessible (heart icon is a button or clickable element)
- [ ] Tab key focuses component
- [ ] Enter/Space activates toggle
- [ ] Tag badge (if clickable) has clear role (button or link)

### Styling

- [ ] Uses TailwindCSS classes only (no inline styles)
- [ ] Unfilled heart: gray or muted color
- [ ] Filled heart: red, green, or accent color (consistent with app theme)
- [ ] Dark mode support (colors work in dark theme)
- [ ] Hover state: heart brightens or scales slightly
- [ ] Focus state: outline or ring visible (WCAG)
- [ ] Tag badge: subtle background (light gray) with text
- [ ] Tag badge in dark mode: darker background

### Props

- [ ] `exerciseId: string` — Required, identifies exercise in storage
- [ ] `onTagsClick?: () => void` — Optional, called on tag badge click
- [ ] `className?: string` — Optional, appended to root element
- [ ] Renders correctly with/without `onTagsClick`
- [ ] Renders correctly with/without tags

### State Management

- [ ] Component reads from localStorage on mount (via `isFavorite()`)
- [ ] Component reads tags via `getExerciseTags()` on mount
- [ ] Component updates visual state when clicked
- [ ] No React state used; purely derived from storage
- [ ] Re-renders correctly if external code updates storage (e.g., another tab)

### Initial Render

- [ ] First render shows correct favorite state
- [ ] First render shows correct tag count
- [ ] No flashing or visual jank during initial load

---

## Edge Cases

1. **No tags** — Component renders heart only; no badge shown
2. **Many tags** — Exact count shown (e.g., "[27]"); no truncation
3. **Favorite unfavorited** — Heart unfills immediately on click
4. **Storage unavailable** — Component still renders (gracefully degrades)
5. **Missing exercise** — Component renders as unfavorited (no error)
6. **Very long exercise ID** — Only used internally; no display impact

---

## Notes

- **No modal/popover logic** — This component only handles favorite toggle and tag click callback; TagInput popover is separate (spec 04)
- **Storage integration** — Component calls `isFavorite()`, `toggleFavorite()`, and `getExerciseTags()` from spec 01
- **Icon library** — Use existing icon system (Heroicons, if available, or custom SVG)
- **Single responsibility** — Only manages heart icon + tag badge; doesn't render tag input or manage tags directly
- **Parent-driven tags UI** — Parent component (ExerciseCard or ExerciseBrowser) handles tag management modal

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [ ] Component created at `packages/ui/src/components/molecules/FavoriteButton/`
- [ ] Component exported via `packages/ui/src/index.ts`
- [ ] All props documented in JSDoc
- [ ] Component tests written (15+ tests expected):
  - [ ] Toggle favorite on/off
  - [ ] Display tag count
  - [ ] Tag click callback
  - [ ] Accessibility attributes
  - [ ] Dark mode rendering
  - [ ] Edge cases (no tags, many tags)
- [ ] All tests pass
- [ ] No regressions in existing UI tests
- [ ] Linting passes
- [ ] Storybook story created (optional but recommended)
