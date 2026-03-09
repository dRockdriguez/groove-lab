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
6. Update the skill's `README.md`

## Constraints

- Implement **only** what is needed to pass the tests
- Use existing types from `packages/types`
- Use existing utilities from `packages/utils`
- Do not modify test files (fix the implementation, not the tests)
- Do not introduce dependencies not already in the project

## Code Quality

- TypeScript: must pass ESLint and Prettier checks (`pnpm lint`)
- Python: must pass Ruff and Black checks (`ruff check . && black --check .`)
