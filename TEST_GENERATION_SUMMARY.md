# Test Generation Summary: Theme Spec

**Generated:** 2026-03-11
**Spec:** `specs/theme.md`
**Status:** Tests created and ready for implementation

---

## Acceptance Criteria → Test Cases

### Theme Toggle Component Tests
**Location:** `packages/ui/src/components/atoms/ThemeToggle/ThemeToggle.test.tsx` (EXISTING)

✅ **Already implemented** with comprehensive coverage:
- Renders button element
- Displays moon emoji (🌙) in light mode
- Displays sun emoji (☀️) in dark mode
- Has accessible aria-labels
- Keyboard accessible (Enter, Space, Tab)
- Calls onToggle callback when clicked
- Controlled component (updates when props change)

---

## New Test Files Created

### 1. Theme Integration Tests
**Location:** `apps/web/src/__tests__/theme.test.ts`

**Coverage:**
- Theme Root Application (HTML element receives `dark` class)
- Global Theme Behavior (initialization, persistence, switching)
- System Preference Detection (`prefers-color-scheme`)
- sessionStorage Persistence across page navigations
- FOIT Prevention (inline script applies class before paint)
- Fallback behavior when matchMedia unavailable
- Theme Transition styles (`transition-colors duration-200`)
- BaseLayout integration

**Test Groups:**
1. **Theme Root Application** (3 tests)
   - Adds `dark` class to `<html>`
   - Removes `dark` class from `<html>`
   - Starts without `dark` class

2. **Global Theme Behavior** (11 tests)
   - System preference detection
   - sessionStorage read/write
   - Fallback logic
   - Cross-page navigation persistence
   - No localStorage/cookie usage
   - Theme switching without reload

3. **Theme Transition** (3 tests)
   - `transition-colors` class
   - `duration-200` class
   - Duration compliance

4. **BaseLayout Integration** (3 tests)
   - Body transition classes
   - Body dark mode classes
   - Inline script synchronous application

---

### 2. Component Theme Support Tests
**Location:** `apps/web/src/__tests__/component-theme-support.test.tsx`

**Coverage:**
- Button dark mode variants
- InstrumentButton dark mode variants + selected state
- ExerciseCard dark mode variants
- WelcomeBanner dark mode variants
- Page styling background/text colors

**Test Groups:**
1. **Button** (6 tests)
   - Light: `bg-white`, `text-gray-900`, `border-gray-200`
   - Dark: `dark:bg-gray-800`, `dark:text-gray-100`, `dark:border-gray-700`

2. **InstrumentButton** (10 tests)
   - Base state: light/dark backgrounds, text, borders, ring-offset
   - Selected state: `bg-indigo-600`, `dark:bg-indigo-500`, white text

3. **ExerciseCard** (6 tests)
   - Light: `bg-white`, `text-gray-900`, `border-gray-200`
   - Dark: `dark:bg-gray-800`, `dark:text-gray-100`, `dark:border-gray-700`

4. **WelcomeBanner** (2 tests)
   - Subtitle: `text-gray-500`, `dark:text-gray-400`

5. **Page Styling** (4 tests)
   - Light mode: `bg-gray-50`, `text-gray-900`
   - Dark mode: `dark:bg-gray-900`, `dark:text-gray-100`

---

## Test Statistics

| Category | Count |
|----------|-------|
| ThemeToggle tests (existing) | 7 |
| Theme integration tests (new) | 20 |
| Component theme tests (new) | 28 |
| **Total** | **55** |

---

## Test Execution

Run all theme-related tests:

```bash
# All tests
pnpm test

# Specific test files
pnpm --filter @groovelab/ui exec vitest run src/components/atoms/ThemeToggle/ThemeToggle.test.tsx
pnpm --filter @groovelab/web exec vitest run src/__tests__/theme.test.ts
pnpm --filter @groovelab/web exec vitest run src/__tests__/component-theme-support.test.tsx
```

---

## Implementation Readiness

Tests are now ready for implementation. They cover:

✅ Component behavior (ThemeToggle)
✅ Theme state management (initialization, switching, persistence)
✅ System integration (HTML element, sessionStorage, prefers-color-scheme)
✅ Component styling (dark: variants)
✅ Visual transitions (transition-colors duration-200)
✅ Accessibility (aria-labels, keyboard navigation)
✅ Cross-browser compatibility (matchMedia fallback)

**All tests currently FAIL** — they are ready for implementation against `specs/theme.md`.

---

## Next Steps

1. Implement ThemeToggle component (`packages/ui/src/components/atoms/ThemeToggle/ThemeToggle.tsx`)
2. Create theme hook/state management in BaseLayout.astro
3. Add Tailwind `darkMode: "class"` configuration
4. Add dark: variants to all components
5. Implement inline script for FOIT prevention
6. Run tests and verify all pass
