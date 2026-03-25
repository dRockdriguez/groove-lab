# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

---

## Spec Driven Development — The Prime Directive

**This is a strict SDD (Spec-Driven Development) codebase. These rules are non-negotiable:**

1. **No feature may be implemented without a spec.** If no spec exists, create one first.
2. Every feature references a spec in `/specs`.
3. Mark acceptance criteria `[x]` only after implementation is complete and verified.

Development flow (TDD is optional):

```
1. Read spec  →  2. Write tests (optional)  →  3. Implement  →  4. Verify  →  5. Update spec
```

Prefer the CLI workflow when implementing specs (see CLI Commands below).

---

## Agent Discovery

Agents are defined in `/agents`. **Before starting any task, list the available agents and
select the one whose purpose matches the work.**

```bash
ls agents/
```

Each agent lives in `agents/<name>/README.md` and defines:
- Purpose
- Inputs and outputs
- Step-by-step workflow
- Constraints

**Currently available agents:**

| Agent | When to use |
|---|---|
| `agents/spec-writer` | Decomposing a feature request into executable mini-specs |
| `agents/test-writer` | Generating test stubs from a spec's acceptance criteria (optional, for TDD) |
| `agents/test-implementer` | Generating test from a spec's acceptance criteria (optional, for TDD) |
| `agents/feature-builder` | Implementing a feature to satisfy spec acceptance criteria |

If a new agent directory appears in `/agents`, treat it as an active agent and read its
`README.md` before deciding whether it applies to the current task.

**How to select an agent:**
1. Read the task.
2. Run `ls agents/` to see all agents.
3. Read the README of the best-matching agent.
4. Follow that agent's workflow exactly.

---

## Skill Discovery

Skills are Claude Code workflow automation tools that automate specific development steps.
They live in `.agents/skills/<skill-name>/` directories with a `SKILL.md` file.

**Currently available skills:**

| Skill | Directory | When to use |
|---|---|---|
| `astro` | `.agents/skills/astro/` | Astro framework development and optimization |
| `backend-development` | `.agents/skills/backend-development/` | Backend development tasks and API work |
| `code-refactoring` | `.agents/skills/code-refactoring/` | Refactoring and improving existing code |
| `create-readme` | `.agents/skills/create-readme/` | Creating and updating README files |
| `find-skills` | `.agents/skills/find-skills/` | Discovering and listing available skills |
| `front-end-developer` | `.agents/skills/front-end-developer/` | Frontend development and UI work |
| `mastering-typescript` | `.agents/skills/mastering-typescript/` | TypeScript patterns, types, and best practices |
| `python-development` | `.agents/skills/python-development/` | Python development and backend work |
| `tailwind-best-practices` | `.agents/skills/tailwind-best-practices/` | Tailwind CSS styling and design patterns |
| `tdd-cycle` | `.agents/skills/tdd-cycle/` | Test-Driven Development workflow |

Skills are **not** business logic — they are workflow automation tools for contributors (human and AI).

---

## Spec CLI Usage

For detailed spec-cli command reference, flags, and workflow examples, see [`docs/spec-cli-usage.md`](docs/spec-cli-usage.md).

Key commands:
- `pnpm spec:analyze` — Analyze and understand a spec
- `pnpm spec:plan` — Plan implementation approach
- `pnpm spec:implement` — Implement from spec (non-TDD)
- `pnpm spec:verify` — Verify implementation against spec

---

## Development Commands

### Install
```bash
pnpm install
```

### Frontend (Astro, port 4321)
```bash
pnpm dev
pnpm build
```

### Backend (FastAPI, port 8000)
```bash
# First-time Python setup
cd apps/api
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# Run dev server
pnpm dev:api   # from root, or: uvicorn app.main:app --reload (inside apps/api with venv active)
```

