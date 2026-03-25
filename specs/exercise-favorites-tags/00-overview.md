# Overview: Exercise Favorites & Tags

## Problem Summary

Users want to organize exercises in an exercise library by:
1. Marking exercises as "favorites" (quick-access, heart button)
2. Creating custom tags to categorize exercises (user-defined, not predefined)
3. Filtering exercises by selected tags (AND logic — show only exercises with ALL selected tags)

All data is stored in `localStorage` with no backend sync. Tags are independent of favorites (unfavoriting doesn't delete tags, but tags remain searchable).

## User Workflows

**Workflow 1: Favorite & Tag an Exercise**
1. User sees an exercise in the library
2. Clicks heart button → exercise marked as favorite
3. Clicks heart button again (or via popover) → can add/manage tags
4. Types custom tag, confirms → tag saved with exercise
5. Tags persist in localStorage

**Workflow 2: Filter by Tags**
1. User sees tag filter area (section in exercise library)
2. Clicks available tags or searches for tags
3. Selects multiple tags → library shows ONLY exercises matching ALL selected tags
4. Unselects tag → library updates immediately
5. Filter state persists in sessionStorage (clears on refresh)

**Workflow 3: Manage Favorites**
1. User can filter to show "Favorites only" (toggle/section)
2. Can unfavorite exercises (heart button or favorites list)
3. Unfavoriting removes from favorites but preserves tags

## Affected Files

```
packages/utils/src/index.ts
  ├─ New utilities: storage functions (spec 01)
  └─ New utilities: filter/tag logic (spec 02)

packages/types/src/index.ts
  └─ New types: FavoritesStore, ExerciseTagsStore (spec 01)

packages/ui/src/components/molecules/FavoriteButton/
  └─ FavoriteButton.tsx (spec 03)

packages/ui/src/components/molecules/TagInput/
  └─ TagInput.tsx (spec 04)

packages/ui/src/components/molecules/TagFilter/
  └─ TagFilter.tsx (spec 05)

packages/ui/src/components/molecules/ExerciseCard/
  └─ ExerciseCard.tsx (enhanced, spec 06)

packages/ui/src/components/organisms/ExerciseBrowser/
  └─ ExerciseBrowser.tsx (enhanced, spec 07)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ ExerciseBrowser (Page-Level State)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │ Favorites Filter │  │ Tag Filter                           │ │
│  │ (Toggle)         │  │ ├─ TagFilter (molecule)              │ │
│  │                  │  │ │  ├─ Selected tags state            │ │
│  │                  │  │ │  ├─ Available tags (derived)       │ │
│  │                  │  │ │  └─ Filter buttons/search          │ │
│  └──────────────────┘  │ └──────────────────────────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ Filtered Exercise List                                       │ │
│  │ ├─ Load favorites + tags from localStorage                   │ │
│  │ ├─ Filter by: instrument + favorites (if toggled) + tags   │ │
│  │ └─ ExerciseCard for each exercise                           │ │
│  │    ├─ FavoriteButton (molecule)                             │ │
│  │    │  └─ Heart icon + tag count                             │ │
│  │    │     └─ Click → TagInput popover (spec 04)              │ │
│  │    └─ Standard card layout                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ State:                                                           │
│ ├─ selectedInstrument (existing)                                │
│ ├─ expandedSections (existing)                                  │
│ ├─ showFavoritesOnly (new)                                      │
│ ├─ selectedFilterTags (new, sessionStorage)                     │
│ ├─ favorites (localStorage)                                     │
│ └─ tags (localStorage)                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Mini-Specs and Execution Order

Specs are organized by dependency layer:
- **Spec 01** (storage/utils) — No dependencies; foundation
- **Spec 02** (tag logic) — Depends on spec 01
- **Specs 03, 04, 05** (UI components) — Depend on spec 01, independent from each other
- **Spec 06** (ExerciseCard enhancement) — Depends on spec 03
- **Spec 07** (ExerciseBrowser integration) — Depends on specs 02, 03, 04, 05, 06
- **Spec 08** (Real-time sync) — Depends on spec 01; enhances all downstream components
- **Spec 09** (Inline badges) — Depends on specs 01, 03, 08; improves ExerciseCard UX

| # | File | Scope | Dependency |
|---|------|-------|------------|
| 01 | `01-storage-layer.md` | localStorage/sessionStorage utilities; FavoritesStore & TagsStore types | none |
| 02 | `02-tag-filter-logic.md` | Filter/search exercises by tags & favorites (AND logic, distinct tags) | 01 |
| 03 | `03-favorite-button.md` | Heart button component (toggle favorite, show tag count) | 01 |
| 04 | `04-tag-input.md` | Modal/popover input for adding/removing tags to an exercise | 01 |
| 05 | `05-tag-filter.md` | Filter UI: available tags, selection, search, clear button | 02 |
| 06 | `06-exercise-card-enhancement.md` | Integrate FavoriteButton into ExerciseCard | 03 |
| 07 | `07-exercise-browser-integration.md` | Integrate all: favorites toggle, tag filtering, updated ExerciseCard | 02, 03, 04, 05, 06 |
| 08 | `08-real-time-tag-updates.md` | Real-time localStorage sync via hook/notifier (cross-tab & in-tab) | 01 |
| 09 | `09-inline-tag-badges.md` | Display up to 3 tags as badges in ExerciseCard, "+X more" indicator | 01, 03, 08 |

---

## Key Design Decisions

1. **localStorage for data** — FavoritesStore keyed by `exerciseId`, TagsStore keyed by `exerciseId`
2. **sessionStorage for filter state** — Selected filter tags persist within session but clear on refresh
3. **AND logic for multi-tag filtering** — Exercise must have ALL selected tags to appear
4. **Heart button dual action** — Single click toggles favorite; shift+click or icon click in popover opens tag management
5. **Independent data** — Unfavoriting doesn't delete tags; tags can exist without favorites
6. **Distinct tag list** — TagFilter shows unique tags across all exercises, sorted alphabetically
7. **No predefined tags** — Tags are user-created as they're added to exercises
8. **Popover, not modal** — TagInput appears as floating UI near FavoriteButton for minimal disruption

---

## Test Strategy

- **Spec 01**: Storage layer utility tests (get/set favorites, get/set tags, retrieve distinct tags)
- **Spec 02**: Tag filter logic tests (filter by tags, filter by favorites, combined filters)
- **Spec 03**: FavoriteButton component tests (toggle, visual state, tag count display)
- **Spec 04**: TagInput popover tests (add tag, remove tag, validation, keyboard interaction)
- **Spec 05**: TagFilter component tests (tag selection, search, clear, visual state)
- **Spec 06**: ExerciseCard tests (integration, no breaking changes)
- **Spec 07**: ExerciseBrowser integration tests (full flow, state management, filtering)

---

## Out of Scope

- Backend sync/API for favorites/tags
- Global tag management page (tags managed inline only)
- Tag deletion UI (only removal from individual exercises)
- Export/import of favorites or tags
- Tag ordering/pinning
- Shared favorites/tags between users
- Tag autocomplete suggestions (user can type freely)
- Analytics on favorite/tag usage

---

## Status

- **Status**: In Progress
- **Created**: 2026-03-23
- **Last updated**: 2026-03-25
- **Specs 01–07**: Implemented and verified
- **Specs 08–09**: Draft (created 2026-03-25)
- **Next phase**: Implement Specs 08 & 09 to address real-time sync + UX improvements
