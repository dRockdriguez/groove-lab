import React, { useState, useEffect, useRef, useCallback } from 'react';
import { bpmToInterval } from '@groovelab/utils';

export interface MetronomeControlProps {
  /** Initial BPM value (default 120). Clamped to 20–300. */
  initialBpm?: number;
  /** Original exercise BPM (used to sync metronome clicks). Defaults to initialBpm if not provided. */
  originalBpm?: number;
  /** Whether the exercise is currently playing; metronome clicks only when true. */
  isPlaying?: boolean;
  /** Current playback time in milliseconds; used to synchronize metronome clicks with audio. */
  currentTimeMs?: number;
  /** Callback when BPM changes; used to update audio playback speed. */
  onBpmChange?: (bpm: number) => void;
  /** Callback when metronome is toggled on or off. */
  onToggle?: (enabled: boolean) => void;
  className?: string;
}

const MIN_BPM = 40;
const MAX_BPM = 300;
const DEFAULT_BPM = 120;

export const MetronomeControl: React.FC<MetronomeControlProps> = ({
  initialBpm = DEFAULT_BPM,
  originalBpm,
  isPlaying = false,
  currentTimeMs = 0,
  onBpmChange,
  onToggle,
  className = '',
}) => {
  const [bpm, setBpm] = useState(Math.max(MIN_BPM, Math.min(MAX_BPM, initialBpm)));
  const [isEnabled, setIsEnabled] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  // Use originalBpm for click timing (default to initialBpm if not provided)
  const clickBpm = originalBpm ?? initialBpm ?? DEFAULT_BPM;

  // Track previous bpm to announce changes only (not on mount).
  const prevBpmRef = useRef<number | null>(null);
  useEffect(() => {
    if (prevBpmRef.current !== null && prevBpmRef.current !== bpm) {
      setAnnouncement(`BPM: ${bpm}`);
      onBpmChange?.(bpm);
    }
    prevBpmRef.current = bpm;
  }, [bpm, onBpmChange]);

  // Track the last time a metronome click was scheduled to ensure synchronized beats.
  const lastClickTimeRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const audioContextRef = useRef<any>(null); // AudioContext | null
  const beatCountRef = useRef(0);

  const increaseBpm = useCallback(() => {
    if (!isPlaying) {
      setBpm(prev => Math.min(prev + 1, MAX_BPM));
    }
  }, [isPlaying]);

  const decreaseBpm = useCallback(() => {
    if (!isPlaying) {
      setBpm(prev => Math.max(prev - 1, MIN_BPM));
    }
  }, [isPlaying]);

  const handleBpmInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPlaying) {
      const newValue = parseInt(e.target.value, 10);
      if (!isNaN(newValue)) {
        setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, newValue)));
      }
    }
  }, [isPlaying]);

  const handleBpmSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPlaying) {
      setBpm(parseInt(e.target.value, 10));
    }
  }, [isPlaying]);

  const toggleMetronome = useCallback(() => {
    const next = !isEnabled;
    setIsEnabled(next);
    onToggle?.(next);
  }, [isEnabled, onToggle]);

  // Keyboard shortcuts: = to increment, - to decrement (disabled during playback).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept when typing in an input / textarea or when playing.
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (isPlaying) return;

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
  }, [increaseBpm, decreaseBpm, isPlaying]);

  // Initialize AudioContext once when metronome becomes enabled.
  // Close it when disabled or component unmounts.
  useEffect(() => {
    if (!isEnabled) {
      // Clean up AudioContext when metronome is disabled.
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioContextClass: typeof AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
      lastClickTimeRef.current = 0;
      beatCountRef.current = 0;
    }

    return () => {
      // Cleanup on unmount.
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isEnabled]);

  // Cleanup AudioContext on component unmount.
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Track if we just started playing to schedule initial click.
  const prevIsPlayingRef = useRef(false);
  // Track previous time to detect loop jumps (backward time jumps)
  const prevTimeRef = useRef(0);

  // Schedule metronome clicks synchronized with audio playback time.
  useEffect(() => {
    if (!isEnabled || !isPlaying || !audioContextRef.current) {
      prevIsPlayingRef.current = false;
      return;
    }

    const ctx = audioContextRef.current;
    // Use clickBpm (original exercise BPM) to sync clicks with visual markers
    const intervalMs = bpmToInterval(clickBpm);
    const justStartedPlaying = !prevIsPlayingRef.current && isPlaying;
    prevIsPlayingRef.current = true;

    // Detect loop jump: backward time jump > 500ms indicates loop has occurred
    const isLoopJump = currentTimeMs < prevTimeRef.current && (prevTimeRef.current - currentTimeMs) > 500;
    prevTimeRef.current = currentTimeMs;

    // On first play, significant time jump, or loop jump, reset sync point.
    if (justStartedPlaying || currentTimeMs === 0 || isLoopJump) {
      lastClickTimeRef.current = 0;
      beatCountRef.current = 0;

      // Schedule initial click immediately when playback starts.
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = 1200; // First beat is downbeat
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);

      lastClickTimeRef.current = 0;
      beatCountRef.current = 1;
    }

    // Check if it's time to play the next click based on audio time, not wallclock time.
    const timeSinceLastClick = currentTimeMs - lastClickTimeRef.current;
    if (!justStartedPlaying && timeSinceLastClick >= intervalMs) {
      // Schedule a click at the current audio time.
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // First beat of each measure is higher pitched (downbeat).
      const beatCount = beatCountRef.current;
      osc.frequency.value = beatCount % 4 === 0 ? 1200 : 1000;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);

      // Update sync state.
      lastClickTimeRef.current = currentTimeMs;
      beatCountRef.current += 1;
    }
  }, [clickBpm, isEnabled, isPlaying, currentTimeMs]);

  return (
    <div
      className={['flex flex-col gap-3', className].join(' ')}
      data-testid="metronome-control"
    >
      {/* BPM Slider */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          role="slider"
          aria-label="BPM slider"
          aria-valuemin={MIN_BPM}
          aria-valuemax={MAX_BPM}
          aria-valuenow={bpm}
          min={MIN_BPM}
          max={MAX_BPM}
          value={bpm}
          onChange={handleBpmSliderChange}
          disabled={isPlaying}
          className="flex-1 h-8 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-center gap-2">
        {/* BPM numeric input — editable and labeled via aria-label to avoid duplicate
            visible "BPM" text nodes that would break getByText(/bpm/i) queries
            in other components on the page. */}
        <input
          id="bpm-input"
          type="number"
          value={bpm}
          onChange={handleBpmInputChange}
          min={MIN_BPM}
          max={MAX_BPM}
          disabled={isPlaying}
          aria-label="BPM"
          className="w-16 text-center font-mono text-sm border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        />

        <button
          type="button"
          aria-label="Decrease BPM"
          onClick={decreaseBpm}
          disabled={bpm <= MIN_BPM || isPlaying}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-base font-bold hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          −
        </button>

        <button
          type="button"
          aria-label="Increase BPM"
          onClick={increaseBpm}
          disabled={bpm >= MAX_BPM || isPlaying}
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
      </div>

      {/* Screen-reader live region for BPM change announcements. */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </div>
  );
};
