# Spec: Browse Practice Exercises by Instrument

**Status:** Draft
**Version:** 0.1.0
**Last updated:** 2026-03-09

---

## Problem

A new user opening GrooveLab for the first time has no clear entry point to start practicing.
The application needs an instrument selector and an exercise browser so the user can immediately
find relevant exercises grouped by section without requiring a backend, playback engine, or
MIDI connection.

Without this screen, users cannot discover or navigate to any practice content, making the
application unusable as a practice tool.

---

## User Stories

1. **As a musician**, I want to select my instrument from a list so that I only see exercises
   relevant to what I am practicing.

2. **As a musician**, I want to see all available exercises organized into sections so that I can
   quickly scan the available content and pick a starting point.

3. **As a musician**, I want each exercise to display a title and a description so that I can
   understand what the exercise is about before selecting it.

4. **As a musician**, I want to switch between instruments without leaving the browse screen so
   that I can explore exercises for any instrument with minimal friction.

5. **As a musician**, I want selecting an exercise to navigate me to the exercise playback screen
   so that I can begin practicing immediately after choosing an exercise.

---

## Acceptance Criteria

### Instrument Selector

- [ ] The instrument selector renders three options: **Drums**, **Bass**, **Guitar**.
- [ ] The selector reflects the `InstrumentType` values from `@groovelab/types`:
      `'electronic-drums'`, `'bass-guitar'`, `'guitar'`.
- [ ] One instrument is always selected; no state exists where no instrument is active.
- [ ] The currently selected instrument is visually distinguished from unselected ones.
- [ ] Clicking a different instrument updates the displayed exercises without a page reload.

### Exercise List

- [ ] When an instrument is selected, the exercise list renders only the exercises for that
      instrument.
- [ ] Exercises are grouped under named sections; each section heading is visible above its
      exercises.
- [ ] Each exercise card displays a **title** and a **description**.
- [ ] Each instrument has at least one section and each section has at least one exercise in
      the mock data.
- [ ] The exercise list updates immediately when the instrument selection changes.

### Navigation

- [ ] Clicking an exercise navigates the user to the exercise playback screen.
- [ ] The navigation target URL encodes enough information to identify the selected instrument
      and exercise (e.g. `/practice/[instrumentType]/[exerciseId]`).

### Mock Data

- [ ] Exercise data is defined as a static TypeScript constant — no API call is made.
- [ ] The mock dataset includes exercises for all three instruments: Drums, Bass, and Guitar.
- [ ] The Drums instrument includes at minimum the section **"Ritmos básicos"** with at least
      one exercise (title: `"Ejercicio 1"`, description:
      `"Patrón básico de batería para practicar ritmo."`).
- [ ] Each exercise in the mock data has a unique `id` string within its instrument.

### Accessibility & UX

- [ ] The instrument selector is keyboard-navigable.
- [ ] Exercise cards are focusable and activatable via keyboard (Enter or Space).
- [ ] The page renders correctly on viewport widths from 320 px to 1440 px.

---

## Technical Notes

### Existing Types to Extend

The `Instrument` and `InstrumentType` interfaces from `packages/types/src/index.ts` are the
foundation for instrument identity:

```ts
// From @groovelab/types
export type InstrumentType = 'electronic-drums' | 'bass-guitar' | 'guitar';

export interface Instrument {
  id: string;
  type: InstrumentType;
  name: string;
  midiChannel?: number;
}
```

New types needed for this feature (to be added to `packages/types`):

```ts
export interface Exercise {
  id: string;
  title: string;
  description: string;
}

export interface ExerciseSection {
  title: string;
  exercises: Exercise[];
}

export interface InstrumentExercises {
  instrumentType: InstrumentType;
  sections: ExerciseSection[];
}
```

### Mock Data Location

Static mock data lives in `mocks/frontend/mockExercises.ts`. Business logic for
filtering exercises by instrument type belongs in `apps/web`.

### Component Location

UI components for this feature follow the atomic design convention in `packages/ui`:

- `atoms/` — `InstrumentButton` (single selectable instrument tab)
- `molecules/` — `ExerciseCard` (title + description), `ExerciseSectionList` (section heading
  + list of cards)
- `organisms/` — `ExerciseBrowser` (instrument selector + exercise list composed together)

The page that mounts the organism lives in `apps/web/src/pages/` (Astro page or React route).

### Navigation

The exercise playback route is not implemented yet. Navigation must point to a placeholder
route such as `/practice/[instrumentType]/[exerciseId]` so links are structurally correct and
testable before the destination page exists.

### No Backend Required

This feature uses only static mock data. No `fetch`, `axios`, or API client calls are made.
The `ApiResponse` and `PaginatedResponse` generics from `@groovelab/types` are not used here.

### Utilities

No utilities from `@groovelab/utils` are required for this feature (`GM_DRUM_MAP`,
`intervalToBpm`, etc. are out of scope for a browse-only UI).

---

## Assumptions

- The three instruments (Drums, Bass, Guitar) map to the three existing `InstrumentType` values.
  Display labels ("Drums", "Bass", "Guitar") are presentation-layer strings, not new type values.
- "Playback screen" is a future page not yet specced. Navigation is a link/route stub only.
- Section titles and exercise content may be in Spanish, matching the example content provided
  in the feature request.
- Exercise `id` values in mock data are stable strings (e.g. `"drums-basic-1"`) used for URL
  construction; they are not UUIDs.

---

## Out of Scope

- Audio or MIDI playback of exercises
- MIDI input or rhythm detection during exercise browsing
- Backend API for exercises
- Persisting the selected instrument across sessions
- User accounts or progress tracking
- Scoring or timing feedback
- Filtering or searching exercises
- Pagination of exercises
- Favouriting or bookmarking exercises

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [ ] New types (`Exercise`, `ExerciseSection`, `InstrumentExercises`) added to `packages/types`
- [ ] Tests written covering all acceptance criteria
- [ ] Mock data defined in `mocks/frontend/mockExercises.ts`
- [ ] UI components implemented in `packages/ui` and consumed in `apps/web`
- [ ] Instrument switching works correctly in the browser
- [ ] Clicking an exercise navigates to the placeholder playback route
- [ ] All tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] No regressions in existing tests
