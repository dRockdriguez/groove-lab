# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
packages/types  → Shared TypeScript interfaces (MidiEvent, Instrument, PracticeSession, etc.)
packages/utils  → Shared utilities: GM drum map, MIDI validation, time/math helpers
skills/         → Feature skill modules (midi, rhythm, practice, analysis) — all placeholders
specs/          → Feature specifications — the source of truth before any code is written
agents/         → Workflow documentation for human and AI contributors
```

### Spec Driven Development (SDD) + TDD

**This is a strict SDD+TDD codebase.** The workflow is:

1. Write or find the spec in `specs/` (acceptance criteria = future tests)
2. Write failing tests from the acceptance criteria
3. Implement minimal code to pass tests
4. Mark acceptance criteria `[x]` in the spec

**Never implement a feature without a spec. Never write implementation before tests.**

### Package Relationships

- `apps/web` depends on `@groovelab/ui` and `@groovelab/types`
- `packages/utils` depends on `@groovelab/types`
- `skills/*` depend on `packages/types` and `packages/utils`
- All packages use `workspace:*` for internal references

### TypeScript

Base config is `tsconfig.base.json` at root. All packages extend it. Key settings: `strict: true`, `moduleResolution: bundler`, `target: ES2022`.

### UI Components

`packages/ui` follows atomic design: `atoms/` → `molecules/` → `organisms/`. Each component lives in its own directory with `ComponentName.tsx`, `index.ts`, optional `.stories.tsx` and `.test.tsx`. All exports flow through `src/index.ts`.

### FastAPI Backend

Entry point: `apps/api/app/main.py`. Routes are registered with prefix + tag. Tests use `httpx.AsyncClient` with `ASGITransport` (no real server needed). All tests are async (`asyncio_mode = "auto"` in pyproject.toml).

### Shared Types

Core types in `packages/types/src/index.ts`: `MidiEvent`, `Instrument`, `InstrumentType`, `PracticeSession`, `TimingFeedback`. Import from `@groovelab/types`.

Core utilities in `packages/utils/src/index.ts`: `GM_DRUM_MAP`, `getDrumName`, `isValidVelocity`, `isValidNote`, `intervalToBpm`, `bpmToInterval`, `formatDuration`, `clamp`.

### Skills

Skills in `skills/` are feature modules that will be implemented incrementally. Each skill has a `README.md` describing its purpose and spec reference. Implement skills by reading the linked spec first, then writing tests, then code.

### Code Style

- TypeScript/JS: line width 100, single quotes, trailing commas (`es5`), enforced by Prettier + ESLint
- Python: line width 100, enforced by Black + Ruff (rules: E, F, I, N, W)
