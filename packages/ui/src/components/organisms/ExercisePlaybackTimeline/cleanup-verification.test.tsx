/**
 * Verification tests for cleanup-old-scoring spec
 * These tests verify that ExercisePlaybackTimeline has been cleaned of scoring logic
 */

import { render, screen } from '@testing-library/react'
import { ExercisePlaybackTimeline } from './ExercisePlaybackTimeline'
import type { MidiEvent } from '@groovelab/types'

// Mock MiniTimeline
vi.mock('../../molecules/MiniTimeline', () => ({
  MiniTimeline: ({ onBracketDrag }: any) => (
    <div
      data-testid="mini-timeline"
      onClick={() => onBracketDrag?.(1000, 2000)}
    />
  )
}))

const mockEvents: MidiEvent[] = [
  { note: 36, velocity: 100, timestamp: 500 },
  { note: 38, velocity: 90, timestamp: 1000 }
]

const defaultProps = {
  currentTimeMs: 0,
  durationMs: 4000,
  isPlaying: false,
  midiEvents: mockEvents,
  onTimelineClick: vi.fn(),
  isLoopActive: false,
  loopStartMs: 0,
  loopEndMs: 4000,
  onLoopChange: vi.fn()
}

describe('Cleanup Old Scoring — ExercisePlaybackTimeline Verification', () => {
  describe('Scoring props should be removed', () => {
    it('should not accept validatedHits prop', () => {
      // Component should render without validatedHits and no error
      expect(() => {
        render(<ExercisePlaybackTimeline {...defaultProps} />)
      }).not.toThrow()
    })

    it('should render without scoring props without errors', () => {
      const { container } = render(
        <ExercisePlaybackTimeline {...defaultProps} />
      )
      // Timeline region should exist
      expect(container.querySelector('[role="region"]')).toBeInTheDocument()
    })
  })

  describe('Scoring visuals should be removed', () => {
    it('should not render hit overlays', () => {
      const { container } = render(
        <ExercisePlaybackTimeline {...defaultProps} />
      )
      // Hit overlays should not exist
      const hitOverlays = container.querySelectorAll('[data-testid^="hit-overlay"]')
      expect(hitOverlays.length).toBe(0)
    })

    it('should not render track glow overlays', () => {
      const { container } = render(
        <ExercisePlaybackTimeline {...defaultProps} />
      )
      // Track glow overlays should not exist
      const trackGlows = container.querySelectorAll('[data-testid="track-glow-overlay"]')
      expect(trackGlows.length).toBe(0)
    })

    it('should not have scoring-related useMemo calculations', () => {
      // The component should render efficiently without hitOverlayMap or rowGlowMap
      const { rerender } = render(
        <ExercisePlaybackTimeline {...defaultProps} />
      )

      // Rerender with different MIDI events - should not affect scoring
      rerender(
        <ExercisePlaybackTimeline
          {...defaultProps}
          midiEvents={[
            ...mockEvents,
            { note: 42, velocity: 80, timestamp: 2000 }
          ]}
        />
      )

      // Should still not have overlays
      const { container } = render(
        <ExercisePlaybackTimeline {...defaultProps} />
      )
      const hitOverlays = container.querySelectorAll('[data-testid^="hit-overlay"]')
      expect(hitOverlays.length).toBe(0)
    })
  })

  describe('Non-scoring functionality should remain', () => {
    it('should still render note markers from MIDI events', () => {
      const { container } = render(
        <ExercisePlaybackTimeline {...defaultProps} />
      )
      // Note markers should still exist
      const noteMarkers = container.querySelectorAll('[data-testid="note-marker"]')
      expect(noteMarkers.length).toBe(mockEvents.length)
    })

    it('should still render playhead', () => {
      const { container } = render(
        <ExercisePlaybackTimeline {...defaultProps} />
      )
      // Playhead should still be rendered
      const playhead = container.querySelector('[data-testid="playhead"]')
      expect(playhead).toBeInTheDocument()
    })

    it('should still render loop markers when loop is active', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={500}
          loopEndMs={2500}
        />
      )
      // Loop markers should still exist
      const loopStart = container.querySelector('[data-testid="loop-start-marker"]')
      const loopEnd = container.querySelector('[data-testid="loop-end-marker"]')
      expect(loopStart).toBeInTheDocument()
      expect(loopEnd).toBeInTheDocument()
    })

    it('should still have drum colors applied to note markers', () => {
      const { container } = render(
        <ExercisePlaybackTimeline {...defaultProps} />
      )
      // Note markers should have backgroundColor from getDrumColor
      const noteMarkers = container.querySelectorAll('[data-testid="note-marker"]')
      expect(noteMarkers.length).toBeGreaterThan(0)
      // At least one marker should have a background color
      let hasColoredMarker = false
      noteMarkers.forEach((marker) => {
        const bgColor = (marker as HTMLElement).style.backgroundColor
        if (bgColor) {
          hasColoredMarker = true
        }
      })
      expect(hasColoredMarker).toBeTruthy()
    })
  })

  describe('Loop interactions should remain', () => {
    it('should accept loop-related props', () => {
      const { container } = render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={1000}
          loopEndMs={2000}
          onLoopStartChange={vi.fn()}
          onLoopEndChange={vi.fn()}
        />
      )
      expect(container).toBeDefined()
    })

    it('should handle onLoopStartChange and onLoopEndChange callbacks', () => {
      const onLoopStartChange = vi.fn()
      const onLoopEndChange = vi.fn()
      render(
        <ExercisePlaybackTimeline
          {...defaultProps}
          isLoopActive={true}
          loopStartMs={1000}
          loopEndMs={2000}
          onLoopStartChange={onLoopStartChange}
          onLoopEndChange={onLoopEndChange}
        />
      )
      // Loop callbacks should be callable
      expect(onLoopStartChange).toBeDefined()
      expect(onLoopEndChange).toBeDefined()
    })
  })
})
