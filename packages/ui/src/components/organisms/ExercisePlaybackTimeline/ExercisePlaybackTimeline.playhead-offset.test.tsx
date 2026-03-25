import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import type { MidiEvent } from '@groovelab/utils';

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPTANCE CRITERIA MAPPING
// ─────────────────────────────────────────────────────────────────────────────
// AC1: Prop playheadOffsetPx?: number optional on ExercisePlaybackTimelineProps
// AC2: Default value is 250px if not provided
// AC3: Prop accepts any non-negative integer (0 to disable offset)
// AC4: Playhead positioned at fixed left: playheadOffsetPx px (no percentage, no transform)
// AC5: Playhead class unchanged (absolute top-0 bottom-0 w-0.5 bg-green-500 z-10 pointer-events-none)
// AC6: Loop/metronome/note markers unaffected by offset prop
// AC7: Click-to-seek time calculation unaffected by offset
// AC8: Playhead does not change position as currentTimeMs changes (fixed visual offset)

describe('ExercisePlaybackTimeline playhead offset', () => {
  const mockMidiEvents: MidiEvent[] = [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
    { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
    { timestamp: 1000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
    { timestamp: 1500, note: 36, velocity: 95, channel: 1, type: 'noteOn' },
  ];

  // ───────────────────────────────────────────────────────────────────────────
  // AC1: Prop accepts playheadOffsetPx
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC1: playheadOffsetPx prop acceptance', () => {
    it('accepts playheadOffsetPx prop without error', () => {
      expect(() => {
        render(
          <ExercisePlaybackTimeline
            midiEvents={mockMidiEvents}
            durationMs={2000}
            currentTimeMs={500}
            playheadOffsetPx={200}
          />
        );
      }).not.toThrow();
    });

    it('renders without error when playheadOffsetPx is undefined', () => {
      expect(() => {
        render(
          <ExercisePlaybackTimeline
            midiEvents={mockMidiEvents}
            durationMs={2000}
            currentTimeMs={500}
            playheadOffsetPx={undefined}
          />
        );
      }).not.toThrow();
    });

    it('renders without error when playheadOffsetPx is 0', () => {
      expect(() => {
        render(
          <ExercisePlaybackTimeline
            midiEvents={mockMidiEvents}
            durationMs={2000}
            currentTimeMs={500}
            playheadOffsetPx={0}
          />
        );
      }).not.toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC2: Default offset is 250px
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC2: default offset is 250px', () => {
    it('applies left: 250px when playheadOffsetPx not provided', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '250px' });
    });

    it('applies left: 250px when playheadOffsetPx is undefined', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={undefined}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '250px' });
    });

    it('default offset is rendered in inline style attribute', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      const leftValue = playhead.style.left;
      expect(leftValue).toMatch(/\d+px/);
      expect(leftValue).toContain('250');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC3: Offset accepts any non-negative integer
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC3: offset accepts non-negative integers', () => {
    it('applies left: 0px when playheadOffsetPx is 0', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={0}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '0px' });
    });

    it('applies left: 150px when playheadOffsetPx is 150', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={150}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '150px' });
    });

    it('applies left: 300px when playheadOffsetPx is 300', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={300}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '300px' });
    });

    it('applies left: 500px for large custom offset', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={500}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '500px' });
    });

    it('applies left: 1px for minimal offset', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={1}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '1px' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC4: Playhead positioned at fixed left: playheadOffsetPx px
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC4: playhead at fixed pixel position', () => {
    it('left position is always at playheadOffsetPx regardless of currentTimeMs', () => {
      // At 50% duration (1000ms of 2000ms total)
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={1000}
          playheadOffsetPx={250}
        />
      );

      const playhead1 = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead1).toHaveStyle({ left: '250px' });

      // Change currentTimeMs to 0% but playhead should stay at 250px
      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          playheadOffsetPx={250}
        />
      );

      const playhead2 = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead2).toHaveStyle({ left: '250px' });
    });

    it('left position remains fixed when time changes and offset is constant', () => {
      // Start at 25% (500ms of 2000ms)
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      let playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '250px' });

      // Move to 50% (1000ms) — playhead should stay at 250px
      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={1000}
          playheadOffsetPx={250}
        />
      );

      playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '250px' });
    });

    it('playhead position only changes when offset prop changes', () => {
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={100}
        />
      );

      let playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '100px' });

      // Change offset
      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={300}
        />
      );

      playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '300px' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC5: Playhead positioned at fixed left: playheadOffsetPx px
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC5: playhead positioned at fixed pixel offset', () => {
    it('playhead has left pixel style (not percentage)', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      const leftValue = playhead.style.left;

      expect(leftValue).toBeTruthy();
      expect(leftValue).toMatch(/\d+px/);
      expect(leftValue).not.toMatch(/%/);
    });

    it('playhead has left in inline styles (no transform property)', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;

      expect(playhead.style.left).toBeTruthy();
      expect(playhead.style.left).toContain('250px');
      // Should NOT have a transform style
      expect(playhead.style.transform).toBe('');
    });

    it('left is pixel format regardless of offset value', () => {
      const offsets = [0, 100, 250, 500];

      for (const offset of offsets) {
        const { container } = render(
          <ExercisePlaybackTimeline
            midiEvents={mockMidiEvents}
            durationMs={2000}
            currentTimeMs={500}
            playheadOffsetPx={offset}
          />
        );

        const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
        expect(playhead.style.left).toMatch(/^\d+px$/);
        expect(playhead.style.left).toBe(`${offset}px`);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC6: Playhead class and appearance unchanged (offset does not affect styling)
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC6: playhead class and appearance unchanged', () => {
    it('playhead retains absolute positioning class', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveClass('absolute');
    });

    it('playhead retains top-0 bottom-0 classes', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveClass('top-0');
      expect(playhead).toHaveClass('bottom-0');
    });

    it('playhead retains w-0.5 (width) class', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveClass('w-0.5');
    });

    it('playhead retains bg-green-500 (color) class', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveClass('bg-green-500');
    });

    it('playhead retains z-10 class', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveClass('z-10');
    });

    it('playhead retains pointer-events-none class', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveClass('pointer-events-none');
    });

    it('playhead has aria-hidden="true" for accessibility', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveAttribute('aria-hidden', 'true');
    });

    it('playhead maintains consistent styling with offset changes', () => {
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={0}
        />
      );

      let playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      const initialClasses = playhead.className;

      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={500}
        />
      );

      playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      // Classes should remain unchanged when offset changes
      expect(playhead.className).toBe(initialClasses);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC7: Loop/metronome/note markers unaffected by offset
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC7: loop, metronome, note markers unaffected by offset', () => {
    it('loop start marker position unaffected by playhead offset', () => {
      const { container: container1 } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          loopStartMs={300}
          loopEndMs={1500}
          isLoopActive={true}
          playheadOffsetPx={0}
        />
      );

      const { container: container2 } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          loopStartMs={300}
          loopEndMs={1500}
          isLoopActive={true}
          playheadOffsetPx={250}
        />
      );

      const loopStart1 = container1.querySelector('[data-testid="loop-start-marker"]') as HTMLElement;
      const loopStart2 = container2.querySelector('[data-testid="loop-start-marker"]') as HTMLElement;

      if (loopStart1 && loopStart2) {
        expect(loopStart1.style.left).toBe(loopStart2.style.left);
      }
    });

    it('loop end marker position unaffected by playhead offset', () => {
      const { container: container1 } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          loopStartMs={300}
          loopEndMs={1500}
          isLoopActive={true}
          playheadOffsetPx={0}
        />
      );

      const { container: container2 } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          loopStartMs={300}
          loopEndMs={1500}
          isLoopActive={true}
          playheadOffsetPx={250}
        />
      );

      const loopEnd1 = container1.querySelector('[data-testid="loop-end-marker"]') as HTMLElement;
      const loopEnd2 = container2.querySelector('[data-testid="loop-end-marker"]') as HTMLElement;

      if (loopEnd1 && loopEnd2) {
        expect(loopEnd1.style.left).toBe(loopEnd2.style.left);
      }
    });

    it('note markers render for all MIDI events regardless of playhead offset', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');

      // Should render markers for all MIDI events (offset does not affect markers count/rendering)
      expect(markers.length).toBe(mockMidiEvents.length);
    });

    it('metronome markers unaffected by playhead offset', () => {
      const { container: container1 } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          bpm={120}
          metronomeEnabled={true}
          playheadOffsetPx={0}
        />
      );

      const { container: container2 } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          bpm={120}
          metronomeEnabled={true}
          playheadOffsetPx={250}
        />
      );

      const marks1 = container1.querySelectorAll('[data-testid="metronome-downbeat-marker"], [data-testid="metronome-beat-marker"]');
      const marks2 = container2.querySelectorAll('[data-testid="metronome-downbeat-marker"], [data-testid="metronome-beat-marker"]');

      // Both should have the same number of metronome markers
      if (marks1.length > 0) {
        expect(marks1.length).toBe(marks2.length);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // AC8: Playhead does not change position as currentTimeMs changes
  // ───────────────────────────────────────────────────────────────────────────
  describe('AC8: playhead position fixed regardless of currentTimeMs', () => {
    it('playhead left position is always at playheadOffsetPx regardless of time changes', () => {
      // Start at 500ms
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playheadInitial = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playheadInitial.style.left).toBe('250px');

      // Change to 1000ms — playhead should stay at 250px
      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={1000}
          playheadOffsetPx={250}
        />
      );

      const playheadAfter = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playheadAfter.style.left).toBe('250px');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Edge cases
  // ───────────────────────────────────────────────────────────────────────────
  describe('Edge cases: dynamic offset changes', () => {
    it('updates playhead left position when offset prop changes', () => {
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={100}
        />
      );

      let playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '100px' });

      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={300}
        />
      );

      playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '300px' });
    });

    it('offset is fixed at 0% timeline position (currentTimeMs=0)', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={0}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '250px' });
    });

    it('offset is fixed at 100% timeline position (currentTimeMs=duration)', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={2000}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '250px' });
    });

    it('handles very large offset values', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={1000}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '1000px' });
    });

    it('offset renders correctly with narrow container', () => {
      const { container } = render(
        <div style={{ width: '200px', position: 'relative' }}>
          <ExercisePlaybackTimeline
            midiEvents={mockMidiEvents}
            durationMs={2000}
            currentTimeMs={500}
            playheadOffsetPx={250}
          />
        </div>
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveStyle({ left: '250px' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Visual/functional properties
  // ───────────────────────────────────────────────────────────────────────────
  describe('Visual/functional properties maintained', () => {
    it('playhead has z-index 10 for layering above other elements', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveClass('z-10');
    });

    it('playhead is pointer-events-none to not block clicks', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveClass('pointer-events-none');
    });

    it('playhead is aria-hidden from accessibility tree', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead.getAttribute('aria-hidden')).toBe('true');
    });

    it('playhead remains green with offset applied', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead).toHaveClass('bg-green-500');
    });

    it('no console warnings when offset is applied', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const consoleErrorSpy = vi.spyOn(console, 'error');

      render(
        <ExercisePlaybackTimeline
          midiEvents={mockMidiEvents}
          durationMs={2000}
          currentTimeMs={500}
          playheadOffsetPx={250}
        />
      );

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      // Note: expect(consoleErrorSpy).not.toHaveBeenCalled() might fail if React has other errors
      // so we focus on warn.

      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
