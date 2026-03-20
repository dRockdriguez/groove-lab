# Overview: Drum Sound Playback

## Problem Summary

When a user connects their e-drum kit via USB MIDI, the app detects the connection (MIDI indicator shows green) but produces no audio when pads are hit. Additionally, MIDI hit detection only activates during exercise playback (`playbackState === 'playing'`), meaning the user cannot practice freely or hear their instrument outside of an active exercise.

The user expects to:
1. Hear drum sounds from the browser whenever they hit a pad (always, not just during playback)
2. See hit detection and scoring when playing along with an exercise

## Affected Files

- `packages/utils/src/index.ts` — New `DrumSoundEngine` class (synthesis logic)
- `packages/ui/src/components/organisms/ExercisePlaybackPage/ExercisePlaybackPage.tsx` — Restructure MIDI handler, wire sound engine
- `packages/ui/src/components/organisms/ToolsSidebar/ToolsSidebar.tsx` — Volume control UI (spec 03)

## Architecture

```
MIDI pad hit (Web MIDI API)
    ↓
handleMidiMessage()
    ↓
parse bytes → filter note-on + velocity > 0
    ↓                          ↓
DrumSoundEngine.play()    [only during playback]
(ALWAYS — audio feedback)  validateDrumHit() → scoring
    ↓
Web Audio API synthesis
(oscillators + noise → speakers)
```

Key design decisions:
- **Synthesis over samples** — Web Audio API oscillators/noise (no audio files needed)
- **DrumSoundEngine in `packages/utils`** — Alongside existing drum logic (`GM_DRUM_MAP`, `getDrumColor`, `validateDrumHit`). Accepts `AudioContext` via constructor (dependency injection).
- **Sound always, scoring gated** — Sound triggers on every MIDI note-on. Scoring only during `playbackState === 'playing'`.

## Mini-Specs and Execution Order

Specs 01 → 02 are sequential (02 depends on 01). Spec 03 is optional UX polish.

| # | File | Scope | Dependency |
|---|------|-------|------------|
| 01 | `01-drum-sound-engine.md` | `DrumSoundEngine` class: Web Audio synthesis for GM drum notes | none |
| 02 | `02-always-on-midi-with-sound.md` | Restructure MIDI handler: sound always, scoring gated to playback | 01 |
| 03 | `03-drum-sound-volume-control.md` | Volume slider + mute toggle in ToolsSidebar | 02 |
