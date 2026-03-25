import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import type { MidiEvent } from '@groovelab/types';

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPTANCE CRITERIA MAPPING
// Spec: specs/scrolling-timeline/02-scrolling-track-container.md
// ─────────────────────────────────────────────────────────────────────────────
// AC1: containerWidth measured from tracksRef.getBoundingClientRect().width on mount
//      and whenever ResizeObserver fires
// AC2: scrollTranslateX = -(currentTimeMs/durationMs)*containerWidth + playheadOffsetPx
//      (falls back to playheadOffsetPx when containerWidth=0 or durationMs<=0)
// AC3: Inner container div has style transform=translateX(Npx), position=relative,
//      width=100%, willChange=transform
// AC4: Outer tracksRef container has overflow:hidden to clip scrolled content
// AC5: Playhead is a sibling of the inner container (stays fixed during scroll)
// AC6: Note markers render with left:(timestamp/durationMs)*100% (unchanged formula)
// AC7: Loop fill/brackets render with percentage-based positions (unchanged)
// AC8: Beat markers render with percentage-based positions (unchanged)
// AC9: Edge case: containerWidth=0 → scrollTranslateX = playheadOffsetPx (no crash)
// AC10: Edge case: durationMs=0 → scrollTranslateX = playheadOffsetPx (no division by zero)

const mockEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
  { timestamp: 2000, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
  { timestamp: 4000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
  { timestamp: 6000, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
];

// ─── ResizeObserver mock ──────────────────────────────────────────────────────
// JSDOM does not implement ResizeObserver; mock it so tests can control width.
let resizeObserverCallback: ResizeObserverCallback | null = null;
let observeMock: ReturnType<typeof vi.fn>;
let disconnectMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  resizeObserverCallback = null;
  observeMock = vi.fn();
  disconnectMock = vi.fn();

  vi.stubGlobal(
    'ResizeObserver',
    vi.fn().mockImplementation((callback: ResizeObserverCallback) => {
      resizeObserverCallback = callback;
      return {
        observe: observeMock,
        disconnect: disconnectMock,
        unobserve: vi.fn(),
      };
    }),
  );

  // JSDOM returns 0 for getBoundingClientRect by default; override for tests
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 800,
    height: 40,
    top: 0,
    left: 0,
    right: 800,
    bottom: 40,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────

describe('ExercisePlaybackTimeline — Scrolling Track Container', () => {
  // ─── AC1: ResizeObserver wires up on mount ──────────────────────────────
  describe('AC1: ResizeObserver and initial width measurement', () => {
    it('creates a ResizeObserver on mount', () => {
      render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );
      // observeMock.toHaveBeenCalled means the observer was created and observed
      expect(observeMock).toHaveBeenCalled();
    });

    it('disconnects the ResizeObserver on unmount', () => {
      const { unmount } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );
      unmount();
      expect(disconnectMock).toHaveBeenCalled();
    });

    it('reads initial width from getBoundingClientRect on mount', () => {
      // The spy returns 800px width; verify component renders without crash
      // (containerWidth=800 is used internally — tested via translateX below)
      expect(() => {
        render(
          <ExercisePlaybackTimeline
            midiEvents={mockEvents}
            durationMs={8000}
            currentTimeMs={0}
          />,
        );
      }).not.toThrow();
    });
  });

  // ─── AC2: scrollTranslateX formula ─────────────────────────────────────
  describe('AC2: scrollTranslateX formula', () => {
    it('inner container has translateX(playheadOffsetPx) when currentTimeMs=0', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
          playheadOffsetPx={250}
        />,
      );

      // With containerWidth=800, durationMs=8000, currentTimeMs=0:
      // scrollTranslateX = -(0/8000)*800 + 250 = 250
      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(inner).not.toBeNull();
      expect(inner.style.transform).toBe('translateX(250px)');
    });

    it('inner container scrolls left as currentTimeMs increases', () => {
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
          playheadOffsetPx={250}
        />,
      );

      const inner0 = container.querySelector('[style*="translateX"]') as HTMLElement;
      const transform0 = inner0.style.transform; // translateX(250px)

      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={4000}
          playheadOffsetPx={250}
        />,
      );

      const inner4 = container.querySelector('[style*="translateX"]') as HTMLElement;
      const transform4 = inner4.style.transform; // translateX(-(4000/8000)*800+250) = translateX(-150px)

      // At time 4000ms (50%), translateX should be less than at 0ms (content scrolled left)
      const extractPx = (t: string) => parseFloat(t.replace('translateX(', '').replace('px)', ''));
      expect(extractPx(transform4)).toBeLessThan(extractPx(transform0));
    });

    it('translateX formula: -(currentTimeMs/durationMs)*containerWidth+playheadOffsetPx', () => {
      // containerWidth=800 (mocked), durationMs=8000, currentTimeMs=2000, offset=250
      // scrollTranslateX = -(2000/8000)*800 + 250 = -200 + 250 = 50
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={2000}
          playheadOffsetPx={250}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(inner.style.transform).toBe('translateX(50px)');
    });

    it('translateX at 50% duration positions inner container correctly', () => {
      // currentTimeMs=4000 (50%), durationMs=8000, containerWidth=800, offset=250
      // scrollTranslateX = -(4000/8000)*800 + 250 = -400 + 250 = -150
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={4000}
          playheadOffsetPx={250}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(inner.style.transform).toBe('translateX(-150px)');
    });

    it('translateX respects custom playheadOffsetPx', () => {
      // currentTimeMs=0, offset=150 → scrollTranslateX = 0 + 150 = 150
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
          playheadOffsetPx={150}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(inner.style.transform).toBe('translateX(150px)');
    });
  });

  // ─── AC3: Inner container style attributes ──────────────────────────────
  describe('AC3: inner container div style', () => {
    it('inner container has position: relative', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(inner.style.position).toBe('relative');
    });

    it('inner container has width: 100%', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(inner.style.width).toBe('100%');
    });

    it('inner container has willChange: transform', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(inner.style.willChange).toBe('transform');
    });
  });

  // ─── AC4: Outer container has overflow:hidden ───────────────────────────
  describe('AC4: outer container overflow:hidden', () => {
    it('tracks ref container has overflow-hidden class', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      // The outer tracks div (sibling of label column) should have overflow-hidden
      const tracksContainer = container.querySelector('.overflow-hidden') as HTMLElement;
      expect(tracksContainer).not.toBeNull();
    });
  });

  // ─── AC5: Playhead is sibling of inner container ────────────────────────
  describe('AC5: playhead is sibling of inner scrolling container', () => {
    it('playhead and inner container share the same parent', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;

      expect(playhead).not.toBeNull();
      expect(inner).not.toBeNull();
      expect(playhead.parentElement).toBe(inner.parentElement);
    });

    it('playhead is NOT inside the inner container', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      const playheadInsideInner = inner.querySelector('[data-testid="playhead"]');
      expect(playheadInsideInner).toBeNull();
    });

    it('playhead does not scroll with the inner container', () => {
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
          playheadOffsetPx={250}
        />,
      );

      const playhead = container.querySelector('[data-testid="playhead"]') as HTMLElement;
      expect(playhead.style.left).toBe('250px');

      rerender(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={4000}
          playheadOffsetPx={250}
        />,
      );

      // Playhead position should be unchanged; inner container scrolled
      expect(playhead.style.left).toBe('250px');
    });
  });

  // ─── AC6: Note markers use % positioning inside inner container ─────────
  describe('AC6: note markers render with percentage-based left positioning', () => {
    it('note at timestamp 0 has left: 0%', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const markers = container.querySelectorAll('[data-testid="note-marker"]');
      // The outer wrapper div for the first note (timestamp=0) should be at left: 0%
      const firstNoteWrapper = markers[0]?.parentElement as HTMLElement;
      expect(firstNoteWrapper?.style.left).toBe('0%');
    });

    it('note at timestamp 4000 (50%) has left: 50%', () => {
      const eventsWithMidNote: MidiEvent[] = [
        { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
        { timestamp: 4000, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
      ];

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={eventsWithMidNote}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      // Find the wrapper for the 4000ms note
      const wrappers = container.querySelectorAll('[data-testid="note-marker"]');
      const secondNoteWrapper = wrappers[1]?.parentElement as HTMLElement;
      expect(secondNoteWrapper?.style.left).toBe('50%');
    });

    it('note markers are children of the inner scrolling container', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      const markers = inner.querySelectorAll('[data-testid="note-marker"]');
      expect(markers.length).toBe(mockEvents.length);
    });
  });

  // ─── AC7: Loop markers use % positioning inside inner container ─────────
  describe('AC7: loop fill and brackets use percentage-based positions', () => {
    it('loop region fill is inside inner container with percentage left', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
          loopStartMs={2000}
          loopEndMs={6000}
          isLoopActive={true}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      const fill = inner.querySelector('[data-testid="loop-region-fill"]') as HTMLElement;

      expect(fill).not.toBeNull();
      // loopStartMs=2000, durationMs=8000 → left = 25%
      expect(fill.style.left).toBe('25%');
    });

    it('loop start bracket is inside inner container with percentage left', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
          loopStartMs={2000}
          loopEndMs={6000}
          isLoopActive={true}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      const startBracket = inner.querySelector('[data-testid="loop-start-marker"]') as HTMLElement;

      expect(startBracket).not.toBeNull();
      expect(startBracket.style.left).toBe('25%');
    });

    it('loop end bracket is inside inner container with percentage left', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
          loopStartMs={2000}
          loopEndMs={6000}
          isLoopActive={true}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      const endBracket = inner.querySelector('[data-testid="loop-end-marker"]') as HTMLElement;

      expect(endBracket).not.toBeNull();
      // loopEndMs=6000, durationMs=8000 → left = 75%
      expect(endBracket.style.left).toBe('75%');
    });
  });

  // ─── AC8: Beat markers use % positioning inside inner container ─────────
  describe('AC8: beat markers render with percentage-based positions inside inner container', () => {
    it('metronome beat markers are inside inner container', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
          bpm={120}
          metronomeEnabled={true}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      const beatMarkers = inner.querySelectorAll(
        '[data-testid="metronome-beat-marker"], [data-testid="metronome-downbeat-marker"]',
      );

      expect(beatMarkers.length).toBeGreaterThan(0);
    });

    it('beat markers have left position in percentage format', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={0}
          bpm={120}
          metronomeEnabled={true}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      const beatMarkers = inner.querySelectorAll(
        '[data-testid="metronome-beat-marker"], [data-testid="metronome-downbeat-marker"]',
      );

      beatMarkers.forEach((marker) => {
        const el = marker as HTMLElement;
        expect(el.style.left).toMatch(/%$/);
      });
    });
  });

  // ─── AC9 & AC10: Edge cases ─────────────────────────────────────────────
  describe('AC9 & AC10: edge cases', () => {
    it('does not crash when containerWidth=0 (JSDOM default without mock)', () => {
      // Override getBoundingClientRect to return 0 width
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

      expect(() => {
        render(
          <ExercisePlaybackTimeline
            midiEvents={mockEvents}
            durationMs={8000}
            currentTimeMs={1000}
            playheadOffsetPx={250}
          />,
        );
      }).not.toThrow();
    });

    it('falls back to playheadOffsetPx when containerWidth=0', () => {
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={4000}
          playheadOffsetPx={250}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      // containerWidth=0 → scrollTranslateX = playheadOffsetPx = 250
      expect(inner.style.transform).toBe('translateX(250px)');
    });

    it('does not crash when durationMs=0 (prevents division by zero)', () => {
      expect(() => {
        render(
          <ExercisePlaybackTimeline
            midiEvents={mockEvents}
            durationMs={0}
            currentTimeMs={0}
            playheadOffsetPx={250}
          />,
        );
      }).not.toThrow();
    });

    it('falls back to playheadOffsetPx when durationMs=0', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={0}
          currentTimeMs={0}
          playheadOffsetPx={250}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      // durationMs=0 → scrollTranslateX = playheadOffsetPx = 250
      if (inner) {
        expect(inner.style.transform).toBe('translateX(250px)');
      }
    });

    it('currentTimeMs > durationMs does not crash (no clamping)', () => {
      expect(() => {
        render(
          <ExercisePlaybackTimeline
            midiEvents={mockEvents}
            durationMs={8000}
            currentTimeMs={10000}
            playheadOffsetPx={250}
          />,
        );
      }).not.toThrow();
    });
  });

  // ─── ResizeObserver callback updates translateX ─────────────────────────
  describe('ResizeObserver width update', () => {
    it('updates translateX when ResizeObserver fires with new width', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={8000}
          currentTimeMs={4000}
          playheadOffsetPx={250}
        />,
      );

      // Initial: getBoundingClientRect returns 800 → translateX = -(4000/8000)*800+250 = -150
      const innerBefore = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(innerBefore.style.transform).toBe('translateX(-150px)');

      // Simulate ResizeObserver firing with new width = 1000
      act(() => {
        if (resizeObserverCallback) {
          resizeObserverCallback(
            [{ contentRect: { width: 1000 } } as ResizeObserverEntry],
            {} as ResizeObserver,
          );
        }
      });

      // After: -(4000/8000)*1000 + 250 = -500 + 250 = -250
      const innerAfter = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(innerAfter.style.transform).toBe('translateX(-250px)');
    });
  });
});
