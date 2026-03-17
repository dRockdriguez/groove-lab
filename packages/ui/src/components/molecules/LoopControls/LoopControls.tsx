import React, { useState, useEffect, useCallback } from 'react';

export interface LoopControlsProps {
  loopStartMs: number;
  loopEndMs: number;
  isLoopActive: boolean;
  loopRepetitions: number | 'infinite';
  currentLoopRepetition: number;
  durationMs: number;
  onLoopStartChange: (ms: number) => void;
  onLoopEndChange: (ms: number) => void;
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

/** Parse mm:ss or plain ms string to milliseconds. Returns null if invalid. */
function parseMmSs(value: string): number | null {
  const trimmed = value.trim();
  // Try mm:ss format
  const colonMatch = trimmed.match(/^(\d+):(\d{2})$/);
  if (colonMatch) {
    const mins = parseInt(colonMatch[1], 10);
    const secs = parseInt(colonMatch[2], 10);
    if (secs >= 60) return null;
    return (mins * 60 + secs) * 1000;
  }
  // Try plain number (ms)
  const num = Number(trimmed);
  if (!Number.isNaN(num) && num >= 0) return Math.round(num);
  return null;
}

export const LoopControls: React.FC<LoopControlsProps> = ({
  loopStartMs,
  loopEndMs,
  isLoopActive,
  loopRepetitions,
  currentLoopRepetition,
  durationMs,
  onLoopStartChange,
  onLoopEndChange,
  onLoopToggle,
  onLoopRepetitionsChange,
  onLoopClear,
  className = '',
}) => {
  const [startInput, setStartInput] = useState(() => msToMmSs(loopStartMs));
  const [endInput, setEndInput] = useState(() => msToMmSs(loopEndMs));
  const [startError, setStartError] = useState(false);
  const [endError, setEndError] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const validate = useCallback((startMs: number, endMs: number): string => {
    if (startMs >= endMs) return 'Start must be before end';
    if (endMs - startMs < 500) return 'Minimum 500ms loop';
    return '';
  }, []);

  // Keep inputs in sync when props change externally (e.g., drag)
  useEffect(() => {
    setStartInput(msToMmSs(loopStartMs));
  }, [loopStartMs]);

  useEffect(() => {
    setEndInput(msToMmSs(loopEndMs));
  }, [loopEndMs]);

  // Validate on mount and when loop times change
  useEffect(() => {
    const err = validate(loopStartMs, loopEndMs);
    setValidationMessage(err);
  }, [loopStartMs, loopEndMs, validate]);

  const isRangeValid = loopStartMs < loopEndMs && loopEndMs - loopStartMs >= 500;

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setStartInput(val);
    const ms = parseMmSs(val);
    if (ms === null) {
      setStartError(true);
      setValidationMessage('Invalid time format');
      return;
    }
    const clamped = Math.max(0, Math.min(ms, durationMs));
    const err = validate(clamped, loopEndMs);
    setStartError(!!err);
    setValidationMessage(err);
    if (!err) onLoopStartChange(clamped);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEndInput(val);
    const ms = parseMmSs(val);
    if (ms === null) {
      setEndError(true);
      setValidationMessage('Invalid time format');
      return;
    }
    const clamped = Math.max(0, Math.min(ms, durationMs));
    const err = validate(loopStartMs, clamped);
    setEndError(!!err);
    setValidationMessage(err);
    if (!err) onLoopEndChange(clamped);
  };

  const handleStartSpinner = (delta: number, shift: boolean) => {
    const step = shift ? 1000 : 100;
    const newMs = Math.max(0, Math.min(durationMs, loopStartMs + delta * step));
    const err = validate(newMs, loopEndMs);
    setStartError(!!err);
    setValidationMessage(err);
    if (!err) {
      onLoopStartChange(newMs);
      setStartInput(msToMmSs(newMs));
    }
  };

  const handleEndSpinner = (delta: number, shift: boolean) => {
    const step = shift ? 1000 : 100;
    const newMs = Math.max(0, Math.min(durationMs, loopEndMs + delta * step));
    const err = validate(loopStartMs, newMs);
    setEndError(!!err);
    setValidationMessage(err);
    if (!err) {
      onLoopEndChange(newMs);
      setEndInput(msToMmSs(newMs));
    }
  };

