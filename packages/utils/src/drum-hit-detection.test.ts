import { describe, it, expect } from 'vitest';
import { buildHitLookup, validateDrumHit, HIT_PERFECT_THRESHOLD_MS } from './index';

describe('Drum Hit Detection', () => {
  describe('buildHitLookup', () => {
    it('creates a lookup structure mapping notes to sorted timestamps', () => {
      const events = [
        { note: 36, timestamp: 0 },
        { note: 42, timestamp: 250 },
        { note: 36, timestamp: 500 },
        { note: 38, timestamp: 750 },
      ];

      const lookup = buildHitLookup(events);

      expect(lookup[36]).toEqual([0, 500]);
      expect(lookup[42]).toEqual([250]);
      expect(lookup[38]).toEqual([750]);
    });

    it('returns empty object for empty events', () => {
      const lookup = buildHitLookup([]);
      expect(lookup).toEqual({});
    });

    it('maintains sorted order for notes with multiple hits', () => {
      const events = [
        { note: 36, timestamp: 1000 },
        { note: 36, timestamp: 200 },
        { note: 36, timestamp: 500 },
      ];

      const lookup = buildHitLookup(events);
      expect(lookup[36]).toEqual([200, 500, 1000]);
    });
  });

  describe('validateDrumHit', () => {
    const mockExercise = [
      { note: 36, timestamp: 0 },
      { note: 42, timestamp: 250 },
      { note: 38, timestamp: 500 },
      { note: 36, timestamp: 750 },
    ];
    const lookup = buildHitLookup(mockExercise);

    describe('HIT classification', () => {
      it('classifies a hit within ±20ms threshold as "hit"', () => {
        const result = validateDrumHit(36, 15, lookup, 150);
        expect(result?.classification).toBe('hit');
        expect(result?.offsetMs).toBe(15);
      });

      it('classifies a hit at exact time as "hit"', () => {
        const result = validateDrumHit(36, 0, lookup, 150);
        expect(result?.classification).toBe('hit');
        expect(result?.offsetMs).toBe(0);
      });

      it('classifies a hit at tolerance boundary as "late"', () => {
        const result = validateDrumHit(42, 400, lookup, 150); // 150ms late
        expect(result?.classification).toBe('late');
      });
    });

    describe('EARLY classification', () => {
      it('classifies a hit slightly before expected time as "early"', () => {
        const result = validateDrumHit(36, 750 - 75, lookup, 150); // 75ms early
        expect(result?.classification).toBe('early');
        expect(result?.offsetMs).toBe(-75);
      });
    });

    describe('LATE classification', () => {
      it('classifies a hit slightly after expected time as "late"', () => {
        const result = validateDrumHit(36, 750 + 75, lookup, 150); // 75ms late
        expect(result?.classification).toBe('late');
        expect(result?.offsetMs).toBe(75);
      });
    });

    describe('VIOLATION classification', () => {
      it('classifies a hit on a note that does not exist as "violation"', () => {
        const result = validateDrumHit(49, 100, lookup, 150); // note 49 (crash) not in exercise
        expect(result?.classification).toBe('violation');
      });

      it('classifies a hit too far outside tolerance as "violation"', () => {
        const result = validateDrumHit(36, 10000, lookup, 150); // way too late
        expect(result?.classification).toBe('violation');
      });
    });

    describe('timing offset', () => {
      it('correctly calculates positive offset (late hit)', () => {
        const result = validateDrumHit(36, 50, lookup, 150);
        expect(result?.offsetMs).toBe(50);
      });

      it('correctly calculates negative offset (early hit)', () => {
        const result = validateDrumHit(36, -50, lookup, 150);
        expect(result?.offsetMs).toBe(-50);
      });

      it('returns 0 offset for exact hit', () => {
        const result = validateDrumHit(36, 0, lookup, 150);
        expect(result?.offsetMs).toBe(0);
      });
    });

    describe('nearest hit selection', () => {
      it('finds the nearest expected hit when multiple exist', () => {
        // Note 36 has hits at 0 and 750
        // Detected at 100 is closer to 0 than 750
        const result = validateDrumHit(36, 100, lookup, 200);
        expect(result?.expectedTimeMs).toBe(0);
        expect(result?.offsetMs).toBe(100);
      });

      it('switches to nearest hit if it falls within tolerance', () => {
        // Note 36 has hits at 0 and 750
        // Detected at 700 is closer to 750 than 0
        const result = validateDrumHit(36, 700, lookup, 200);
        expect(result?.expectedTimeMs).toBe(750);
        expect(result?.offsetMs).toBe(-50);
      });
    });

    describe('tolerance window', () => {
      it('respects custom tolerance window', () => {
        const result = validateDrumHit(36, 250, lookup, 100); // 250ms away from nearest
        expect(result?.classification).toBe('violation');
      });

      it('uses default 150ms tolerance when not specified', () => {
        const result = validateDrumHit(36, 140, lookup); // 140ms from 0, within default tolerance
        expect(result?.classification).toBe('late'); // offset=140ms > HIT_PERFECT_THRESHOLD_MS
      });
    });

    describe('return value', () => {
      it('returns validation object with all required fields', () => {
        const result = validateDrumHit(36, 50, lookup, 150);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('expectedNote');
        expect(result).toHaveProperty('expectedTimeMs');
        expect(result).toHaveProperty('detectedTimeMs');
        expect(result).toHaveProperty('offsetMs');
        expect(result).toHaveProperty('classification');
      });

      it('always returns non-null result (no violation returns null)', () => {
        const result = validateDrumHit(49, 100, lookup, 150);
        expect(result).not.toBeNull();
      });
    });

    describe('Hit Classification Fix (spec 01-fix-hit-classification)', () => {
      // Acceptance Criterion 1: exact hit within ±20ms
      it('classifies exact hit at expected time as "hit" (offsetMs = 0)', () => {
        const result = validateDrumHit(36, 500, { 36: [500] }, 150);
        expect(result?.classification).toBe('hit');
        expect(result?.offsetMs).toBe(0);
      });

      // Acceptance Criterion 2: hit within ±20ms threshold (positive offset)
      it('classifies hit +15ms from expected as "hit" (offsetMs = +15)', () => {
        const result = validateDrumHit(36, 515, { 36: [500] }, 150);
        expect(result?.classification).toBe('hit');
        expect(result?.offsetMs).toBe(15);
      });

      // Acceptance Criterion 3: hit within ±20ms threshold (negative offset)
      it('classifies hit -15ms from expected as "hit" (offsetMs = -15)', () => {
        const result = validateDrumHit(36, 485, { 36: [500] }, 150);
        expect(result?.classification).toBe('hit');
        expect(result?.offsetMs).toBe(-15);
      });

      // Acceptance Criterion 4: late hit outside ±20ms threshold
      it('classifies hit +30ms from expected as "late" (offsetMs = +30)', () => {
        const result = validateDrumHit(36, 530, { 36: [500] }, 150);
        expect(result?.classification).toBe('late');
        expect(result?.offsetMs).toBe(30);
      });

      // Acceptance Criterion 5: early hit outside ±20ms threshold
      it('classifies hit -30ms from expected as "early" (offsetMs = -30)', () => {
        const result = validateDrumHit(36, 470, { 36: [500] }, 150);
        expect(result?.classification).toBe('early');
        expect(result?.offsetMs).toBe(-30);
      });

      // Acceptance Criterion 6: exact hit on second expected timestamp
      // This was broken when hitIndex === 0 was used for classification
      it('classifies exact hit on second expected timestamp as "hit" (second occurrence)', () => {
        const result = validateDrumHit(36, 1000, { 36: [500, 1000] }, 150);
        expect(result?.classification).toBe('hit');
        expect(result?.offsetMs).toBe(0);
        expect(result?.expectedTimeMs).toBe(1000);
      });

      // Acceptance Criterion 7: early hit on second expected timestamp
      // This was broken when hitIndex !== 0 was not properly handled
      it('classifies early hit on second expected timestamp as "early" (second occurrence, offsetMs = -30)', () => {
        const result = validateDrumHit(36, 970, { 36: [500, 1000] }, 150);
        expect(result?.classification).toBe('early');
        expect(result?.offsetMs).toBe(-30);
        expect(result?.expectedTimeMs).toBe(1000);
      });

      // Acceptance Criterion 8: late hit on second expected timestamp
      // This was broken when hitIndex !== 0 was not properly handled
      it('classifies late hit on second expected timestamp as "late" (second occurrence, offsetMs = +40)', () => {
        const result = validateDrumHit(36, 1040, { 36: [500, 1000] }, 150);
        expect(result?.classification).toBe('late');
        expect(result?.offsetMs).toBe(40);
        expect(result?.expectedTimeMs).toBe(1000);
      });

      // Acceptance Criterion 9: violation when note not in lookup
      it('classifies hit on unmapped note as "violation"', () => {
        const result = validateDrumHit(36, 500, { 42: [500] }, 150);
        expect(result?.classification).toBe('violation');
      });

      // Acceptance Criterion 10: verify constant is exported
      it('exports HIT_PERFECT_THRESHOLD_MS constant with value 20', () => {
        expect(HIT_PERFECT_THRESHOLD_MS).toBe(20);
      });

      // Edge case: boundary at +20ms (inclusive)
      it('classifies +20ms offset as "hit" (boundary, inclusive)', () => {
        const result = validateDrumHit(36, 520, { 36: [500] }, 150);
        expect(result?.classification).toBe('hit');
        expect(result?.offsetMs).toBe(20);
      });

      // Edge case: boundary at -20ms (inclusive)
      it('classifies -20ms offset as "hit" (boundary, inclusive)', () => {
        const result = validateDrumHit(36, 480, { 36: [500] }, 150);
        expect(result?.classification).toBe('hit');
        expect(result?.offsetMs).toBe(-20);
      });

      // Edge case: just outside boundary at +21ms
      it('classifies +21ms offset as "late" (just outside boundary)', () => {
        const result = validateDrumHit(36, 521, { 36: [500] }, 150);
        expect(result?.classification).toBe('late');
        expect(result?.offsetMs).toBe(21);
      });

      // Edge case: just outside boundary at -21ms
      it('classifies -21ms offset as "early" (just outside boundary)', () => {
        const result = validateDrumHit(36, 479, { 36: [500] }, 150);
        expect(result?.classification).toBe('early');
        expect(result?.offsetMs).toBe(-21);
      });

      // Edge case: third timestamp in array
      it('classifies exact hit on third expected timestamp as "hit"', () => {
        const result = validateDrumHit(36, 1500, { 36: [500, 1000, 1500] }, 150);
        expect(result?.classification).toBe('hit');
        expect(result?.offsetMs).toBe(0);
        expect(result?.expectedTimeMs).toBe(1500);
      });

      // Edge case: selects nearest timestamp when multiple in lookup within tolerance
      it('selects nearest timestamp when detecting between two expected hits (within tolerance)', () => {
        // 650 is 150ms from 500 and 350ms from 1000, so should pick 500 (within tolerance)
        const result = validateDrumHit(36, 650, { 36: [500, 1000] }, 150);
        expect(result?.classification).toBe('late');
        expect(result?.offsetMs).toBe(150); // offset from nearest hit at 500
        expect(result?.expectedTimeMs).toBe(500);
      });
    });
  });
});
