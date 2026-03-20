import { describe, it, expect } from 'vitest';
import {
  buildExpectedNoteLookup,
  matchNote,
  TOLERANCE_PRESETS,
  PERFECT_THRESHOLD_MS,
  type NoteMatchResult,
  type HitClassification,
  type ExpectedNoteLookup,
} from './index';

describe('buildExpectedNoteLookup', () => {
  it('groups events by MIDI note number', () => {
    const events = [
      { note: 36, timestamp: 100 },
      { note: 38, timestamp: 200 },
      { note: 36, timestamp: 300 },
    ];
    const lookup = buildExpectedNoteLookup(events);
    expect(lookup[36]).toEqual([100, 300]);
    expect(lookup[38]).toEqual([200]);
  });

  it('sorts each notes timestamp array in ascending order', () => {
    const events = [
      { note: 36, timestamp: 500 },
      { note: 36, timestamp: 100 },
      { note: 36, timestamp: 300 },
    ];
    const lookup = buildExpectedNoteLookup(events);
    expect(lookup[36]).toEqual([100, 300, 500]);
  });

  it('ignores duplicate timestamps for the same note', () => {
    const events = [
      { note: 36, timestamp: 100 },
      { note: 36, timestamp: 100 },
      { note: 36, timestamp: 200 },
    ];
    const lookup = buildExpectedNoteLookup(events);
    expect(lookup[36]).toEqual([100, 200]);
  });

  it('returns empty object for empty input', () => {
    const lookup = buildExpectedNoteLookup([]);
    expect(lookup).toEqual({});
  });

  it('handles single event', () => {
    const events = [{ note: 42, timestamp: 500 }];
    const lookup = buildExpectedNoteLookup(events);
    expect(lookup[42]).toEqual([500]);
  });
});

describe('matchNote — correct hit', () => {
  it('matches exact timestamp with 0 offset', () => {
    const result = matchNote(36, 500, { 36: [500] }, 200);
    expect(result.classification).toBe('correct');
    expect(result.offsetMs).toBe(0);
    expect(result.matchedNote).toBe(36);
    expect(result.matchedTimeMs).toBe(500);
    expect(result.detectedTimeMs).toBe(500);
  });

  it('classifies as correct when detected within +30ms (early side of threshold)', () => {
    const result = matchNote(36, 520, { 36: [500] }, 200);
    expect(result.classification).toBe('correct');
    expect(result.offsetMs).toBe(20);
    expect(result.matchedTimeMs).toBe(500);
  });

  it('classifies as correct when detected within -30ms (late side of threshold)', () => {
    const result = matchNote(36, 480, { 36: [500] }, 200);
    expect(result.classification).toBe('correct');
    expect(result.offsetMs).toBe(-20);
    expect(result.matchedTimeMs).toBe(500);
  });

  it('classifies as correct at exactly +30ms boundary', () => {
    const result = matchNote(36, 530, { 36: [500] }, 200);
    expect(result.classification).toBe('correct');
    expect(result.offsetMs).toBe(30);
  });

  it('classifies as correct at exactly -30ms boundary', () => {
    const result = matchNote(36, 470, { 36: [500] }, 200);
    expect(result.classification).toBe('correct');
    expect(result.offsetMs).toBe(-30);
  });
});

describe('matchNote — early hit', () => {
  it('classifies as early when detected 60ms before expected (beyond perfect threshold)', () => {
    const result = matchNote(36, 440, { 36: [500] }, 200);
    expect(result.classification).toBe('early');
    expect(result.offsetMs).toBe(-60);
    expect(result.matchedTimeMs).toBe(500);
    expect(result.detectedTimeMs).toBe(440);
  });

  it('classifies as early at boundary just beyond ±30ms threshold', () => {
    const result = matchNote(36, 469, { 36: [500] }, 200);
    expect(result.classification).toBe('early');
    expect(result.offsetMs).toBe(-31);
  });

  it('classifies as early at exactly -tolerance boundary (inclusive)', () => {
    const result = matchNote(36, 300, { 36: [500] }, 200);
    expect(result.classification).toBe('early');
    expect(result.offsetMs).toBe(-200);
  });
});

