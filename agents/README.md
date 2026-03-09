# GrooveLab Agent Workflow

All contributors — human or AI agent — follow **Spec Driven Development** combined with
**Test Driven Development**. No code ships without a spec. No spec ships without tests.

---

## The 5-Step Workflow

### 1. Read the Spec

Find the relevant spec in `/specs`. Read it completely:

- Understand the **Problem** and **User Stories**
- Study the **Acceptance Criteria** — these become your tests
- Review **Technical Notes** for implementation constraints
- Check **Out of Scope** to avoid over-engineering

If the spec is unclear or missing, **stop** — update or create the spec first (use the
`spec-writer` agent).

### 2. Write Tests

Create tests that directly map to every acceptance criterion. Tests go alongside the code
they will test.

**Frontend (TypeScript/React):**
```ts
// skills/midi/frontend/midi-parser.test.ts
describe('MidiParser', () => {
  it('parses a note-on event', () => { ... });
  it('rejects invalid velocity', () => { ... });
});
```

**Backend (Python):**
```python
# skills/midi/backend/test_midi_parser.py
def test_parse_note_on_event():
    ...

def test_rejects_invalid_velocity():
    ...
```

Use `it.todo()` / `@pytest.mark.skip` for stubs if writing incrementally.

### 3. Implement the Feature

Write the **minimum code** required to make all tests pass. Do not add functionality
beyond what the spec requires.

### 4. Ensure Tests Pass

Run the full test suite. **All** tests — new and existing — must pass before the work
is considered done.

```bash
pnpm test:all
```

Fix any regressions before proceeding.

### 5. Update Documentation

- Mark acceptance criteria checkboxes in the spec as `[x]`
- Update the skill's `README.md` with implementation notes
- Update the spec **Status** field to `Implemented` or `Partial`

---

## Agent Types

### `spec-writer`

Creates or updates specification documents in `/specs`.

**Input:** A user story, feature request, or problem description
**Output:** A complete spec document following the template in this directory
**Location:** `agents/spec-writer/`

### `test-writer`

Generates test skeletons directly from a spec's acceptance criteria.

**Input:** Path to a spec document
**Output:** Test files with `it.todo()` or `@pytest.mark.skip` stubs
**Location:** `agents/test-writer/`

### `feature-builder`

Implements a feature to make a set of failing tests pass.

**Input:** Spec path + failing test file paths
**Output:** Implementation code, all tests green
**Location:** `agents/feature-builder/`

---

## Rules

1. **Never implement without a spec.**
2. **Never implement without tests.**
3. Keep changes scoped to a single skill or feature per PR/commit.
4. If a spec is ambiguous, clarify it before writing tests.
5. Tests are the source of truth — if an implementation detail conflicts with a test,
   fix the implementation (or revisit the spec), not the test.
6. Do not mark acceptance criteria as complete until the CI test suite passes.

---

## Spec Template

When writing a new spec, use this structure:

```markdown
# Spec: [Feature Name]

**Status:** Draft | In Progress | Implemented
**Version:** 0.1.0
**Last updated:** YYYY-MM-DD

## Problem
## User Stories
## Acceptance Criteria
## Technical Notes
## Out of Scope
## Definition of Done
```
