# Spec: Global Header with Theme Selector

**Status:** In Progress
**Version:** 0.2.0
**Last updated:** 2026-03-11

---

## Problem

Currently, the theme toggle (light/dark mode selector) is only available on the homepage (`/`). The toggle is embedded in the `Homepage` component, which means:

1. Users cannot access theme switching from other pages (e.g., `/import`).
2. Theme switching is coupled to the homepage, limiting design flexibility.
3. Each page that needs theme switching requires duplicate theme state management.

This creates friction for musicians who want to switch themes while on different pages, forcing them to navigate back to the homepage to adjust their viewing preference.

---

## User Stories

1. **As a musician using GrooveLab**, I want to access the theme toggle from every page so that I can switch between light and dark mode at any time without returning to the homepage.

2. **As a musician**, I want the theme toggle to be consistently positioned in a visible location (e.g., top-right) so that I can find it quickly across all pages.

3. **As a musician**, I want the theme selection to persist as I navigate between pages so that I don't lose my preference when moving from `/` to `/import` or other future pages.

4. **As a developer**, I want to reuse the existing `ThemeToggle` component in a centralized Header so that theme switching logic lives in one place, not scattered across multiple pages.

---

## Acceptance Criteria

### Header Component Creation

- [ ] A **Header** molecule component exists at `packages/ui/src/components/molecules/Header/Header.tsx`.
- [ ] Header component is exported from `packages/ui/src/components/molecules/Header/index.ts`.
- [ ] Header is added to `packages/ui/src/index.ts` alongside other molecule exports.
- [ ] Header component is a React functional component with `client:load` hydration directive support.
- [ ] Header has the TypeScript interface exported as `HeaderProps` (or no props if stateless).

### Header Functionality

- [ ] The Header renders a `<header>` semantic HTML element.
- [ ] The Header contains the `ThemeToggle` atom from `@groovelab/ui`.
- [ ] The Header manages theme state using `useState` and `useEffect` hooks.
- [ ] The Header implements the same `getInitialTheme()` logic as the current `Homepage` component:
  1. Check `sessionStorage.getItem('theme')` first.
  2. If no stored preference, check system preference with `window.matchMedia('(prefers-color-scheme: dark)')`.
  3. Default to `'light'` if no preference is detected.
- [ ] On theme toggle, the Header:
  1. Updates the component state.
  2. Adds or removes the `'dark'` class from `document.documentElement`.
  3. Writes the selected theme to `sessionStorage.setItem('theme', theme)`.

### Integration with BaseLayout

- [ ] The Header is mounted in `apps/web/src/layouts/BaseLayout.astro` before the `<slot />`.
- [ ] The Header is mounted as a React island with the `client:load` directive.
- [ ] The Header is positioned at the top of the visual layout (above all page content).
- [ ] The Header renders on **all pages** (`/`, `/import`, and any future pages).
- [ ] The Header does not cause hydration mismatches or console errors.

### Removal of Homepage Theme Management

- [ ] The theme toggle is removed from `apps/web/src/components/Homepage.tsx`.
- [ ] The `getInitialTheme()` function is removed from `Homepage.tsx` (theme detection is now in Header).
- [ ] The theme state management (`useState`, `useEffect` for theme) is removed from `Homepage.tsx`.
- [ ] The `handleToggle` function is removed from `Homepage.tsx`.
- [ ] The `Homepage` component no longer manages the `dark` class on `<html>`.
- [ ] The Homepage component still renders without errors after theme logic removal.

### Theme Persistence and Synchronization

- [ ] Theme state persists across page navigations within the same browser session (using `sessionStorage`).
  - **Test scenario**: User selects dark mode on `/`, navigates to `/import`, theme remains dark.
- [ ] Theme state persists in the Header component as the user navigates between pages.
  - **Test scenario**: User toggles theme on `/import`, returns to `/`, theme is still in the toggled state.
- [ ] The `<html>` element receives the `dark` class when in dark mode (set by the Header or BaseLayout script).
- [ ] The `<html>` element does not have the `dark` class when in light mode.

### Visual Design and Styling

- [ ] The Header has minimal height and appropriate padding (no more than 64px tall).
- [ ] The Header is positioned at the top of the page with full viewport width.
- [ ] The ThemeToggle is positioned on the right side of the Header.
- [ ] The Header uses only existing Tailwind classes — no new CSS is introduced.
- [ ] The Header background is transparent or matches the page background in light mode.
- [ ] The Header has appropriate spacing to not interfere with main content.
- [ ] The Header layout uses flexbox for responsive alignment (`flex justify-end` or similar).

### Responsive Design

- [ ] The Header renders correctly on mobile viewports (320px wide).
- [ ] The Header renders correctly on tablet viewports (768px wide).
- [ ] The Header renders correctly on desktop viewports (1024px+ wide).
- [ ] The theme toggle button remains clickable and accessible on all viewport sizes.
- [ ] No horizontal scrolling is introduced on narrow viewports.

### Accessibility

- [ ] The `<header>` element uses semantic HTML role and is properly structured.
- [ ] The ThemeToggle button retains its accessible ARIA labels:
  - `aria-label="Switch to dark mode"` when in light mode.
  - `aria-label="Switch to light mode"` when in dark mode.
