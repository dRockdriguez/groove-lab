# Spec: Integrate NavigationMenu into Header

**Status:** Implemented
**Last updated:** 2026-03-25
**Test Coverage:** All 11 acceptance criteria fully tested (33 tests passing)

## Scope

Modify the existing Header component to include the NavigationMenu atom alongside the existing ThemeToggle. The Header layout should flex navigation on the left and theme toggle on the right, with responsive spacing and alignment.

## Inputs

- Existing Header component at `packages/ui/src/components/molecules/Header/Header.tsx`
- NavigationMenu atom (from spec/01)
- No new props to Header interface (navigation items and active state will be added in spec/03)

## Outputs

- Updated Header component that renders:
  - `<header>` with updated flex layout (`justify-between` instead of `justify-end`)
  - NavigationMenu on the left side (flex-1 or flex-start)
  - ThemeToggle on the right side (flex-end)
  - Proper spacing and alignment maintained
  - Dark mode styles preserved
  - All existing theme toggle functionality unchanged

## Acceptance Criteria

- [x] Header renders `<header>` element with `role="banner"` (implicit)
- [x] Header has `className="w-full flex items-center justify-between px-4 py-2"`
- [x] NavigationMenu is rendered as a child (left side)
- [x] ThemeToggle is rendered as a child (right side)
- [x] Navigation and toggle are visually separated and properly aligned
- [x] ThemeToggle functionality is unaffected by navigation addition
- [x] Header accepts placeholder props for NavigationMenu:
  - `navigationItems: Array<{ href: string; label: string }>` (default: empty array or hardcoded test data)
  - `activeHref?: string` (default: undefined)
- [x] Header passes these props to NavigationMenu component
- [x] Header remains `client:load` in Astro layout (already is)
- [x] No changes to theme toggle initialization or behavior
- [x] Theme toggle still writes/reads from sessionStorage

## Edge Cases

- NavigationMenu has no items → Header still renders with empty space for nav (graceful)
- Both navigation and toggle present on small screens → layout remains intact (flexbox handles overflow)
- Theme toggle and navigation both receive focus → Tab order is logical (nav first, then toggle)
- Header renders before pathname is detected → NavigationMenu renders without activeHref (no crash)

## Definition of Done

- [x] Header component updated to accept `navigationItems` and `activeHref` props
- [x] Header renders NavigationMenu atom as first child (left side)
- [x] Header renders ThemeToggle as last child (right side)
- [x] Layout CSS correctly uses `justify-between` for left-right alignment
- [x] All 11 acceptance criteria verified by tests (33 comprehensive tests)
- [x] Theme toggle functionality preserved and unaffected by navigation addition
- [x] No functionality outside the spec
- [x] Architecture rules respected (layout only, no routing logic)
- [x] All tests passing (33/33 ✅)
- [x] Zero regressions (1358 total UI tests passing, 1 todo)
- [x] Header properly exported and typed

## Notes

- Does NOT implement pathname detection — spec/03 handles that
- NavigationMenu is rendered with placeholder items (hardcoded or empty)
- Header integration is layout-only; active state detection is separate concern
- Depends on spec/01: NavigationMenu atom must exist first
- Can be tested with mock items to verify layout without routing logic
- Keep theme toggle styling and behavior identical to current implementation
