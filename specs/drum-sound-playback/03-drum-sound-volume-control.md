# Spec: Drum Sound Volume Control

## Scope

Add a volume slider and mute toggle for drum sounds to the `ToolsSidebar` component. Wire the volume state from `ExercisePlaybackPage` to `DrumSoundEngine.setVolume()`. Persist volume preference to `sessionStorage`.

## Inputs

- `DrumSoundEngine.setVolume(level)` method (spec 01)
- `drumSoundEngineRef` in `ExercisePlaybackPage` (spec 02)
- `ToolsSidebar` component (existing, has `metronomeProps`)

## Outputs

- New `drumVolumeProps` on `ToolsSidebar`: `{ volume: number; onVolumeChange: (v: number) => void; isMuted: boolean; onToggleMute: () => void }`
- Volume slider (range input 0–100) rendered below metronome section in sidebar
- Mute toggle button with `aria-pressed`
- `sessionStorage` key: `exerciseTools_drumVolume`
- `sessionStorage` key: `exerciseTools_drumMuted`

## Acceptance Criteria

- [ ] ToolsSidebar renders a "Drum Volume" section below the metronome controls when `drumVolumeProps` is provided
- [ ] Volume slider is a range input with `min=0`, `max=100`, `aria-label="Drum volume"`
- [ ] Slider default value is 70 (maps to engine volume 0.7)
- [ ] Moving the slider calls `onVolumeChange(newValue)` with the numeric value
- [ ] `ExercisePlaybackPage` calls `drumSoundEngineRef.current.setVolume(volume / 100)` when volume changes
- [ ] Mute button renders with `aria-pressed="false"` by default
- [ ] Clicking mute button toggles `aria-pressed` and calls `onToggleMute()`
- [ ] When muted, `DrumSoundEngine.setVolume(0)` is called; when unmuted, previous volume is restored
- [ ] Volume value persists to `sessionStorage` key `exerciseTools_drumVolume` on change
- [ ] Muted state persists to `sessionStorage` key `exerciseTools_drumMuted` on change
- [ ] On page load, volume and muted state are restored from `sessionStorage` (defaults: volume=70, muted=false)
- [ ] When `drumVolumeProps` is not provided (undefined), the volume section is not rendered

## Edge Cases

- Volume slider at 0: equivalent to mute but does not toggle the mute button state
- Mute then change slider: slider visually updates but engine stays at 0 until unmuted
- `DrumSoundEngine` not yet initialized (no MIDI event yet): volume state is stored and applied when engine is created
- `sessionStorage` unavailable: silently fall back to defaults, no error

## Notes

- Follows the same pattern as `metronomeProps` in `ToolsSidebar` — optional prop object, section only renders when provided
- Volume slider styling should use the same Tailwind classes as existing sidebar controls
- This spec modifies `ToolsSidebar.tsx` (add volume section), `ExercisePlaybackPage.tsx` (add volume state + wiring)
- Tests: ~10-12 tests in `ToolsSidebar.test.tsx` (volume section rendering, interactions, accessibility) and `ExercisePlaybackPage.tools-sidebar.test.tsx` (persistence, engine wiring)

## Definition of Done

- [ ] Volume slider + mute toggle rendered in ToolsSidebar
- [ ] Volume wired to `DrumSoundEngine.setVolume()`
- [ ] Persistence to/from `sessionStorage`
- [ ] All 12 acceptance criteria have corresponding passing tests
- [ ] No regressions in existing ToolsSidebar tests (39 tests)
- [ ] No regressions in existing ExercisePlaybackPage tests

## Status

**Not started**
