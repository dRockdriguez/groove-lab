import React from 'react';
import type { DrumHitValidation } from '@groovelab/utils';

export interface DrumHitFeedbackProps {
  /** All validated hits so far */
  validatedHits: DrumHitValidation[];
  /** Total expected notes in the exercise (for accuracy calculation) */
  totalExpectedHits: number;
  /** Whether playback is currently active */
  isPlaying: boolean;
  className?: string;
}

export const DrumHitFeedback: React.FC<DrumHitFeedbackProps> = ({
  validatedHits,
  totalExpectedHits,
  isPlaying,
  className = '',
}) => {
  // Calculate statistics
  const correctHits = validatedHits.filter((h) => h.classification === 'hit').length;
  const violations = validatedHits.filter((h) => h.classification === 'violation').length;
  const totalAttempts = validatedHits.length;

  const accuracyPercent =
    totalAttempts > 0 ? Math.round((correctHits / totalAttempts) * 100) : 0;

  // Average timing offset for hits only (exclude violations)
  const hitsWithOffset = validatedHits.filter(
    (h) => h.classification === 'hit' || h.classification === 'early' || h.classification === 'late'
  );
  const averageOffsetMs =
    hitsWithOffset.length > 0
      ? Math.round(hitsWithOffset.reduce((sum, h) => sum + h.offsetMs, 0) / hitsWithOffset.length)
      : 0;

  // Most recent hit for visual feedback
  const mostRecentHit = validatedHits[validatedHits.length - 1];
  const mostRecentClassification = mostRecentHit?.classification ?? null;

  return (
    <div
      className={[
        'w-full bg-gray-100 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-600 p-4',
        className,
      ].join(' ')}
    >
      {/* Most recent hit visual feedback */}
      {isPlaying && mostRecentClassification && (
        <div
          className={[
            'mb-4 px-3 py-2 rounded text-center text-sm font-medium transition-colors',
            mostRecentClassification === 'hit'
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
              : mostRecentClassification === 'violation'
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                : mostRecentClassification === 'early'
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100'
                  : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100',
          ].join(' ')}
        >
          {mostRecentClassification === 'hit' && '✓ Hit!'}
          {mostRecentClassification === 'violation' && '✗ Violation'}
          {mostRecentClassification === 'early' && '⇠ Too early'}
          {mostRecentClassification === 'late' && '⇢ Too late'}
        </div>
      )}

      {/* Statistics grid */}
      <div className="grid grid-cols-4 gap-4">
        {/* Accuracy */}
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Accuracy
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {accuracyPercent}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
            {correctHits}/{totalAttempts}
          </div>
        </div>

        {/* Hits */}
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Hits
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
            {correctHits}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
            of {totalAttempts}
          </div>
        </div>

        {/* Timing Offset */}
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Avg Offset
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {averageOffsetMs >= 0 ? '+' : ''}{averageOffsetMs}ms
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
            {averageOffsetMs > 0 ? 'late' : 'early'}
          </div>
        </div>

        {/* Violations */}
        <div className="text-center">
          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
            Violations
          </div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
            {violations}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
            extra notes
          </div>
        </div>
      </div>
    </div>
  );
};
