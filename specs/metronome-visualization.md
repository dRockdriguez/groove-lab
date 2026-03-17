# Spec: Metronome Click Visualization
**Status:** Implemented
**Version:** 0.1.0
**Last updated:** 2026-03-17

## Problem

Musicians practicing with a metronome benefit from both auditory and visual feedback. Currently, the metronome provides only sound cues. Visual markers showing where each metronome click occurs on the playback timeline help musicians stay synchronized, especially when:
- The exercise audio is loud and the metronome click is quiet or masked
- The practitioner is watching their playing form or the instrument
- The user is learning to internalize the tempo and needs reinforcement cues

## User Stories

### As a drummer practicing exercises,
I want to see where each metronome click occurs on the playback timeline so that I can visually sync my playing with the metronome beat, even when the audio cue is not clearly audible.

### As a learner,
I want visual markers on the mini timeline (exercise summary) to see the metronome pulse distribution across the entire exercise so that I can understand the tempo pattern without needing to listen to the full playback.

### As a system,
I should display metronome beat markers at precise intervals based on the current BPM so that the visual feedback aligns exactly with the audio metronome clicks.

## Acceptance Criteria

- [x] Metronome beat markers appear on the MiniTimeline showing the metronome pulse across the entire exercise
- [x] Metronome beat markers appear on the ExercisePlaybackTimeline (main timeline with MIDI note tracks) above all track lanes
- [x] Markers are colored red (or a distinct visual style) and visually distinct from other timeline elements
- [x] Markers are rendered at the correct timeline position calculated from exercise duration and BPM
- [x] First beat of each measure (every 4th click in 4/4 time) is visually distinct from regular beats (e.g., larger, brighter red, or different shape)
- [x] Markers remain synchronized with audio playback when BPM is changed (audio duration in clock time changes, but beats stay locked to original exercise beat grid)
- [x] Markers recalculate when exercise is seeked or paused
- [x] Markers do not interfere with existing seek or note-click functionality (user can still click/drag to seek or interact with MIDI notes)
- [x] Markers are responsive and scale appropriately with timeline width on different screen sizes
- [x] Screen readers announce the presence of metronome markers on both timelines
- [x] Marker rendering performance is optimized for exercises up to 10 minutes long with BPM range 40–300
- [x] Markers appear only when metronome is enabled (toggle state respected)
- [x] Markers on ExercisePlaybackTimeline span across all MIDI note tracks (full height)
- [x] Metronome beats remain aligned with playback position even when playback rate changes (BPM change adjusts audio speed, not the beat grid)

## Technical Notes

### Integration Points

- **MiniTimeline Component** (`packages/ui/src/components/molecules/MiniTimeline/`)
  - Add metronome marker indicators across the timeline track
  - Markers should fit proportionally across the exercise duration
  - Receive `exercise.bpm` (original exercise BPM, NOT currentBpm) and `totalDuration` as props to calculate marker positions
  - **Critical**: Use original exercise BPM, not `currentBpm`, so markers stay locked to the original beat grid when BPM is changed

- **ExercisePlaybackTimeline Component** (`packages/ui/src/components/organisms/ExercisePlaybackTimeline/`)
  - Add metronome marker layer spanning full height above all MIDI note tracks
  - Markers should be positioned on the relative-positioned parent container
  - Receive `exercise.bpm` (original exercise BPM, NOT currentBpm) and `totalDuration` (derived from `durationMs`) as props
  - Use `z-index` to ensure markers do not block note interaction (notes should be clickable)
  - **Critical**: Use original exercise BPM, not `currentBpm`, so markers stay locked to the original beat grid when BPM is changed