  const handleStartKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleStartSpinner(1, e.shiftKey);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleStartSpinner(-1, e.shiftKey);
    }
  };

  const handleEndKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleEndSpinner(1, e.shiftKey);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleEndSpinner(-1, e.shiftKey);
    }
  };

  const handleRepetitionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!Number.isNaN(val) && val >= 1 && val <= 999) {
      onLoopRepetitionsChange(val);
    }
  };

  const handleInfiniteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onLoopRepetitionsChange('infinite');
    } else {
      onLoopRepetitionsChange(1);
    }
  };

  const isInfinite = loopRepetitions === 'infinite';
  const repetitionCount = isInfinite ? 0 : (loopRepetitions as number);

  // Repetition counter text
  const repetitionCounterText = isLoopActive
    ? isInfinite
      ? `Repeat ${currentLoopRepetition} / ∞`
      : `Repeat ${currentLoopRepetition} of ${loopRepetitions}`
    : null;

  return (
    <div
      className={['flex flex-col gap-2 w-full', className].join(' ')}
      aria-label="Loop controls"
    >
      {/* Row 1: Start and End inputs */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Start input */}
        <div className="flex items-center gap-1">
          <label
            htmlFor="loop-start-input"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0"
          >
            Start:
          </label>
          <div className="flex items-center">
            <input
              id="loop-start-input"
              type="text"
              aria-label="Loop start time, mm:ss format"
              value={startInput}
              onChange={handleStartChange}
              onKeyDown={handleStartKeyDown}
              className={[
                'w-16 px-2 py-1 text-sm border rounded font-mono',
                startError
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              ].join(' ')}
            />
            <div className="flex flex-col ml-0.5">
              <button
                type="button"
                aria-label="Increase loop start by 100ms"
                onClick={(e) => handleStartSpinner(1, e.shiftKey)}
                className="text-xs leading-none px-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Decrease loop start by 100ms"
                onClick={(e) => handleStartSpinner(-1, e.shiftKey)}
                className="text-xs leading-none px-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ↓
              </button>
            </div>
          </div>
        </div>

        {/* End input */}
        <div className="flex items-center gap-1">
          <label
            htmlFor="loop-end-input"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0"
          >
            End:
          </label>
          <div className="flex items-center">
            <input
              id="loop-end-input"
              type="text"
              aria-label="Loop end time, mm:ss format"
              value={endInput}
              onChange={handleEndChange}
              onKeyDown={handleEndKeyDown}
              className={[
                'w-16 px-2 py-1 text-sm border rounded font-mono',
                endError
                  ? 'border-red-500 dark:border-red-400'
                  : 'border-gray-300 dark:border-gray-600',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              ].join(' ')}
            />
            <div className="flex flex-col ml-0.5">
              <button
                type="button"
                aria-label="Increase loop end by 100ms"
                onClick={(e) => handleEndSpinner(1, e.shiftKey)}
                className="text-xs leading-none px-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label="Decrease loop end by 100ms"
                onClick={(e) => handleEndSpinner(-1, e.shiftKey)}
                className="text-xs leading-none px-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ↓
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Repeat + Infinite + Toggle + Clear */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Repetitions input */}
        <div className="flex items-center gap-1">
          <label
            htmlFor="loop-repetitions-input"
            className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0"
          >
            Repeat:
          </label>
          <input
            id="loop-repetitions-input"
            type="number"
            aria-label="Loop repetitions, 1 to 999 or infinite"
            min={1}
            max={999}
            value={isInfinite ? '' : repetitionCount}
            disabled={isInfinite}
            onChange={handleRepetitionsChange}
            className={[
              'w-16 px-2 py-1 text-sm border rounded border-gray-300 dark:border-gray-600',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
              isInfinite ? 'opacity-50' : '',
            ].join(' ')}
          />
        </div>

        {/* Infinite toggle */}
        <label className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={isInfinite}
            onChange={handleInfiniteChange}
            aria-label="Loop infinite"
            className="rounded border-gray-300"
          />
          ∞ Infinite
        </label>

        {/* Enable/Disable Loop toggle */}
        <button
          type="button"
          aria-pressed={isLoopActive}
          disabled={!isRangeValid}
          onClick={() => onLoopToggle(!isLoopActive)}
          className={[
            'px-3 py-1 text-sm font-medium rounded',
            isLoopActive
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200',
            !isRangeValid ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {isLoopActive ? 'Disable Loop' : 'Enable Loop'}
        </button>

        {/* Clear button */}
        <button
          type="button"
          aria-label="Clear loop boundaries and reset"
          onClick={onLoopClear}
          className="px-3 py-1 text-sm font-medium rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          Clear
        </button>
      </div>

      {/* Validation error */}
      {validationMessage && (
        <div
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          className="text-xs text-red-600 dark:text-red-400"
        >
          {validationMessage}
        </div>
      )}

      {/* Repetition counter (read-only during playback) */}
      {repetitionCounterText && (
        <div
          aria-live="polite"
          className="text-xs text-gray-500 dark:text-gray-400"
        >
          {repetitionCounterText}
        </div>
      )}
    </div>
  );
};
