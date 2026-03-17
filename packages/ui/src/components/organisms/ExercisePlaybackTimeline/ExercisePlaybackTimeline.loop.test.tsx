import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline';

describe('ExercisePlaybackTimeline - Loop Overlay', () => {
  const mockExercise = {
    id: '1',
    name: 'Exercise 1',
    bpm: 120,
    duration: 60000, // 60 seconds
    instrumentType: 'drums' as const,
    tracks: [
      {
        id: 'track1',
        name: 'Kick',
        color: '#FF0000',
        notes: [
          { time: 5000, velocity: 100 },
          { time: 10000, velocity: 95 },
        ],
      },
      {
        id: 'track2',
        name: 'Snare',
        color: '#00FF00',
        notes: [
          { time: 7500, velocity: 100 },
          { time: 12500, velocity: 100 },
        ],
      },
    ],
  };

  const defaultProps = {
    exercise: mockExercise,
    currentTimeMs: 0,
    isPlaying: false,
    onSeek: vi.fn(),
    loopStartMs: 15000,
    loopEndMs: 45000,
    isLoopActive: false,
    isDraggingLoop: false,
    onLoopStartChange: vi.fn(),
    onLoopEndChange: vi.fn(),
    onLoopDragStart: vi.fn(),
    onLoopDragEnd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loop Overlay Rendering', () => {
    it('should render loop overlay when active', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const loopOverlay = screen.getByTestId('loop-overlay');
      expect(loopOverlay).toBeInTheDocument();
    });

    it('should not render loop overlay when inactive', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={false}
        />
      );

      expect(screen.queryByTestId('loop-overlay')).not.toBeInTheDocument();
    });

    it('should span full height of instrument tracks', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
        />
      );

      const loopOverlay = screen.getByTestId('loop-overlay');
      expect(loopOverlay).toHaveStyle('height: 100%');
    });

    it('should render semi-transparent green fill', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
        />
      );

      const loopFill = screen.getByTestId('loop-fill');
      expect(loopFill).toHaveStyle('background-color: rgba(16, 185, 129, 0.15)');
    });

    it('should render left bracket "[" at loop start', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      expect(startBracket).toHaveTextContent('[');
    });

    it('should render right bracket "]" at loop end', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopEndMs={45000}
        />
      );

      const endBracket = screen.getByTestId('loop-end-bracket');
      expect(endBracket).toHaveTextContent(']');
    });

    it('should position brackets at correct percent of duration', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const endBracket = screen.getByTestId('loop-end-bracket');

      // 15s/60s = 25%, 45s/60s = 75%
      expect(startBracket).toHaveStyle('left: 25%');
      expect(endBracket).toHaveStyle('left: 75%');
    });

    it('should apply distinct visual styling to brackets', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const endBracket = screen.getByTestId('loop-end-bracket');

      expect(startBracket).toHaveClass('loop-bracket-start');
      expect(endBracket).toHaveClass('loop-bracket-end');
    });
  });

  describe('Loop Overlay Z-Index and Interaction', () => {
    it('should not block MIDI note interaction (pointer-events: none on fill)', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
        />
      );

      const loopFill = screen.getByTestId('loop-fill');
      expect(loopFill).toHaveStyle('pointer-events: none');
    });

    it('should allow pointer events on brackets for dragging', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      expect(startBracket).toHaveStyle('pointer-events: auto');
    });

    it('should have proper z-index to be visible above tracks', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
        />
      );

      const loopOverlay = screen.getByTestId('loop-overlay');
      const computedStyle = window.getComputedStyle(loopOverlay);
      const zIndex = parseInt(computedStyle.zIndex, 10);

      expect(zIndex).toBeGreaterThan(0);
    });
  });

  describe('Bracket Dragging on Timeline', () => {
    it('should drag left bracket to resize loop start', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopStartChange={onStartChange}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-container"]');
      const rect = timeline!.getBoundingClientRect();

      // Drag from 25% to 35% (15s to 21s)
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
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          onEndChange={onEndChange}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      const endBracket = screen.getByTestId('loop-end-bracket');
      const timeline = container.querySelector('[data-testid="timeline-container"]');
      const rect = timeline!.getBoundingClientRect();

      // Drag from 75% to 65% (45s to 39s)
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
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopStartChange={onStartChange}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-container"]');
      const rect = timeline!.getBoundingClientRect();

      // Try to drag past end (to 80%)
      fireEvent.mouseDown(startBracket);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.80 });
      fireEvent.mouseUp();

      await waitFor(() => {
        expect(onStartChange).toHaveBeenCalledWith(44000); // Just before end
      });
    });

    it('should prevent dragging end past start', async () => {
      const onEndChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          onEndChange={onEndChange}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      const endBracket = screen.getByTestId('loop-end-bracket');
      const timeline = container.querySelector('[data-testid="timeline-container"]');
      const rect = timeline!.getBoundingClientRect();

      // Try to drag before start (to 10%)
      fireEvent.mouseDown(endBracket);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.10 });
      fireEvent.mouseUp();

      await waitFor(() => {
        expect(onEndChange).toHaveBeenCalledWith(16000); // Just after start
      });
    });

    it('should show resize cursor on bracket hover', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      expect(startBracket).toHaveStyle('cursor: col-resize');
    });

    it('should highlight bracket during drag', async () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');

      fireEvent.mouseDown(startBracket);
      await waitFor(() => {
        expect(startBracket).toHaveClass('dragging');
      });

      fireEvent.mouseUp();
      await waitFor(() => {
        expect(startBracket).not.toHaveClass('dragging');
      });
    });

    it('should update continuously during bracket drag', async () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopStartChange={onStartChange}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-container"]');
      const rect = timeline!.getBoundingClientRect();

      fireEvent.mouseDown(startBracket);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.30 });
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.35 });
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.40 });
      fireEvent.mouseUp();

      expect(onStartChange.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('Loop Overlay with Multiple Tracks', () => {
    it('should span across all instrument tracks', () => {
      const exerciseWithMoreTracks = {
        ...mockExercise,
        tracks: [
          ...mockExercise.tracks,
          {
            id: 'track3',
            name: 'Hi-Hat',
            color: '#0000FF',
            notes: [],
          },
          {
            id: 'track4',
            name: 'Tom',
            color: '#FFFF00',
            notes: [],
          },
        ],
      };

      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          exercise={exerciseWithMoreTracks}
          isLoopActive={true}
        />
      );

      const loopOverlay = screen.getByTestId('loop-overlay');
      expect(loopOverlay).toHaveStyle('height: 100%');
    });

    it('should allow note interaction within loop region', async () => {
      const user = await userEvent.setup();
      const onNoteClick = vi.fn();

      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={5000}
          loopEndMs={12500}
          onNoteClick={onNoteClick}
        />
      );

      // Click on a note within the loop region
      const noteElement = screen.getByTestId('note-5000-track1');
      await user.click(noteElement);

      expect(onNoteClick).toHaveBeenCalled();
    });
  });

  describe('Loop Fill Width Calculation', () => {
    it('should calculate fill width as percentage of timeline', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      const loopFill = screen.getByTestId('loop-fill');
      // From 25% to 75%, so width should be 50%
      expect(loopFill).toHaveStyle('width: 50%');
    });

    it('should update fill width when loop boundaries change', async () => {
      const { rerender } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      let loopFill = screen.getByTestId('loop-fill');
      expect(loopFill).toHaveStyle('width: 50%');

      rerender(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={10000}
          loopEndMs={50000}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      loopFill = screen.getByTestId('loop-fill');
      // From 16.67% to 83.33%, so width should be 66.67%
      expect(loopFill).toHaveStyle('width: 66.67%');
    });
  });

  describe('Loop Overlay Accessibility', () => {
    it('should have aria-label on loop overlay container', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const loopOverlay = screen.getByTestId('loop-overlay');
      expect(loopOverlay).toHaveAttribute(
        'aria-label',
        /loop region from 15 seconds to 45 seconds/i
      );
    });

    it('should have aria-labels on bracket markers', () => {
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const endBracket = screen.getByTestId('loop-end-bracket');

      expect(startBracket).toHaveAttribute('aria-label', /loop start at 15 seconds/i);
      expect(endBracket).toHaveAttribute('aria-label', /loop end at 45 seconds/i);
    });

    it('should announce bracket drag updates', async () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-container"]');
      const rect = timeline!.getBoundingClientRect();

      fireEvent.mouseDown(startBracket);
      fireEvent.mouseMove(document, { clientX: rect.left + rect.width * 0.35 });

      const announcement = screen.getByRole('status', { hidden: true });
      await waitFor(() => {
        expect(announcement).toHaveAttribute('aria-live', 'polite');
      });
    });
  });

  describe('Performance', () => {
    it('should handle rapid bracket drag updates without frame drops', () => {
      const onStartChange = vi.fn();
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={15000}
          loopEndMs={45000}
          onLoopStartChange={onStartChange}
          exercise={{ ...mockExercise, duration: 60000 }}
        />
      );

      const startBracket = screen.getByTestId('loop-start-bracket');
      const timeline = container.querySelector('[data-testid="timeline-container"]');
      const rect = timeline!.getBoundingClientRect();

      const startTime = performance.now();

      fireEvent.mouseDown(startBracket);
      for (let i = 0; i < 100; i++) {
        fireEvent.mouseMove(document, {
          clientX: rect.left + rect.width * (0.25 + i * 0.001),
        });
      }
      fireEvent.mouseUp();

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1600); // Should handle 100 updates at 60fps
    });
  });
});
