# Agent: feature-builder

## Purpose

Implements a feature by writing the minimum code required to make a set of failing tests pass.
Does not add functionality beyond what the tests require.

## Inputs

- Path to the spec document
- Path(s) to failing test file(s)

## Outputs

- Implementation code that makes all provided tests pass
- Updated spec (acceptance criteria checked off)
- Updated skill README with implementation notes

## Workflow

1. Read the spec for context and constraints
2. Run the failing tests to see current output
3. Implement the feature incrementally:
   a. Make one test pass at a time
   b. Do not break existing passing tests
4. Run `pnpm test:all` to confirm all tests pass
5. Update the spec: mark `[x]` on completed acceptance criteria
6. Update the spec (use Edit tool):
   Acceptance Criteria
      - Mark `[x]` for each criterion that is implemented and verified
   Definition of Done
      - If ALL acceptance criteria are completed AND all tests pass:
        mark all Definition of Done items as `[x]`
      - If any criterion is incomplete, leave Definition of Done unchecked
7. Finalize the spec state
   If the feature is fully implemented:
      - All acceptance criteria must be `[x]`
      - All Definition of Done items must be `[x]`

The spec must reflect the real completion state of the feature.

## Constraints

- Implement **only** what is needed to pass the tests
- Use existing types from `packages/types`
- Use existing utilities from `packages/utils`
- Do not modify test files (fix the implementation, not the tests)
- Do not introduce dependencies not already in the project

## Code Quality

- TypeScript: must pass ESLint and Prettier checks (`pnpm lint`)
- Python: must pass Ruff and Black checks (`ruff check . && black --check .`)
