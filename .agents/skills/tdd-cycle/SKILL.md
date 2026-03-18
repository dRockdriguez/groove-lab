---
name: tdd-cycle
description: Execute a complete TDD cycle (RED → GREEN → REFACTOR) for a spec's acceptance criteria using GrooveLab's spec-cli tooling.
---

# Complete TDD Cycle

## Overview

This skill orchestrates a Test-Driven Development cycle using GrooveLab's spec-cli infrastructure. It guides you through writing failing tests, implementing code to pass them, refactoring, and verifying against acceptance criteria.

## When to Use

Use this skill when:
- Implementing a new feature with a spec
- Want to follow strict TDD practice (tests before implementation)
- Need structured guidance through RED → GREEN → REFACTOR phases
- Following the `--flow tdd` workflow in spec-cli

## Complete Workflow

### Phase 1: RED - Write Failing Tests

**Using spec-cli:**
```bash
pnpm spec:test <spec-file>
```

This generates test stubs (one `it.todo()` per acceptance criterion).

**Your task:**
1. Run the generated test file
2. Confirm all tests fail with "not implemented" errors
3. Read the spec carefully to understand what behavior each test should verify

**Success Criteria:**
- All tests are failing for the right reason (missing functionality)
- Each test name clearly describes one observable behavior
- No false positives (tests don't pass accidentally)

---

### Phase 2: GREEN - Implement Code

**Implement the feature incrementally:**
1. Pick one failing test
2. Write the minimum code to make that test pass
3. Run tests after each implementation
4. Move to the next failing test
5. Stop when all tests pass

**Success Criteria:**
- All tests pass
- Only the minimum code was added (no extra features)
- No existing tests were broken

---

### Phase 3: REFACTOR - Improve Code Structure

**Only after all tests pass:**
1. Look for code duplication, unclear names, or structural issues
2. Make one improvement at a time
3. Run tests after each change to stay green
4. Stop when code is clean (avoid premature optimization)

**When to Skip:**
- Code is already clean
- No obvious improvements are needed
- Further changes would over-engineer the solution

---

### Phase 4: VERIFY - Check Against Spec

**Using spec-cli:**
```bash
pnpm spec:verify <spec-file>
```

This checks that:
- All acceptance criteria have passing tests
- The spec status is accurate
- No criteria are incomplete

**Update the spec:**
- Mark `[x]` on completed acceptance criteria
- Mark all Definition of Done items if the feature is complete

---

## Complete TDD Cycle in GrooveLab

```bash
# 1. Create spec (if not already written)
# 2. Start TDD workflow
pnpm spec:run <spec-file> --flow tdd

# This automatically runs:
# - analyze: Review the spec
# - test: Generate test stubs
# - implement-tests: Convert stubs to real tests (optional step)
# - implement: Build the feature
# - verify: Check against acceptance criteria
```

---

## Key Principles

**RED Phase (Test Stubs):**
- One test per acceptance criterion
- Test observable behavior, not implementation
- Fail for the right reason

**GREEN Phase (Implementation):**
- Simplest code that makes tests pass
- No premature optimization
- Make it work first

**REFACTOR Phase:**
- Only when all tests are green
- One improvement at a time
- Keep tests passing throughout

**VERIFY Phase:**
- All tests must pass
- Acceptance criteria must be marked `[x]`
- Spec status must reflect true completion

---

## Important Reminders

- **Always start with tests** — RED phase first
- **Don't over-implement** — GREEN phase uses minimum code
- **Don't refactor on red tests** — refactor only when all pass
- **Run tests frequently** — after each change
- **Keep commits small** — one feature at a time
- **Test observable behavior** — not implementation details

---

## Execution Flow in GrooveLab

```
START with spec
  ↓
Run: pnpm spec:run <spec> --flow tdd
  ↓
[analyze]: Read and understand spec
  ↓
[test]: Generate test stubs (one per AC)
  ↓
RED: Confirm all tests fail
  ↓
GREEN: Implement code incrementally
  ↓
All tests pass? ──No──> Keep implementing
  ↓ Yes
REFACTOR: Improve code structure (optional)
  ↓
[implement-tests]: Real test assertions (replaced stubs)
  ↓
[verify]: Check all ACs are marked [x]
  ↓
DONE
```

---

## Real Example

**Spec Acceptance Criterion:**
"Upload button is disabled when no files are selected"

**Phase 1 (RED - Test Stub):**
```typescript
it.todo('disables upload button when no files are selected')
```

**Phase 2 (GREEN - Implementation):**
```typescript
it('disables upload button when no files are selected', () => {
  render(<FileUpload />)
  const button = screen.getByRole('button', { name: /upload/i })
  expect(button).toBeDisabled()
})
```

Then implement:
```typescript
<button disabled={files.length === 0}>Upload</button>
```

**Phase 3 (REFACTOR - Optional):**
Extract the disabled state logic if repeated elsewhere.

**Phase 4 (VERIFY):**
Mark this AC as `[x]` in the spec. Continue with next AC.

---

## Related Commands

- `pnpm spec:test <spec>` — Generate test stubs
- `pnpm spec:implement <spec>` — Scaffold implementation
- `pnpm spec:implement:test <spec>` — Convert stubs to real tests
- `pnpm spec:verify <spec>` — Verify completion
- `pnpm spec:run <spec> --flow tdd` — Full TDD cycle
- `pnpm test` — Run all tests locally
