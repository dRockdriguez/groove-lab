import React from 'react';

export interface LoopControlsProps {
  loopStartMs: number; // Read-only display
  loopEndMs: number; // Read-only display
  isLoopActive: boolean;
  loopRepetitions: number | 'infinite';
  durationMs: number;
  onLoopToggle: (enabled: boolean) => void;
  onLoopRepetitionsChange: (count: number | 'infinite') => void;
  onLoopClear: () => void;
  className?: string;
}

/** Format milliseconds to mm:ss string */
function msToMmSs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export const LoopControls: React.FC<LoopControlsProps> = ({
  loopStartMs,
  loopEndMs,
  isLoopActive,
  loopRepetitions,
  durationMs,
  onLoopToggle,
  onLoopRepetitionsChange,
  onLoopClear,
  className = '',
}) => {
  const isLoopRegionSelected = loopStartMs < loopEndMs;

  const handleRepetitionsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'infinite') {
      onLoopRepetitionsChange('infinite');
    } else {
      const num = parseInt(val, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= 999) {
        onLoopRepetitionsChange(num);
      }
    }
  };

  const isInfinite = loopRepetitions === 'infinite';

  return (
    <div
      className={['flex flex-col gap-3 w-full', className].join(' ')}
      aria-label="Loop controls"
    >
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Loop Control
        </h3>
      </div>

      {/* Loop Status Display (only if loop region selected) */}
      {isLoopRegionSelected && (
        <div className="text-xs text-gray-600 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
          Loop: {msToMmSs(loopStartMs)}–{msToMmSs(loopEndMs)}
          {' • '}
          {isInfinite ? '∞ reps' : `${loopRepetitions}x`}
        </div>
      )}

      {/* Repetitions Selector */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="loop-reps-select"
          className="text-xs font-medium text-gray-700 dark:text-gray-300"
        >
          Repeat
        </label>
        <select
          id="loop-reps-select"
          value={isInfinite ? 'infinite' : loopRepetitions}
          onChange={handleRepetitionsChange}
          className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
          aria-label="Number of loop repetitions"
        >
          {[1, 2, 3, 5, 10, 25, 50, 100, 999].map((n) => (
            <option key={n} value={n}>
              {n}x
            </option>
          ))}
          <option value="infinite">∞ Infinite</option>
        </select>
      </div>

      {/* Toggle + Clear Buttons */}
      <div className="flex gap-2">
        {/* Toggle Button */}
        <button
          onClick={() => onLoopToggle(!isLoopActive)}
          disabled={!isLoopRegionSelected}
          aria-pressed={isLoopActive}
          aria-label={`Turn loop ${isLoopActive ? 'off' : 'on'}`}
          className={`
            flex-1 px-3 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm
            ${
              isLoopActive
                ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
            }
          `}
        >
          {isLoopActive ? '✓ Loop On' : 'Loop Off'}
        </button>

        {/* Clear Button */}
        <button
          onClick={onLoopClear}
          disabled={!isLoopRegionSelected}
          aria-label="Clear loop region"
          className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
