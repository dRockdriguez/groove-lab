# Spec: Cleanup Old Specs

## Scope

Delete the old spec files that described the now-removed scoring system.

## Inputs

- Old spec files in `/specs/`

## Outputs

- Old scoring specs removed from the repository

## Acceptance Criteria

### Delete old spec files
- [ ] Delete `specs/drum-hit-detection.md`
- [ ] Delete `specs/drum-scoring-improvements/` folder and all contents:
  - `00-overview.md`
  - `01-fix-hit-classification.md`
  - `02-fix-midi-timestamp.md`
  - `03-fix-loop-hit-tracking.md`
  - `04-fix-accuracy-denominator.md`
  - `05-fix-overlay-fade-after-loop.md`
  - `06-ux-inline-track-glow.md`

### Verify
- [ ] No references to `drum-hit-detection.md` or `drum-scoring-improvements` remain in documentation
- [ ] `specs/drum-scoring-v2/` folder is the canonical scoring spec reference

## Edge Cases

- Other specs may reference "hit detection" in passing text — those references can stay as historical context

## Notes

- This is the last spec to implement, after all others are verified
- Pure file deletion — no code changes
