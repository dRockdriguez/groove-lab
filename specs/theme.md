# Spec: Light and Dark Mode Support

**Status:** Draft
**Version:** 0.4.0
**Last updated:** 2026-03-10

---

## Problem

Musicians use GrooveLab for long practice sessions in a wide range of lighting conditions — bright studios, dim rehearsal rooms, and home practice environments.

The current application has a single visual theme which can become uncomfortable or difficult to read depending on ambient lighting. Without a theme system, the UI cannot adapt to user preferences or environment.

GrooveLab must support **light mode and dark mode** so the interface remains comfortable and readable in all conditions.

---

## User Stories

1. **As a musician**, I want a visible toggle that switches between light and dark mode so that I can adjust the interface to my environment.

2. **As a musician practicing in a dim room**, I want a dark theme that reduces screen glare so that I can practice for longer without eye strain.

3. **As a musician navigating the application**, I want the selected theme to remain active while I interact with the UI so that the experience stays visually consistent.

4. **As a musician**, I want GrooveLab to respect my system's preferred color scheme so that the interface matches my operating system settings automatically on first load.

---

## Acceptance Criteria

### Theme Toggle

- [ ] A `ThemeToggle` atom component exists in `packages/ui`.
- [ ] The `ThemeToggle` is rendered in the top-right corner of the page header.
- [ ] The toggle renders a `<button>` element.
- [ ] The toggle displays a moon emoji (`🌙`) when light mode is active and a sun emoji (`☀️`) when dark mode is active.
- [ ] Clicking the toggle switches between **light** and **dark** themes.
- [ ] The toggle has an accessible label:
  - `aria-label="Switch to dark mode"` when light mode is active
  - `aria-label="Switch to light mode"` when dark mode is active
- [ ] The toggle is keyboard accessible (focusable and activatable with Enter or Space).

---

### Theme Root Application

- [ ] Tailwind dark mode uses the **class strategy**.
- [ ] The root `<html>` element controls the theme.
- [ ] When the user activates dark mode, the `<html>` element receives the class `dark`.
- [ ] When the user activates light mode, the `dark` class is removed from `<html>`.

Example expected DOM state:

```html
<html class="dark">
```

---

### Global Theme Behavior

- [ ] The application detects the user's preferred color scheme using `prefers-color-scheme`.
- [ ] On first load, the application initializes the theme according to the system preference:
  - `prefers-color-scheme: dark` → dark mode
  - `prefers-color-scheme: light` → light mode
- [ ] If the user manually toggles the theme, that choice overrides the system preference for the current session (a "session" is the lifetime of a single browser tab).
- [ ] Switching themes updates the UI immediately without reloading the page.
- [ ] The selected theme persists across Astro page navigations within the same tab using `sessionStorage`.
- [ ] No cross-session persistence mechanisms are used (`localStorage`, cookies, or server storage are prohibited).
- [ ] If `window.matchMedia` is unavailable or returns no preference, the application defaults to light mode.
- [ ] An inline `<script>` in the `<head>` of `BaseLayout.astro` reads `sessionStorage` first, then falls back to `prefers-color-scheme`, and applies the `dark` class on `<html>` synchronously before first paint (FOIT prevention).

---

### Component Theme Support

The following components must support both themes using Tailwind `dark:` variants.

#### Button

Must support:

```css
bg-white dark:bg-gray-800
text-gray-900 dark:text-gray-100
border-gray-200 dark:border-gray-700
```

#### ExerciseCard

Must support:

```css
bg-white dark:bg-gray-800
text-gray-900 dark:text-gray-100
border-gray-200 dark:border-gray-700
```

#### InstrumentButton

Must support:

```css
bg-white dark:bg-gray-800
text-gray-900 dark:text-gray-100
border-gray-200 dark:border-gray-700
ring-offset-white dark:ring-offset-gray-900
```

Selected state:

```css
bg-indigo-600 dark:bg-indigo-500
text-white dark:text-white
```

#### WelcomeBanner

Subtitle text must support:

```css
text-gray-500 dark:text-gray-400
```

#### ExerciseSectionList

Section titles must support:

```css
text-gray-900 dark:text-gray-100
```

#### ExerciseBrowser

Background container must support:

```css
bg-gray-50 dark:bg-gray-900
```

#### Page Styling

The application background must change depending on theme.

| Mode | Classes |
|------|---------|
| Light | `bg-gray-50 text-gray-900` |
| Dark | `dark:bg-gray-900 dark:text-gray-100` |

---

### Theme Transition

- [ ] `transition-colors duration-200` must be applied to the `<body>` element.
- [ ] Individual components may also include transition classes on their themed elements.
- [ ] Transition duration must not exceed 200ms.

