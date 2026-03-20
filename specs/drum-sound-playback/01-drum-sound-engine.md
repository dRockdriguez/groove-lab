# Spec: Drum Sound Engine

## Scope

Create a `DrumSoundEngine` class in `packages/utils/src/index.ts` that synthesizes drum sounds using the Web Audio API. Given a MIDI note number and velocity, the engine produces an immediate audio output through oscillators and noise generators. The engine receives an `AudioContext` via constructor injection for testability.

## Inputs

- `ctx: AudioContext` — injected via constructor
- `note: number` — GM drum MIDI note (0–127)
- `velocity: number` — hit strength (0–127)

## Outputs

- `DrumSoundEngine` class exported from `packages/utils/src/index.ts`
  - `constructor(ctx: AudioContext)`
  - `play(note: number, velocity: number): void` — triggers synthesized sound immediately
  - `setVolume(level: number): void` — master volume 0.0–1.0 (default 0.7)
  - `dispose(): void` — disconnects internal gain node

## Acceptance Criteria

- [x] `DrumSoundEngine` is exported from `packages/utils/src/index.ts`
- [x] Constructor accepts an `AudioContext` and creates a master `GainNode` connected to `ctx.destination`
- [x] `play(36, 100)` creates a sine oscillator with frequency sweep from 160Hz to 40Hz over 200ms (kick drum)
- [x] `play(38, 100)` creates a noise buffer source with bandpass filter at 3000Hz plus a triangle oscillator at 200Hz, both with 150ms decay (snare)
- [x] `play(42, 100)` creates a noise buffer source with bandpass filter at 8000Hz and 50ms decay (closed hi-hat)
- [x] `play(46, 100)` creates a noise buffer source with bandpass filter at 8000Hz and 300ms decay (open hi-hat)
- [x] `play(45, 100)` creates a sine oscillator at a frequency between 80Hz–200Hz mapped to the tom pitch, with 200ms decay (tom)
- [x] `play(49, 100)` creates a wideband noise source with highpass filter and 500ms decay (crash cymbal)
- [x] `play(51, 100)` creates a narrow-band noise source at high frequency with 400ms decay (ride cymbal)
- [x] `play(99, 100)` (unmapped note) creates a short sine oscillator at 440Hz with 100ms decay (fallback)
- [x] Velocity scales output gain linearly: `gain = (velocity / 127) * masterVolume`
- [x] `play(36, 0)` produces no sound (velocity 0 is ignored)
- [x] `setVolume(0.5)` changes master gain node value to 0.5
- [x] `setVolume(0.0)` mutes all output
- [x] `dispose()` disconnects the master gain node from destination
- [x] After `dispose()`, calling `play()` does not throw

## Edge Cases

- Velocity 0: `play()` returns immediately without creating any audio nodes
- Velocity 127: maximum gain = `1.0 * masterVolume`
- Rapid repeated calls: each `play()` creates independent audio nodes that overlap naturally (no cancellation of previous sounds)
- Unknown notes (not in GM drum map): use fallback synthesis (440Hz sine, 100ms)
- `setVolume()` clamped to 0.0–1.0 range
- After `dispose()`, `play()` is a no-op (no throw)

## Notes

- Synthesis recipes use the same note groupings as `getDrumColor()` in the same file
- Tom notes (41, 43, 45, 47, 48, 50) map to frequencies proportional to their pitch: lower note = lower frequency
- The noise buffer for snare/hi-hat/crash/ride is a shared pre-generated white noise `AudioBuffer` created once in the constructor (1 second, mono, filled with `Math.random() * 2 - 1`)
- Test strategy: mock `AudioContext` following the pattern in `MetronomeControl.test.tsx` (lines 7–30). Verify `createOscillator`, `createGain`, `createBufferSource` are called with correct parameters
- This spec modifies only `packages/utils/src/index.ts`. No component changes.

## Definition of Done

- [x] `DrumSoundEngine` class exported from `packages/utils/src/index.ts`
- [x] All 16 acceptance criteria have corresponding passing tests
- [x] No regressions in existing `packages/utils` tests (35 drum-hit-detection tests still passing)
- [x] Only `packages/utils/src/index.ts` modified; no component changes

## Status

**Implemented** (2026-03-20)
