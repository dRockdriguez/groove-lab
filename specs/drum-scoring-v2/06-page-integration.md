# Spec: Page Integration

## Scope

Wire the `ScoringTracker` into `ExercisePlaybackPage` to connect MIDI input → scoring → visual feedback. Also connect the tolerance selector to the sidebar.

## Inputs

- Exercise data with `midiEvents`
- User MIDI input via Web MIDI API (already captured)
- Tolerance preset selection from ToolsSidebar

## Outputs

- Real-time scoring during playback with visual glow on timeline
- Tolerance preset UI in sidebar
- Proper state management for loops and restarts

## Acceptance Criteria

### Tracker lifecycle
- [ ] Create `ScoringTracker` when exercise data loads: `new ScoringTracker(buildExpectedNoteLookup(exercise.midiEvents), TOLERANCE_PRESETS[tolerancePreset])`
- [ ] Store in `scoringTrackerRef = useRef<ScoringTracker | null>(null)`
- [ ] Recreate tracker when `tolerancePreset` changes (resets scoring)
- [ ] Recreate tracker when `exercise` changes

### MIDI handler integration
- [ ] In `handleMidiMessage`, after sound playback: if `playbackState === 'playing'`, call `scoringTrackerRef.current.processHit(note, exerciseTimeMs)`
- [ ] Update `activeGlows` state after `processHit`
- [ ] Keep sound playback unconditional (plays regardless of playback state)
- [ ] Keep 50ms per-note debounce for scoring hits

### Animation frame integration
- [ ] In the rAF loop (while playing): call `scoringTrackerRef.current.advancePlayhead(currentTimeMs)`
- [ ] Update `activeGlows` state: `setActiveGlows(scoringTrackerRef.current.getActiveGlows(performance.now()))`
- [ ] This detects missed notes and refreshes glow fade state each frame

### Loop handling
- [ ] When loop jumps back (currentTime >= loopEndMs → seek to loopStartMs): call `scoringTrackerRef.current.reset()`
- [ ] This allows fresh scoring for each loop iteration

### Playback state transitions
- [ ] On play (from stopped): call `reset()` to start fresh
- [ ] On stop: update `activeGlows` one final time, then stop updating
- [ ] On pause: stop calling `advancePlayhead`, but keep existing glows visible (they'll fade naturally)

### Timeline prop
- [ ] Pass `activeGlows={activeGlows}` to `<ExercisePlaybackTimeline>`

### Tolerance UI
- [ ] State: `const [tolerancePreset, setTolerancePreset] = useState<TolerancePreset>('medium')`
- [ ] Read initial value from `sessionStorage.getItem('exerciseTools_tolerancePreset')` — default `'medium'`
- [ ] On change: save to sessionStorage, recreate tracker
- [ ] Pass to ToolsSidebar: `toleranceProps={{ preset: tolerancePreset, onPresetChange: handleToleranceChange }}`

### No stats panel
- [ ] No `<DrumHitFeedback>` or equivalent rendered anywhere
- [ ] Scoring feedback is ONLY via timeline row glows

## Edge Cases

- Exercise has no MIDI events: tracker created with empty lookup — all hits are `wrong_note`, no misses
- MIDI hit received while paused: ignored (gated by `playbackState === 'playing'`)
- Tolerance changed during playback: tracker recreated, scoring resets mid-playback
- sessionStorage contains invalid tolerance value: default to `'medium'`
- Loop jump and MIDI hit arrive in same frame: reset happens first (reset before processHit)

## Notes

- Modified file: `packages/ui/src/components/organisms/ExercisePlaybackPage/ExercisePlaybackPage.tsx`
- New test file: `ExercisePlaybackPage.scoring.test.tsx`
- The `exerciseTimeMs` calculation for MIDI events uses existing refs (`playbackStartPerfTimeRef`, `playbackStartAudioOffsetRef`) — these were preserved in spec 01 if needed for sound timing
- Performance: `getActiveGlows()` is called every frame — it should be fast (iterates events array, filters by time)
- Import `ScoringTracker`, `buildExpectedNoteLookup`, `TOLERANCE_PRESETS`, `TolerancePreset` from `@groovelab/utils`
- Import `ToleranceSelector` from `@groovelab/ui`
