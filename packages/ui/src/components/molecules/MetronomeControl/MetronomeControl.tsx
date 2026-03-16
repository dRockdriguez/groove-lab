import React, { useState, useEffect, useRef, useCallback } from 'react';
import { bpmToInterval } from '@groovelab/utils';

export interface MetronomeControlProps {
  /** Initial BPM value (default 120). Clamped to 20–300. */
  initialBpm?: number;
  /** Whether the exercise is currently playing; metronome clicks only when true. */
  isPlaying?: boolean;
  /** Callback when BPM changes; used to update audio playback speed. */
  onBpmChange?: (bpm: number) => void;
  className?: string;
}

const MIN_BPM = 20;
const MAX_BPM = 300;
const DEFAULT_BPM = 120;

export const MetronomeControl: React.FC<MetronomeControlProps> = ({
  initialBpm = DEFAULT_BPM,
  isPlaying = false,
  onBpmChange,
  className = '',
}) => {
  const [bpm, setBpm] = useState(Math.max(MIN_BPM, Math.min(MAX_BPM, initialBpm)));
  const [isEnabled, setIsEnabled] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Track previous bpm to announce changes only (not on mount).
  const prevBpmRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevBpmRef.current !== null && prevBpmRef.current !== bpm) {
      setAnnouncement(`BPM: ${bpm}`);
      onBpmChange?.(bpm);
    }
    prevBpmRef.current = bpm;
  }, [bpm, onBpmChange]);

  const increaseBpm = useCallback(() => {
    setBpm(prev => Math.min(prev + 1, MAX_BPM));
  }, []);

  const decreaseBpm = useCallback(() => {
    setBpm(prev => Math.max(prev - 1, MIN_BPM));
  }, []);

  const toggleMetronome = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  // Keyboard shortcuts: = to increment, - to decrement.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept when typing in an input / textarea.
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === '=') {
        e.preventDefault();
        increaseBpm();
      } else if (e.key === '-') {
        e.preventDefault();
        decreaseBpm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [increaseBpm, decreaseBpm]);

  // Web Audio API metronome: clicks fire only when enabled AND playing.
  useEffect(() => {
    if (!isEnabled || !isPlaying) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass: typeof AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const intervalMs = bpmToInterval(bpm);
    let beatCount = 0;

    const scheduleClick = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // First beat of each measure is higher pitched (downbeat).
      osc.frequency.value = beatCount % 4 === 0 ? 1200 : 1000;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);

      beatCount++;
    };

    scheduleClick();
    const intervalId = setInterval(scheduleClick, intervalMs);

    return () => {
      clearInterval(intervalId);
      void ctx.close();
    };
  }, [bpm, isEnabled, isPlaying]);

  return (
    <div
      className={['flex items-center gap-2', className].join(' ')}
      data-testid="metronome-control"
    >
      {/* BPM numeric display — labeled via aria-label to avoid duplicate
          visible "BPM" text nodes that would break getByText(/bpm/i) queries
          in other components on the page. */}
      <input
        id="bpm-input"
        type="number"
        readOnly
        value={bpm}
        min={MIN_BPM}
        max={MAX_BPM}
        aria-label="BPM"
        className="w-14 text-center font-mono text-sm border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
      />

      <button
        type="button"
        aria-label="Decrease BPM"
        onClick={decreaseBpm}
        disabled={bpm <= MIN_BPM}
        className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-base font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        −
      </button>

      <button
        type="button"
        aria-label="Increase BPM"
        onClick={increaseBpm}
        disabled={bpm >= MAX_BPM}
        className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-base font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        +
      </button>

      <button
        type="button"
        aria-label="Toggle metronome"
        aria-pressed={isEnabled}
        onClick={toggleMetronome}
        className={[
          'px-2 py-0.5 rounded text-xs font-medium border transition-colors',
          isEnabled
            ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700',
        ].join(' ')}
      >
        {isEnabled ? 'On' : 'Off'}
      </button>

      {/* Screen-reader live region for BPM change announcements. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
};
