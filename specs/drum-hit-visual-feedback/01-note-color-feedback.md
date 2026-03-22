# Spec: Note Color Feedback

**Status:** Implemented
**Last updated:** 2026-03-22

## Scope

Render individual MIDI notes with colors based on the user's hit validation (whether they were hit correctly, early, late, missed, or not played).

When a user plays a drum pad, the corresponding note on the timeline changes from the rudiment color (`getDrumColor()`) to a feedback color:
- Green for correct hits
- Orange for late hits
- Purple for early hits
- Original rudiment color if missed or not played

## Inputs

- `validatedHits?: DrumHitValidation[]` — Array of validated hits from `ExercisePlaybackPage.validatedHits` state
- `midiEvents: MidiEvent[]` — Existing timeline note data (already a prop)
- `currentTimeMs: number` — Current playhead position (already a prop)

## Outputs

- Note markers on timeline colored according to hit classification
- Only notes that were actually played change color
- Notes that were missed or not yet played keep their rudiment color

## Acceptance Criteria

### Note color mapping
- [x] Note with `classification === 'hit'` renders **green** (`#22C55E`)
- [x] Note with `classification === 'late'` renders **orange** (`#FB923C`)
- [x] Note with `classification === 'early'` renders **purple** (`#A855F7`)
- [x] Note with `classification === 'miss'` renders **rudiment color** (via `getDrumColor()`)
- [x] Note with `classification === 'violation'` renders **rudiment color** (via `getDrumColor()`)
- [x] Note **not in validatedHits** renders **rudiment color** (via `getDrumColor()`)

### Per-note lookup
- [x] `ExercisePlaybackTimeline` creates a lookup map: `note number → latest DrumHitValidation`
  - If multiple hits on same note, use the one with highest `detectedMs` (most recent)
  - Memoized with dependency on `validatedHits` to avoid recalculation
- [x] Lookup handles edge case: multiple validatedHits entries for the same note (e.g., player hit kick twice)

### Rendering logic
- [x] For each note marker in the timeline (line 387–398 of ExercisePlaybackTimeline.tsx):
  - Determine its background color: check lookup first, fall back to `getDrumColor(event.note)`
  - Apply background color via inline style: `backgroundColor: colorForNote`
- [x] Note opacity calculation unchanged (still uses `Math.max(0.3, event.velocity / 127)`)

### Data flow
- [x] `ExercisePlaybackTimeline` accepts new optional prop: `validatedHits?: DrumHitValidation[]`
- [x] When `validatedHits` is undefined or empty, all notes use rudiment colors (no change)
- [x] When `validatedHits` has entries, lookup is built and applied

## Edge Cases

- Multiple plays of same note (e.g., "play kick twice"):
  - Use the **most recent** (highest `detectedMs`) for color
  - Older plays are shadowed by newer ones in the lookup
- Note exists in exercise but was never played: rudiment color
- Note exists in validatedHits but not in midiEvents: silently ignored (no error)
- `validatedHits` is undefined: behave as if empty (all rudiment colors)
- Empty validatedHits array: all rudiment colors

## Notes

- Modified file: `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.tsx`
- New test file: `ExercisePlaybackTimeline.note-color-feedback.test.tsx`
- The lookup is **immutable per render**; it's computed fresh each render from validatedHits
- This feature is **read-only**: no new state, no callbacks, just data → color mapping

### Implementation hint

```typescript
// Inside ExercisePlaybackTimeline:
const validatedHitsLookup = React.useMemo(() => {
  if (!validatedHits || validatedHits.length === 0) return new Map();

  const map = new Map<number, DrumHitValidation>();
  for (const hit of validatedHits) {
    const existing = map.get(hit.note);
    // Keep the most recent hit (highest detectedMs)
    if (!existing || hit.detectedMs > existing.detectedMs) {
      map.set(hit.note, hit);
    }
  }
  return map;
}, [validatedHits]);

// Then for each note marker, determine its color:
const validation = validatedHitsLookup.get(event.note);
const noteColor = validation
  ? (validation.classification === 'hit' ? '#22C55E' : ...)
  : getDrumColor(event.note);
```

## Test Plan

### Unit tests: Note color mapping
- `getDrumColor()` returns rudiment color for any valid MIDI note ✓ (already tested in utils)
- Color for 'hit' classification is green
- Color for 'early' classification is purple
- Color for 'late' classification is orange
- Color for 'miss' classification is rudiment color
- Color for 'violation' classification is rudiment color

### Component tests: Note rendering
- Note with matching validatedHit renders correct classification color
- Note without matching validatedHit renders rudiment color
- Multiple hits on same note: most recent hit's color is used
- Empty validatedHits: all notes render rudiment colors
- Undefined validatedHits: all notes render rudiment colors

### Integration tests
- All notes on timeline render (existing test continues to pass)
- Note colors update when validatedHits changes
- No console errors or warnings
- Hit notes remain colored after move to next note (persistence of lookup)
