import React, { useCallback, useEffect, useState } from 'react';
import { isFavorite, toggleFavorite, useLocalStorageListener } from '@groovelab/utils';

export interface FavoriteButtonProps {
  /** Exercise ID used to look up favorite state in storage */
  exerciseId: string;
  /** Optional callback when user clicks tags icon to open tag editor */
  onTagsClick?: () => void;
  /** Optional class name appended to the root element */
  className?: string;
}

/** Reads current favorite state from localStorage */
function readFavorited(exerciseId: string): boolean {
  return isFavorite(exerciseId);
}

/**
 * FavoriteButton — inline heart icon that toggles favorite state.
 *
 * Clicking the heart toggles the exercise's favorite state in localStorage.
 * Tag badges are displayed separately in ExerciseCard (not here).
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  exerciseId,
  onTagsClick,
  className = '',
}) => {
  const [favorited, setFavorited] = useState(() => readFavorited(exerciseId));

  // Re-sync when the exerciseId changes
  useEffect(() => {
    setFavorited(readFavorited(exerciseId));
  }, [exerciseId]);

  // Re-sync on any localStorage change to watched keys (same tab + cross-tab)
  useLocalStorageListener(['groovelab_favorites'], () => {
    setFavorited(readFavorited(exerciseId));
  });

  const handleHeartClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = toggleFavorite(exerciseId);
    setFavorited(next);
  }, [exerciseId]);

  const handleTagsClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTagsClick?.();
  }, [onTagsClick]);

  const heartLabel = favorited ? 'Remove from favorites' : 'Add to favorites';

  return (
    <div className={['inline-flex items-center gap-1', className].join(' ')}>
      {/* Heart button */}
      <button
        type="button"
        aria-label={heartLabel}
        aria-pressed={favorited}
        onClick={handleHeartClick}
        className={[
          'inline-flex items-center justify-center',
          'rounded p-0.5',
          'transition-transform duration-100 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          favorited
            ? 'text-red-500 dark:text-red-400 focus-visible:ring-red-400'
            : 'text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-400 focus-visible:ring-gray-400',
          'hover:scale-110',
        ].join(' ')}
      >
        {favorited ? (
          /* Filled heart */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
          </svg>
        ) : (
          /* Hollow heart */
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        )}
      </button>

      {/* Tags button (if callback provided) */}
      {onTagsClick && (
        <button
          type="button"
          aria-label="Manage tags"
          onClick={handleTagsClick}
          className={[
            'inline-flex items-center justify-center',
            'rounded p-0.5',
            'transition-transform duration-100 ease-in-out',
            'text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-400',
            'hover:scale-110',
          ].join(' ')}
        >
          {/* Tag icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            width="18"
            height="18"
            aria-hidden="true"
          >
            <path d="M6.75 2.25A2.25 2.25 0 004.5 4.5v6a2.25 2.25 0 002.25 2.25h12a2.25 2.25 0 002.25-2.25v-6a2.25 2.25 0 00-2.25-2.25h-12zM3.75 15h16.5a.75.75 0 00-.75.75v2.25a2.25 2.25 0 01-2.25 2.25h-12a2.25 2.25 0 01-2.25-2.25V15.75a.75.75 0 00-.75-.75z" />
          </svg>
        </button>
      )}
    </div>
  );
};
