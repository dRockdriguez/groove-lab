# Spec: Browse Practice Exercises by Instrument

**Status:** Draft
**Version:** 0.4.0
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

2. **As a musician**, I want to see all available exercises organized into sections so that I
   can quickly scan the available content and pick a starting point.

3. **As a musician**, I want each exercise to display a title and a description so that I can
   understand what the exercise is about before selecting it.

4. **As a musician**, I want to switch between instruments without leaving the browse screen so
   that I can explore exercises for any instrument with minimal friction.

5. **As a musician**, I want selecting an exercise to navigate me to the exercise playback
   screen so that I can begin practicing immediately after choosing an exercise.

---

## Acceptance Criteria

### Instrument Selector

- [ ] The instrument selector renders three options: **Drums**, **Bass**, **Guitar**.
- [ ] The selector reflects the `InstrumentType` values from `@groovelab/types`: `'electronic-drums'`, `'bass-guitar'`, `'guitar'`.
- [ ] **Drums** is the default selected instrument on initial page load.
- [ ] One instrument is always selected; no state exists where no instrument is active.
- [ ] The currently selected instrument is visually distinguished from unselected ones.
- [ ] Clicking a different instrument updates the displayed exercises without a page reload.
- [ ] The instrument selector uses `role="tablist"` and each option uses `role="tab"` with `aria-selected` reflecting the current selection.

### Exercise List

- [ ] When an instrument is selected, the exercise list renders only the exercises for that instrument.
- [ ] Exercises are grouped under named sections; each section heading is visible above its exercises.
- [ ] Sections and exercises render in the order they appear in the data array (no automatic sorting).
- [ ] Each exercise card displays a **title** and a **description**.
- [ ] Each instrument has at least one section and each section has at least one exercise in the mock data.
- [ ] The exercise list updates immediately when the instrument selection changes.
- [ ] The exercise list region uses `role="tabpanel"` and is associated with the active instrument tab via `aria-labelledby`.
- [ ] If an instrument has no exercises, the panel displays the message "No hay ejercicios disponibles".

### Navigation

- [ ] Each exercise card renders as an `<a>` element with an `href` attribute pointing to the target URL (standard link navigation).
- [ ] The navigation target URL follows the pattern `/practice/{instrumentType}/{exerciseId}` (e.g. `/practice/electronic-drums/drums-basic-1`).

### Page Creation

- [ ] Create `apps/web/src/pages/index.astro` (or `.tsx`) that:
  - mounts the `ExerciseBrowser` organism component.
  - passes mock exercises data to the organism as props.
  - renders the instrument selector and exercise list correctly.
  - manages selected instrument state (default: Drums).
  - fully functional with keyboard navigation and accessible roles.

### Mock Data

- [ ] Exercise data is defined as a static TypeScript constant — no API call is made.
- [ ] The mock dataset includes exercises for all three instruments: Drums, Bass, and Guitar.
- [ ] Drums includes section `id: "drums-basic-rhythms"`, `title: "Ritmos básicos"` with at least one exercise (`id: "drums-basic-1"`, `title: "Ejercicio 1"`, `description: "Patrón básico de batería para practicar ritmo."`).
- [ ] Bass includes section `id: "bass-lines"`, `title: "Líneas de bajo"` with at least one exercise (`id: "bass-basic-1"`, `title: "Ejercicio 1"`, `description: "Línea de bajo sencilla para practicar el pulso."`).
- [ ] Guitar includes section `id: "guitar-basic-chords"`, `title: "Acordes básicos"` with at least one exercise (`id: "guitar-basic-1"`, `title: "Ejercicio 1"`, `description: "Progresión de acordes básica para principiantes."`).
- [ ] Each exercise has a unique `id` string across all sections for its instrument.

### Accessibility & UX

- [ ] The instrument selector is keyboard-navigable using Arrow Left/Right keys to move between tabs (WAI-ARIA Tabs pattern).
- [ ] Exercise cards are focusable and activatable via keyboard (Enter or Space).
- [ ] Tab key moves focus from the tab list into the exercise panel and between exercise cards.
- [ ] The page renders correctly on viewport widths from 320 px to 1440 px.

---

## Technical Notes

### Types

Use existing types from `@groovelab/types` — `Exercise`, `ExerciseSection`, and
`InstrumentExercises` are already defined in `packages/types/src/index.ts`:

```ts
export type InstrumentType = 'electronic-drums' | 'bass-guitar' | 'guitar';

export interface Instrument {
  id: string;
  type: InstrumentType;
  name: string;
  midiChannel?: number;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
}

export interface ExerciseSection {
  id: string;
  title: string;
  exercises: Exercise[];
}

export interface InstrumentExercises {
  instrumentType: InstrumentType;
  sections: ExerciseSection[];
}
```

### Component Locations

- `packages/ui/atoms/InstrumentButton.tsx` — single instrument tab
- `packages/ui/molecules/ExerciseCard.tsx` — exercise card
- `packages/ui/molecules/ExerciseSectionList.tsx` — section heading + list of cards
- `packages/ui/organisms/ExerciseBrowser.tsx` — instrument selector + exercise list

### Page Implementation

- The page mounts `ExerciseBrowser` and passes the mock dataset.
- Handles instrument selection state and updates exercise list immediately.
- Navigation links point to placeholder playback routes.

### Mock Data Location

- `apps/web/src/data/mockExercises.ts` — static exercises dataset.

### Assumptions

- Instrument labels ("Drums", "Bass", "Guitar") are presentation strings, not new types.
- Playback screen is a placeholder route for now.
- Exercise IDs are stable strings used for URL construction.

---

## Out of Scope

- Audio/MIDI playback
- Backend API
- Persistence, user accounts, scoring, progress tracking
- Filtering, searching, pagination, favoriting

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [ ] Existing types in `packages/types` verified as sufficient
- [ ] Tests written covering all acceptance criteria
- [ ] Mock data defined in `apps/web/src/data/mockExercises.ts`
- [ ] Components implemented in `packages/ui`
- [ ] Index page (`index.astro`) implemented and renders organism
- [ ] Instrument switching works in the browser
- [ ] Clicking exercise navigates to placeholder route
- [ ] All tests pass
- [ ] Linting passes
- [ ] No regressions in existing tests
