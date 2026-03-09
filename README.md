# GrooveLab

**Your intelligent music practice companion.**

GrooveLab is a practice-first platform that helps musicians improve technique and timing
through intelligent feedback. It is **not** a game — it is a serious practice tool.

## Supported Instruments (Roadmap)

1. Electronic drums via MIDI
2. Bass guitar
3. Guitar

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Frontend     | Astro + React + TailwindCSS         |
| Backend      | Python + FastAPI + Pydantic         |
| UI Library   | React atomic components + Storybook |
| Testing (FE) | Vitest + Testing Library            |
| Testing (BE) | pytest + pytest-asyncio             |
| Lint/Format  | ESLint, Prettier, Ruff, Black       |
| Monorepo     | pnpm workspaces                     |

---

## Project Structure

```
groove-lab/
├── apps/
│   ├── web/          ← Astro frontend (port 4321)
│   └── api/          ← FastAPI backend (port 8000)
├── packages/
│   ├── ui/           ← Atomic React component library
│   ├── types/        ← Shared TypeScript types
│   └── utils/        ← Shared utilities (MIDI helpers, math, time)
├── specs/            ← Feature specifications (source of truth)
└── tools/            ← Developer scripts
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+

### Install

```bash
pnpm install
```

### Development

```bash
# Frontend only
pnpm dev

# Backend only (in a separate terminal)
pnpm dev:api

# Both simultaneously
pnpm dev:all
```

- Frontend: http://localhost:4321
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Python Setup

```bash
cd apps/api
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
```

---

## Running Tests

```bash
# Frontend tests (Vitest)
pnpm test

# Backend tests (pytest)
pnpm test:api

# All tests
pnpm test:all
```

---

## Storybook

```bash
pnpm storybook
```

Opens at http://localhost:6006 — browse all UI components.

---

## Linting & Formatting

```bash
pnpm lint      # ESLint + Ruff
pnpm format    # Prettier + Black
```

---

## Architecture: Spec Driven Development

All features start with a **specification document** in `/specs`. No code is written
without a spec. See [`agents/README.md`](agents/README.md) for the full workflow.

```
specs/ → tests/ → implementation
```

1. Write the spec
2. Write tests from the acceptance criteria
3. Implement the minimal code to pass tests
4. All tests green → done

---

## Contributing

See [`agents/README.md`](agents/README.md) for the contributor workflow.
