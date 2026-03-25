import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';
import type { MidiEvent } from '@groovelab/types';

// ─────────────────────────────────────────────────────────────────────────────
// ACCEPTANCE CRITERIA MAPPING
// Spec: specs/scrolling-timeline/05-drag-to-seek-main-timeline.md
// ─────────────────────────────────────────────────────────────────────────────
// AC1: onSeek and isPlaying are optional; component renders without them
// AC2: mousedown with altKey=true, isPlaying=false, onSeek defined → drag starts
// AC3: mousedown with altKey=false → drag-to-seek NOT activated
// AC4: mousedown with altKey=true, isPlaying=true → drag-to-seek NOT activated
// AC5: mousedown with altKey=true, onSeek undefined → drag-to-seek NOT activated
// AC6: On drag start: capture dragStartX and dragStartTimeMs
// AC7: On mousemove: newTimeMs = clamp(dragStartTimeMs - (deltaX / containerWidth) * durationMs, 0, durationMs)
// AC8: On mouseup: listeners removed, cursor restored
// AC9: document.body.style.cursor = 'grabbing' during drag
// AC10: containerWidth = 0 → onSeek not called (guard clause)
// AC11: durationMs = 0 → onSeek not called (guard clause)
// AC12: onSeek values clamped to [0, durationMs]
// AC13: Bracket drag behavior unchanged (stopPropagation prevents seek)
// AC14: Loop creation behavior unchanged (mutually exclusive on same event)
// AC15: isPlaying defaults to false when not provided

const mockMidiEvents: MidiEvent[] = [
  { note: 36, timestamp: 1000, velocity: 100 },
  { note: 38, timestamp: 3000, velocity: 100 },
  { note: 42, timestamp: 5000, velocity: 100 },
];

// ─── ResizeObserver mock ──────────────────────────────────────────────────────
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

  // Mock getBoundingClientRect to return containerWidth=1000
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1000,
    height: 40,
    top: 0,
    left: 0,
    right: 1000,
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

