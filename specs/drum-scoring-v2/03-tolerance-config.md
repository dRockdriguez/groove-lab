# Spec: Tolerance Configuration UI

## Scope

Add a `ToleranceSelector` component that lets the user choose hit detection difficulty (Easy/Medium/Hard). Integrate it into the ToolsSidebar. Persist the selection in sessionStorage.

## Inputs

- `preset: TolerancePreset` — Current selected preset
- `onPresetChange: (preset: TolerancePreset) => void` — Callback when user changes preset

## Outputs

- `ToleranceSelector` React component
- `ToolsSidebar` updated to accept and render tolerance controls

## Component API

```typescript
export interface ToleranceSelectorProps {
  preset: TolerancePreset;
  onPresetChange: (preset: TolerancePreset) => void;
}
```

## Acceptance Criteria

### ToleranceSelector component
- [x] Renders 3 options: "Easy (300ms)", "Medium (200ms)", "Hard (100ms)"
- [x] Highlights the currently selected preset visually (e.g., filled vs outline button)
- [x] Calls `onPresetChange` with the new preset when user clicks an option
- [x] Uses `role="radiogroup"` with `aria-label="Hit detection tolerance"`
- [x] Each option has `role="radio"` with `aria-checked` matching selection state
- [x] Keyboard navigation: arrow keys cycle through options, Enter/Space selects
- [x] Compact horizontal layout (3 buttons in a row)

### ToolsSidebar integration
- [x] `ToolsSidebar` accepts optional `toleranceProps?: ToleranceSelectorProps`
- [x] When `toleranceProps` provided, renders `ToleranceSelector` with a "Tolerance" label
- [x] When `toleranceProps` not provided, does not render tolerance section
- [x] Renders below existing sidebar content (metronome, volume, etc.)

### Persistence
- [ ] Selected preset persisted to `sessionStorage` key `exerciseTools_tolerancePreset`
- [ ] On mount, reads from sessionStorage; defaults to `'medium'` if not set
- [ ] Persistence is handled by the page component (spec 06), NOT inside ToleranceSelector

## Definition of Done

- [x] All acceptance criteria (AC1-11) have corresponding tests
- [x] All 35 tests pass (28 component + 7 integration)
- [x] ToleranceSelector component implemented at `packages/ui/src/components/atoms/ToleranceSelector/`
- [x] ToolsSidebar integration complete with optional `toleranceProps` parameter
- [x] Types properly exported from `packages/ui/src/index.ts`
- [x] Keyboard navigation fully implemented (arrow keys, Enter, Space)
- [x] Accessibility complete (role="radiogroup", aria-checked, aria-label)
- [x] Visual selection highlighting with CSS classes (bg-green-600)
- [x] No regressions in existing tests (779 UI tests passing)
- [ ] Persistence implementation deferred to spec 06 (explicitly out of scope for this spec)

## Edge Cases

- sessionStorage contains invalid value (e.g., `"extreme"`): fall back to `'medium'` ← **Handled by spec 06**
- sessionStorage unavailable (private browsing): default to `'medium'`, no errors ← **Handled by spec 06**

## Status

**Status:** Implemented

**Last updated:** 2026-03-20

**Test Coverage:** 35/35 tests passing ✅
- ToleranceSelector rendering: 4 tests
- ToleranceSelector accessibility (radiogroup): 2 tests
- ToleranceSelector accessibility (radio buttons): 5 tests
- ToleranceSelector visual highlighting: 4 tests
- ToleranceSelector click interactions: 4 tests
- ToleranceSelector keyboard navigation: 9 tests
- ToleranceSelector layout: 2 tests
- ToolsSidebar integration: 7 tests

## Notes

- Component lives at `packages/ui/src/components/atoms/ToleranceSelector/`
- Imports `TolerancePreset` type from `@groovelab/utils`
- Export from `packages/ui/src/index.ts`
- The actual wiring to ExercisePlaybackPage happens in spec 06
