import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DrumHitFeedback } from './DrumHitFeedback';
import type { DrumHitValidation } from '@groovelab/utils';

describe('DrumHitFeedback', () => {
  const mockValidations: DrumHitValidation[] = [
    {
      expectedNote: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 25,
      offsetMs: 25,
      classification: 'hit',
    },
    {
      expectedNote: 42,
      expectedTimeMs: 250,
      detectedTimeMs: 280,
      offsetMs: 30,
      classification: 'hit',
    },
    {
      expectedNote: 49,
      expectedTimeMs: 300,
      detectedTimeMs: 350,
      offsetMs: 0,
      classification: 'violation',
    },
  ];

  describe('Layout & Rendering', () => {
    it('renders the feedback container', () => {
      const { container } = render(
        <DrumHitFeedback validatedHits={[]} totalExpectedHits={10} isPlaying={true} />
      );
      expect(container.querySelector('[class*="bg-gray-100"]')).toBeTruthy();
    });

    it('renders statistics grid with 4 columns', () => {
      const { container } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      const grid = container.querySelector('[class*="grid-cols-4"]');
      expect(grid).toBeTruthy();
    });

    it('displays accuracy label', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('Accuracy')).toBeTruthy();
    });

    it('displays hits label', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('Hits')).toBeTruthy();
    });

    it('displays timing offset label', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('Avg Offset')).toBeTruthy();
    });

    it('displays violations label', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('Violations')).toBeTruthy();
    });
  });

  describe('Accuracy Calculation', () => {
    it('calculates accuracy as percentage of correct hits', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations} // 2 hits, 1 violation
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      // 2 correct hits out of 10 expected = 20%
      expect(getByText('20%')).toBeTruthy();
    });

    it('shows 0% accuracy when no hits', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={[]}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('0%')).toBeTruthy();
    });

    it('shows 100% accuracy when all hits are correct', () => {
      const allHits: DrumHitValidation[] = [
        { expectedNote: 36, expectedTimeMs: 0, detectedTimeMs: 10, offsetMs: 10, classification: 'hit' },
        { expectedNote: 42, expectedTimeMs: 250, detectedTimeMs: 255, offsetMs: 5, classification: 'hit' },
      ];
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={allHits}
          totalExpectedHits={2}
          isPlaying={true}
        />
      );
      expect(getByText('100%')).toBeTruthy();
    });

    it('renders 0% accuracy when totalExpectedHits is 0 (guards division by zero)', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={0}
          isPlaying={true}
        />
      );
      expect(getByText('0%')).toBeTruthy();
    });

    it('clamps accuracy to 100% when correctHits exceeds totalExpectedHits', () => {
      const twoHits: DrumHitValidation[] = [
        { expectedNote: 36, expectedTimeMs: 0, detectedTimeMs: 10, offsetMs: 10, classification: 'hit' },
        { expectedNote: 42, expectedTimeMs: 250, detectedTimeMs: 255, offsetMs: 5, classification: 'hit' },
      ];
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={twoHits}
          totalExpectedHits={1}
          isPlaying={true}
        />
      );
      // 2 correct hits out of 1 expected = 200%, but clamped to 100%
      expect(getByText('100%')).toBeTruthy();
    });

    it('uses totalExpectedHits as denominator in sub-label (not totalAttempts)', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations} // 3 total attempts (2 hits, 1 violation)
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      // Sub-label should show 2/10 (not 2/3)
      expect(getByText('2/10')).toBeTruthy();
    });

    it('displays accuracy sub-label with correct format when totalExpectedHits varies', () => {
      const singleHit: DrumHitValidation[] = [
        { expectedNote: 36, expectedTimeMs: 0, detectedTimeMs: 10, offsetMs: 10, classification: 'hit' },
      ];
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={singleHit}
          totalExpectedHits={20}
          isPlaying={true}
        />
      );
      // 1 hit out of 20 expected should show "1/20" sub-label
      expect(getByText('1/20')).toBeTruthy();
    });
  });

  describe('Hits Display', () => {
    it('displays correct hit count', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      // 2 hits, 1 violation = 3 attempts
      expect(getByText('2')).toBeTruthy(); // hits
      expect(getByText('of 3')).toBeTruthy(); // total attempts
    });

    it('shows color difference for hit count', () => {
      const { container } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      const hitElements = container.querySelectorAll('[class*="text-green"]');
      expect(hitElements.length).toBeGreaterThan(0);
    });
  });

  describe('Violations Display', () => {
    it('counts and displays violations', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('1')).toBeTruthy(); // 1 violation
    });

    it('shows color difference for violations', () => {
      const { container } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      const violationElements = container.querySelectorAll('[class*="text-red"]');
      expect(violationElements.length).toBeGreaterThan(0);
    });
  });

  describe('Timing Offset', () => {
    it('calculates average offset for hits only', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      // 2 hits with offsets: 25ms and 30ms = average 27.5ms → rounds to 28ms
      expect(getByText('+28ms')).toBeTruthy();
    });

    it('shows negative offset when hits are early', () => {
      const earlyHits: DrumHitValidation[] = [
        { expectedNote: 36, expectedTimeMs: 100, detectedTimeMs: 50, offsetMs: -50, classification: 'hit' },
      ];
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={earlyHits}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('-50ms')).toBeTruthy();
    });

    it('shows "early" label for negative offset', () => {
      const earlyHits: DrumHitValidation[] = [
        { expectedNote: 36, expectedTimeMs: 100, detectedTimeMs: 50, offsetMs: -50, classification: 'hit' },
      ];
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={earlyHits}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('early')).toBeTruthy();
    });

    it('shows "late" label for positive offset', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('late')).toBeTruthy();
    });

    it('shows 0ms when no valid hits', () => {
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={[]}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('+0ms')).toBeTruthy();
    });
  });

  describe('Most Recent Hit Feedback', () => {
    it('does not show feedback banner for violation classification', () => {
      const { container, queryByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      // Most recent hit is a violation — should NOT show "✗ Violation"
      expect(queryByText('✗ Violation')).toBeFalsy();
      // The feedback banner (mb-4) should not exist when last hit is violation
      const feedbackBox = container.querySelector('[class*="mb-4"]');
      expect(feedbackBox).toBeFalsy();
    });

    it('hides recent hit feedback when not playing', () => {
      const { container, queryByText } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={false}
        />
      );
      // Look specifically for the feedback box (which has mb-4 class)
      const feedbackBox = container.querySelector('[class*="mb-4"]');
      expect(feedbackBox).toBeFalsy();
      // Also verify symbols don't appear outside of stats
      const hitSymbol = queryByText('✓');
      const violationSymbol = queryByText('✗');
      expect(hitSymbol).toBeFalsy();
      expect(violationSymbol).toBeFalsy();
    });

    it('shows "✓ Hit!" for successful hit', () => {
      const successHit: DrumHitValidation[] = [
        { expectedNote: 36, expectedTimeMs: 0, detectedTimeMs: 25, offsetMs: 25, classification: 'hit' },
      ];
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={successHit}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('✓ Hit!')).toBeTruthy();
    });

    it('shows "⇠ Too early" for early hits', () => {
      const earlyHit: DrumHitValidation[] = [
        { expectedNote: 36, expectedTimeMs: 100, detectedTimeMs: 50, offsetMs: -50, classification: 'early' },
      ];
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={earlyHit}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('⇠ Too early')).toBeTruthy();
    });

    it('shows "⇢ Too late" for late hits', () => {
      const lateHit: DrumHitValidation[] = [
        { expectedNote: 36, expectedTimeMs: 0, detectedTimeMs: 100, offsetMs: 100, classification: 'late' },
      ];
      const { getByText } = render(
        <DrumHitFeedback
          validatedHits={lateHit}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      expect(getByText('⇢ Too late')).toBeTruthy();
    });
  });

  describe('Visual Styling', () => {
    it('applies green styling to correct hits feedback', () => {
      const successHit: DrumHitValidation[] = [
        { expectedNote: 36, expectedTimeMs: 0, detectedTimeMs: 25, offsetMs: 25, classification: 'hit' },
      ];
      const { container } = render(
        <DrumHitFeedback
          validatedHits={successHit}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      const feedback = container.querySelector('[class*="bg-green"]');
      expect(feedback).toBeTruthy();
    });

    it('does not apply red styling to violation banner (banner hidden)', () => {
      const violation: DrumHitValidation[] = [
        { expectedNote: 49, expectedTimeMs: 300, detectedTimeMs: 350, offsetMs: 0, classification: 'violation' },
      ];
      const { container } = render(
        <DrumHitFeedback
          validatedHits={violation}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      // The banner itself should not appear for violations
      const feedbackBanner = container.querySelector('[class*="mb-4"][class*="bg-"]');
      expect(feedbackBanner).toBeFalsy();
      // But violations are still counted in the stats grid with red color
      const violationStat = container.querySelectorAll('[class*="text-red"]');
      expect(violationStat.length).toBeGreaterThan(0);
    });

    it('applies blue styling to timing offset stat', () => {
      const { container } = render(
        <DrumHitFeedback
          validatedHits={mockValidations}
          totalExpectedHits={10}
          isPlaying={true}
        />
      );
      const offsetElements = container.querySelectorAll('[class*="text-blue"]');
      expect(offsetElements.length).toBeGreaterThan(0);
    });
  });
});