describe('ExercisePlaybackTimeline — Drag-to-Seek', () => {
  const defaultProps = {
    midiEvents: mockMidiEvents,
    durationMs: 8000,
    currentTimeMs: 0,
    playheadOffsetPx: 250,
  };

  // ─── AC1: Props are optional ────────────────────────────────────────────────
  describe('AC1: Optional props — onSeek and isPlaying', () => {
    it('renders without onSeek prop', () => {
      expect(() => {
        render(
          <ExercisePlaybackTimeline
            {...defaultProps}
            onSeek={undefined}
          />
        );
      }).not.toThrow();
      expect(screen.getByRole('region', { name: 'Exercise timeline' })).toBeInTheDocument();
    });

    it('renders without isPlaying prop', () => {
      const onSeekMock = vi.fn();
      expect(() => {
        render(
          <ExercisePlaybackTimeline
            {...defaultProps}
            onSeek={onSeekMock}
            isPlaying={undefined}
          />
        );
      }).not.toThrow();
      expect(screen.getByRole('region', { name: 'Exercise timeline' })).toBeInTheDocument();
    });

    it('renders without both onSeek and isPlaying props', () => {
      expect(() => {
        render(<ExercisePlaybackTimeline {...defaultProps} />);
      }).not.toThrow();
      expect(screen.getByRole('region', { name: 'Exercise timeline' })).toBeInTheDocument();
    });
  });

  // ─── AC2: Drag start conditions (altKey, isPlaying, onSeek) ─────────────────
  describe('AC2: Drag start with altKey=true, isPlaying=false, onSeek defined', () => {
    it('onSeek is called on mousemove after mousedown with altKey=true', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;
      expect(tracksRef).toBeInTheDocument();

      // mousedown with altKey=true at x=250 (drag start point)
      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: true,
      });

      // mousemove to x=200 (move left by 50px)
      fireEvent.mouseMove(document, {
        clientX: 200,
      });

      // onSeek should be called
      expect(onSeekMock).toHaveBeenCalled();
    });
  });

  // ─── AC3: altKey=false does not activate drag-to-seek ──────────────────────
  describe('AC3: Drag start with altKey=false (loop creation path)', () => {
    it('mousedown without altKey does NOT call onSeek (loop create path fires)', () => {
      const onSeekMock = vi.fn();
      const onLoopStartChangeMock = vi.fn();
      const onLoopEndChangeMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          onSeek={onSeekMock}
          isPlaying={false}
          onLoopStartChange={onLoopStartChangeMock}
          onLoopEndChange={onLoopEndChangeMock}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      // mousedown WITHOUT altKey at x=250
      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: false,
      });

      // mousemove to x=200
      fireEvent.mouseMove(document, {
        clientX: 200,
      });

      // onSeek should NOT be called (loop creation path runs instead)
      expect(onSeekMock).not.toHaveBeenCalled();
    });
  });

  // ─── AC4: isPlaying=true prevents drag-to-seek ──────────────────────────────
  describe('AC4: Drag start with altKey=true, isPlaying=true', () => {
    it('mousedown with altKey=true AND isPlaying=true does NOT activate seek', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          onSeek={onSeekMock}
          isPlaying={true}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: true,
      });

      fireEvent.mouseMove(document, {
        clientX: 200,
      });

      expect(onSeekMock).not.toHaveBeenCalled();
    });
  });

  // ─── AC5: onSeek undefined does not activate drag-to-seek ────────────────────
  describe('AC5: Drag start with altKey=true, onSeek undefined', () => {
    it('mousedown with altKey=true AND onSeek undefined does NOT throw and does NOT activate', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          onSeek={undefined}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      expect(() => {
        fireEvent.mouseDown(tracksRef, {
          clientX: 250,
          altKey: true,
        });

        fireEvent.mouseMove(document, {
          clientX: 200,
        });
      }).not.toThrow();
    });
  });

  // ─── AC6: Capture drag start state (dragStartX, dragStartTimeMs) ────────────
  describe('AC6: Drag start captures dragStartX and dragStartTimeMs', () => {
    it('captures dragStartX and dragStartTimeMs at mousedown', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 500,
        altKey: true,
      });

      fireEvent.mouseMove(document, {
        clientX: 400,
      });

      // onSeek should be called with value based on captured state
      expect(onSeekMock).toHaveBeenCalled();
      const callValue = onSeekMock.mock.calls[0][0];
      expect(typeof callValue).toBe('number');
    });
  });

  // ─── AC7: Seek formula (newTimeMs calculation) ──────────────────────────────
  describe('AC7: Seek formula — deltaX to newTimeMs', () => {
    it('drag left by 250px (containerWidth=1000, durationMs=8000) → onSeek called with value 2000ms ahead', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          durationMs={8000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      // Start drag at x=500
      fireEvent.mouseDown(tracksRef, {
        clientX: 500,
        altKey: true,
      });

      // Move left by 250px (to x=250)
      fireEvent.mouseMove(document, {
        clientX: 250,
      });

      // deltaX = -250
      // newTimeMs = 2000 - ((-250) / 1000) * 8000 = 2000 + 2000 = 4000
      expect(onSeekMock).toHaveBeenCalledWith(4000);
    });

    it('drag right by 250px (containerWidth=1000, durationMs=8000) → onSeek called with value 2000ms behind', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={4000}
          durationMs={8000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      // Start drag at x=250
      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: true,
      });

      // Move right by 250px (to x=500)
      fireEvent.mouseMove(document, {
        clientX: 500,
      });

      // deltaX = +250
      // newTimeMs = 4000 - (250 / 1000) * 8000 = 4000 - 2000 = 2000
      expect(onSeekMock).toHaveBeenCalledWith(2000);
    });
  });

  // ─── AC8 & AC12: Clamp to [0, durationMs] ──────────────────────────────────
  describe('AC8 & AC12: Seek clamping — clamp to [0, durationMs]', () => {
    it('drag far left (deltaX = -10000) → onSeek called with durationMs', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={4000}
          durationMs={8000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 1000,
        altKey: true,
      });

      // Move left by 10000px (extreme leftward drag)
      fireEvent.mouseMove(document, {
        clientX: -9000,
      });

      // Should clamp to durationMs (8000)
      expect(onSeekMock).toHaveBeenCalledWith(8000);
    });

    it('drag far right (deltaX = +10000) → onSeek called with 0', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={4000}
          durationMs={8000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 0,
        altKey: true,
      });

      // Move right by 10000px (extreme rightward drag)
      fireEvent.mouseMove(document, {
        clientX: 10000,
      });

      // Should clamp to 0
      expect(onSeekMock).toHaveBeenCalledWith(0);
    });
  });

  // ─── AC9: Cursor styling during drag ────────────────────────────────────────
  describe('AC9: Cursor styling', () => {
    it('document.body.style.cursor = "grabbing" during drag', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: true,
      });

      // Cursor should be set to 'grabbing'
      expect(document.body.style.cursor).toBe('grabbing');
    });

    it('document.body.style.cursor restored to "" after mouseup', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: true,
      });

      expect(document.body.style.cursor).toBe('grabbing');

      // Trigger mouseup
      fireEvent.mouseUp(document);

      // Cursor should be cleared
      expect(document.body.style.cursor).toBe('');
    });
  });

  // ─── AC10 & AC11: Guard clauses (containerWidth=0, durationMs=0) ────────────
  describe('AC10 & AC11: Guard clauses — containerWidth=0 and durationMs=0', () => {
    it('containerWidth = 0 → onSeek not called', () => {
      const onSeekMock = vi.fn();

      // Override mock to return 0 width
      vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
        width: 0,
        height: 40,
        top: 0,
        left: 0,
        right: 0,
        bottom: 40,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect);

      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          durationMs={8000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: true,
      });

      fireEvent.mouseMove(document, {
        clientX: 200,
      });

      // onSeek should not be called due to guard clause
      expect(onSeekMock).not.toHaveBeenCalled();
    });

    it('durationMs = 0 → onSeek not called', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={0}
          durationMs={0}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: true,
      });

      fireEvent.mouseMove(document, {
        clientX: 200,
      });

      expect(onSeekMock).not.toHaveBeenCalled();
    });
  });

  // ─── AC13: Bracket drag not affected by seek gesture ──────────────────────
  describe('AC13: Bracket drag regression — bracket stopPropagation takes priority', () => {
    it('mousedown on loop bracket with altKey=true → seek does NOT fire (bracket stopPropagation)', () => {
      const onSeekMock = vi.fn();
      const onLoopStartChangeMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          loopStartMs={1000}
          loopEndMs={6000}
          isLoopActive={false}
          onSeek={onSeekMock}
          isPlaying={false}
          onLoopStartChange={onLoopStartChangeMock}
          onLoopEndChange={vi.fn()}
        />
      );

      // Find the loop start bracket marker
      const bracket = screen.getByTestId('loop-start-marker');

      // mousedown on bracket with altKey=true
      fireEvent.mouseDown(bracket, {
        clientX: 125, // Approx position of 1000ms mark when duration=8000
        altKey: true,
      });

      fireEvent.mouseMove(document, {
        clientX: 100,
      });

      // onSeek should NOT be called because bracket's stopPropagation prevents it
      expect(onSeekMock).not.toHaveBeenCalled();
      // Bracket drag should work normally
      expect(onLoopStartChangeMock).toHaveBeenCalled();
    });
  });

  // ─── AC14: Loop creation still works when altKey=false ──────────────────────
  describe('AC14: Loop creation regression — altKey=false creates loop', () => {
    it('mousedown without altKey with onLoopStartChange → loop creation still works', () => {
      const onSeekMock = vi.fn();
      const onLoopStartChangeMock = vi.fn();
      const onLoopEndChangeMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={0}
          loopStartMs={undefined}
          loopEndMs={undefined}
          isLoopActive={false}
          onSeek={onSeekMock}
          isPlaying={false}
          onLoopStartChange={onLoopStartChangeMock}
          onLoopEndChange={onLoopEndChangeMock}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      // mousedown WITHOUT altKey (loop creation path)
      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: false,
      });

      fireEvent.mouseMove(tracksRef, {
        clientX: 750,
      });

      fireEvent.mouseUp(tracksRef);

      // Loop creation should work (onLoopStartChange should be called)
      expect(onLoopStartChangeMock).toHaveBeenCalled();
      // onSeek should NOT be called
      expect(onSeekMock).not.toHaveBeenCalled();
    });
  });

  // ─── AC15: isPlaying defaults to false ──────────────────────────────────────
  describe('AC15: isPlaying defaults to false', () => {
    it('when isPlaying not provided, it defaults to false (drag-to-seek works)', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          onSeek={onSeekMock}
          // isPlaying NOT provided (should default to false)
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: true,
      });

      fireEvent.mouseMove(document, {
        clientX: 200,
      });

      // onSeek should be called because isPlaying defaults to false
      expect(onSeekMock).toHaveBeenCalled();
    });
  });

  // ─── AC8 Continued: Cleanup after mouseup ──────────────────────────────────
  describe('AC8: Document-level listener cleanup', () => {
    it('document listeners removed after mouseup (second mousemove does not call onSeek)', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={2000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 250,
        altKey: true,
      });

      fireEvent.mouseMove(document, {
        clientX: 200,
      });

      const firstCallCount = onSeekMock.mock.calls.length;
      expect(firstCallCount).toBeGreaterThan(0);

      // Trigger mouseup
      fireEvent.mouseUp(document);

      // After mouseup, another mousemove should NOT call onSeek again
      const callCountAfterUp = onSeekMock.mock.calls.length;
      fireEvent.mouseMove(document, {
        clientX: 150,
      });

      // Call count should not increase
      expect(onSeekMock.mock.calls.length).toBe(callCountAfterUp);
    });
  });

  // ─── Extra: Multiple mousemove calls during single drag ──────────────────────
  describe('Extra: Multiple mousemove events during single drag', () => {
    it('onSeek is called continuously during drag with each mousemove', () => {
      const onSeekMock = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          currentTimeMs={4000}
          durationMs={8000}
          onSeek={onSeekMock}
          isPlaying={false}
        />
      );

      const tracksRef = container.querySelector('.relative.flex-1.overflow-hidden') as HTMLElement;

      fireEvent.mouseDown(tracksRef, {
        clientX: 500,
        altKey: true,
      });

      // Multiple mousemove events
      fireEvent.mouseMove(document, { clientX: 400 });
      fireEvent.mouseMove(document, { clientX: 300 });
      fireEvent.mouseMove(document, { clientX: 200 });

      // onSeek should be called 3 times
      expect(onSeekMock).toHaveBeenCalledTimes(3);
    });
  });
});
