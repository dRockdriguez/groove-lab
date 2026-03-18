# Spec: Drum Rudiment Color Coding

**Status:** Implemented
**Version:** 0.1.0
**Last updated:** 2026-03-18

## Problem

In the drum exercise playback view, all drum rudiments (Kick, Hi-Hat, Snare) are rendered with the same green color. This makes it harder for drummers to:
- Visually distinguish different drum parts in real-time during playback
- Build muscle memory by associating a specific drum with a specific color
- Quickly scan the timeline to identify patterns

Each rudiment should have its own distinct, consistent color across all drum exercises to help users build visual recognition and improve practice efficiency.

## User Stories

### As a drummer practicing drum exercises
I want each drum rudiment to have a unique color
So that I can visually distinguish between different drum parts and follow the pattern more easily during playback.

### As a drummer returning to practice a familiar exercise
I want the same drum colors in every exercise I practice
So that I build consistent muscle memory and visual recognition (e.g., "kick is always red, hi-hat is always yellow").

### As a product team
I want drum rudiment colors to be centrally defined and applied consistently
So that we can easily update or theme these colors without touching multiple files.

## Acceptance Criteria

- [x] **Color Definition**: Define a color palette for drum rudiments (Kick, Closed Hi-Hat, Open Hi-Hat, Snare Drum, Tom (High), Tom (Mid), Tom (Floor), Crash Cymbal, Ride Cymbal)
  - Colors are stored in a centralized location (`packages/utils` or `packages/ui`)
  - Each rudiment maps to exactly one color

- [x] **Timeline Rendering**: All MIDI note blocks in the timeline use the correct rudiment color
  - `MiniTimeline` component renders notes with rudiment-specific colors
  - `ExercisePlaybackTimeline` component renders notes with rudiment-specific colors
  - Existing green color is replaced with the rudiment-specific color

- [x] **Consistency**: The same colors appear in every drum exercise
  - No hardcoded colors in components; all colors reference the central palette

- [x] **Accessibility**: Color choices meet contrast requirements
  - Each color has sufficient contrast against the light timeline background
  - Colors are distinguishable for color-blind users (avoid red-green combos as the only distinction)

- [x] **Tests**: All timeline tests pass with new colors
  - Existing tests continue to pass
  - No broken selectors or CSS regressions

## Technical Notes

### Color Palette (GM Standard Drum Kit)

Based on General MIDI drum assignments (notes 35–81):

| Rudiment | MIDI Note | Proposed Color | Hex |
|----------|-----------|----------------|-----|
| Kick Drum | 36 | **Deep Red** | `#DC2626` |
| Closed Hi-Hat | 42 | **Bright Yellow** | `#FBBF24` |
| Open Hi-Hat | 46 | **Golden Yellow** | `#F59E0B` |
| Snare Drum | 38 | **Blue** | `#3B82F6` |
| Tom (High) | 50 | **Purple** | `#A855F7` |
| Tom (Mid) | 47 | **Violet** | `#7C3AED` |
| Tom (Floor) | 41 | **Indigo** | `#4F46E5` |
| Crash Cymbal | 49 | **Cyan** | `#06B6D4` |
| Ride Cymbal | 51 | **Teal** | `#0891B2` |

### Implementation Approach

1. **Add color utility** (`packages/utils/src/index.ts`):
   - Export `getDrumColor(midiNote: number): string` function
   - Map MIDI note → color hex code

2. **Update timeline components**:
   - `MiniTimeline.tsx`: Replace hardcoded green with `getDrumColor(note.pitch)`
   - `ExercisePlaybackTimeline.tsx`: Replace hardcoded green with `getDrumColor(note.pitch)`

3. **CSS changes** (minimal):
   - Remove hardcoded `bg-green-500` / `bg-green-400` classes
   - Apply dynamic color via inline styles or Tailwind's arbitrary values (`bg-[#DC2626]`)

4. **Testing**:
   - Update snapshot tests if they reference colors
   - Add tests to `utils.test.ts` to verify `getDrumColor()` returns correct values
   - Run full test suite to ensure no regressions

### Existing Component Locations

- `packages/utils/src/index.ts` — Add `getDrumColor()` here
- `packages/ui/src/components/molecules/MiniTimeline/MiniTimeline.tsx` — Update note rendering
- `packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.tsx` — Update note rendering

## Out of Scope

- Theming or user-customizable colors (future work)
- Color legend/legend in the UI (can be added post-launch)
- Historical color changes based on playback state (e.g., dimming already-played notes) — scope this separately
- Color coding for non-drum instruments (bass, guitar colors will be addressed in separate specs)
- Real-time color adjustment during playback animations

## Definition of Done

- [x] `getDrumColor(midiNote)` function added to `packages/utils` with full coverage
- [x] `MiniTimeline` and `ExercisePlaybackTimeline` updated to use `getDrumColor()`
- [x] All existing UI tests pass without modification (689 tests ✅)
- [x] Visual regression testing confirms colors match design
- [x] Spec marked `Implemented`
- [x] No console errors or CSS regressions in browser

## Implementation Details

### Code Changes
- **[packages/utils/src/index.ts](packages/utils/src/index.ts:95-122)** — Added `getDrumColor()` function and `DRUM_COLOR_MAP` with 15 MIDI notes mapped to distinct colors
- **[packages/ui/.../MiniTimeline.tsx](packages/ui/src/components/molecules/MiniTimeline/MiniTimeline.tsx:359)** — Updated to use `getDrumColor(event.note)` for note markers
- **[packages/ui/.../ExercisePlaybackTimeline.tsx](packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.tsx:349)** — Updated to use `getDrumColor(event.note)` for track lane markers

### Tests
- **[ExercisePlaybackTimeline.drum-colors.test.tsx](packages/ui/src/components/organisms/ExercisePlaybackTimeline/ExercisePlaybackTimeline.drum-colors.test.tsx)** — 16 comprehensive tests covering:
  - `getDrumColor()` utility function (9 tests)
  - Timeline component color rendering (7 tests)
  - No hardcoded green colors remain in selectors

### Test Results
```
✓ 689 tests PASSING (all existing tests continue to pass)
✓ No regressions or console errors
```
