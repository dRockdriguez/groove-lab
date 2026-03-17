import React from 'react';
import type { PlaybackState } from '@groovelab/types';
import { formatDuration } from '@groovelab/utils';
import { PlaybackButton } from '../../atoms/PlaybackButton';

export interface PlaybackControlsProps {
  state: PlaybackState;
  currentTimeMs: number;
  durationMs: number;
  onTogglePlay: () => void;
  onSeek: (timeMs: number) => void;
  /** Current BPM used to calculate metronome marker positions. */
  bpm?: number;
  /** When true, renders metronome beat markers on the seek bar. */
  metronomeEnabled?: boolean;
  className?: string;
}

interface BeatMarker {
  percent: number;
  isDownbeat: boolean;
}

function calculateBeatMarkers(bpm: number | undefined, durationMs: number): BeatMarker[] {
  if (!bpm || bpm <= 0 || durationMs <= 0) return [];
  const beatIntervalMs = 60000 / bpm;
  const numBeats = Math.floor(durationMs / beatIntervalMs);
  const displayBeats = Math.min(numBeats, 1000);
  return Array.from({ length: displayBeats }, (_, i) => ({
    percent: (i * beatIntervalMs / durationMs) * 100,
    isDownbeat: i % 4 === 0,
  }));
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  state,
  currentTimeMs,
  durationMs,
  onTogglePlay,
  onSeek,
  bpm,
  metronomeEnabled = false,
  className = '',
}) => {
  const beatMarkers = React.useMemo(
    () => (metronomeEnabled ? calculateBeatMarkers(bpm, durationMs) : []),
    [bpm, durationMs, metronomeEnabled]
  );

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSeek(Number(e.target.value));
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Home') {
      e.preventDefault();
      onSeek(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onSeek(durationMs);
    }
  };

  return (
    <div
      className={[
        'flex items-center gap-4 w-full',
        className,
      ].join(' ')}
    >
      <PlaybackButton state={state} onToggle={onTogglePlay} />

      <div className="flex items-center gap-2 flex-1">
        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 shrink-0">
          {formatDuration(currentTimeMs)}
        </span>

        <div className="relative flex-1">
          {beatMarkers.length > 0 && (
            <div
              role="img"
              aria-label={`Metronome beats at ${beatMarkers.length} intervals across the timeline`}
              className="absolute inset-0 z-10"
              style={{ pointerEvents: 'none' }}
            >
              {beatMarkers.map((beat, i) => (
                <div
                  key={i}
                  data-testid={beat.isDownbeat ? 'metronome-downbeat-marker' : 'metronome-beat-marker'}
                  aria-hidden="true"
                  className="absolute top-1/2"
                  style={{
                    left: `${beat.percent}%`,
                    width: beat.isDownbeat ? '3px' : '2px',
                    height: beat.isDownbeat ? '10px' : '6px',
                    backgroundColor: '#EF4444',
                    opacity: beat.isDownbeat ? 1 : 0.7,
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                  }}
                />
              ))}
            </div>
          )}

          <input
            type="range"
            role="slider"
            aria-label="Seek playback position"
            aria-valuemin={0}
            aria-valuemax={durationMs}
            aria-valuenow={currentTimeMs}
            min={0}
            max={durationMs}
            value={currentTimeMs}
            onChange={handleSeekChange}
            onKeyDown={handleSliderKeyDown}
            className="w-full h-2 accent-green-600 cursor-pointer"
          />
        </div>

        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 shrink-0">
          {formatDuration(durationMs)}
        </span>
      </div>
    </div>
  );
};
