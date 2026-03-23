# Spec: Favorite Button Component

**Status:** Implemented
**Last updated:** 2026-03-23 (verified)

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

- [x] Component renders a heart icon (SVG or icon library)
- [x] Heart is unfilled/hollow when exercise NOT favorited
- [x] Heart is filled/solid and colored (e.g., red or accent color) when favorited
- [x] Component displays tag count as badge if tags exist (e.g., "[3]" next to heart)
- [x] Tag badge shows in a small circle or inline text
- [x] Component is small and inline-friendly (no extra spacing)

### Favorite Toggle

- [x] Single click on heart icon toggles favorite state (on → off, off → on)
- [x] Click immediately updates visual state (filled/unfilled)
- [x] Click calls `toggleFavorite(exerciseId)` from storage layer
- [x] localStorage is updated on click
- [x] Multiple clicks work correctly (toggle multiple times)
- [x] No errors thrown if localStorage unavailable

### Tag Count Display

- [x] If exercise has tags, shows count (e.g., "[3 Tags]", "[1]")
- [x] If no tags, no badge is shown (heart only)
- [x] Count updates immediately if tags added/removed elsewhere
- [x] Clicking badge area (if present) calls `onTagsClick` callback

### Tag Click Handler

- [x] If `onTagsClick` prop provided, clicking tag badge fires callback
- [x] If `onTagsClick` not provided, tag area is not interactive (display-only)
- [x] Callback has no arguments (parent component responsible for state)

### Accessibility

- [x] Heart icon has `aria-label` (e.g., "Add to favorites" or "Remove from favorites")
- [x] Label updates based on favorite state
- [x] Component is keyboard-accessible (heart icon is a button or clickable element)
- [x] Tab key focuses component
- [x] Enter/Space activates toggle
- [x] Tag badge (if clickable) has clear role (button or link)

### Styling

- [x] Uses TailwindCSS classes only (no inline styles)
- [x] Unfilled heart: gray or muted color
- [x] Filled heart: red, green, or accent color (consistent with app theme)
- [x] Dark mode support (colors work in dark theme)
- [x] Hover state: heart brightens or scales slightly
- [x] Focus state: outline or ring visible (WCAG)
- [x] Tag badge: subtle background (light gray) with text
- [x] Tag badge in dark mode: darker background

### Props

- [x] `exerciseId: string` — Required, identifies exercise in storage
- [x] `onTagsClick?: () => void` — Optional, called on tag badge click
- [x] `className?: string` — Optional, appended to root element
- [x] Renders correctly with/without `onTagsClick`
- [x] Renders correctly with/without tags

### State Management

- [x] Component reads from localStorage on mount (via `isFavorite()`)
- [x] Component reads tags via `getExerciseTags()` on mount
- [x] Component updates visual state when clicked
- [x] No React state used; purely derived from storage
- [x] Re-renders correctly if external code updates storage (e.g., another tab)

### Initial Render

- [x] First render shows correct favorite state
- [x] First render shows correct tag count
- [x] No flashing or visual jank during initial load

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

- [x] Spec reviewed and accepted
- [x] Component created at `packages/ui/src/components/molecules/FavoriteButton/`
- [x] Component exported via `packages/ui/src/index.ts`
- [x] All props documented in JSDoc
- [x] Component tests written (15+ tests expected):
  - [x] Toggle favorite on/off
  - [x] Display tag count
  - [x] Tag click callback
  - [x] Accessibility attributes
  - [x] Dark mode rendering
  - [x] Edge cases (no tags, many tags)
- [x] All tests pass
- [x] No regressions in existing UI tests
- [x] Linting passes
- [ ] Storybook story created (optional but recommended)
