/**
 * Verification tests for cleanup-old-scoring spec
 * These tests verify that old component exports have been removed from main index
 */

import * as uiExports from './index'

describe('Cleanup Old Scoring — UI Package Root Verification', () => {
  describe('Old scoring components should not be exported', () => {
    it('should not export DrumHitFeedback from ui package root', () => {
      expect(uiExports).not.toHaveProperty('DrumHitFeedback')
    })
  })

  describe('Non-scoring components should still be exported', () => {
    it('should export ExercisePlaybackPage organism', () => {
      expect(uiExports).toHaveProperty('ExercisePlaybackPage')
    })

    it('should export ExercisePlaybackTimeline organism', () => {
      expect(uiExports).toHaveProperty('ExercisePlaybackTimeline')
    })

    it('should export PlaybackControls molecule', () => {
      expect(uiExports).toHaveProperty('PlaybackControls')
    })

    it('should export MetronomeControl molecule', () => {
      expect(uiExports).toHaveProperty('MetronomeControl')
    })

    it('should export LoopControls molecule', () => {
      expect(uiExports).toHaveProperty('LoopControls')
    })

    it('should export ToolsSidebar organism', () => {
      expect(uiExports).toHaveProperty('ToolsSidebar')
    })
  })
})
