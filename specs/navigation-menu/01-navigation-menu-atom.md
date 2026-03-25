# Spec: NavigationMenu Atom Component

**Status:** Implemented
**Last updated:** 2026-03-25

## Scope

Build a reusable NavigationMenu atom component that renders a list of navigation links with optional active state styling. The component accepts menu items as props and applies visual styling to indicate the currently active link.

## Inputs

- `items: Array<{ href: string; label: string }>` — Array of navigation links
- `activeHref?: string` — URL path of currently active page (used to highlight matching link)
- `className?: string` — Additional CSS classes for wrapper `<nav>` element

## Outputs

- Rendered `<nav>` element containing:
  - List of `<a>` links, each linking to `href` from items
  - Active link has Tailwind classes: `font-semibold text-blue-600 dark:text-blue-400`
  - Inactive links have classes: `text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400`
  - All links share: `transition-colors duration-200`

## Acceptance Criteria

- [x] Component renders `<nav>` with role="navigation"
- [x] Each item renders as `<a>` element with correct `href` attribute
- [x] Each link renders its `label` as text content
- [x] When `activeHref` matches an item's `href` exactly, that link gets active styling (semibold, blue color)
- [x] Inactive links render without active styling
- [x] When `activeHref` is undefined, no links are marked active
- [x] When `activeHref` matches no items, no links are marked active
- [x] Component applies `className` prop to `<nav>` wrapper if provided
- [x] Links are spaced with `gap-4` (16px) between them using flexbox
- [x] Component works in both light and dark modes (colors adapt with `dark:` prefix)
- [x] All links are keyboard accessible (Tab key focus, Enter key activates)
- [x] Links have descriptive text content for screen readers

## Edge Cases

- `items` array is empty → renders empty `<nav>`
- `activeHref` is `null` or `undefined` → no links are marked active
- `activeHref` contains trailing slash but item `href` doesn't (e.g., `/import/` vs `/import`) → no exact match
- `activeHref` is `/` and items contain both `/` and `/import` → only `/` is marked active (exact match)
- `className` contains conflicting Tailwind classes → last class wins (standard CSS specificity)
- Very long link labels → should wrap naturally (no fixed width)

## Definition of Done

- [x] Component implementation complete and tested
- [x] All 12 acceptance criteria verified by tests (49 comprehensive tests)
- [x] No functionality outside the spec
- [x] Architecture rules respected (atomic component, pure presentational, no routing logic)
- [x] All tests passing (49/49 ✅)
- [x] Zero regressions (1348 total UI tests passing)
- [x] Component exported from `packages/ui/src/index.ts`
- [x] Proper TypeScript interfaces (`NavigationMenuItem`, `NavigationMenuProps`)

## Notes

- This is a pure presentational atom — no routing logic, no pathname detection
- Does NOT handle active state detection (parent component provides `activeHref`)
- Follows atomic design: fully reusable, single responsibility
- Can be tested independently without Header or routing context
- Tailwind classes only — no custom CSS
- Uses semantic HTML (`<nav>`, `<a>`) for accessibility
