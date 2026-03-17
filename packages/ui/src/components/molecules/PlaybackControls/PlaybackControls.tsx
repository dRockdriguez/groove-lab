import React from 'react';
import type { PlaybackState } from '@groovelab/types';
import { formatDuration } from '@groovelab/utils';
import { PlaybackButton } from '../../atoms/PlaybackButton';
import { LoopControls } from '../LoopControls';
import type { LoopControlsProps } from '../LoopControls';

export interface PlaybackControlsProps {
  state: PlaybackState;
  currentTimeMs: number;
  durationMs: number;
  onTogglePlay: () => void;
  onSeek: (timeMs: number) => void;
  /** Loop controls props — when provided, renders LoopControls below seek slider */
  loopControls?: Omit<LoopControlsProps, 'className'>;
  className?: string;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  state,
  currentTimeMs,
  durationMs,
  onTogglePlay,
  onSeek,
  loopControls,
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
        'flex flex-col gap-3 w-full',
        className,
      ].join(' ')}
    >
      {/* Seek slider row */}
      <div className="flex items-center gap-4 w-full">
        <PlaybackButton state={state} onToggle={onTogglePlay} />

        <div className="flex items-center gap-2 flex-1">
          <span className="text-sm font-mono text-gray-600 dark:text-gray-400 shrink-0">
            {formatDuration(currentTimeMs)}
          </span>

          <div className="relative flex-1">
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

      {/* Loop controls (below seek slider) */}
      {loopControls && (
        <LoopControls {...loopControls} />
      )}
    </div>
  );
};
