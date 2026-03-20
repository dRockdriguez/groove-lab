/**
 * Verification tests for cleanup-old-scoring spec
 * These tests verify that old scoring system has been completely removed
 */

import * as utils from './index'

describe('Cleanup Old Scoring — Utils Verification', () => {
  describe('Old scoring exports should be deleted', () => {
    it('should not export HIT_PERFECT_THRESHOLD_MS', () => {
      expect(utils).not.toHaveProperty('HIT_PERFECT_THRESHOLD_MS')
    })

    it('should not export DrumHitValidation type', () => {
      // TypeScript types are erased at runtime, but we can check no related runtime exists
      expect(utils).not.toHaveProperty('DrumHitValidation')
    })

    it('should not export HitLookup type', () => {
      expect(utils).not.toHaveProperty('HitLookup')
    })

    it('should not export buildHitLookup function', () => {
      expect(utils).not.toHaveProperty('buildHitLookup')
    })

    it('should not export findNearestHit function', () => {
      expect(utils).not.toHaveProperty('findNearestHit')
    })

    it('should not export validateDrumHit function', () => {
      expect(utils).not.toHaveProperty('validateDrumHit')
    })
  })

  describe('Non-scoring exports should remain', () => {
    it('should export getDrumColor function', () => {
      expect(typeof utils.getDrumColor).toBe('function')
    })

    it('should export DRUM_COLOR_MAP', () => {
      expect(utils.DRUM_COLOR_MAP).toBeDefined()
      expect(typeof utils.DRUM_COLOR_MAP).toBe('object')
    })

    it('should export DrumSoundEngine class', () => {
      expect(typeof utils.DrumSoundEngine).toBe('function')
    })

    it('should export GM_DRUM_MAP', () => {
      expect(utils.GM_DRUM_MAP).toBeDefined()
    })

    it('should export getDrumName function', () => {
      expect(typeof utils.getDrumName).toBe('function')
    })

    it('should export isValidVelocity function', () => {
      expect(typeof utils.isValidVelocity).toBe('function')
    })

    it('should export isValidNote function', () => {
      expect(typeof utils.isValidNote).toBe('function')
    })

    it('should export formatDuration function', () => {
      expect(typeof utils.formatDuration).toBe('function')
    })
  })
})
