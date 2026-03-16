# Spec: Exercise Playback Metronome
**Status:** Implemented
**Version:** 0.1.0
**Last updated:** 2026-03-16

## Problem
Musicians practicing exercises need auditory feedback to stay in time. Currently, the exercise playback provides audio feedback through the recorded exercise itself, but there is no independent metronome to help the player maintain tempo, especially when learning at different speeds or when the exercise audio is quiet.

## User Stories

### As a drummer practicing exercises,
I want to hear a metronome click at the current BPM so that I can stay synchronized with the tempo while practicing.

### As a learner,
I want to adjust the BPM up and down while an exercise is playing so that I can practice at a comfortable speed and gradually increase tempo.

### As a system,
I should generate metronome sounds at precise intervals so that the timing is accurate and helps the musician stay in rhythm.

## Acceptance Criteria

- [x] Metronome component displays current BPM value on the exercise playback page
- [x] BPM can be increased by 1 BPM using an increment button (up arrow / +)
- [x] BPM can be decreased by 1 BPM using a decrement button (down arrow / -)
- [x] BPM range is 20–300 (typical practice range)
- [x] Metronome sound plays when playback is active and exercise is not paused
- [x] Metronome sound stops when exercise is paused or stopped
- [x] Metronome clicks occur at precisely the correct interval based on current BPM (using Web Audio API or high-precision timer)
- [x] Changing BPM during playback immediately adjusts the metronome tempo
- [x] Metronome volume is controlled independently (toggle on/off, or separate volume slider)
- [x] First beat of each measure is acoustically distinct (louder, different pitch, or marked "1") from other beats
- [x] Metronome state persists for the session (BPM and on/off state remembered for current session)
- [x] Metronome UI integrates seamlessly with existing PlaybackControls (no layout shift)
- [x] Keyboard shortcuts support BPM adjustment (e.g., `=` to increment, `-` to decrement)
- [x] Screen reader announces current BPM when changed (aria-live region)
- [x] Metronome works on all browsers supporting Web Audio API (Chrome, Firefox, Safari, Edge)

## Technical Notes

### Integration Points
- **Existing component**: `ExercisePlaybackPage` in `packages/ui/src/components/organisms/ExercisePlaybackPage/`
  - Metronome component can be placed alongside existing `PlaybackControls`
  - Playback state is managed via props; metronome must react to `isPlaying` and `currentTime`

- **Playback timing**: Exercise playback uses `<audio>` element with `currentTime` property
  - Metronome timing must be synchronized with audio playback; use Web Audio API `AudioContext.currentTime` for sub-millisecond accuracy
  - Metronome clicks should fire relative to audio `currentTime`, not wall-clock time

### Sound Generation
- **Web Audio API**: Oscillator + Envelope for click sound (sine wave, ~1000 Hz for regular click, ~1200 Hz for downbeat)
- **Click duration**: ~50–100 ms per click (attack ~5 ms, release ~50 ms)
- **Volume**: Default 0.3 (30% of max audio), user-adjustable via toggle or slider

### BPM Calculation
- BPM → interval: `interval_ms = (60,000 / BPM)` milliseconds per beat
- For 4/4 time (standard): 4 clicks per measure, measure duration = `4 * interval_ms`
- Use `setInterval` or Web Audio API scheduled notes for click timing

### Component Structure
```
MetronomeControl
  ├─ BPM Input (numeric display)
  ├─ Increment/Decrement Buttons
  ├─ Toggle On/Off Button
  └─ (Optional) Volume Slider

Integration: Place in ExercisePlaybackPage alongside PlaybackControls
```

### State Management
- Store BPM in component state (can be lifted to parent if needed)
- Metronome should respect playback state (`isPlaying`, `isPaused`)
- BPM updates should not reset playback position

### Accessibility
- BPM input labeled with `<label htmlFor="bpm-input">`
- Buttons have clear aria-labels: `"Increase BPM"`, `"Decrease BPM"`, `"Toggle metronome"`
- BPM changes announced via `aria-live="polite"` region
- Slider (if included) has aria-valuemin, aria-valuemax, aria-valuenow

### Browser Compatibility
- **Web Audio API**: Supported in all modern browsers
- **Fallback**: If Web Audio unavailable, metronome can use `<audio>` element with pre-recorded click sound (less precise but acceptable)
- Test on Chrome, Firefox, Safari, Edge

## Out of Scope

- Metronome presets or profiles (e.g., "rock," "jazz")
- Advanced time signatures (3/4, 5/4, 7/8) — initially support 4/4 only
- MIDI metronome output to external devices
- Metronome muting via mute button (independent on/off toggle is in scope)
- Recording practice sessions with metronome data
- Analytics on metronome usage

## Definition of Done

1. ✅ Spec reviewed and approved
2. ✅ Acceptance criteria testable and unambiguous
3. ✅ MetronomeControl component implemented with unit tests
4. ✅ ExercisePlaybackPage updated to include MetronomeControl
5. ✅ Integration tests verify metronome timing and sync with playback
6. ✅ Manual testing on Chrome, Firefox, Safari
7. ✅ A11y audit: ARIA labels, keyboard shortcuts, screen reader testing
8. ✅ Spec marked `[x]` on all acceptance criteria
9. ✅ PR merged and deployed
