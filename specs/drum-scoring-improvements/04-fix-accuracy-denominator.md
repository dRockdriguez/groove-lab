# Spec: Fix Accuracy Denominator in DrumHitFeedback

## Scope

In `DrumHitFeedback.tsx`, the `totalExpectedHits` prop is declared but destructured away
(unused). The accuracy formula is `correctHits / totalAttempts` where `totalAttempts =
validatedHits.length`. This produces a denominator that grows with every attempt,
not with the exercise's total note count. Fix: use `totalExpectedHits` as the denominator;
update the sub-label below the percentage to reflect this.

## Inputs

- `validatedHits: DrumHitValidation[]` — all hits in current iteration
- `totalExpectedHits: number` — total MIDI note events in the exercise (already passed from
  `ExercisePlaybackPage` as `exercise.midiEvents.length`)

## Outputs

- `accuracyPercent = totalExpectedHits > 0 ? Math.round((correctHits / totalExpectedHits) * 100) : 0`
- Sub-label below percentage: `{correctHits}/{totalExpectedHits}` (was `{correctHits}/{totalAttempts}`)
- The Hits column sub-label (`of {totalAttempts}`) is unchanged — it still shows attempts

## Acceptance Criteria

- [ ] `totalExpectedHits` is destructured from props in `DrumHitFeedback` (was previously
      shadowed out)
- [ ] When `validatedHits = [{ classification: 'hit' }, { classification: 'hit' }]` and
      `totalExpectedHits = 10`, the rendered accuracy percentage is `20%`
      (was: `100%` under old formula with `totalAttempts = 2`)
- [ ] When `validatedHits = []` and `totalExpectedHits = 10`, accuracy renders `0%`
- [ ] When `totalExpectedHits = 0`, accuracy renders `0%` (no division by zero)
- [ ] The sub-label under the accuracy percentage reads `{correctHits}/{totalExpectedHits}`,
      e.g. `2/10` (not `2/2`)
- [ ] The Hits column still shows `correctHits` as the large number and `of {totalAttempts}`
      as the sub-label (unchanged)
- [ ] `correctHits` is still only hits with `classification === 'hit'` (unchanged)

## Edge Cases

- `totalExpectedHits` provided as `0`: guard with `totalExpectedHits > 0` before dividing
- `correctHits > totalExpectedHits`: can occur if the same note is hit multiple times due
  to a bug elsewhere; clamp `accuracyPercent = Math.min(100, ...)` to prevent >100% display
- `validatedHits.length > totalExpectedHits`: the Hits column sub-label `of {totalAttempts}`
  will exceed `totalExpectedHits`; this is intentional (shows over-hitting)

## Notes

- Only `DrumHitFeedback.tsx` is modified
- Existing tests in `DrumHitFeedback.test.tsx` that assert accuracy values must be updated
  to account for the new denominator formula
- `ExercisePlaybackPage` already passes `totalExpectedHits={exercise.midiEvents.length}`;
  no change needed there
- Spec 06 (UX) modifies `DrumHitFeedback` to remove the banner; implement spec 04 before
  spec 06 to avoid merge conflicts
