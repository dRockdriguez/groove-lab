import React, { useCallback, useEffect, useState } from 'react';
import { isFavorite, toggleFavorite, getExerciseTags } from '@groovelab/utils';

export interface FavoriteButtonProps {
  /** Exercise ID used to look up favorite state and tags in storage */
  exerciseId: string;
  /** Called when the user clicks the tag badge (if present) */
  onTagsClick?: () => void;
  /** Optional class name appended to the root element */
  className?: string;
}

/** Reads current state from localStorage and returns { favorited, tagCount } */
function readState(exerciseId: string): { favorited: boolean; tagCount: number } {
  return {
    favorited: isFavorite(exerciseId),
    tagCount: getExerciseTags(exerciseId).length,
  };
}

/**
 * FavoriteButton — inline heart icon with optional tag count badge.
 *
 * Clicking the heart toggles the exercise's favorite state in localStorage.
 * If `onTagsClick` is provided, clicking the tag badge fires that callback.
 */
export const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  exerciseId,
  onTagsClick,
  className = '',
}) => {
  const [state, setState] = useState(() => readState(exerciseId));

  // Re-sync when the exerciseId changes
  useEffect(() => {
    setState(readState(exerciseId));
  }, [exerciseId]);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'groovelab_favorites' || e.key === 'groovelab_tags') {
        setState(readState(exerciseId));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [exerciseId]);

  const handleHeartClick = useCallback(() => {
    const next = toggleFavorite(exerciseId);
    setState((prev) => ({ ...prev, favorited: next }));
  }, [exerciseId]);

  const handleTagClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTagsClick?.();
    },
    [onTagsClick],
  );

  const heartLabel = state.favorited ? 'Remove from favorites' : 'Add to favorites';

  return (
    <div className={['inline-flex items-center gap-1.5', className].join(' ')}>
      {/* Heart button */}
      <button
        type="button"
        aria-label={heartLabel}
        aria-pressed={state.favorited}
        onClick={handleHeartClick}
        className={[
          'inline-flex items-center justify-center',
          'rounded p-0.5',
          'transition-transform duration-100 ease-in-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          state.favorited
            ? 'text-red-500 dark:text-red-400 focus-visible:ring-red-400'
            : 'text-gray-400 dark:text-gray-500 hover:text-red-400 dark:hover:text-red-400 focus-visible:ring-gray-400',
          'hover:scale-110',
        ].join(' ')}
      >
        {state.favorited ? (
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

      {/* Tag count badge — only rendered when tags exist */}
      {state.tagCount > 0 &&
        (onTagsClick ? (
          <button
            type="button"
            onClick={handleTagClick}
            aria-label={`${state.tagCount} ${state.tagCount === 1 ? 'tag' : 'tags'}, click to manage`}
            className={[
              'inline-flex items-center gap-0.5 px-1.5 py-0.5',
              'rounded-full text-xs font-medium',
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
              'hover:bg-gray-200 dark:hover:bg-gray-600',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400',
              'transition-colors duration-100',
            ].join(' ')}
          >
            {state.tagCount}
          </button>
        ) : (
          <span
            aria-label={`${state.tagCount} ${state.tagCount === 1 ? 'tag' : 'tags'}`}
            className={[
              'inline-flex items-center px-1.5 py-0.5',
              'rounded-full text-xs font-medium',
              'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
            ].join(' ')}
          >
            {state.tagCount}
          </span>
        ))}
    </div>
  );
};
