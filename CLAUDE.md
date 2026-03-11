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
| `agents/spec-writer` | Turning a feature request into a spec document |
| `agents/test-writer` | Generating test stubs from a spec's acceptance criteria (optional, for TDD) |
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

Skills are Claude Code agent definitions that automate specific workflow steps.
They live in `.claude/agents/` as Markdown files.

**Currently available skills:**

| Skill | File | When to use |
|---|---|---|
| `spec-writer` | `.claude/agents/spec-writer.md` | Turning a feature request into a spec document |
| `test-writer` | `.claude/agents/test-writer.md` | Generating test stubs from a spec's acceptance criteria (optional, for TDD) |
| `feature-builder` | `.claude/agents/feature-builder.md` | Implementing a feature to satisfy spec acceptance criteria |

Skills are **not** business logic — they are workflow automation tools for contributors (human and AI).

---

## CLI Workflow

Use these commands when implementing specs. They wrap the spec-driven workflow steps:

```bash
pnpm spec:analyze    # Analyze a spec file and understand requirements
pnpm spec:plan       # Plan implementation approach and architecture
pnpm spec:test       # Generate test stubs from acceptance criteria (optional)
pnpm spec:implement  # Scaffold implementation based on spec
pnpm spec:verify     # Verify implementation against spec acceptance criteria
```

**Always prefer these commands** over manually running individual tools when the workflow
step matches.

### Spec CLI Workflows

Use `pnpm spec:run <spec-file> --flow <workflow>` to automate multi-step implementation flows:

| Workflow | Command | Best for | Flow |
|----------|---------|----------|------|
| **No TDD** | `--flow no-tdd` | Implementing directly against spec without tests | analyze → implement → verify |
| **Default** | `--flow default` | Implement first, write tests after | implement → test → verify |
| **Plan First** | `--flow plan` | Complex features needing architecture planning | plan → implement → test → verify |
| **TDD** | `--flow tdd` | Pure Test-Driven Development | analyze → test → implement → verify |

**Examples:**
```bash
# No TDD: analyze spec, implement directly, verify (no tests)
pnpm spec:run specs/import-page.md --flow no-tdd

# Default: implement, generate tests after, verify
pnpm spec:run specs/import-page.md --flow default

# TDD: analyze, write tests first, then implement
pnpm spec:run specs/import-page.md --flow tdd

# Plan: plan architecture, implement, generate tests, verify
pnpm spec:run specs/import-page.md --flow plan
```

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

Specs live in `/specs/` as individual Markdown files, not organized into subdirectories:

```
specs/
  browse-exercises.md     ← Exercise browser feature
  import-page.md          ← File import feature
  theme.md                ← Theme/styling specification
  homepage.md             ← Homepage feature
  ...
```

Every spec follows this structure:

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

When writing or updating a spec, use the `spec-writer` agent (`agents/spec-writer/README.md`).
