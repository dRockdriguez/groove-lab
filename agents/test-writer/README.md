# Agent: test-writer

## Purpose

Reads a spec document and generates test skeletons — one test per acceptance criterion.
Tests are written as `it.todo()` (TypeScript) or `@pytest.mark.skip` (Python) stubs,
ready for implementation.

## Inputs

- Path to a spec document under `/specs`

## Outputs

- Test files placed alongside the code they will test
- One `describe` block per spec section
- One test stub per acceptance criterion

## Workflow

1. Read the spec file
2. Parse the Acceptance Criteria section
3. Determine whether the feature is frontend (TS) or backend (Python) or both
4. Create test file(s) in the appropriate directory
5. Name each test after the acceptance criterion it covers

## Example Output (TypeScript)

```ts
import { describe, it } from 'vitest';

describe('MidiParser — note-on detection', () => {
  it.todo('detects MIDI note-on events on all 16 channels');
  it.todo('stores timestamp in milliseconds since Unix epoch');
  it.todo('rejects velocity outside 0–127 range');
  it.todo('rejects note number outside 0–127 range');
});

describe('MidiParser — GM drum map', () => {
  it.todo('maps note 36 to kick-drum');
  it.todo('maps note 38 to snare-drum');
  it.todo('maps note 42 to closed-hi-hat');
});
```

## Example Output (Python)

```python
import pytest

@pytest.mark.skip(reason="not implemented")
def test_parses_note_on_event(): ...

@pytest.mark.skip(reason="not implemented")
def test_rejects_invalid_velocity(): ...
```
