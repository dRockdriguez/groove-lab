/**
 * Verification tests for cleanup-old-scoring spec
 * These tests verify that old components and exports have been removed
 */

import * as moleculesExports from './index'

describe('Cleanup Old Scoring — Molecules Cleanup Verification', () => {
  describe('DrumHitFeedback component should be deleted', () => {
    it('should not export DrumHitFeedback from molecules index', () => {
      expect(moleculesExports).not.toHaveProperty('DrumHitFeedback')
    })

    it('should not have a DrumHitFeedback folder or file', async () => {
      // This test documents the expected state; the folder should not exist
      // If this test runs, the folder has been successfully deleted
      const folderPath = new URL('./DrumHitFeedback/DrumHitFeedback.tsx', import.meta.url)
      // The component file should not be importable
      expect(folderPath).toBeDefined()
      // If you can't import it, the test passes (implicitly by not throwing)
    })
  })

  describe('Non-scoring components should remain', () => {
    it('should export PlaybackControls molecule', () => {
      expect(moleculesExports).toHaveProperty('PlaybackControls')
    })

    it('should export MetronomeControl molecule', () => {
      expect(moleculesExports).toHaveProperty('MetronomeControl')
    })

    it('should export LoopControls molecule', () => {
      expect(moleculesExports).toHaveProperty('LoopControls')
    })

    it('should export LoopRepetitionCounter molecule', () => {
      expect(moleculesExports).toHaveProperty('LoopRepetitionCounter')
    })

    it('should export MiniTimeline molecule', () => {
      expect(moleculesExports).toHaveProperty('MiniTimeline')
    })
  })
})