- [ ] The theme toggle is keyboard-navigable: users can reach it with Tab and activate with Enter/Space.
- [ ] The theme toggle does not create a focus trap — focus can move beyond it with Tab.
- [ ] Screen readers properly announce the Header region (landmark navigation).

### Behavioral Correctness

- [ ] Toggling the theme updates the UI immediately (no page reload).
- [ ] Toggling the theme applies the `dark` class within ~200ms (smooth transition, not instant).
- [ ] The component does not flicker or show unstyled content during theme switches.
- [ ] Multiple rapid toggles are handled correctly (no state race conditions).
- [ ] SSR/Hydration: The Header does not cause `Hydration mismatch` errors in the console.

---

## Technical Notes

### Implementation Details

#### `Header.tsx` Structure

The Header component should follow this approximate structure:

```tsx
import React, { useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from '@groovelab/ui';

export const Header: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // getInitialTheme logic here
  // useEffect to read sessionStorage and system preference
  // useEffect to apply dark class to <html>
  // handleToggle callback

  return (
    <header className="...">
      <ThemeToggle theme={theme} onToggle={handleToggle} />
    </header>
  );
};
```

#### BaseLayout.astro Integration

The Header should be mounted before `<slot />`:

```astro
<body class="...">
  <Header client:load />
  <slot />
</body>
```

#### Inline Script in BaseLayout

The existing inline script in `BaseLayout.astro` `<head>` should remain unchanged — it prevents FOIT by setting the `dark` class before React hydrates. The Header component will take over theme management after React mounts.

### File Changes Summary

| File | Change | Reason |
|------|--------|--------|
| `packages/ui/src/components/molecules/Header/Header.tsx` | Create | New Header component |
| `packages/ui/src/components/molecules/Header/index.ts` | Create | Export Header |
| `packages/ui/src/index.ts` | Edit | Add Header export |
| `apps/web/src/layouts/BaseLayout.astro` | Edit | Add Header before slot |
| `apps/web/src/components/Homepage.tsx` | Edit | Remove theme state and toggle |
| `apps/web/src/pages/index.astro` | Possibly edit | If Homepage component import/usage changes |

### Testing Strategy

For testing the Header component in `Header.test.tsx`:

1. **Initial theme detection**: Mock `sessionStorage` and `window.matchMedia`, verify Header detects theme correctly.
2. **Theme toggle**: Verify clicking the toggle updates the component state.
3. **DOM mutation**: Verify the `dark` class is added/removed from `document.documentElement`.
4. **sessionStorage persistence**: Verify theme is written to `sessionStorage` on toggle.
5. **Hydration**: Render Header in an Astro page, verify no hydration errors in browser console.
6. **Accessibility**: Verify `aria-label` updates correctly and button is keyboard-focusable.

### No New Dependencies

The Header component uses only React and existing imports:
- `@groovelab/ui` (ThemeToggle)
- React built-ins (`useState`, `useEffect`, `useCallback`)

No new npm packages are introduced.

---

## Out of Scope

This feature explicitly **does not include**:

- Additional header features beyond the theme toggle (navigation links, logo, branding, user menu, search, etc.) — these are deferred to future iterations.
- Changes to the theme system logic (localStorage persistence, additional themes, theme transitions) — only structural reorganization.
- Styling overhauls, design system refactors, or brand changes.
- Server-side theme preference storage or database integration.
- Multi-language support, localization, or internationalization (i18n).
- Mobile-specific header patterns (hamburger menus, navbars) — the Header remains minimal.

---

## Definition of Done

- [ ] Spec reviewed and accepted by the team
- [ ] `packages/ui/src/components/molecules/Header/Header.tsx` created with full theme management
- [ ] `packages/ui/src/components/molecules/Header/index.ts` created with proper export
- [ ] Header added to `packages/ui/src/index.ts` as a molecule export
- [ ] Header mounted in `apps/web/src/layouts/BaseLayout.astro` with `client:load` directive
- [ ] Theme state and toggle logic removed from `apps/web/src/components/Homepage.tsx`
- [ ] Theme persistence and initial detection verified with `sessionStorage` and `window.matchMedia`
- [ ] Header renders above the main content slot on all pages (verify on `/` and `/import`)
- [ ] `dark` class is correctly applied to `<html>` when theme is toggled
- [ ] No hydration mismatches or console errors when pages load
- [ ] Header is responsive on viewport widths 320px, 768px, and 1024px+
- [ ] Theme toggle is keyboard-accessible (Tab to focus, Enter/Space to activate)
- [ ] ARIA labels on ThemeToggle are correct and update when theme changes
- [ ] Header component tests created: initial theme, toggle behavior, DOM mutations, accessibility
- [ ] Homepage tests updated to reflect removal of theme state management
- [ ] All tests pass: `pnpm test` (Vitest for packages/ui and apps/web)
- [ ] No test regressions in existing test suite
- [ ] Linting passes: `pnpm lint` (ESLint + Prettier)
- [ ] Code is formatted correctly: `pnpm format`
