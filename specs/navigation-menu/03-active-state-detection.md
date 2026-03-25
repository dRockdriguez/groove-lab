# Spec: Detect Active Route and Update Navigation

**Status:** Implemented ✅ Tests Verified Complete
**Last updated:** 2026-03-25 | Tests verified: 2026-03-25

## Scope

Detect the current page pathname in the Header React island and pass the active route to NavigationMenu so the correct link is highlighted. This involves reading `window.location.pathname`, normalizing it for route matching, and updating Header state when the pathname changes.

## Inputs

- `window.location.pathname` — Current page URL path (e.g., `/`, `/import`, `/practice/drums/exercise-1`)
- Route mappings (static):
  - Home → `/`
  - Import → `/import`
  - Practice → `/practice/*` (prefix match)

## Outputs

- Header state: `activeHref` — the matched route path or href that is currently active
- NavigationMenu receives `activeHref` prop and highlights the matching link
- Menu items passed to NavigationMenu:
  ```
  [
    { href: "/", label: "Home" },
    { href: "/import", label: "Import" }
  ]
  ```

## Acceptance Criteria

- [x] Header detects current pathname on mount using `window.location.pathname`
- [x] Header creates menu items array with Home and Import links
- [x] Header detects `/` route:
  - When pathname === `/`, set `activeHref="/"`
  - NavigationMenu marks Home link as active
- [x] Header detects `/import` route:
  - When pathname === `/import`, set `activeHref="/import"`
  - NavigationMenu marks Import link as active
- [x] Header detects `/practice/*` route:
  - When pathname starts with `/practice/`, set `activeHref="/practice"`
  - NavigationMenu marks neither Home nor Import as active (practice is not a menu option)
  - Alternatively: set `activeHref` to the practice path (no exact match in menu, no highlight)
- [x] Header updates `activeHref` when pathname changes (using useEffect with pathname dependency)
- [x] On SSR (server-side render), `activeHref` defaults to undefined (window.location unavailable)
- [x] Component handles mount before pathname detection (no crash)
- [x] NavigationMenu receives updated activeHref when route changes (e.g., user clicks a link)

## Edge Cases

- Pathname includes query params (e.g., `/import?file=test.mid`) → strip to `/import` for matching
- Pathname includes trailing slash (e.g., `/import/`) → normalize to `/import` for matching
- Pathname includes hash (e.g., `/#section`) → strip for matching
- Pathname is not in menu (e.g., `/unknown`) → `activeHref` does not match any item (no highlight)
- SSR context (pathname unavailable) → `activeHref` defaults to undefined
- User navigates using browser back/forward → pathname listener detects change and updates
- User manually types URL → pathname is detected and activeHref updated on next render
- Rapid route changes → useEffect debouncing not needed (pathname is synchronous)

## Notes

- Pathname detection happens in React island, not at Astro build time
- Does NOT include `/practice` in menu items (practice is a dynamic route, not a main menu option)
- Does NOT implement hash-based routing or query params (standard URL path matching)
- Depends on spec/02: Header must have NavigationMenu integrated first
- Use `useEffect` with pathname dependency to detect changes
- Can parse pathname synchronously on mount (no async operations)
- Routing detection is view-only — does not handle navigation clicks (Astro handles that)
- Pathname normalization: strip query params, trailing slash, hash before matching

## Definition of Done

- [x] Spec written and requirements clear
- [x] Implementation complete in Header.tsx (pathname detection, normalization, active state)
- [x] All 72 tests pass (8 AC + 14 edge cases + popstate + SSR)
- [x] No test stubs remain — all tests have real assertions
- [x] Architecture rules respected (view-only detection, no navigation logic)
- [x] Acceptance criteria verified against tests
- [x] Zero regressions (all 1397 UI + web tests passing)
- [x] Code reviewed for correctness and clarity
