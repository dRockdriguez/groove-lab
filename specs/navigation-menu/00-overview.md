# Navigation Menu Feature — Overview

**Last updated:** 2026-03-25

## Problem Statement

The GrooveLab web application currently has no navigation menu. Users cannot easily navigate between Home, Import, and Practice pages without manually typing URLs. The Header component needs a responsive navigation menu that displays the current page and provides links to other sections.

## Architecture

```
Header (existing molecule)
├── NavigationMenu (new atom)
│   └── Renders links with active state
├── ThemeToggle (existing atom)
└── Layout: flex container with nav on left, toggle on right
```

The implementation follows these principles:
- **NavigationMenu atom**: Renders menu items with optional active state styling
- **Header integration**: Adds NavigationMenu to existing layout without breaking ThemeToggle
- **URL detection**: React island detects pathname from `window.location.pathname`
- **Responsive design**: Tailwind classes for mobile/desktop layout
- **Accessibility**: Semantic HTML (`<nav>`, `<a>` tags), proper ARIA attributes

## Routes

- Home: `/`
- Import: `/import`
- Practice: `/practice/[instrumentType]/[exerciseId]`

Active state detection logic:
- `/` active when pathname === `/`
- `/import` active when pathname starts with `/import`
- `/practice/*` active when pathname starts with `/practice`

## Mini-Specs (Execution Order)

1. **spec/01-navigation-menu-atom.md** — Build reusable NavigationMenu atom component
   - Accepts menu items, optional activeHref, className
   - Renders links with active state styling
   - No dependencies on other specs

2. **spec/02-header-navigation-integration.md** — Add NavigationMenu to existing Header
   - Integrate NavigationMenu into Header layout
   - Ensure ThemeToggle remains unaffected
   - Depends on spec/01

3. **spec/03-active-state-detection.md** — Detect current page and mark as active
   - Detect pathname in React island
   - Pass activeHref to NavigationMenu
   - Handle edge cases (hash links, query params, SSR context)
   - Depends on spec/02

## Design Patterns

- **Atomic Design**: NavigationMenu is an atom (reusable link list)
- **Composition**: Header is molecule that composes atoms
- **Component Props**: Explicit, testable interface (no global state)
- **Tailwind**: Responsive classes, dark mode support
- **Testing**: Unit tests per component, integration tests for Header

## Known Constraints

- Astro SSR context: `window.location` unavailable at build time (only in React island)
- No global router context (Astro doesn't provide one by default)
- Theme toggle must remain functional after adding navigation
- Atomic design: NavigationMenu should not know about routes or Header context
