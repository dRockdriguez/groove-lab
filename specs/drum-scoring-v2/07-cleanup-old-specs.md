# Spec: Cleanup Old Specs

**Status:** Implemented
**Last updated:** 2026-03-22

## Scope

Delete the old spec files that described the now-removed scoring system.

## Inputs

- Old spec files in `/specs/`

## Outputs

- Old scoring specs removed from the repository

## Acceptance Criteria

### Delete old spec files
- [x] Delete `specs/drum-hit-detection.md`
- [x] Delete `specs/drum-scoring-improvements/` folder and all contents:
  - `00-overview.md`
  - `01-fix-hit-classification.md`
  - `02-fix-midi-timestamp.md`
  - `03-fix-loop-hit-tracking.md`
  - `04-fix-accuracy-denominator.md`
  - `05-fix-overlay-fade-after-loop.md`
  - `06-ux-inline-track-glow.md`

### Verify
- [x] No references to `drum-hit-detection.md` or `drum-scoring-improvements` remain in documentation
- [x] `specs/drum-scoring-v2/` folder is the canonical scoring spec reference

## Edge Cases

- Other specs may reference "hit detection" in passing text — those references can stay as historical context

## Definition of Done

- [x] All acceptance criteria satisfied and verified
- [x] Old spec files removed from repository
- [x] No broken references in documentation
- [x] specs/drum-scoring-v2/ confirmed as canonical spec reference

## Notes

- This is the last spec to implement, after all others are verified
- Pure file deletion — no code changes