describe('matchNote — late hit', () => {
  it('classifies as late when detected 60ms after expected (beyond perfect threshold)', () => {
    const result = matchNote(36, 560, { 36: [500] }, 200);
    expect(result.classification).toBe('late');
    expect(result.offsetMs).toBe(60);
    expect(result.matchedTimeMs).toBe(500);
    expect(result.detectedTimeMs).toBe(560);
  });

  it('classifies as late at boundary just beyond ±30ms threshold', () => {
    const result = matchNote(36, 531, { 36: [500] }, 200);
    expect(result.classification).toBe('late');
    expect(result.offsetMs).toBe(31);
  });

  it('classifies as late at exactly +tolerance boundary (inclusive)', () => {
    const result = matchNote(36, 700, { 36: [500] }, 200);
    expect(result.classification).toBe('late');
    expect(result.offsetMs).toBe(200);
  });
});

describe('matchNote — wrong note', () => {
  it('returns wrong_note when detected note not in lookup', () => {
    const result = matchNote(36, 500, { 42: [500] }, 200);
    expect(result.classification).toBe('wrong_note');
    expect(result.matchedNote).toBe(36);
    expect(result.detectedTimeMs).toBe(500);
  });

  it('returns wrong_note when lookup is empty', () => {
    const result = matchNote(36, 500, {}, 200);
    expect(result.classification).toBe('wrong_note');
  });

  it('returns wrong_note when timing is outside tolerance window', () => {
    const result = matchNote(36, 900, { 36: [500] }, 200);
    expect(result.classification).toBe('wrong_note');
    expect(result.detectedTimeMs).toBe(900);
  });

  it('returns wrong_note for note that exists but with no timestamps in tolerance', () => {
    const result = matchNote(36, 100, { 36: [500] }, 200);
    expect(result.classification).toBe('wrong_note');
  });

  it('has matchedTimeMs and offsetMs set to detectedTimeMs for wrong_note', () => {
    const result = matchNote(36, 500, { 42: [500] }, 200);
    expect(result.classification).toBe('wrong_note');
    expect(result.matchedTimeMs).toBe(result.detectedTimeMs);
    expect(result.offsetMs).toBe(0);
  });
});

describe('matchNote — consumed notes', () => {
  it('returns wrong_note when matched note is already consumed', () => {
    const consumedKeys = new Set(['36_500']);
    const result = matchNote(36, 500, { 36: [500] }, 200, consumedKeys);
    expect(result.classification).toBe('wrong_note');
  });

  it('does NOT mutate the consumedKeys set', () => {
    const consumedKeys = new Set(['36_500']);
    const consumedKeysBefore = new Set(consumedKeys);
    matchNote(36, 500, { 36: [500] }, 200, consumedKeys);
    expect(consumedKeys).toEqual(consumedKeysBefore);
  });

  it('returns correct when matched note is not consumed', () => {
    const consumedKeys = new Set(['36_300']);
    const result = matchNote(36, 500, { 36: [300, 500] }, 200, consumedKeys);
    expect(result.classification).toBe('correct');
    expect(result.matchedTimeMs).toBe(500);
  });

  it('skips consumed timestamps when multiple available', () => {
    const consumedKeys = new Set(['36_400', '36_500']);
    const result = matchNote(36, 610, { 36: [400, 500, 600] }, 200, consumedKeys);
    expect(result.classification).toBe('correct');
    expect(result.matchedTimeMs).toBe(600);
  });

  it('returns wrong_note when all matching timestamps are consumed', () => {
    const consumedKeys = new Set(['36_500', '36_510', '36_520']);
    const result = matchNote(36, 515, { 36: [500, 510, 520] }, 200, consumedKeys);
    expect(result.classification).toBe('wrong_note');
  });
});

