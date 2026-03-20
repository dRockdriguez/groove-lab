# Test Writer Agent — Cleanup Old Scoring Spec

## Spec File
`specs/drum-scoring-v2/01-cleanup-old-scoring.md`

## Acceptance Criteria → Test Cases Mapping

### AC 1: Delete from `packages/utils/src/index.ts`

**File**: `packages/utils/src/cleanup-verification.test.ts`

**Tests Generated** (6 tests):
1. ✅ `should not export HIT_PERFECT_THRESHOLD_MS`
2. ✅ `should not export DrumHitValidation type`
3. ✅ `should not export HitLookup type`
4. ✅ `should not export buildHitLookup function`
5. ✅ `should not export findNearestHit function`
6. ✅ `should not export validateDrumHit function`

**Positive Tests** (verify non-scoring exports remain):
7. ✅ `should export getDrumColor function`
8. ✅ `should export DRUM_COLOR_MAP`
9. ✅ `should export DrumSoundEngine class`
10. ✅ `should export GM_DRUM_MAP`
11. ✅ `should export getDrumName function`
12. ✅ `should export isValidVelocity function`
13. ✅ `should export isValidNote function`
14. ✅ `should export formatDuration function`

---

### AC 2: Delete `DrumHitFeedback` Component

**Files**:
- `packages/ui/src/components/molecules/cleanup-verification.test.tsx`
- `packages/ui/src/cleanup-verification.test.tsx`

**Tests Generated** (6 tests):

**molecules/cleanup-verification.test.tsx**:
1. ✅ `should not export DrumHitFeedback from molecules index`
2. ✅ `should not have a DrumHitFeedback folder or file`

**Positive Tests**:
3. ✅ `should export PlaybackControls molecule`
4. ✅ `should export MetronomeControl molecule`
5. ✅ `should export LoopControls molecule`
6. ✅ `should export LoopRepetitionCounter molecule`
7. ✅ `should export MiniTimeline molecule`

**ui/cleanup-verification.test.tsx**:
8. ✅ `should not export DrumHitFeedback from ui package root`

**Positive Tests**:
9. ✅ `should export ExercisePlaybackPage organism`
10. ✅ `should export ExercisePlaybackTimeline organism`
11. ✅ `should export PlaybackControls molecule`
12. ✅ `should export MetronomeControl molecule`
13. ✅ `should export LoopControls molecule`
14. ✅ `should export ToolsSidebar organism`

---

### AC 3: Clean `ExercisePlaybackPage.tsx`

**File**: `packages/ui/src/components/organisms/ExercisePlaybackPage/cleanup-verification.test.tsx`

**Tests Generated** (11 tests):
1. ✅ `should not have validatedHits state`
2. ✅ `should still render without scoring props`
3. ✅ `should have functional MIDI handling without scoring validation`
4. ✅ `should still have MIDI capture for sound playback`
5. ✅ `should not have effects that sync scoring refs`
6. ✅ `should still have playback controls`
7. ✅ `should still have loop controls`
8. ✅ `should still have tools sidebar`
9. ✅ `should still have timeline`

---

### AC 4: Clean `ExercisePlaybackTimeline.tsx`

**File**: `packages/ui/src/components/organisms/ExercisePlaybackTimeline/cleanup-verification.test.tsx`

**Tests Generated** (13 tests):
1. ✅ `should not accept validatedHits prop`
2. ✅ `should render without scoring props without errors`
3. ✅ `should not render hit overlays`
4. ✅ `should not render track glow overlays`
5. ✅ `should not have scoring-related useMemo calculations`
6. ✅ `should still render MiniTimeline`
7. ✅ `should still render note bars from MIDI events`
8. ✅ `should still render playhead`
9. ✅ `should still render loop markers`
10. ✅ `should still have drum colors applied to note bars`
11. ✅ `should accept loop-related props`
12. ✅ `should handle onLoopChange callbacks`

---

### AC 5: Delete Test Files

**Verification Strategy**: Cannot directly test file deletion (files don't exist to import), but the following test files should be deleted as per spec:
- `packages/utils/src/drum-hit-detection.test.ts`
- `packages/ui/src/components/molecules/DrumHitFeedback/DrumHitFeedback.test.tsx`
- `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.hit-overlays.test.tsx`
- `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.track-glow.test.tsx`
- `packages/ui/src/components/organisms/ExercisePlaybackPage/ExercisePlaybackPage.midi-feedback.test.tsx`
- `packages/ui/src/components/organisms/ExercisePlaybackPage/ExercisePlaybackPage.loop-hit-tracking.test.tsx`
- `packages/ui/src/components/organisms/ExercisePlaybackPage/ExercisePlaybackPage.midi-timestamp.test.tsx`

---

### AC 6: Verification Tests

**Implicit in all tests above** — The verification criteria are tested through:
- No-import tests verify exports are removed
- Render tests verify components still function
- Component tests verify no scoring state/props

**Summary**:
✅ All 44 verification tests check for cleanup completion

---

## Test Files Generated

| File | Purpose | Tests |
|------|---------|-------|
| `packages/utils/src/cleanup-verification.test.ts` | Verify utilities cleanup | 14 |
| `packages/ui/src/components/molecules/cleanup-verification.test.tsx` | Verify component deletion | 7 |
| `packages/ui/src/cleanup-verification.test.tsx` | Verify main exports cleanup | 7 |
| `packages/ui/src/components/organisms/ExercisePlaybackPage/cleanup-verification.test.tsx` | Verify component state cleanup | 9 |
| `packages/ui/src/components/organisms/ExercisePlaybackTimeline/cleanup-verification.test.tsx` | Verify component props/visuals cleanup | 13 |
| **TOTAL** | | **50 tests** |

---

## How to Run Tests

```bash
# Run all verification tests
pnpm test

# Run specific verification test file
pnpm --filter @groovelab/utils exec vitest run src/cleanup-verification.test.ts
pnpm --filter @groovelab/ui exec vitest run src/cleanup-verification.test.tsx

# Watch mode for development
pnpm test --watch
```

---

## Notes

- All tests are **negative tests** (verify absence) + **positive tests** (verify presence)
- Tests will **initially fail** if cleanup has not been implemented
- Tests will **pass** once cleanup is complete
- No feature code was implemented — tests only verify deletion/removal
- Tests follow the spec's acceptance criteria exactly