### Testing
```bash
pnpm test             # Vitest (apps/web + packages/ui)
pnpm test:api         # pytest (apps/api, must have venv active)
pnpm test:all         # both

# Single test file (frontend)
pnpm --filter @groovelab/web exec vitest run src/components/WelcomeBanner.test.tsx
pnpm --filter @groovelab/ui exec vitest run src/components/atoms/Button/Button.test.tsx

# Single test file (backend — run from apps/api with venv active)
pytest app/tests/test_health.py
pytest app/tests/test_health.py::test_health_check
```

### Linting & Formatting
```bash
pnpm lint     # ESLint (.ts/.tsx/.astro) + Ruff (Python)
pnpm format   # Prettier + Black
```

### Storybook (port 6006)
```bash
pnpm storybook
```

---

## Architecture

### Monorepo Layout

```
apps/web        → Astro + React + Tailwind frontend
apps/api        → FastAPI backend (Python 3.11+)
packages/ui     → Atomic React component library (@groovelab/ui)
packages/types  → Shared TypeScript interfaces
packages/utils  → Shared utilities
specs/          → Feature specifications — source of truth before any code
agents/         → Agent definitions for human and AI contributors
workflows/      → High-level workflow documentation
tools/          → Developer CLI tooling (spec-cli.ts)
prompts/        → Prompt templates used by the spec CLI workflow
```

### Architecture Rules

- `apps/web` — UI only. No business logic.
- `apps/api` — API routing only. No business logic.
- `packages/types` — Shared TypeScript types. Import via `@groovelab/types`.
- `packages/utils` — Shared utilities. Import via `@groovelab/utils`.
- `packages/ui` — Shared React components. Import via `@groovelab/ui`.
- All internal package references use `workspace:*`.

### Package Relationships

```
apps/web       → @groovelab/ui, @groovelab/types
apps/api       → (Python, no TS packages)
packages/utils → @groovelab/types
```

### UI Components

`packages/ui` follows atomic design: `atoms/` → `molecules/` → `organisms/`. Each component
lives in its own directory: `ComponentName.tsx`, `index.ts`, optional `.stories.tsx` and
`.test.tsx`. All exports flow through `src/index.ts`.

### FastAPI Backend

Entry point: `apps/api/app/main.py`. Routes registered with prefix + tag. Tests use
`httpx.AsyncClient` with `ASGITransport`. All tests are async (`asyncio_mode = "auto"`).

### Shared Types

`packages/types/src/index.ts`: `MidiEvent`, `Instrument`, `InstrumentType`,
`PracticeSession`, `TimingFeedback`.

### Shared Utilities

`packages/utils/src/index.ts`: `GM_DRUM_MAP`, `getDrumName`, `isValidVelocity`,
`isValidNote`, `intervalToBpm`, `bpmToInterval`, `formatDuration`, `clamp`.

### TypeScript

Base config: `tsconfig.base.json`. All packages extend it. Key settings: `strict: true`,
`moduleResolution: bundler`, `target: ES2022`.

### Code Style

- TypeScript/JS: line width 100, single quotes, trailing commas (`es5`) — Prettier + ESLint
- Python: line width 100 — Black + Ruff (rules: E, F, I, N, W)

---

## Specs Reference

The repository still contains legacy single-file specs in `/specs/`, but the `spec-writer`
agent now creates new work as decomposed feature folders with executable mini-specs:

```text
specs/<feature-name>/
  00-overview.md
  01-<mini-spec-name>.md
  02-<mini-spec-name>.md
```

`00-overview.md` should summarize the problem, architecture, mini-spec list, and execution
order. Each mini-spec should follow this structure:

```markdown
# Spec: [Mini Spec Name]

**Status:** Draft
**Last updated:** YYYY-MM-DD

## Scope
## Inputs
## Outputs
## Acceptance Criteria
## Edge Cases
## Notes
```

New mini-specs must always include the `Status` and `Last updated` metadata directly under
the title. Start new specs with `Status: Draft`.

When writing or updating a spec, use the `spec-writer` agent (`agents/spec-writer/README.md`).