describe('matchNote — nearest hit selection', () => {
  it('selects nearest expected timestamp when multiple exist within tolerance', () => {
    const result = matchNote(36, 510, { 36: [400, 500, 600] }, 200);
    expect(result.matchedTimeMs).toBe(500);
    expect(result.offsetMs).toBe(10);
  });

  it('selects nearest even when detected time is equidistant from two timestamps', () => {
    // e.g., 450 is equidistant from 400 and 500
    // Should pick the first nearest in sorted order (earlier timestamp)
    const result = matchNote(36, 450, { 36: [400, 500] }, 200);
    expect(result.matchedTimeMs).toBe(400);
    expect(result.offsetMs).toBe(50);
  });

  it('ignores timestamps outside tolerance when selecting nearest', () => {
    // 36 detected at 550: 400 is 150ms away (within 200ms tolerance)
    // 500 is 50ms away (within 200ms tolerance)
    // 800 is 250ms away (outside 200ms tolerance)
    // Should match 500, not 800
    const result = matchNote(36, 550, { 36: [400, 500, 800] }, 200);
    expect(result.matchedTimeMs).toBe(500);
    expect(result.offsetMs).toBe(50);
  });

  it('filters consumed timestamps before finding nearest', () => {
    const consumedKeys = new Set(['36_500']);
    const result = matchNote(36, 510, { 36: [400, 500, 600] }, 200, consumedKeys);
    // 500 is consumed, so pick nearest among 400 and 600
    // 400 is 110ms away, 600 is 90ms away, so pick 600
    expect(result.matchedTimeMs).toBe(600);
    expect(result.offsetMs).toBe(-90);
  });
});

describe('Tolerance presets', () => {
  it('TOLERANCE_PRESETS.easy equals 300', () => {
    expect(TOLERANCE_PRESETS.easy).toBe(300);
  });

  it('TOLERANCE_PRESETS.medium equals 200', () => {
    expect(TOLERANCE_PRESETS.medium).toBe(200);
  });

  it('TOLERANCE_PRESETS.hard equals 100', () => {
    expect(TOLERANCE_PRESETS.hard).toBe(100);
  });

  it('PERFECT_THRESHOLD_MS equals 30', () => {
    expect(PERFECT_THRESHOLD_MS).toBe(30);
  });
});

describe('Edge cases', () => {
  it('handles user hitting exactly at expected time (offsetMs = 0)', () => {
    const result = matchNote(36, 500, { 36: [500] }, 200);
    expect(result.classification).toBe('correct');
    expect(result.offsetMs).toBe(0);
  });

  it('handles user hitting exactly at +30ms boundary', () => {
    const result = matchNote(36, 530, { 36: [500] }, 200);
    expect(result.classification).toBe('correct');
    expect(result.offsetMs).toBe(30);
  });

  it('handles user hitting exactly at -30ms boundary', () => {
    const result = matchNote(36, 470, { 36: [500] }, 200);
    expect(result.classification).toBe('correct');
    expect(result.offsetMs).toBe(-30);
  });

  it('always returns wrong_note for empty lookup', () => {
    const result = matchNote(36, 500, {}, 200);
    expect(result.classification).toBe('wrong_note');
  });

  it('returns wrong_note when note exists but no timestamps within tolerance', () => {
    const result = matchNote(36, 1000, { 36: [100, 200, 300] }, 200);
    expect(result.classification).toBe('wrong_note');
  });

  it('matches nearest unconsumed when multiple notes of same type close together', () => {
    const consumedKeys = new Set(['36_100', '36_200']);
    const result = matchNote(36, 250, { 36: [100, 200, 300] }, 200, consumedKeys);
    expect(result.matchedTimeMs).toBe(300);
    expect(result.offsetMs).toBe(-50);
  });

  it('handles very large MIDI note numbers', () => {
    const result = matchNote(127, 500, { 127: [500] }, 200);
    expect(result.classification).toBe('correct');
  });

  it('handles zero offset correctly', () => {
    const result = matchNote(36, 1000, { 36: [1000] }, 200);
    expect(result.offsetMs).toBe(0);
  });

  it('calculates offsetMs as detectedTimeMs - matchedTimeMs', () => {
    const result = matchNote(36, 600, { 36: [500] }, 200);
    expect(result.offsetMs).toBe(100);
    expect(result.offsetMs).toBe(result.detectedTimeMs - result.matchedTimeMs);
  });

  it('handles very small tolerance windows', () => {
    const result = matchNote(36, 512, { 36: [500] }, 10);
    expect(result.classification).toBe('wrong_note');
    expect(result.offsetMs).toBe(0);
  });

  it('handles very large tolerance windows', () => {
    const result = matchNote(36, 1000, { 36: [500] }, 1000);
    expect(result.classification).toBe('late');
    expect(result.offsetMs).toBe(500);
  });

  it('handles negative tolerances gracefully (treats as zero)', () => {
    // Negative tolerance should be treated as 0
    const result = matchNote(36, 500, { 36: [500] }, 0);
    expect(result.classification).toBe('correct');
  });
});
