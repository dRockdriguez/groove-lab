import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import type { MidiEvent } from '@groovelab/types';

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPTANCE CRITERIA MAPPING
// Spec: specs/scrolling-timeline/04-full-width-row-separators.md
// ─────────────────────────────────────────────────────────────────────────────
// AC1: ROW_HEIGHT_PX = 40 constant defined at the component top
// AC2: One separator div per uniqueNotes entry, absolute child of tracksRef
//      with top: (i+1)*40px, left:0, right:0, height:1px, pointer-events:none,
//      aria-hidden="true", data-testid="row-separator"
// AC3: border-b removed from inner track row divs
// AC4: Separator count equals uniqueNotes.length
// AC5: Each separator top value equals (rowIndex+1)*40
// AC6: Separators are siblings of the inner scrolling div (not children)
// AC7: Separators have aria-hidden="true"
// AC8: Separators have pointer-events: none
// AC9: Separator positions are scroll-invariant (same at currentTimeMs=0 and mid-playback)

const threeNoteEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
  { timestamp: 2000, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
  { timestamp: 4000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
];

const oneNoteEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
];

const twoNoteEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
  { timestamp: 2000, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
];

// ─── ResizeObserver mock ──────────────────────────────────────────────────────
let observeMock: ReturnType<typeof vi.fn>;
let disconnectMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  observeMock = vi.fn();
  disconnectMock = vi.fn();

  vi.stubGlobal(
    'ResizeObserver',
    vi.fn().mockImplementation(() => ({
      observe: observeMock,
      disconnect: disconnectMock,
      unobserve: vi.fn(),
    })),
  );

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

describe('ExercisePlaybackTimeline — Full-Width Row Separators', () => {
  // ─── AC4: Separator count equals uniqueNotes.length ─────────────────────
  describe('AC4: correct number of separators rendered', () => {
    it('renders 3 separators for 3 unique notes', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      expect(separators.length).toBe(3);
    });

    it('renders 1 separator for 1 unique note', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={oneNoteEvents}
          durationMs={4000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      expect(separators.length).toBe(1);
    });

    it('renders 2 separators for 2 unique notes', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={twoNoteEvents}
          durationMs={4000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      expect(separators.length).toBe(2);
    });

    it('renders no separators when midiEvents is empty (early return)', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={[]}
          durationMs={4000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      expect(separators.length).toBe(0);
    });
  });

  // ─── AC5: Separator top values ──────────────────────────────────────────
  describe('AC5: each separator top value equals (rowIndex+1)*40', () => {
    it('separator at index 0 has top: 40px', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      expect((separators[0] as HTMLElement).style.top).toBe('40px');
    });

    it('separator at index 1 has top: 80px', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      expect((separators[1] as HTMLElement).style.top).toBe('80px');
    });

    it('separator at index N-1 (2) has top: N*40 = 3*40 = 120px', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      const lastSeparator = separators[separators.length - 1] as HTMLElement;
      // N=3, last index = 2, top = (2+1)*40 = 120px
      expect(lastSeparator.style.top).toBe('120px');
    });

    it('single-note scenario: only separator has top: 40px', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={oneNoteEvents}
          durationMs={4000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      expect((separators[0] as HTMLElement).style.top).toBe('40px');
    });
  });

  // ─── AC6: Separators are siblings of the inner scrolling div ────────────
  describe('AC6: separators are NOT children of the inner scrolling div', () => {
    it('separators are not inside the inner translateX container', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      expect(inner).not.toBeNull();

      const separatorsInsideInner = inner.querySelectorAll('[data-testid="row-separator"]');
      expect(separatorsInsideInner.length).toBe(0);
    });

    it('separators share the same parent as the inner scrolling container', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      const separators = container.querySelectorAll('[data-testid="row-separator"]');

      separators.forEach((sep) => {
        expect((sep as HTMLElement).parentElement).toBe(inner.parentElement);
      });
    });
  });

  // ─── AC7: Separators have aria-hidden="true" ────────────────────────────
  describe('AC7: separators have aria-hidden="true"', () => {
    it('all separators have aria-hidden="true"', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      separators.forEach((sep) => {
        expect(sep.getAttribute('aria-hidden')).toBe('true');
      });
    });
  });

  // ─── AC8: Separators have pointer-events: none ──────────────────────────
  describe('AC8: separators have pointer-events: none', () => {
    it('all separators have pointerEvents: none style', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      separators.forEach((sep) => {
        expect((sep as HTMLElement).style.pointerEvents).toBe('none');
      });
    });
  });

  // ─── AC9: Scroll-invariance ─────────────────────────────────────────────
  describe('AC9: separator positions are scroll-invariant', () => {
    it('separator top values are identical at currentTimeMs=0 vs mid-playback', () => {
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
          playheadOffsetPx={250}
        />,
      );

      const sepsAt0 = Array.from(
        container.querySelectorAll('[data-testid="row-separator"]'),
      ).map((sep) => (sep as HTMLElement).style.top);

      rerender(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={4000}
          playheadOffsetPx={250}
        />,
      );

      const sepsAtMid = Array.from(
        container.querySelectorAll('[data-testid="row-separator"]'),
      ).map((sep) => (sep as HTMLElement).style.top);

      expect(sepsAt0.length).toBe(3);
      expect(sepsAt0).toEqual(sepsAtMid);
    });

    it('separator top values are identical at currentTimeMs=0 vs end of exercise', () => {
      const { container, rerender } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
          playheadOffsetPx={250}
        />,
      );

      const sepsAt0 = Array.from(
        container.querySelectorAll('[data-testid="row-separator"]'),
      ).map((sep) => (sep as HTMLElement).style.top);

      rerender(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={8000}
          playheadOffsetPx={250}
        />,
      );

      const sepsAtEnd = Array.from(
        container.querySelectorAll('[data-testid="row-separator"]'),
      ).map((sep) => (sep as HTMLElement).style.top);

      expect(sepsAt0).toEqual(sepsAtEnd);
    });
  });

  // ─── Additional: separator visual attributes ────────────────────────────
  describe('separator visual attributes', () => {
    it('separators have height: 1px', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      separators.forEach((sep) => {
        expect((sep as HTMLElement).style.height).toBe('1px');
      });
    });

    it('separators have position: absolute', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const separators = container.querySelectorAll('[data-testid="row-separator"]');
      separators.forEach((sep) => {
        expect((sep as HTMLElement).style.position).toBe('absolute');
      });
    });

    it('inner track row divs do not have border-b class', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      const inner = container.querySelector('[style*="translateX"]') as HTMLElement;
      // Track row divs have class "h-10 relative" (no border-b)
      const rowDivs = inner.querySelectorAll('.h-10.relative');
      rowDivs.forEach((row) => {
        expect(row.classList.contains('border-b')).toBe(false);
      });
    });

    it('labels column divs retain border-b class', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={threeNoteEvents}
          durationMs={8000}
          currentTimeMs={0}
        />,
      );

      // Labels column is w-32 shrink-0; rows inside have border-b
      const labelsColumn = container.querySelector('.w-32.shrink-0') as HTMLElement;
      expect(labelsColumn).not.toBeNull();
      const labelRows = labelsColumn.querySelectorAll('.border-b');
      expect(labelRows.length).toBe(3); // one per unique note
    });
  });
});
