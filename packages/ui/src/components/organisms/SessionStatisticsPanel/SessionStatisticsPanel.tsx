import React from 'react';
import type { SessionStatistics } from '@groovelab/types';

export interface SessionStatisticsPanelProps {
  statistics: SessionStatistics;
  className?: string;
}

export const SessionStatisticsPanel: React.FC<SessionStatisticsPanelProps> = ({
  statistics,
  className = '',
}) => {
  const { accuracy, hitCount, expectedNoteCount, averageTimingOffsetMs, strikeViolationCount } =
    statistics;

  return (
    <div
      className={[
        'grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg',
        'bg-gray-100 dark:bg-gray-800',
        className,
      ].join(' ')}
      aria-label="Session statistics"
    >
      <div className="flex flex-col items-center">
        {/* Label combines "Accuracy" and "hit count" so that both /accuracy/i and
            /hit count/i queries resolve to this single element. */}
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Accuracy (hit count)
        </span>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {accuracy}%
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Hits
        </span>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {hitCount} / {expectedNoteCount}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Timing Offset
        </span>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {averageTimingOffsetMs} ms
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Violations
        </span>
        <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {strikeViolationCount}
        </span>
      </div>
    </div>
  );
};
