# Spec: Fix MIDI Event Timestamp Staleness

## Scope

In `ExercisePlaybackPage.tsx` `handleMidiMessage`, replace `currentTimeMsRef.current`
(last requestAnimationFrame tick, up to 16ms stale) with a value derived from
`e.timeStamp` (the Web MIDI API `MIDIMessageEvent.timeStamp`, a `DOMHighResTimeStamp`
in `performance.now()` units). Compute the exercise timeline position by subtracting the
`performance.now()` value captured at playback start.

## Inputs

- `e: MIDIMessageEvent` — the Web MIDI API event, carrying `e.timeStamp` (ms since
  page load, `performance.now()`-based)
- `playbackStartPerfTimeRef: React.MutableRefObject<number>` — new ref that records
  `performance.now()` at the moment playback begins (when audio `.play()` resolves)
- `playbackStartAudioOffsetRef: React.MutableRefObject<number>` — new ref that records
  the audio element's `currentTime * 1000` at the moment `.play()` resolves (handles
  seek-then-play)

## Outputs

- `exerciseTimeMs: number` — computed inside `handleMidiMessage` as:
  `(e.timeStamp - playbackStartPerfTimeRef.current) + playbackStartAudioOffsetRef.current`
- This value replaces `currentTimeMsRef.current` in the `validateDrumHit()` call

## Acceptance Criteria

- [ ] A new ref `playbackStartPerfTimeRef` is added to `ExercisePlaybackPage`; it is set to
      `performance.now()` immediately after `audioRef.current.play()` resolves without error
- [ ] A new ref `playbackStartAudioOffsetRef` is added; it is set to
      `audioRef.current.currentTime * 1000` at the same moment
- [ ] Both refs are reset to `0` when playback stops (state transitions to `'stopped'`)
- [ ] Both refs are updated again on resume from pause (state transitions from `'paused'`
      to `'playing'`), capturing the current `performance.now()` and audio offset at that
      moment
- [ ] `handleMidiMessage` computes
      `exerciseTimeMs = (e.timeStamp - playbackStartPerfTimeRef.current) + playbackStartAudioOffsetRef.current`
      and passes `exerciseTimeMs` (not `currentTimeMsRef.current`) to `validateDrumHit`
- [ ] `exerciseTimeMs` is clamped to `[0, exercise.durationMs]` before being passed to
      `validateDrumHit` to prevent out-of-range lookups
- [ ] The debounce check still uses `exerciseTimeMs` for the per-note last-hit comparison
      (replaces previous use of `currentTimeMsRef.current` in the debounce check)
- [ ] `currentTimeMsRef` continues to exist and is still used for other purposes
      (playhead display); only the MIDI handler's timing input changes

## Edge Cases

- If `playbackStartPerfTimeRef.current === 0` (MIDI message arrives before play starts),
  the handler returns early (same as current `playbackState !== 'playing'` guard)
- If computed `exerciseTimeMs < 0` (clock skew or ref not yet set), clamp to 0
- On seek-then-play: `playbackStartAudioOffsetRef` captures the seeked position so the
  offset math remains correct

## Notes

- Only `ExercisePlaybackPage.tsx` is modified
- The `handleMidiMessage` callback's dependency array does not change (all reads via refs)
- Integration tests that mock MIDI events should set `e.timeStamp` to a meaningful value;
  existing tests that don't set `timeStamp` will get `undefined` → NaN → clamped to 0,
  which is acceptable test behavior (tests should be updated to set `timeStamp`)
