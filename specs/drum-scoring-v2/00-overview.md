# Drum Scoring v2 — Overview

## Problem

The existing scoring system (drum-hit-detection + drum-scoring-improvements) does not work correctly and needs to be completely replaced. The new system compares the user's real-time MIDI drum input note-by-note against the exercise's parsed MIDI track, showing visual feedback directly on the playback timeline.

## Architecture

```
User hits drum pad
       │
       ▼
Web MIDI API (already exists, keep)
       │
       ▼
matchNote() ─── pure function, no state
       │           compares note+time vs exercise track
       ▼
ScoringTracker ─── stateful class
       │           tracks consumed notes, detects misses
       ▼
activeGlows Map ─── per-note most-recent result
       │
       ▼
ExercisePlaybackTimeline ─── row glow rendering
       │                      full-row color overlay per classification
       ▼
User sees green/yellow/orange/red/purple glow on track rows
```

**No stats panel.** Only visual feedback on the track itself.

## Data Source

Each exercise has `parsed_midi_data` JSON in the database containing:
```json
{
  "pistaEjercicio": [
    { "timestamp": 0.0, "note": 36, "velocity": 100, "channel": 1 },
    ...
  ]
}
```

The frontend receives this as `exercise.midiEvents: MidiEvent[]`.

## Classifications

| Classification | Meaning | Color |
|---|---|---|
| `correct` | Right note, within ±PERFECT_THRESHOLD_MS (30ms) | Green |
| `early` | Right note, hit before expected (beyond 30ms, within tolerance) | Yellow |
| `late` | Right note, hit after expected (beyond 30ms, within tolerance) | Orange |
| `missed` | Expected note passed without being played | Red |
| `wrong_note` | User played a note not expected near that time | Purple |

## Tolerance Presets (configurable by user)

| Preset | Tolerance Window | Description |
|---|---|---|
| Easy | ±300ms | Forgiving timing window |
| Medium | ±200ms | Default, balanced |
| Hard | ±100ms | Strict timing |

## Mini-Specs

| # | Spec | Scope | Dependencies |
|---|------|-------|-------------|
| 01 | cleanup-old-scoring | Remove all old scoring code, components, tests | None |
| 02 | note-matching-engine | Pure function: matchNote() + buildExpectedNoteLookup() | 01 |
| 03 | tolerance-config | ToleranceSelector UI component + ToolsSidebar integration | 02 |
| 04 | realtime-scoring-tracker | ScoringTracker class: state, miss detection, glow map | 02 |
| 05 | row-glow-rendering | ExercisePlaybackTimeline row glow overlay rendering | 04 |
| 06 | page-integration | Wire tracker into ExercisePlaybackPage + connect everything | 02, 03, 04, 05 |
| 07 | cleanup-old-specs | Delete old spec files | All |

## Execution Order

```
01 cleanup
 └→ 02 matching engine
     ├→ 03 tolerance UI     (parallel)
     ├→ 04 scoring tracker   (parallel)
     │    └→ 05 row glow
     └────────→ 06 page integration
                 └→ 07 cleanup specs
```

## What to KEEP (do NOT delete)

- `getDrumColor()` and `DRUM_COLOR_MAP` (packages/utils)
- `DrumSoundEngine` class (packages/utils)
- Web MIDI API capture (ExercisePlaybackPage)
- Loop system (loopStartMs, loopEndMs, repetitions)
- All non-scoring playback, metronome, sidebar functionality
