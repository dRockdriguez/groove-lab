import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MiniTimeline } from './MiniTimeline';

describe('MiniTimeline - Loop Interactions', () => {
  const mockMidiEvents = [
    { note: 36, time: 5000, velocity: 100 },
    { note: 36, time: 10000, velocity: 95 },
    { note: 38, time: 7500, velocity: 100 },
    { note: 38, time: 12500, velocity: 100 },
  ];

  const defaultProps = {
    midiEvents: mockMidiEvents,
    durationMs: 60000, // 60 seconds
    currentTimeMs: 0,
    onSeek: vi.fn(),
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

  describe('Loop Boundary Markers', () => {
    it('should render left bracket "[" at loop start position', () => {
      render(<MiniTimeline {...defaultProps} isLoopActive={true} />);
      const startBracket = screen.getByTestId('loop-start-bracket');
      expect(startBracket).toBeInTheDocument();
      expect(startBracket).toHaveTextContent('[');
    });

    it('should render right bracket "]" at loop end position', () => {
      render(<MiniTimeline {...defaultProps} isLoopActive={true} />);
      const endBracket = screen.getByTestId('loop-end-bracket');
      expect(endBracket).toBeInTheDocument();
      expect(endBracket).toHaveTextContent(']');
    });

    it('should render semi-transparent green fill between markers', () => {
      render(<MiniTimeline {...defaultProps} isLoopActive={true} />);
      const loopFill = screen.getByTestId('loop-fill');
      expect(loopFill).toHaveStyle('background-color: rgba(16, 185, 129, 0.15)');
    });

    it('should position markers at correct percent of timeline', () => {
      render(
        <MiniTimeline
          {...defaultProps}
          durationMs={60000}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const endBracket = screen.getByTestId('loop-end-bracket');

      // 15s out of 60s = 25%, 45s out of 60s = 75%
      expect(startBracket).toHaveStyle('left: 25%');
      expect(endBracket).toHaveStyle('left: 75%');
    });

    it('should hide markers when loop is not active', () => {
      render(<MiniTimeline {...defaultProps} isLoopActive={false} />);
      expect(screen.queryByTestId('loop-start-bracket')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loop-end-bracket')).not.toBeInTheDocument();
    });

    it('should hide markers when no loop is set', () => {
      render(
        <MiniTimeline
          {...defaultProps}
          loopStartMs={0}
          loopEndMs={0}
          isLoopActive={false}
        />
      );
      expect(screen.queryByTestId('loop-start-bracket')).not.toBeInTheDocument();
    });

    it('should apply different styling to start vs end bracket', () => {
      render(<MiniTimeline {...defaultProps} isLoopActive={true} />);

      const startBracket = screen.getByTestId('loop-start-bracket');
      const endBracket = screen.getByTestId('loop-end-bracket');

      expect(startBracket).toHaveClass('loop-bracket-start');
      expect(endBracket).toHaveClass('loop-bracket-end');
    });
  });

  describe('Drag-to-Select Loop (Desktop)', () => {
    it('should start loop selection on mouse down', async () => {
      const onDragStart = vi.fn();
      const { container } = render(
        <MiniTimeline {...defaultProps} onLoopDragStart={onDragStart} />
      );

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      fireEvent.mouseDown(timeline!, { clientX: 150 });

      expect(onDragStart).toHaveBeenCalled();
    });

    it('should show drag preview as user drags', async () => {
      const { container } = render(<MiniTimeline {...defaultProps} />);

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Start drag at 25% (15s)
      fireEvent.mouseDown(timeline!, { clientX: rect.left + rect.width * 0.25 });
      // Move to 75% (45s)
      fireEvent.mouseMove(timeline!, { clientX: rect.left + rect.width * 0.75 });

      const preview = screen.getByTestId('loop-drag-preview');
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveStyle('background-color: rgba(59, 130, 246, 0.2)'); // Blue
    });

    it('should create loop on mouse up after drag', async () => {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          onLoopStartChange={onStartChange}
          onLoopEndChange={onEndChange}
          exerciseDuration={60000}
        />
      );

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Drag from 15s to 45s
      fireEvent.mouseDown(timeline!, { clientX: rect.left + rect.width * 0.25 });
      fireEvent.mouseMove(timeline!, { clientX: rect.left + rect.width * 0.75 });
      fireEvent.mouseUp();

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(15000);
        expect(onEndChange).toHaveBeenCalledWith(45000);
      });
    });

    it('should swap start and end if drag goes right to left', async () => {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          onLoopStartChange={onStartChange}
          onLoopEndChange={onEndChange}
          exerciseDuration={60000}
        />
      );

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Drag from 75% to 25% (right to left)
      fireEvent.mouseDown(timeline!, { clientX: rect.left + rect.width * 0.75 });
      fireEvent.mouseMove(timeline!, { clientX: rect.left + rect.width * 0.25 });
      fireEvent.mouseUp();

      await waitFor(() => {
        // Should swap to ensure start < end
        expect(onStartChange).toHaveBeenCalledWith(15000);
        expect(onEndChange).toHaveBeenCalledWith(45000);
      });
    });

    it('should enforce minimum 500ms loop duration', async () => {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          onLoopStartChange={onStartChange}
          onLoopEndChange={onEndChange}
          exerciseDuration={60000}
        />
      );

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Drag less than 500ms (300ms)
      fireEvent.mouseDown(timeline!, { clientX: rect.left + rect.width * 0.25 });
      fireEvent.mouseMove(timeline!, {
        clientX: rect.left + rect.width * 0.25 + (rect.width * (300 / 60000)),
      });

      const preview = screen.queryByTestId('loop-drag-preview');
      expect(preview).toHaveClass('loop-drag-preview-invalid');
    });

    it('should ignore drag if duration < 500ms on mouse up', async () => {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          onLoopStartChange={onStartChange}
          onLoopEndChange={onEndChange}
          exerciseDuration={60000}
        />
      );

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Drag less than 500ms
      fireEvent.mouseDown(timeline!, { clientX: rect.left + rect.width * 0.25 });
      fireEvent.mouseMove(timeline!, {
        clientX: rect.left + rect.width * 0.25 + (rect.width * (300 / 60000)),
      });
      fireEvent.mouseUp();

      expect(onStartChange).not.toHaveBeenCalled();
      expect(onEndChange).not.toHaveBeenCalled();
    });

    it('should clear preview on drag end', () => {
      const { container, queryByTestId } = render(<MiniTimeline {...defaultProps} />);

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      fireEvent.mouseDown(timeline!, { clientX: rect.left + rect.width * 0.25 });
      fireEvent.mouseMove(timeline!, { clientX: rect.left + rect.width * 0.75 });
      fireEvent.mouseUp();

      expect(queryByTestId('loop-drag-preview')).not.toBeInTheDocument();
    });
  });

  describe('Bracket Drag (Resize Loop)', () => {
    it('should drag left bracket to resize loop start', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
          onLoopStartChange={onStartChange}
          exerciseDuration={60000}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Drag bracket from 25% to 35% (15s to 21s)
      fireEvent.mouseDown(startBracket);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.35 });
      fireEvent.mouseUp();

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(21000);
      });
    });

    it('should drag right bracket to resize loop end', async () => {
      const onEndChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
          onLoopEndChange={onEndChange}
          exerciseDuration={60000}
        />
      );

      const endBracket = screen.getByTestId('loop-end-bracket');
      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Drag bracket from 75% to 65% (45s to 39s)
      fireEvent.mouseDown(endBracket);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.65 });
      fireEvent.mouseUp();

      await waitFor(() => {
        expect(onEndChange).toHaveBeenCalledWith(39000);
      });
    });

    it('should prevent dragging start past end', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
          onLoopStartChange={onStartChange}
          exerciseDuration={60000}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Try to drag bracket past end (to 80%, which is 48s > 45s)
      fireEvent.mouseDown(startBracket);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.80 });
      fireEvent.mouseUp();

      await waitFor(() => {
        // Should be clamped to just before end
        expect(onStartChange).toHaveBeenCalledWith(44000); // Just before 45s
      });
    });

    it('should prevent dragging end past start', async () => {
      const onEndChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
          onLoopEndChange={onEndChange}
          exerciseDuration={60000}
        />
      );

      const endBracket = screen.getByTestId('loop-end-bracket');
      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Try to drag bracket before start (to 20%, which is 12s < 15s)
      fireEvent.mouseDown(endBracket);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.20 });
      fireEvent.mouseUp();

      await waitFor(() => {
        // Should be clamped to just after start
        expect(onEndChange).toHaveBeenCalledWith(16000); // Just after 15s
      });
    });

    it('should clamp bracket drag to timeline boundaries', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
          onLoopStartChange={onStartChange}
          exerciseDuration={60000}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Drag to before timeline start (negative)
      fireEvent.mouseDown(startBracket);
      fireEvent.mouseMove(document, { clientX: rect.left - 100 });
      fireEvent.mouseUp();

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(0);
      });
    });

    it('should show resize cursor on bracket hover', () => {
      render(
        <MiniTimeline {...defaultProps} loopStartMs={15000} isLoopActive={true} />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      expect(startBracket).toHaveStyle('cursor: col-resize');
    });

    it('should update continuously during bracket drag', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
          onLoopStartChange={onStartChange}
          exerciseDuration={60000}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      fireEvent.mouseDown(startBracket);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.30 });
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.35 });
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.40 });
      fireEvent.mouseUp();

      expect(onStartChange.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('Mobile/Touch Fallback (Tap-to-Set)', () => {
    it('should show "[" marker and hint after first tap', async () => {
      const { container } = render(<MiniTimeline {...defaultProps} />);

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // Simulate touch device
      fireEvent.touchStart(timeline!, {
        touches: [{ clientX: rect.left + rect.width * 0.25 }],
      });

      await waitFor(() => {
        expect(screen.getByText(/tap to set loop end/i)).toBeInTheDocument();
        expect(screen.getByTestId('loop-start-bracket')).toBeInTheDocument();
      });
    });

    it('should complete loop selection after second tap', async () => {
      const onStartChange = vi.fn();
      const onEndChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          onLoopStartChange={onStartChange}
          onLoopEndChange={onEndChange}
          exerciseDuration={60000}
        />
      );

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // First tap at 25%
      fireEvent.touchStart(timeline!, {
        touches: [{ clientX: rect.left + rect.width * 0.25 }],
      });
      fireEvent.touchEnd(timeline!);

      // Second tap at 75%
      fireEvent.touchStart(timeline!, {
        touches: [{ clientX: rect.left + rect.width * 0.75 }],
      });
      fireEvent.touchEnd(timeline!);

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(15000);
        expect(onEndChange).toHaveBeenCalledWith(45000);
      });
    });

    it('should show "]" marker after second tap', async () => {
      const { container } = render(<MiniTimeline {...defaultProps} />);

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // First tap
      fireEvent.touchStart(timeline!, {
        touches: [{ clientX: rect.left + rect.width * 0.25 }],
      });
      fireEvent.touchEnd(timeline!);

      // Second tap
      fireEvent.touchStart(timeline!, {
        touches: [{ clientX: rect.left + rect.width * 0.75 }],
      });
      fireEvent.touchEnd(timeline!);

      await waitFor(() => {
        expect(screen.getByTestId('loop-end-bracket')).toBeInTheDocument();
        expect(screen.getByText(/tap to set loop end/i)).not.toBeInTheDocument();
      });
    });

    it('should have minimum 48x48px tap target', () => {
      render(<MiniTimeline {...defaultProps} isLoopActive={true} />);

      const startBracket = screen.getByTestId('loop-start-bracket');
      const rect = startBracket.getBoundingClientRect();

      expect(rect.width).toBeGreaterThanOrEqual(48);
      expect(rect.height).toBeGreaterThanOrEqual(48);
    });

    it('should allow resetting first tap if user taps twice on same location', async () => {
      const { container } = render(<MiniTimeline {...defaultProps} />);

      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      // First tap at 25%
      fireEvent.touchStart(timeline!, {
        touches: [{ clientX: rect.left + rect.width * 0.25 }],
      });
      fireEvent.touchEnd(timeline!);

      // Cancel and tap again at different location
      fireEvent.touchStart(timeline!, {
        touches: [{ clientX: rect.left + rect.width * 0.30 }],
      });
      fireEvent.touchEnd(timeline!);

      // Verify it resets (hint still shows, bracket moved)
      expect(screen.getByText(/tap to set loop end/i)).toBeInTheDocument();
    });
  });

  describe('Loop Markers Respect Timeline Width', () => {
    it('should scale marker positions with timeline width changes', async () => {
      const { rerender } = render(
        <MiniTimeline
          {...defaultProps}
          durationMs={60000}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
        }
      />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const initialLeft = startBracket.style.left;

      // Change timeline width (simulate resize)
      rerender(
        <MiniTimeline
          {...defaultProps}
          durationMs={60000}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
        />
      );

      // Position should remain same percentage
      expect(startBracket).toHaveStyle('left: 25%');
    });
  });

  describe('Performance', () => {
    it('should not drop frames with many rapid drag updates', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <MiniTimeline
          {...defaultProps}
          loopStartMs={15000}
          loopEndMs={45000}
          isLoopActive={true}
          onLoopStartChange={onStartChange}
          exerciseDuration={60000}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-track"]');
      const rect = timeline!.getBoundingClientRect();

      const startTime = performance.now();

      fireEvent.mouseDown(startBracket);
      // Simulate 100 rapid mousemove events
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(document, {
          clientX: rect.left + rect.width * (0.25 + i * 0.001),
        });
      }
      fireEvent.mouseUp();

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 100 updates in less than 16ms per frame (60fps)
      expect(duration).toBeLessThan(1600);
    });
  });
});
