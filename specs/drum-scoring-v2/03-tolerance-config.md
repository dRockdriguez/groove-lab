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
- [ ] Renders 3 options: "Easy (300ms)", "Medium (200ms)", "Hard (100ms)"
- [ ] Highlights the currently selected preset visually (e.g., filled vs outline button)
- [ ] Calls `onPresetChange` with the new preset when user clicks an option
- [ ] Uses `role="radiogroup"` with `aria-label="Hit detection tolerance"`
- [ ] Each option has `role="radio"` with `aria-checked` matching selection state
- [ ] Keyboard navigation: arrow keys cycle through options, Enter/Space selects
- [ ] Compact horizontal layout (3 buttons in a row)

### ToolsSidebar integration
- [ ] `ToolsSidebar` accepts optional `toleranceProps?: ToleranceSelectorProps`
- [ ] When `toleranceProps` provided, renders `ToleranceSelector` with a "Tolerance" label
- [ ] When `toleranceProps` not provided, does not render tolerance section
- [ ] Renders below existing sidebar content (metronome, volume, etc.)

### Persistence
- [ ] Selected preset persisted to `sessionStorage` key `exerciseTools_tolerancePreset`
- [ ] On mount, reads from sessionStorage; defaults to `'medium'` if not set
- [ ] Persistence is handled by the page component (spec 06), NOT inside ToleranceSelector

## Edge Cases

- sessionStorage contains invalid value (e.g., `"extreme"`): fall back to `'medium'`
- sessionStorage unavailable (private browsing): default to `'medium'`, no errors

## Notes

- Component lives at `packages/ui/src/components/atoms/ToleranceSelector/`
- Imports `TolerancePreset` type from `@groovelab/utils`
- Export from `packages/ui/src/index.ts`
- The actual wiring to ExercisePlaybackPage happens in spec 06
