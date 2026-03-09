# Tools

Developer scripts and tooling for the GrooveLab monorepo.

## Planned Tools

- `generate-spec.ts` — Scaffold a new spec document from a template
- `generate-skill.ts` — Scaffold a new skill directory with README and placeholder tests
- `check-coverage.sh` — Run all tests with coverage reporting
- `validate-specs.ts` — Lint spec documents for completeness (all sections present)

## Adding a Tool

Place scripts here and reference them from the root `package.json` scripts if needed.
Keep tools focused on developer experience — build, test, scaffold, validate.