---

## Technical Notes

### Tailwind Configuration

File: `apps/web/tailwind.config.mjs`

Must contain:

```js
export default {
  darkMode: "class"
}
```

### ThemeToggle Component

Location: `packages/ui/src/components/atoms/ThemeToggle/`

Files:

- `ThemeToggle.tsx`
- `index.ts`
- `ThemeToggle.test.tsx`

Component API:

```ts
interface ThemeToggleProps {
  theme: "light" | "dark";
  onToggle: () => void;
}
```

The component must be **stateless** and controlled by the parent.

### Theme State Owner

Theme state is owned by the application shell (Astro page or layout).

`BaseLayout.astro` is responsible for:
- The inline `<script>` in `<head>` that reads `sessionStorage`, falls back to `prefers-color-scheme`, and applies the `dark` class synchronously before first paint.
- Applying `transition-colors duration-200` on the `<body>` element.
- Applying `dark:bg-gray-900 dark:text-gray-100` on the `<body>` element.

The implementation must:

1. Detect the system theme using `window.matchMedia('(prefers-color-scheme: dark)')`.
2. Initialize the application theme accordingly (default to light if no preference).
3. Maintain a theme state (`light | dark`).
4. Toggle the `dark` class on the `<html>` element.
5. Write the current theme to `sessionStorage` on toggle.
6. Pass `theme` and `onToggle` to `ThemeToggle`.

Example behavior:

```ts
function toggleTheme() {
  if (theme === "light") {
    setTheme("dark");
    document.documentElement.classList.add("dark");
  } else {
    setTheme("light");
    document.documentElement.classList.remove("dark");
  }
}
```

### System Changes Required

The following files must be modified to support dark mode:

- `apps/web/tailwind.config.mjs`
- `apps/web/src/pages/index.astro`
- `apps/web/src/layouts/BaseLayout.astro`
- `apps/web/src/components/WelcomeBanner.tsx`
- `apps/web/src/components/Homepage.tsx`
- `packages/ui/src/components/atoms/Button/Button.tsx`
- `packages/ui/src/components/atoms/InstrumentButton/InstrumentButton.tsx`
- `packages/ui/src/components/molecules/ExerciseCard/ExerciseCard.tsx`
- `packages/ui/src/components/molecules/ExerciseSectionList/ExerciseSectionList.tsx`
- `packages/ui/src/components/organisms/ExerciseBrowser/ExerciseBrowser.tsx`

Each component must include Tailwind `dark:` variants for colors.

---

## Tests Required

### ThemeToggle

- renders correctly
- calls `onToggle` when clicked
- updates accessible label

### Theme Root Behavior

```
Given the application is in light mode
When the user toggles the theme
Then the <html> element has class "dark"

Given the application is in dark mode
When the user toggles the theme
Then the <html> element no longer has class "dark"
```

### System Preference

```
Given the system prefers dark mode
When the application loads
Then the <html> element starts with class "dark"
```

### sessionStorage Persistence

```
Given the user toggled to dark mode
When the user navigates to another page within the same tab
Then the <html> element still has class "dark"
And sessionStorage contains the theme value "dark"
```

### FOIT Prevention

```
Given the inline <script> in <head> runs before first paint
When sessionStorage contains "dark"
Then the <html> element has class "dark" before any content renders
```

### System Preference Fallback

```
Given matchMedia is unavailable or returns no preference
When the application loads
Then the application defaults to light mode (no "dark" class on <html>)
```

---

## Out of Scope

- Persisting theme preference across sessions (cross-tab or cross-browser-restart)
- Additional themes beyond light and dark
- Advanced animation effects

---

## Definition of Done

- [ ] `darkMode: "class"` enabled in Tailwind config
- [ ] `ThemeToggle` atom implemented in `packages/ui`
- [ ] `ThemeToggle` exported from `packages/ui/src/index.ts`
- [ ] `<html>` element receives `dark` class when dark mode is active
- [ ] System `prefers-color-scheme` is respected on first load
- [ ] Theme toggle visible on the homepage
- [ ] `Button` supports dark mode
- [ ] `InstrumentButton` supports dark mode
- [ ] `ExerciseCard` supports dark mode
- [ ] `ExerciseSectionList` supports dark mode
- [ ] `ExerciseBrowser` supports dark mode
- [ ] `WelcomeBanner` supports dark mode
- [ ] Application background changes between themes
- [ ] `BaseLayout.astro` updated with inline theme script and `dark:` body classes
- [ ] Theme persists across page navigations within the same tab via `sessionStorage`
- [ ] Theme switching animates within 200ms
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] No regressions in existing tests
