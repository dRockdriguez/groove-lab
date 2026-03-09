# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

---

## Spec Driven Development — The Prime Directive

**This is a strict SDD+TDD codebase. These rules are non-negotiable:**

1. **No feature may be implemented without a spec.** If no spec exists, create one first.
2. **No implementation may be written before tests.** Tests come from acceptance criteria.
3. Every feature references a spec in `/specs`.
4. Mark acceptance criteria `[x]` only after the full test suite passes.

Development flow:

```
1. Read spec  →  2. Write tests  →  3. Implement  →  4. Verify  →  5. Update spec
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
| `agents/test-writer` | Generating test stubs from a spec's acceptance criteria |
| `agents/feature-builder` | Implementing code to make failing tests pass |

If a new agent directory appears in `/agents`, treat it as an active agent and read its
`README.md` before deciding whether it applies to the current task.

**How to select an agent:**
1. Read the task.
2. Run `ls agents/` to see all agents.
3. Read the README of the best-matching agent.
4. Follow that agent's workflow exactly.

---

## Skill Discovery

Domain business logic lives in `/skills`. Skills are organized by domain:

```
skills/
  midi/       ← MIDI parsing, note detection, GM drum map
  rhythm/     ← BPM, timing, metronome
  practice/   ← Session management, exercises
  analysis/   ← Feedback, scoring, timing analysis
```

**Before writing any business logic:**
1. Run `ls skills/` to discover available skill directories.
2. Check if the required functionality already exists inside a skill.
3. Extend an existing skill rather than creating logic elsewhere.
4. Never place business logic inside `apps/web` or `apps/api` directly — it belongs in a skill.

Each skill may contain frontend (TypeScript) and backend (Python) subdirectories.
Tests live alongside skill code, not in a separate top-level test directory.

---

## CLI Workflow

Use these commands when implementing specs. They wrap the spec-driven workflow steps:

```bash
pnpm spec:analyze    # Step 1 — analyze a spec file
pnpm spec:test       # Step 2 — generate test stubs from acceptance criteria
pnpm spec:implement  # Step 3 — scaffold implementation
pnpm spec:verify     # Step 4 — verify implementation against spec
```

**Always prefer these commands** over manually running individual tools when the workflow
step matches.

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
skills/         → Domain business logic (organized by feature domain)
specs/          → Feature specifications — source of truth before any code
agents/         → Agent definitions for human and AI contributors
workflows/      → High-level workflow documentation
tools/          → Developer CLI tooling (spec-cli.ts)
prompts/        → Prompt templates used by the spec CLI workflow
```

### Architecture Rules

- `apps/web` — UI only. No business logic.
- `apps/api` — API routing only. No business logic.
- `skills/*` — All domain business logic lives here.
- `packages/types` — Shared TypeScript types. Import via `@groovelab/types`.
- `packages/utils` — Shared utilities. Import via `@groovelab/utils`.
- `packages/ui` — Shared React components. Import via `@groovelab/ui`.
- All internal package references use `workspace:*`.

### Package Relationships

```
apps/web       → @groovelab/ui, @groovelab/types
apps/api       → (Python, no TS packages)
packages/utils → @groovelab/types
skills/*       → @groovelab/types, @groovelab/utils
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

Specs live in `/specs` organized by domain:

```
specs/
  instruments/   ← instrument input and detection specs
  practice/      ← session and exercise specs
  feedback/      ← analysis and feedback specs
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
