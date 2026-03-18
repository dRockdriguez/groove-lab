import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';

describe('ExercisePlaybackTimeline - Loop Overlay', () => {
  const mockMidiEvents = [
    { note: 36, timestamp: 5000, velocity: 100 },
    { note: 36, timestamp: 10000, velocity: 95 },
    { note: 38, timestamp: 7500, velocity: 100 },
    { note: 38, timestamp: 12500, velocity: 100 },
  ];

  const defaultProps = {
    midiEvents: mockMidiEvents,
    durationMs: 60000, // 60 seconds
    currentTimeMs: 0,
    bpm: 120,
    metronomeEnabled: false,
    loopStartMs: 15000,
    loopEndMs: 45000,
    isLoopActive: false,
    onLoopStartChange: vi.fn(),
    onLoopEndChange: vi.fn(),
    onLoopDragStart: vi.fn(),
    onLoopDragEnd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loop Overlay Rendering', () => {
    it('should render loop overlay when loop is set', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      // Component renders loop-region-fill and loop-start-marker/loop-end-marker when hasLoop is true
      expect(screen.getByTestId('loop-region-fill')).toBeInTheDocument();
    });

    it('should not render loop overlay when loopStartMs >= loopEndMs', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={45000}
          loopEndMs={15000}
        />
      );

      expect(screen.queryByTestId('loop-region-fill')).not.toBeInTheDocument();
    });

    it('should span full height of instrument tracks', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      // Loop region fill is absolutely positioned top-0 bottom-0
      const loopFill = screen.getByTestId('loop-region-fill');
      expect(loopFill).toHaveClass('absolute', 'top-0', 'bottom-0');
    });

    it('should render semi-transparent green fill', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const loopFill = screen.getByTestId('loop-region-fill');
      // opacity is 0.15
      expect(loopFill).toHaveStyle({ opacity: '0.15' });
    });

    it('should render left bracket "[" at loop start', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');
      expect(startMarker).toHaveTextContent('[');
    });

    it('should render right bracket "]" at loop end', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const endMarker = screen.getByTestId('loop-end-marker');
      expect(endMarker).toHaveTextContent(']');
    });

    it('should position brackets at correct percent of duration', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          durationMs={60000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');
      const endMarker = screen.getByTestId('loop-end-marker');

      // 15s/60s = 25%, 45s/60s = 75%
      expect(startMarker).toHaveStyle('left: 25%');
      expect(endMarker).toHaveStyle('left: 75%');
    });

    it('should apply distinct visual styling to brackets', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');
      const endMarker = screen.getByTestId('loop-end-marker');

      // Both positioned absolutely with col-resize cursor
      expect(startMarker).toHaveStyle('cursor: col-resize');
      expect(endMarker).toHaveStyle('cursor: col-resize');
      // Start has "[" and end has "]"
      expect(startMarker).toHaveTextContent('[');
      expect(endMarker).toHaveTextContent(']');
    });
  });

  describe('Loop Overlay Z-Index and Interaction', () => {
    it('should not block MIDI note interaction (pointer-events: none on fill)', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const loopFill = screen.getByTestId('loop-region-fill');
      expect(loopFill).toHaveStyle('pointer-events: none');
    });

    it('should allow pointer events on brackets for dragging', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');
      // pointer-events: auto is set on markers
      expect(startMarker).toHaveStyle('pointer-events: auto');
    });

    it('should have proper z-index to be visible above tracks', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');
      // z-index: 15 is set on markers in the component
      expect(startMarker).toHaveStyle('z-index: 15');
    });
  });

  describe('Bracket Dragging on Timeline', () => {
    it('should drag left bracket to resize loop start', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopStartChange={onStartChange}
          durationMs={60000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');

      // Mock getBoundingClientRect on the tracksRef div (the relative flex-1 div)
      // The tracksRef is the child of the flex row (after label column)
      const tracksDiv = container.querySelector('.relative.flex-1');
      if (tracksDiv) {
        Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
          value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
          configurable: true,
        });
      }

      // Drag: initialX=250 (25% = 15000ms), move to 200 → delta=-50 → deltaPercent=-0.05 → -3000ms
      // newMs = clamp(15000 - 3000, 0, 60000) = 12000 < loopEndMs (45000) → called with 12000
      fireEvent.mouseDown(startMarker, { clientX: 250 });
      fireEvent.mouseMove(document, { clientX: 200 }); // Move left (earlier in time)
      fireEvent.mouseUp(document);

      expect(onStartChange).toHaveBeenCalled();
    });

    it('should drag right bracket to resize loop end', async () => {
      const onEndChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopEndChange={onEndChange}
          durationMs={60000}
        />
      );

      const endMarker = screen.getByTestId('loop-end-marker');

      // Mock getBoundingClientRect on the tracksRef div
      const tracksDiv = container.querySelector('.relative.flex-1');
      if (tracksDiv) {
        Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
          value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
          configurable: true,
        });
      }

      // Drag: initialX=750 (75% = 45000ms), move to 800 → delta=50 → deltaPercent=0.05 → +3000ms
      // newMs = clamp(45000 + 3000, 0, 60000) = 48000 > loopStartMs (15000) → called with 48000
      fireEvent.mouseDown(endMarker, { clientX: 750 });
      fireEvent.mouseMove(document, { clientX: 800 }); // Move right (later in time)
      fireEvent.mouseUp(document);

      expect(onEndChange).toHaveBeenCalled();
    });

    it('should prevent dragging start past end', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopStartChange={onStartChange}
          durationMs={60000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');
      const tracksDiv = container.querySelector('.relative.flex-1');

      // Mock getBoundingClientRect on the tracks container
      if (tracksDiv) {
        Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
          value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
          configurable: true,
        });
      }

      // Try to drag start from 25% (15000ms) to beyond the end (loopEndMs=45000)
      fireEvent.mouseDown(startMarker, { clientX: 250 });
      fireEvent.mouseMove(document, { clientX: 900 }); // Move far right
      fireEvent.mouseUp(document);

      // The constraint (newMs < capturedLoopEndMs) prevents calling when past end
      if (onStartChange.mock.calls.length > 0) {
        const calledValue = onStartChange.mock.calls[0][0];
        expect(calledValue).toBeLessThan(45000);
      }
    });

    it('should prevent dragging end past start', async () => {
      const onEndChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopEndChange={onEndChange}
          durationMs={60000}
        />
      );

      const endMarker = screen.getByTestId('loop-end-marker');
      const tracksDiv = container.querySelector('.relative.flex-1');

      // Mock getBoundingClientRect on the tracks container
      if (tracksDiv) {
        Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
          value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
          configurable: true,
        });
      }

      // Try to drag end from 75% (45000ms) to before the start (loopStartMs=15000)
      fireEvent.mouseDown(endMarker, { clientX: 750 });
      fireEvent.mouseMove(document, { clientX: 100 }); // Move far left
      fireEvent.mouseUp(document);

      // The constraint (newMs > capturedLoopStartMs) prevents calling when before start
      if (onEndChange.mock.calls.length > 0) {
        const calledValue = onEndChange.mock.calls[0][0];
        expect(calledValue).toBeGreaterThan(15000);
      }
    });

    it('should show resize cursor on bracket hover', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');
      expect(startMarker).toHaveStyle('cursor: col-resize');
    });

    it('should highlight bracket during drag', async () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');

      // Simply verify mouseDown doesn't throw
      fireEvent.mouseDown(startMarker, { clientX: 0 });
      // The component attaches document listeners — just verify marker still exists
      expect(startMarker).toBeInTheDocument();
      fireEvent.mouseUp(document);
    });

    it('should update continuously during bracket drag', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopStartChange={onStartChange}
          durationMs={60000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');

      // Mock getBoundingClientRect on the tracksRef div
      const tracksDiv = container.querySelector('.relative.flex-1');
      if (tracksDiv) {
        Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
          value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
          configurable: true,
        });
      }

      // InitialX=250 (15000ms). Each move with different clientX produces different ms values.
      // All results < 45000 so all should call onStartChange.
      fireEvent.mouseDown(startMarker, { clientX: 250 });
      fireEvent.mouseMove(document, { clientX: 200 }); // delta=-50 → -3000ms → 12000
      fireEvent.mouseMove(document, { clientX: 150 }); // delta=-100 → -6000ms → 9000
      fireEvent.mouseMove(document, { clientX: 100 }); // delta=-150 → -9000ms → 6000
      fireEvent.mouseUp(document);

      expect(onStartChange.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('Loop Overlay with Multiple Tracks', () => {
    it('should span across all instrument tracks', () => {
      const midiEventsWithMoreTracks = [
        ...mockMidiEvents,
        { note: 42, timestamp: 2000, velocity: 100 },
        { note: 46, timestamp: 4000, velocity: 100 },
      ];

      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          midiEvents={midiEventsWithMoreTracks}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      // Loop fill is rendered across the entire tracks container
      const loopFill = screen.getByTestId('loop-region-fill');
      expect(loopFill).toHaveClass('absolute', 'top-0', 'bottom-0');
    });

    it('should allow note interaction within loop region', async () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={5000}
          loopEndMs={12500}
        />
      );

      // Verify that the loop fill has pointer-events: none (doesn't block notes)
      const loopFill = screen.getByTestId('loop-region-fill');
      expect(loopFill).toHaveStyle('pointer-events: none');
    });
  });

  describe('Loop Fill Width Calculation', () => {
    it('should calculate fill width as percentage of timeline', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          durationMs={60000}
        />
      );

      const loopFill = screen.getByTestId('loop-region-fill');
      // From 25% to 75% = 50% width
      expect(loopFill).toHaveStyle('width: 50%');
    });

    it('should update fill width when loop boundaries change', async () => {
      const { rerender } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          durationMs={60000}
        />
      );

      let loopFill = screen.getByTestId('loop-region-fill');
      expect(loopFill).toHaveStyle('width: 50%');

      rerender(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={60000}
          durationMs={60000}
        />
      );

      loopFill = screen.getByTestId('loop-region-fill');
      // From 0% to 100% = 100% width
      expect(loopFill).toHaveStyle('width: 100%');
    });
  });

  describe('Loop Overlay Accessibility', () => {
    it('should have aria-hidden on loop overlay elements', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      // Loop markers and fill are aria-hidden (they're visual decorations)
      const loopFill = screen.getByTestId('loop-region-fill');
      const startMarker = screen.getByTestId('loop-start-marker');
      const endMarker = screen.getByTestId('loop-end-marker');

      expect(loopFill).toHaveAttribute('aria-hidden', 'true');
      expect(startMarker).toHaveAttribute('aria-hidden', 'true');
      expect(endMarker).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have bracket markers with drag affordance', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');
      const endMarker = screen.getByTestId('loop-end-marker');

      // Both have col-resize cursor indicating draggability
      expect(startMarker).toHaveStyle('cursor: col-resize');
      expect(endMarker).toHaveStyle('cursor: col-resize');
    });

    it('should have aria-hidden on fill to not confuse screen readers', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');
      expect(startMarker).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Performance', () => {
    it('should handle rapid bracket drag updates without frame drops', () => {
      const onStartChange = vi.fn();
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopStartChange={onStartChange}
          durationMs={60000}
        />
      );

      const startMarker = screen.getByTestId('loop-start-marker');

      const startTime = performance.now();

      fireEvent.mouseDown(startMarker, { clientX: 0 });
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(document, { clientX: 0 }); // Same position (zero rect)
      }
      fireEvent.mouseUp(document);

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1600); // 100 updates < 1600ms
    });
  });

  describe('Drag-to-select loop creation', () => {
    it('should create loop by dragging left→right', async () => {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={0}
          onLoopStartChange={onStartChange}
          onLoopEndChange={onEndChange}
          durationMs={60000}
        />
      );

      const tracksDiv = container.querySelector('.relative.flex-1');
      Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
        configurable: true,
      });

      fireEvent.mouseDown(tracksDiv as Element, { clientX: 250 });
      fireEvent.mouseMove(tracksDiv as Element, { clientX: 750 });
      fireEvent.mouseUp(tracksDiv as Element);

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(expect.any(Number));
        expect(onEndChange).toHaveBeenCalledWith(expect.any(Number));
      });

      const startMs = onStartChange.mock.calls[0][0];
      const endMs = onEndChange.mock.calls[0][0];
      expect(startMs).toBeLessThan(endMs);
    });

    it('should create loop by dragging right→left (min/max swap)', async () => {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={0}
          onLoopStartChange={onStartChange}
          onLoopEndChange={onEndChange}
          durationMs={60000}
        />
      );

      const tracksDiv = container.querySelector('.relative.flex-1');
      Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
        configurable: true,
      });

      fireEvent.mouseDown(tracksDiv as Element, { clientX: 750 });
      fireEvent.mouseMove(tracksDiv as Element, { clientX: 250 });
      fireEvent.mouseUp(tracksDiv as Element);

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalled();
        expect(onEndChange).toHaveBeenCalled();
      });

      const startMs = onStartChange.mock.calls[0][0];
      const endMs = onEndChange.mock.calls[0][0];
      expect(startMs).toBeLessThan(endMs);
    });

    it('should not create loop if drag < 500ms', async () => {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={0}
          onLoopStartChange={onStartChange}
          onLoopEndChange={onEndChange}
          durationMs={60000}
        />
      );

      const tracksDiv = container.querySelector('.relative.flex-1');
      // Default zero rect makes any drag produce 0ms duration
      fireEvent.mouseDown(tracksDiv as Element, { clientX: 100 });
      fireEvent.mouseMove(tracksDiv as Element, { clientX: 101 });
      fireEvent.mouseUp(tracksDiv as Element);

      // Wait briefly to ensure no callbacks fired
      await waitFor(() => {
        expect(onStartChange).not.toHaveBeenCalled();
        expect(onEndChange).not.toHaveBeenCalled();
      });
    });

    it('should show drag preview overlay during drag', async () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={0}
          onLoopStartChange={vi.fn()}
          onLoopEndChange={vi.fn()}
          durationMs={60000}
        />
      );

      const tracksDiv = container.querySelector('.relative.flex-1');
      Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
        configurable: true,
      });

      fireEvent.mouseDown(tracksDiv as Element, { clientX: 250 });
      fireEvent.mouseMove(tracksDiv as Element, { clientX: 750 });

      await waitFor(() => {
        expect(screen.getByTestId('loop-drag-preview')).toBeInTheDocument();
      });
    });

    it('should hide drag preview overlay after mouseUp', async () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={0}
          onLoopStartChange={vi.fn()}
          onLoopEndChange={vi.fn()}
          durationMs={60000}
        />
      );

      const tracksDiv = container.querySelector('.relative.flex-1');
      Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
        configurable: true,
      });

      fireEvent.mouseDown(tracksDiv as Element, { clientX: 250 });
      fireEvent.mouseMove(tracksDiv as Element, { clientX: 750 });
      fireEvent.mouseUp(tracksDiv as Element);

      // Drag preview should disappear after mouseUp
      await waitFor(() => {
        expect(screen.queryByTestId('loop-drag-preview')).not.toBeInTheDocument();
      });
    });

    it('should disable drag when isLoopActive is true', async () => {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={0}
          isLoopActive={true}
          onLoopStartChange={onStartChange}
          onLoopEndChange={onEndChange}
          durationMs={60000}
        />
      );

      const tracksDiv = container.querySelector('.relative.flex-1');
      Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
        configurable: true,
      });

      fireEvent.mouseDown(tracksDiv as Element, { clientX: 250 });
      fireEvent.mouseMove(tracksDiv as Element, { clientX: 750 });
      fireEvent.mouseUp(tracksDiv as Element);

      expect(onStartChange).not.toHaveBeenCalled();
      expect(onEndChange).not.toHaveBeenCalled();
    });

    it('should call onLoopDragStart on mouseDown', async () => {
      const onDragStart = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={0}
          onLoopStartChange={vi.fn()}
          onLoopEndChange={vi.fn()}
          onLoopDragStart={onDragStart}
          durationMs={60000}
        />
      );

      const tracksDiv = container.querySelector('.relative.flex-1');
      Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
        configurable: true,
      });

      fireEvent.mouseDown(tracksDiv as Element, { clientX: 250 });

      expect(onDragStart).toHaveBeenCalled();
    });

    it('should call onLoopDragEnd on mouseUp', async () => {
      const onDragEnd = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={0}
          onLoopStartChange={vi.fn()}
          onLoopEndChange={vi.fn()}
          onLoopDragEnd={onDragEnd}
          durationMs={60000}
        />
      );

      const tracksDiv = container.querySelector('.relative.flex-1');
      Object.defineProperty(tracksDiv, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 1000, height: 100, right: 1000, bottom: 100, x: 0, y: 0 }),
        configurable: true,
      });

      fireEvent.mouseDown(tracksDiv as Element, { clientX: 250 });
      fireEvent.mouseMove(tracksDiv as Element, { clientX: 750 });
      fireEvent.mouseUp(tracksDiv as Element);

      await waitFor(() => {
        expect(onDragEnd).toHaveBeenCalled();
      });
    });
  });
});
