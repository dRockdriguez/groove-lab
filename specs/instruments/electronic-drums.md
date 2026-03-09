# Spec: Detect MIDI Hits from an Electronic Drum Kit

**Status:** Draft
**Version:** 0.1.0
**Last updated:** 2026-03-09
**Owner:** GrooveLab team

---

## Problem

Musicians using electronic drum kits need a way to connect their kit to GrooveLab and have
every hit detected, timestamped, and classified so the system can provide timing feedback
and practice analysis.

Without this foundational capability, no other drum-related feature (rhythm detection,
timing feedback, session recording) is possible.

---

## User Stories

1. **As a drummer**, I want to connect my electronic drum kit via USB/MIDI so that GrooveLab
   can detect my hits in real time.

2. **As a drummer**, I want each hit to be classified by pad (kick, snare, hi-hat, etc.)
   so I can see performance breakdowns per drum.

3. **As a drummer**, I want the latency between hitting a pad and detection to be under 10ms
   so the feedback feels immediate and accurate.

4. **As the system**, I want invalid or out-of-range MIDI messages to be ignored gracefully
   so malformed data cannot crash or corrupt a practice session.

---

## Acceptance Criteria

- [ ] System detects MIDI note-on events on all 16 MIDI channels.
- [ ] Each event is stored as a `MidiEvent` with: `timestamp`, `note`, `velocity`, `channel`, `type`.
- [ ] `timestamp` is recorded in milliseconds since Unix epoch.
- [ ] Note 36 (C2) maps to `"kick-drum"` using the GM drum map.
- [ ] Note 38 (D2) maps to `"snare-drum"` using the GM drum map.
- [ ] Note 42 (F#2) maps to `"closed-hi-hat"` using the GM drum map.
- [ ] Velocity-0 note-on events are treated as note-off (per MIDI spec).
- [ ] Events with velocity in range 0–127 are accepted; out-of-range values are rejected.
- [ ] MIDI notes in range 0–127 are accepted; out-of-range values are rejected.
- [ ] Latency from MIDI event to `MidiEvent` object creation is < 10ms.
- [ ] Unit tests exist for: event parsing, GM drum map lookup, velocity validation, note validation.

---

## Technical Notes

### Backend
- Use `python-rtmidi` for MIDI device access on the server side.
- Implement in `skills/midi/backend/`.
- Input validation using `isValidVelocity()` and `isValidNote()` from `packages/utils`.

### Frontend
- Use `navigator.requestMIDIAccess()` (Web MIDI API).
- Implement in `skills/midi/frontend/`.
- Wrap Web MIDI API in an abstraction layer for testability.

### Shared
- `MidiEvent` type defined in `packages/types/src/index.ts`.
- `GM_DRUM_MAP` and helpers in `packages/utils/src/index.ts`.

### Skill module
- Implementation lives in `skills/midi/`.

---

## Out of Scope (v0.1)

- Latency compensation / jitter correction
- Multi-device / multi-kit support
- Bluetooth MIDI
- MIDI clock sync
- SysEx messages

---

## Definition of Done

- [ ] Spec reviewed and accepted
- [ ] Tests written (covering all acceptance criteria)
- [ ] Implementation passes all tests
- [ ] `skills/midi/README.md` updated with implementation notes
- [ ] No regressions in existing tests
