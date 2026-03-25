# Spec CLI Usage Guide

## Commands

Use these commands when implementing specs. They wrap the spec-driven workflow steps:

```bash
pnpm spec:analyze    # Analyze a spec file and understand requirements
pnpm spec:plan       # Plan implementation approach and architecture
pnpm spec:test       # Generate test stubs from acceptance criteria (optional)
pnpm spec:implement  # Implement directly from the spec (non-TDD / implementation-first)
pnpm spec:implement:tdd  # Implement from existing failing tests (TDD)
pnpm spec:verify     # Verify implementation against spec acceptance criteria
pnpm spec:flows      # List all available workflows and their steps
```

**Always prefer these commands** over manually running individual tools when the workflow step matches.

## CLI Flags

Use these flags to customize spec-cli behavior:

| Flag | Works with | Effect |
|------|-----------|--------|
| `--flow <name>` | `spec:run` | Choose workflow: `no-tdd`, `default`, `plan`, or `tdd` |
| `--interactive` | `spec:run` | Pause after each step to review changes (git diff) before continuing |
| `--commit-steps` | `spec:run` | Make a commit after each successful step (vs single final commit) |
| `--model <model>` | `spec:run`, `spec:analyze`, `spec:plan`, etc. | Override Claude model for step(s): e.g., `claude-opus-4-6` |

### Examples

```bash
# Review changes between steps
pnpm spec:run specs/foo.md --interactive

# Granular git history with per-step commits
pnpm spec:run specs/foo.md --commit-steps

# Use a specific model for better results or cost control
pnpm spec:analyze specs/foo.md --model claude-opus-4-6
pnpm spec:implement specs/foo.md --model claude-sonnet-4-6

# Combine flags
pnpm spec:run specs/foo.md --flow plan --interactive --commit-steps --model claude-opus-4-6
```

## Workflows

Use `pnpm spec:run <spec-file> --flow <workflow>` to automate multi-step implementation flows:

| Workflow | Command | Best for | Flow |
|----------|---------|----------|------|
| **No TDD** | `--flow no-tdd` | Implementing directly against spec without tests | analyze → implement-first → verify |
| **Default** | `--flow default` | Implement first, write tests after | implement-first → test → implement-tests → verify |
| **Plan First** | `--flow plan` | Complex features needing architecture planning | plan → implement-first → test → implement-tests → verify |
| **TDD** | `--flow tdd` | Pure Test-Driven Development | analyze → test → implement-tests → implement → verify |

### Workflow Examples

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
