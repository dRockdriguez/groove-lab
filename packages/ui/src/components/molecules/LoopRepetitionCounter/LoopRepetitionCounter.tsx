import React from 'react';

export interface LoopRepetitionCounterProps {
  /** Current repetition count (0-based; displayed as 1-based). */
  currentRepetition: number;
  /** Total repetitions or 'infinite' for infinite looping. */
  totalRepetitions: number | 'infinite';
  className?: string;
}

export const LoopRepetitionCounter: React.FC<LoopRepetitionCounterProps> = ({
  currentRepetition,
  totalRepetitions,
  className = '',
}) => {
  const displayCurrent = currentRepetition + 1;
  const displayTotal = totalRepetitions === 'infinite' ? '∞' : String(totalRepetitions);

  return (
    <div
      className={[
        'flex items-center justify-center px-4 py-2',
        'bg-blue-50 dark:bg-blue-950',
        'border border-blue-200 dark:border-blue-800',
        'rounded-md',
        className,
      ].join(' ')}
      role="status"
      aria-live="polite"
      aria-label={`Loop repetition ${displayCurrent} of ${displayTotal}`}
    >
      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
        Repeat {displayCurrent} / {displayTotal}
      </span>
    </div>
  );
};
