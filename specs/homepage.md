# Spec: Homepage — Exercise Browser Entry Point

**Status:** Implemented
**Version:** 0.1.0
**Last updated:** 2026-03-10

---

## Problem

When a musician opens GrooveLab for the first time, there is no clear entry point to start
practicing. The application has exercise browser components (see `specs/browse-exercises.md`)
but no page that assembles and presents them as the starting screen.

Without a homepage that immediately surfaces the exercise browser, users must navigate elsewhere
to find content — adding friction to a practice-first tool where the goal is to get musicians
playing as fast as possible.

---

## User Stories

1. **As a musician visiting GrooveLab**, I want the homepage to immediately show me the exercise
   browser so that I can start exploring practice exercises without navigating to another page.

2. **As a musician**, I want Drums to be the pre-selected instrument on arrival so that the most
   common use case (e-drums) requires zero clicks to start browsing.

3. **As a musician**, I want clicking an exercise on the homepage to take me to the exercise
   practice page so that I can begin practicing with a single click from the entry point.

---

## Acceptance Criteria

### Page Exists and Loads

- [x] Navigating to `/` renders the homepage without an error.
- [x] The page title is "GrooveLab".
- [x] The `ExerciseBrowser` organism is the primary content of the page.

### Initial State

- [x] On first load, **Drums** (`electronic-drums`) is the selected instrument.
- [x] The exercise list for Drums is visible immediately — no interaction is required.
- [x] Mock exercise data is loaded from `apps/web/src/data/mockExercises.ts` as a static import
  (no API call, no loading state).

### Instrument Selection

- [x] Switching instruments on the homepage updates the exercise list immediately.
- [x] The selected instrument state is managed by the page (or island) — not persisted between
  page loads.

### Exercise Navigation

- [x] Each exercise card on the homepage links to `/practice/{instrumentType}/{exerciseId}`.
- [x] Clicking an exercise card navigates to that URL (standard `<a>` link behaviour).

### Accessibility

- [x] The page is navigable by keyboard from instrument selector through to exercise cards.
- [x] Instrument tabs satisfy the WAI-ARIA Tabs pattern (`role="tablist"` / `role="tab"` /
  `aria-selected`) as specified in `specs/browse-exercises.md`.

---

## Technical Notes

### Implementation

- **File:** `apps/web/src/pages/index.astro`
- The page imports `ExerciseBrowser` from `@groovelab/ui`.
- The page imports the mock dataset from `apps/web/src/data/mockExercises.ts`.
- Because instrument selection involves client-side state, `ExerciseBrowser` must be mounted as
  a React island using Astro's `client:load` directive.
- No server-side data fetching is required.

### Types used

From `@groovelab/types`:

```ts
export type InstrumentType = 'electronic-drums' | 'bass-guitar' | 'guitar';

export interface InstrumentExercises {
  instrumentType: InstrumentType;
  sections: ExerciseSection[];
}
```

### Component reference

All component implementation details (structure, ARIA roles, keyboard handling, mock data
shape) are specified in `specs/browse-exercises.md`. This spec governs only the page that
assembles those components.

### Assumptions

- The `/practice/{instrumentType}/{exerciseId}` route does not need to exist for this spec to
  be complete — a 404 on navigation is acceptable at this stage.
- No header, footer, or navigation shell is required for this iteration.

---

## Out of Scope

- Audio or MIDI playback
- Backend API or dynamic data fetching
- User authentication or personalisation
- Persisting the selected instrument across visits
- Any page other than the homepage (`/`)
- The exercise practice page (`/practice/...`)

---

## Definition of Done

- [x] Spec reviewed and accepted
- [x] `apps/web/src/pages/index.astro` created and renders `ExerciseBrowser` as a React island
- [x] Mock data imported from `apps/web/src/data/mockExercises.ts`
- [x] Default instrument is Drums on page load
- [x] Instrument switching works in the browser without a page reload
- [x] Clicking an exercise navigates to `/practice/{instrumentType}/{exerciseId}`
- [x] Page is keyboard-accessible end-to-end
- [x] All tests pass (`pnpm test`)
- [x] Linting passes (`pnpm lint`)
- [x] No regressions in existing tests
