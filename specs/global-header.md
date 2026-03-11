# Spec: Global Header with Theme Selector

**Status:** Draft
**Version:** 0.1.0
**Last updated:** 2026-03-11

---

## Problem

Currently, the theme toggle (light/dark mode selector) is only available on the homepage (`/`). Users must navigate to the homepage to change the theme, and the toggle is not accessible from other pages like `/import` or other future pages.

This creates a poor user experience where theme switching is limited to a single page and users cannot customize their experience while practicing or using other features.

---

## User Stories

1. **As a musician**, I want to access the theme toggle from any page so that I can change between light and dark mode at any time without returning to the homepage.

2. **As a musician**, I want the theme toggle to be part of the main application layout so that it is consistently available across all pages.

3. **As a developer**, I want to reuse the existing `ThemeToggle` component so that we maintain a single source of truth for theme switching logic.

---

## Acceptance Criteria

### Global Header Component

- [ ] A **Header component** exists as a reusable React component in `packages/ui/src/components/molecules/Header/`.
- [ ] The Header component includes the theme toggle from `ThemeToggle` (atoms).
- [ ] The Header renders at the top of the page with consistent styling across all pages.
- [ ] The Header uses appropriate ARIA labels and semantic HTML for accessibility.

### Integration with Layout

- [ ] The Header is integrated into `apps/web/src/layouts/BaseLayout.astro` so it renders on every page.
- [ ] The Header appears above the main content slot (`<slot />`).
- [ ] The theme toggle in the Header manages the same theme state as the existing implementation.
- [ ] Changing the theme via the Header toggle updates the theme globally across all pages.

### Removal of Inline Toggle

- [ ] The theme toggle is removed from the `Homepage` component (currently in `apps/web/src/components/Homepage.tsx`).
- [ ] All theme management logic for the global toggle is moved from `Homepage` to the Header.
- [ ] The `Homepage` component is simplified by removing redundant theme state management.

### Theme Persistence & Behavior

- [ ] The theme preference is persisted using the same mechanism as before (`sessionStorage`).
- [ ] The initial theme detection (system preference vs. saved preference) works identically to the current implementation.
- [ ] The `<html>` element correctly receives the `dark` class when in dark mode.
- [ ] Light mode removes the `dark` class from the `<html>` element.

### Visual Design & Consistency

- [ ] The Header layout is clean and unobtrusive (minimal height, appropriate padding).
- [ ] The Header uses existing UI components (Button, spacing utilities) from `@groovelab/ui`.
- [ ] The Header styling matches the overall design language of GrooveLab (light and dark mode support).
- [ ] The Header is responsive and works correctly on viewport widths from 320 px to 1440 px.

### Accessibility

- [ ] The Header is properly announced by screen readers.
- [ ] The theme toggle button has a descriptive `aria-label` (e.g., "Switch to dark mode" or "Switch to light mode").
- [ ] Keyboard navigation: users can tab to the toggle and activate it with Enter or Space.
- [ ] The Header does not create focus traps or accessibility issues.

---

## Technical Notes

### Existing Components

- **ThemeToggle** (`packages/ui/src/components/atoms/ThemeToggle/ThemeToggle.tsx`): A simple button component that displays a moon/sun emoji and calls an `onToggle` callback.
- **BaseLayout** (`apps/web/src/layouts/BaseLayout.astro`): The main Astro layout that wraps all pages. Contains the theme initialization script.
- **Homepage** (`apps/web/src/components/Homepage.tsx`): Currently manages theme state with `getInitialTheme()`, `useState`, and `useEffect`.

### Theme State Management

The Header component should:
1. Follow the same theme detection logic as `Homepage.getInitialTheme()` (check sessionStorage → check system preference → default to light).
2. Store the selected theme in `sessionStorage` with key `'theme'`.
3. Update the `<html>` element's class list by adding/removing the `'dark'` class.
4. Use React hooks (`useState`, `useEffect`) to manage theme state client-side.

### Component Location

- **Header component**: `packages/ui/src/components/molecules/Header/Header.tsx`
- **Header index**: `packages/ui/src/components/molecules/Header/index.ts`
- **Header export**: Add to `packages/ui/src/index.ts` alongside other molecule exports.

### Integration Steps

1. Create the Header component in `packages/ui/src/components/molecules/Header/`.
2. Export it from `packages/ui/src/index.ts` as `Header`.
3. Mount the Header in `BaseLayout.astro` before the `<slot />`.
4. Remove the theme toggle from `Homepage.tsx` and simplify theme state management (or remove entirely if no longer needed).
5. Update `Homepage` tests to reflect the removal of theme logic.

### Types

Use types from `@groovelab/types` if needed. No new types are required for this iteration — the Header uses the existing `'light' | 'dark'` string type.

### No New Dependencies

The Header component reuses all existing packages and does not introduce new dependencies.

---

## Out of Scope

This feature explicitly **does not include**:

- Additional header features beyond the theme toggle (navigation links, logo, user menu, etc.) — these can be added in future iterations.
- Changes to the theme system logic (persistence, detection, CSS class handling) — only structural reorganization.
- Styling overhauls or design system changes — the Header follows existing patterns.
- Server-side theme preference storage or database integration.
- Multi-language support or localization strings.

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [ ] Header component created in `packages/ui/src/components/molecules/Header/`
- [ ] Header component properly exports theme state and toggle logic
- [ ] Header is mounted in `BaseLayout.astro` at the top of the page
- [ ] Theme toggle removed from `Homepage.tsx`
- [ ] Theme state management centralized in the Header component
- [ ] Theme persistence and detection logic works identically to the previous implementation
- [ ] All pages render the Header without errors
- [ ] Header is keyboard-accessible (tab, Enter/Space to toggle)
- [ ] Header is responsive on all viewport sizes (320px–1440px)
- [ ] Existing tests for Homepage updated or removed as needed
- [ ] New tests added for Header component functionality
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] No regressions in existing tests
