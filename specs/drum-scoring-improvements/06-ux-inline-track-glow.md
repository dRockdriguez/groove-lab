# Spec: UX — Replace Banner with Per-Track Row Glow Feedback

## Scope

Replace the full-width "✓ Hit!" / "⇠ Too early" / "⇢ Too late" banner in `DrumHitFeedback`
with subtle per-track row background glow overlays rendered inside `ExercisePlaybackTimeline`.
The banner `<div>` is removed entirely. The stats grid (Accuracy, Hits, Avg Offset,
Violations) is kept. A new full-width background glow is added to each track row
(`<div key={note} className="border-b ... h-10 relative">`) when a recent hit exists for
that note.

## Inputs

- `validatedHits?: DrumHitValidation[]` — existing prop on `ExercisePlaybackTimeline`
- `currentTimeMs: number` — existing prop for fade timing
- Per-row note number — already available as `note` in the `uniqueNotes.map()` loop

## Outputs

### DrumHitFeedback.tsx changes
- The banner block (lines 47–63, the `isPlaying && mostRecentClassification &&` block) is
  removed
- The `isPlaying` prop is retained on the component interface for now (future use); its
  only previous use was gating the banner
- Stats grid (4-column) is unchanged

### ExercisePlaybackTimeline.tsx changes
- A new `rowGlowMap` is computed from `validatedHits`:
  `Map<note: number, { classification, expectedTimeMs }>` — stores the most recent hit
  per note (last entry wins if multiple hits exist for same note)
- For each track row `<div key={note}>`, if `rowGlowMap.has(note)`:
  - Compute `elapsed = currentTimeMs - rowGlowMap.get(note).expectedTimeMs`
  - If `elapsed < 0` or `elapsed > 800`, no glow
  - `glowOpacity = Math.max(0, Math.min(1, 1 - elapsed / 800))`
  - Fade in: apply `glowOpacity * 0.4` (semi-transparent, not the note-bar overlay which
    uses 0.85)
  - Render a full-width, full-height `<div>` inside the row with `position: absolute`,
    `inset: 0`, `pointerEvents: none`, `zIndex: 1`, background color matching classification:
    - `'hit'`: `rgba(34, 197, 94, {glowOpacity * 0.4})`  — green-500
    - `'early'`: `rgba(234, 179, 8, {glowOpacity * 0.4})` — yellow-500
    - `'late'`: `rgba(249, 115, 22, {glowOpacity * 0.4})` — orange-500
    - `'violation'`: `rgba(239, 68, 68, {glowOpacity * 0.4})` — red-500
  - `data-testid="track-glow-overlay"` on the glow element
  - `aria-hidden="true"` on the glow element

## Acceptance Criteria

### DrumHitFeedback banner removal
- [x] The rendered output of `<DrumHitFeedback>` contains no element with text
      `"✓ Hit!"`, `"⇠ Too early"`, or `"⇢ Too late"` regardless of `validatedHits` content
      or `isPlaying` value
- [x] The 4-column stats grid (Accuracy, Hits, Avg Offset, Violations) still renders
- [x] `DrumHitFeedback` component renders without error when `isPlaying={true}` and
      `validatedHits` contains a `'hit'` classification entry

### ExercisePlaybackTimeline track glow
- [x] When `validatedHits` contains `{ expectedNote: 36, expectedTimeMs: 500, classification: 'hit' }`
      and `currentTimeMs = 500` (elapsed = 0):
      - An element with `data-testid="track-glow-overlay"` exists inside the track row for note 36
      - Its `backgroundColor` style contains `rgba(34, 197, 94,` (green)
- [x] When `validatedHits` contains `{ expectedNote: 38, expectedTimeMs: 300, classification: 'early' }`
      and `currentTimeMs = 300`:
      - The glow overlay inside note 38's row contains `rgba(234, 179, 8,` (yellow)
- [x] When `validatedHits` contains `{ expectedNote: 42, expectedTimeMs: 400, classification: 'late' }`
      and `currentTimeMs = 400`:
      - The glow overlay inside note 42's row contains `rgba(249, 115, 22,` (orange)
- [x] When `validatedHits` contains a `'violation'` with `expectedNote: 49`:
      - A glow overlay exists for note 49 if it appears in `midiEvents`; uses
        `rgba(239, 68, 68,` (red); `expectedTimeMs` for violations equals `detectedTimeMs`
        (existing behavior from `validateDrumHit`)
- [x] When `currentTimeMs = 0` and `expectedTimeMs = 1500` (elapsed = -1500, post-loop):
      no `data-testid="track-glow-overlay"` is rendered for that note
- [x] When `elapsed > 800` (glow expired), no `data-testid="track-glow-overlay"` is rendered
- [x] The existing `data-testid="hit-overlay"` on note-bar overlays (existing per-note-bar
      coloring from v1.1) is unchanged — both the row glow and the note-bar overlay coexist
- [x] The glow overlay has `aria-hidden="true"`
- [x] When multiple hits exist for the same note (note 36 hit twice), only the most
      recent hit's classification and `expectedTimeMs` determines the glow

## Edge Cases

- Note that appears in `validatedHits` but not in `midiEvents` (violation for a note not
  in exercise): `uniqueNotes` will not include this note, so no row exists — no glow
  rendered (correct behavior)
- `validatedHits` is `undefined`: `rowGlowMap` is empty, no glows render
- Rapid successive hits on same note: `rowGlowMap` stores last-wins; previous glow is
  overwritten immediately

## Notes

- Modifies two files: `DrumHitFeedback.tsx` (banner removal) and
  `ExercisePlaybackTimeline.tsx` (row glow addition)
- The `rowGlowMap` useMemo should be separate from the existing `hitOverlayMap` useMemo
  to keep concerns distinct
- Existing `ExercisePlaybackTimeline.hit-overlays.test.tsx` tests for `data-testid="hit-overlay"`
  remain valid and unchanged
- Tests for banner text (`'✓ Hit!'` etc.) in `DrumHitFeedback.test.tsx` must be removed or
  updated to assert absence
- New test file: `ExercisePlaybackTimeline.track-glow.test.tsx` with at minimum:
  hit/early/late/violation color tests, expired glow test, negative-elapsed test,
  multi-hit last-wins test

## Definition of Done

- [x] All acceptance criteria implemented and tested
- [x] DrumHitFeedback banner removed entirely (no placeholder markup)
- [x] ExercisePlaybackTimeline track glow renders correctly with fade
- [x] Color mapping verified for all classifications (hit/early/late/violation)
- [x] Post-loop jump edge case handled (elapsed < 0 prevents rendering)
- [x] Opacity clamping prevents invalid values (0.4 max when elapsed ≤ 800ms)
- [x] Note-bar overlays (hit-overlay) coexist with row glows without conflict
- [x] Accessibility attributes present (aria-hidden="true" on glow)
- [x] Last-wins behavior verified for multiple hits on same note
- [x] DrumHitFeedback tests updated (3 banner absence tests + 27 stats tests)
- [x] ExercisePlaybackTimeline track-glow test file created (15 tests)
- [x] All tests passing (45 tests total: 30 DrumHitFeedback + 15 track-glow)
- [x] No regressions (all existing tests remain passing)

## Status

**Implemented** — 2026-03-19

All acceptance criteria met. Implementation verified. All 45 tests passing.