- **MetronomeControl Component** (`packages/ui/src/components/molecules/MetronomeControl/`)
  - Receives `originalBpm` prop (the exercise's original BPM for click timing)
  - Uses `originalBpm` to calculate click intervals: `intervalMs = bpmToInterval(originalBpm)`
  - User-adjustable `bpm` (currentBpm) only affects audio playback speed via `onBpmChange` callback, NOT click frequency
  - **Critical**: Clicks are generated at `originalBpm` intervals, keeping them synchronized with visual markers

- **ExercisePlaybackPage** (`packages/ui/src/components/organisms/ExercisePlaybackPage/`)
  - Pass `originalBpm={exercise.bpm}` to MetronomeControl so clicks use original exercise BPM
  - Pass `metronomeEnabled` and `bpm={exercise.bpm}` to MiniTimeline and ExercisePlaybackTimeline
  - The beat grid is calculated from the original exercise BPM and remains constant
  - When user changes BPM via MetronomeControl, `currentBpm` affects audio playback speed only, NOT the visual beat grid or click frequency
  - Formula: `audioPlaybackRate = currentBpm / exercise.bpm` (not `currentBpm / 120`)

### Marker Calculation

**Formula for beat positions (using ORIGINAL exercise BPM):**
- Beat interval (ms) = `60,000 / exercise.bpm` (use original exercise BPM, NOT currentBpm)
- Exercise duration (ms) = `totalDuration`
- Number of beats = `Math.floor(exerciseDuration / beatInterval)`
- Beat positions (as % of timeline) = `(beatIndex * beatInterval) / exerciseDuration * 100`

**Critical: The beat grid is LOCKED to exercise.bpm and never changes.**
- When user adjusts `currentBpm` via MetronomeControl, only the audio playback speed changes
- Marker positions remain constant because they represent the original exercise's beat structure
- This ensures markers stay visually aligned with the original MIDI notes

**Example:**
- Exercise: 60 seconds (60,000 ms), original BPM: 120
- Beat interval = 500 ms
- Number of beats: 120
- Beat positions: 0%, 0.833%, 1.666%, ..., 99.166%
- If user changes to 140 BPM: audio plays faster, but markers stay at same positions (beat grid unchanged)

### Visual Design

**Marker styles:**
- **Regular beat**: Small red dot or tick (height: 4–6px, width: 2–3px)
- **Downbeat (1st of measure, every 4th click)**: Larger marker, brighter red, or taller tick (height: 8–10px, width: 3–4px)
- **Color**: Red (`#EF4444` or `#DC2626` — review with design team)
- **Opacity**: 0.7–0.8 for regular beats, 1.0 for downbeats

**Rendering approach:**
- Render markers as SVG overlay (performant for many small marks) or
- Render as CSS absolute-positioned divs (simpler, but may be slower for 100+ markers)
- Consider using a canvas layer if performance becomes an issue

### Component Structure

```
MiniTimeline (updated)
  └─ MetronomeMarkerTrack
       ├─ Regular beat markers (based on exercise.bpm)
       └─ Downbeat markers (every 4th beat)

ExercisePlaybackTimeline (updated)
  └─ MetronomeMarkerOverlay (spans all tracks)
       ├─ Regular beat markers (full height, based on exercise.bpm)
       └─ Downbeat markers (full height, taller, every 4th beat)
```

### State Management

- **Markers are purely presentational**: calculated from `exercise.bpm` (original), `totalDuration`, and `metronomeEnabled` props
- **Beat grid is immutable**: markers are calculated once from the original exercise BPM and never recalculated when `currentBpm` changes
- ExercisePlaybackPage passes `metronomeEnabled` and `exercise.bpm` (NOT `currentBpm`) to MiniTimeline and ExercisePlaybackTimeline
- Marker positions remain constant throughout the session because they represent the original exercise structure
- `currentBpm` only affects audio playback speed: `audioPlaybackRate = currentBpm / exercise.bpm`
- This ensures visual markers stay locked to MIDI notes regardless of playback speed changes

### BPM-Playback Synchronization Bug Fix

**Problem**: When user changes BPM (via MetronomeControl), the audio playback speed changes but metronome markers become misaligned because:
- Old formula: `playbackRate = currentBpm / 120` (hardcoded reference)
- This assumes all exercises are 120 BPM, but they're not
- Example: 100 BPM exercise at 120 BPM user input → `120/120 = 1.0x`, but should be `120/100 = 1.2x`

**Solution**: Use exercise's original BPM as the reference:
- New formula: `playbackRate = currentBpm / exercise.bpm` (dynamic reference)
- Beat markers calculated from `exercise.bpm` never change
- Audio speed scales relative to the exercise's original tempo
- Example: 100 BPM exercise at 120 BPM user input → `120/100 = 1.2x` ✓ correct
- Markers stay aligned with MIDI notes because they're locked to the original beat grid

### Metronome Click Synchronization

**Goal**: Ensure metronome clicks occur at exactly the same positions as visual markers.

**Implementation**:
1. **Visual Markers**: Calculated from `exercise.bpm` (original BPM) → positions never change
2. **Metronome Clicks**: Generated at `originalBpm` intervals (not `currentBpm`)
   - `originalBpm` is passed to MetronomeControl via prop
   - Click interval: `intervalMs = 60000 / originalBpm`
   - Clicks fire every `intervalMs` milliseconds based on audio playback time (`currentTimeMs`)
3. **User BPM Adjustment**: Only affects audio playback speed
   - `playbackRate = currentBpm / exercise.bpm`
   - Audio plays faster/slower, but clicks and markers stay at original beat positions

**Result**:
- Clicks always occur at marker positions ✓
- Changing BPM speeds up audio but keeps clicks/markers synchronized ✓
- Visual and auditory feedback are unified ✓

**Implementation in ExercisePlaybackPage**:
```typescript
const handleBpmChange = useCallback((newBpm: number) => {
  setCurrentBpm(newBpm);
  if (audioRef.current) {
    // FIX: Use exercise.bpm instead of hardcoded 120
    const playbackRate = newBpm / exercise.bpm;
    audioRef.current.playbackRate = playbackRate;
  }
}, [exercise]);
```

**Pass to components**:
```typescript
<MetronomeControl
  initialBpm={exercise.bpm}
  originalBpm={exercise.bpm}  // ← use original BPM for click timing
  isPlaying={playbackState === 'playing'}
  currentTimeMs={currentTimeMs}
  onBpmChange={handleBpmChange}  // updates audio playback rate
  onToggle={setMetronomeEnabled}
/>

<MiniTimeline
  bpm={exercise.bpm}  // ← original exercise BPM
  metronomeEnabled={metronomeEnabled}
  // ... other props
/>

<ExercisePlaybackTimeline
  bpm={exercise.bpm}  // ← original exercise BPM
  metronomeEnabled={metronomeEnabled}
  // ... other props
/>
```

**MetronomeControl implementation**:
```typescript
// In MetronomeControl, use originalBpm for click intervals:
const clickBpm = originalBpm ?? initialBpm ?? DEFAULT_BPM;
const intervalMs = bpmToInterval(clickBpm);  // ← locks to original BPM

// User-adjustable bpm only affects audio speed:
const handleBpmChange = useCallback((newBpm: number) => {
  setBpm(newBpm);
  onBpmChange?.(newBpm);  // triggers playbackRate = newBpm / exercise.bpm
}, [onBpmChange]);
```

### Accessibility

- Aria-label on marker layer: `"Metronome beats at {count} intervals across the timeline"`
- If markers are interactive (hovering shows tooltip), ensure keyboard navigation works
- Screen reader should announce marker presence but not each individual marker (that would be verbose)
- Use `role="presentation"` or `aria-hidden="true"` for individual markers to avoid clutter

### Performance Considerations

- **Limit marker density**: For very fast tempos and long exercises, cap the visible marker count
  - If total markers > 1000, simplify visualization (show only downbeats or every Nth beat)
  - Alternatively, only render markers in the visible timeline window (virtualization)
- **Use CSS transforms** for positioning (GPU-accelerated) rather than recalculating all positions on every update
- **Memoize marker calculations** in React to avoid recalculating on every render

## Out of Scope

- Interactive markers (clicking a marker doesn't trigger any action)
- Custom marker colors per instrument or exercise type
- Markers for non-4/4 time signatures (only 4/4 support initially)
- Exporting or recording marker data
- Animation or transitions for marker appearance/disappearance
- Configurable marker style (only one red color initially)
- Markers for multiple simultaneous metronome tracks
- Haptic feedback synchronized with visual markers (mobile feature, future)

## Definition of Done

1. [ ] Spec reviewed and approved by team
2. [x] Acceptance criteria are testable and unambiguous
3. [x] MiniTimeline updated with MetronomeMarkerTrack rendering logic (using exercise.bpm, not currentBpm)
4. [x] ExercisePlaybackTimeline updated with MetronomeMarkerOverlay rendering logic (spans all MIDI tracks, using exercise.bpm)
5. [x] ExercisePlaybackPage passes `exercise.bpm` (NOT currentBpm) and `metronomeEnabled` to MiniTimeline and ExercisePlaybackTimeline
6. [x] MetronomeControl receives `originalBpm` prop and uses it for click interval calculation (not currentBpm)
7. [x] MetronomeControl passes `originalBpm={exercise.bpm}` from ExercisePlaybackPage
8. [x] Marker position calculation uses exercise.bpm and never changes when currentBpm is adjusted
9. [x] Metronome click interval uses exercise.bpm and never changes when currentBpm is adjusted
10. [x] Audio playback rate formula corrected to: `playbackRate = currentBpm / exercise.bpm` (not `currentBpm / 120`)
11. [x] Unit tests for marker calculation logic using exercise.bpm (edge cases: 40 BPM, 300 BPM, short/long exercises)
12. [x] Unit tests for MetronomeControl using originalBpm for click timing
13. [x] Integration tests verify markers stay locked to beat grid when BPM is changed during playback
14. [x] Integration tests verify markers appear/disappear when metronome toggled
15. [x] Integration tests confirm markers remain visually aligned with MIDI notes when playback speed changes
16. [x] Integration tests verify metronome clicks occur at marker positions (click sync)
17. [ ] Visual regression tests (screenshot comparisons) showing markers stay aligned across BPM changes
18. [x] Performance testing: rendering 1000+ markers does not cause frame drops
19. [x] Accessibility audit: aria-labels and screen reader testing
20. [x] ExercisePlaybackTimeline marker overlay does not interfere with note interaction (z-index, pointer-events)
21. [ ] Manual testing on Chrome, Firefox, Safari (mobile and desktop) verifying marker alignment and click sync at different BPM values
22. [ ] Marker colors reviewed and approved by design team
23. [x] Spec marked `[x]` on all acceptance criteria
24. [x] All tests passing (419 tests + 1 todo)
25. [ ] PR merged and deployed
