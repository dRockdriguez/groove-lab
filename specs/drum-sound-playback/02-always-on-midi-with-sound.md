# Spec: Always-On MIDI Handler with Sound and Gated Scoring

## Scope

Restructure the `handleMidiMessage` callback in `ExercisePlaybackPage.tsx` (lines 83–130) so that drum sounds play on every MIDI note-on event regardless of playback state, while hit validation and scoring remain gated to `playbackState === 'playing'`. Add `AudioContext` lifecycle management and `DrumSoundEngine` integration.

## Inputs

- `DrumSoundEngine` class from `packages/utils` (spec 01)
- Existing MIDI handler in `ExercisePlaybackPage.tsx`
- Existing `AudioContext` pattern from `MetronomeControl.tsx` (lines 109–139)

## Outputs

- Restructured `handleMidiMessage`: sound always, scoring only during playback
- New refs: `drumSoundEngineRef`, `sharedAudioContextRef`
- New helper: `ensureAudioContext()` — creates or resumes `AudioContext`
- Cleanup on component unmount

## Acceptance Criteria

- [ ] When `playbackState === 'stopped'` and a MIDI note-on with velocity > 0 arrives, `DrumSoundEngine.play(note, velocity)` is called
- [ ] When `playbackState === 'paused'` and a MIDI note-on with velocity > 0 arrives, `DrumSoundEngine.play(note, velocity)` is called
- [ ] When `playbackState === 'playing'` and a MIDI note-on with velocity > 0 arrives, `DrumSoundEngine.play(note, velocity)` is called AND `validateDrumHit()` runs (scoring updates)
- [ ] When a MIDI note-on with velocity === 0 arrives, neither sound nor scoring triggers (regardless of playback state)
- [ ] When a MIDI message is not note-on (status !== 0x90), neither sound nor scoring triggers
- [ ] `AudioContext` is created lazily on the first MIDI note-on event (not on page load)
- [ ] If `AudioContext` is in `'suspended'` state, `ensureAudioContext()` calls `ctx.resume()` before playing sound
- [ ] `DrumSoundEngine` is instantiated once when `AudioContext` is created, stored in `drumSoundEngineRef`
- [ ] On component unmount, `DrumSoundEngine.dispose()` is called and `AudioContext` is closed
- [ ] Existing scoring behavior is unchanged: `validatedHits` state updates only during playback, debounce (50ms/note) still applies, consumed hit tracking still works
- [ ] All existing MIDI feedback tests continue to pass without modification (no regressions)

## Edge Cases

- Browser autoplay policy: `AudioContext` may be created in `'suspended'` state even on MIDI events. `ensureAudioContext()` must call `resume()` and handle the promise.
- Multiple rapid MIDI events before `AudioContext.resume()` resolves: `play()` calls should still execute (AudioContext queues them internally once resumed)
- Component unmount during active sounds: `dispose()` + `ctx.close()` stops all pending audio
- MIDI device reconnection: handler is already re-attached via `statechange` listener (no change needed)

## Notes

- The key change is moving `if (playbackStateRef.current !== 'playing') return;` (line 85) BELOW the sound trigger, so it only gates scoring
- The `ensureAudioContext()` pattern is similar to `MetronomeControl.tsx` lines 122–128 but uses lazy initialization instead of toggle-driven creation
- `sharedAudioContextRef` is separate from MetronomeControl's internal context. A future spec could unify them.
- This spec modifies only `ExercisePlaybackPage.tsx`. Tests extend `ExercisePlaybackPage.midi-feedback.test.tsx`.

## Definition of Done

- [x] MIDI handler restructured: sound always fires, scoring gated to playing
- [x] `ensureAudioContext()` helper implemented with lazy init + resume
- [x] `drumSoundEngineRef` and `sharedAudioContextRef` refs added
- [x] Cleanup on unmount (dispose + close)
- [x] All 11 acceptance criteria have corresponding passing tests
- [x] No regressions in existing MIDI feedback tests (12 tests)
- [x] No regressions in existing ExercisePlaybackPage tests

## Status

**Implemented** (2026-03-20)
