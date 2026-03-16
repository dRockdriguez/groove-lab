import React from 'react';
import type { PlaybackState } from '@groovelab/types';

export interface PlaybackButtonProps {
  state: PlaybackState;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}

export const PlaybackButton: React.FC<PlaybackButtonProps> = ({
  state,
  onToggle,
  disabled = false,
  className = '',
}) => {
  const isPlaying = state === 'playing';
  const label = isPlaying ? 'Pause' : 'Play';

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onToggle}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center rounded-full',
        'w-12 h-12',
        'bg-green-600 hover:bg-green-700 text-white',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors duration-150',
        className,
      ].join(' ')}
    >
      {isPlaying ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <polygon points="5,3 19,12 5,21" />
        </svg>
      )}
    </button>
  );
};
