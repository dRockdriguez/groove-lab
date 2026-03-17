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

- [x] Metronome beat markers appear on the PlaybackControls seek bar at positions where metronome clicks occur
- [x] Metronome beat markers appear on the MiniTimeline showing the metronome pulse across the entire exercise
- [x] Metronome beat markers appear on the ExercisePlaybackTimeline (main timeline with MIDI note tracks) above all track lanes
- [x] Markers are colored red (or a distinct visual style) and visually distinct from other timeline elements
- [x] Markers are rendered at the correct timeline position calculated from exercise duration and BPM
- [x] First beat of each measure (every 4th click in 4/4 time) is visually distinct from regular beats (e.g., larger, brighter red, or different shape)
- [x] Markers update dynamically when BPM is changed during playback
- [x] Markers recalculate when exercise is seeked or paused
- [x] Markers do not interfere with existing seek or note-click functionality (user can still click/drag to seek or interact with MIDI notes)
- [x] Markers are responsive and scale appropriately with timeline width on different screen sizes
- [x] Screen readers announce the presence of metronome markers (e.g., "Metronome beats at 40% and 60%")
- [x] Marker rendering performance is optimized for exercises up to 10 minutes long with BPM range 40–300
- [x] Markers appear only when metronome is enabled (toggle state respected)
- [x] Markers on ExercisePlaybackTimeline span across all MIDI note tracks (full height)

## Technical Notes

### Integration Points

- **PlaybackControls Component** (`packages/ui/src/components/molecules/PlaybackControls/`)
  - Add metronome marker layer above or overlaid on the seek slider
  - Markers should not block slider interaction (use `pointer-events: none` or positioned separately)
  - Receive `bpm` and `totalDuration` as props to calculate marker positions

- **MiniTimeline Component** (`packages/ui/src/components/molecules/MiniTimeline/`)
  - Add metronome marker indicators across the timeline track
  - Markers should fit proportionally across the exercise duration
  - Receive same `bpm` and `totalDuration` props

- **ExercisePlaybackTimeline Component** (`packages/ui/src/components/organisms/ExercisePlaybackTimeline/`)
  - Add metronome marker layer spanning full height above all MIDI note tracks
  - Markers should be positioned on the relative-positioned parent container
  - Receive `bpm` and `totalDuration` (derived from `durationMs`) as props
  - Use `z-index` to ensure markers do not block note interaction (notes should be clickable)

- **ExercisePlaybackPage** (`packages/ui/src/components/organisms/ExercisePlaybackPage/`)
  - Pass `metronomeEnabled` and `bpm` state to PlaybackControls, MiniTimeline, and ExercisePlaybackTimeline
  - All child components render markers based on these props

### Marker Calculation

**Formula for beat positions:**
- Beat interval (ms) = `60,000 / bpm`
- Exercise duration (ms) = `totalDuration * 1000`
- Number of beats = `Math.floor(exerciseDuration / beatInterval)`
- Beat positions (as % of timeline) = `(beatIndex * beatInterval) / exerciseDuration * 100`

**Example:**
- Exercise: 60 seconds (60,000 ms)
- BPM: 120 → beat interval = 500 ms
- Number of beats: 120
- Beat positions: 0%, 0.833%, 1.666%, ..., 99.166%

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
PlaybackControls (updated)
  └─ MetronomeMarkerLayer
       ├─ Regular beat markers
       └─ Downbeat markers

MiniTimeline (updated)
  └─ MetronomeMarkerTrack
       ├─ Regular beat markers
       └─ Downbeat markers

ExercisePlaybackTimeline (updated)
  └─ MetronomeMarkerOverlay (spans all tracks)
       ├─ Regular beat markers (full height)
       └─ Downbeat markers (full height, taller)
```

### State Management

- **Markers are purely presentational**: calculated from `bpm`, `totalDuration`, and `metronomeEnabled` props
- No additional state needed in PlaybackControls or MiniTimeline
- ExercisePlaybackPage passes `metronomeEnabled` and `bpm` from MetronomeControl state
- If BPM or metronome state changes, parent re-renders and markers automatically recalculate

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
3. [x] PlaybackControls updated with MetronomeMarkerLayer rendering logic
4. [x] MiniTimeline updated with MetronomeMarkerTrack rendering logic
5. [x] ExercisePlaybackTimeline updated with MetronomeMarkerOverlay rendering logic (spans all MIDI tracks)
6. [x] ExercisePlaybackPage passes `bpm` and `metronomeEnabled` to all three timeline components
7. [x] Marker position calculation verified against manual BPM/duration examples
8. [x] Unit tests for marker calculation logic (edge cases: 40 BPM, 300 BPM, short/long exercises)
9. [x] Integration tests verify markers appear/disappear when metronome toggled (all three timelines)
10. [x] Integration tests confirm markers update when BPM changed (all three timelines)
11. [ ] Visual regression tests (screenshot comparisons) for marker rendering on all timelines
12. [x] Performance testing: rendering 1000+ markers does not cause frame drops
13. [x] Accessibility audit: aria-labels and screen reader testing
14. [x] ExercisePlaybackTimeline marker overlay does not interfere with note interaction (z-index, pointer-events)
15. [ ] Manual testing on Chrome, Firefox, Safari (mobile and desktop) with focus on ExercisePlaybackTimeline
16. [ ] Marker colors reviewed and approved by design team
17. [x] Spec marked `[x]` on all acceptance criteria
18. [ ] PR merged and deployed
