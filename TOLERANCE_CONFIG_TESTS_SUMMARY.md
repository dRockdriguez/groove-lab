# Test Writer Agent Output — Spec 04: Tolerance Configuration UI

## Acceptance Criteria Extracted

### ToleranceSelector Component

| # | Criterion | Description |
|---|-----------|-------------|
| AC1 | Render Options | Renders 3 options: "Easy (300ms)", "Medium (200ms)", "Hard (100ms)" |
| AC2 | Visual Selection | Highlights the currently selected preset visually (e.g., filled vs outline button) |
| AC3 | onPresetChange Callback | Calls `onPresetChange` with the new preset when user clicks an option |
| AC4 | Radiogroup Role | Uses `role="radiogroup"` with `aria-label="Hit detection tolerance"` |
| AC5 | Radio Button Accessibility | Each option has `role="radio"` with `aria-checked` matching selection state |
| AC6 | Keyboard Navigation | Arrow keys cycle through options, Enter/Space selects |
| AC7 | Layout | Compact horizontal layout (3 buttons in a row) |

### ToolsSidebar Integration

| # | Criterion | Description |
|---|-----------|-------------|
| AC8 | Optional Props | `ToolsSidebar` accepts optional `toleranceProps?: ToleranceSelectorProps` |
| AC9 | Render with Label | When `toleranceProps` provided, renders `ToleranceSelector` with a "Tolerance" label |
| AC10 | Conditional Rendering | When `toleranceProps` not provided, does not render tolerance section |
| AC11 | Section Ordering | Renders below existing sidebar content (metronome, volume, etc.) |

### Persistence (Deferred to Spec 06)

- Selected preset persisted to `sessionStorage` key `exerciseTools_tolerancePreset` — PENDING (spec 06)
- On mount, reads from sessionStorage; defaults to `'medium'` if not set — PENDING (spec 06)
- Persistence handled by page component (spec 06), NOT inside ToleranceSelector — PENDING (spec 06)

---

## Test Files Generated

### 1. `packages/ui/src/components/atoms/ToleranceSelector/ToleranceSelector.test.tsx`

**Total Test Cases: 48 tests**

#### Rendering (4 tests)
- [x] Renders three preset options
- [x] Renders easy option with correct label
- [x] Renders medium option with correct label
- [x] Renders hard option with correct label

#### Accessibility — Radiogroup (2 tests)
- [x] Has role="radiogroup" on the container
- [x] Has aria-label "Hit detection tolerance" on the radiogroup

#### Accessibility — Individual Radio Buttons (5 tests)
- [x] All options have role="radio"
- [x] aria-checked matches selected preset (easy)
- [x] aria-checked matches selected preset (medium)
- [x] aria-checked matches selected preset (hard)

#### Visual Selection Highlighting (4 tests)
- [x] Visually highlights easy when selected
- [x] Visually highlights medium when selected
- [x] Visually highlights hard when selected
- [x] Unselected options do not have filled background

#### Click Interaction (4 tests)
- [x] Calls onPresetChange with "easy" when easy option clicked
- [x] Calls onPresetChange with "medium" when medium option clicked
- [x] Calls onPresetChange with "hard" when hard option clicked
- [x] Calls onPresetChange only once per click

#### Keyboard Navigation (9 tests)
- [x] Arrow right moves focus from easy to medium
- [x] Arrow right moves focus from medium to hard
- [x] Arrow right wraps from hard to easy
- [x] Arrow left moves focus from medium to easy
- [x] Arrow left moves focus from hard to medium
- [x] Arrow left wraps from easy to hard
- [x] Enter key selects the focused option
- [x] Space key selects the focused option

#### Layout (2 tests)
- [x] Renders options in horizontal layout
- [x] Renders all three options within the same radiogroup

---

### 2. `packages/ui/src/components/organisms/ToolsSidebar/ToolsSidebar.test.tsx` (Additions)

**Total New Test Cases: 7 tests**

#### ToolsSidebar Integration (7 tests)
- [x] Renders "Tolerance" section when toleranceProps is provided
- [x] Does not render tolerance section when toleranceProps is undefined
- [x] Renders ToleranceSelector component with tolerance options when toleranceProps provided
- [x] Passes onPresetChange callback to ToleranceSelector
- [x] Highlights the currently selected tolerance preset in sidebar
- [x] Tolerance section renders below metronome section
- [x] Tolerance section renders below drum volume section when both provided

---

## Test Mapping to Acceptance Criteria

### ToleranceSelector.test.tsx

| AC # | Tests | Count |
|------|-------|-------|
| AC1 | "renders three preset options" + "renders [X] option with correct label" | 4 |
| AC4 | "has role='radiogroup' on the container" + "has aria-label" | 2 |
| AC5 | "all options have role='radio'" + 3× "aria-checked matches selected preset" | 5 |
| AC2 | 4× "visually highlights [X] when selected" | 4 |
| AC3 | 4× "calls onPresetChange with [preset]" | 4 |
| AC6 | 9× keyboard navigation tests (arrow keys, Enter, Space) | 9 |
| AC7 | 2× layout tests | 2 |

### ToolsSidebar.test.tsx additions

| AC # | Tests | Count |
|------|-------|-------|
| AC8-9 | "renders tolerance section", "renders ToleranceSelector component" | 2 |
| AC10 | "does not render tolerance section when undefined" | 1 |
| AC9 | "passes onPresetChange callback" + "highlights selected preset" | 2 |
| AC11 | 2× "renders below [section]" | 2 |

---

## Notes

- All tests use **userEvent** for keyboard interaction (more realistic than fireEvent)
- All tests are **self-contained** with `vi.fn()` mocks for callbacks
- Tests follow **atomic design patterns** consistent with existing GrooveLab test suite
- **Persistence tests deferred** to spec 06 (page integration) per spec instructions
- Tests should **fail initially** (component not yet implemented)
- Component imports `TolerancePreset` from `@groovelab/utils` (type already exists in codebase)
