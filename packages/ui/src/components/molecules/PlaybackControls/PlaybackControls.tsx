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
  className?: string;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  state,
  currentTimeMs,
  durationMs,
  onTogglePlay,
  onSeek,
  className = '',
}) => {
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
          className="flex-1 h-2 accent-green-600 cursor-pointer"
        />

        <span className="text-sm font-mono text-gray-600 dark:text-gray-400 shrink-0">
          {formatDuration(durationMs)}
        </span>
      </div>
    </div>
  );
};
