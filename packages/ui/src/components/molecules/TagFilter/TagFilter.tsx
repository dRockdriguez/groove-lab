import React, { useEffect, useState } from 'react';
import { getDistinctTags, useLocalStorageListener } from '@groovelab/utils';

export interface TagFilterProps {
  /** Currently selected tags (controlled by parent/sessionStorage) */
  selectedTags: string[];
  /** Called with the updated array of selected tags when a tag is toggled or cleared */
  onSelectedTagsChange: (tags: string[]) => void;
  /** Optional class name appended to the root element */
  className?: string;
}

/**
 * TagFilter — displays all available tags and lets users select multiple to filter
 * exercises using AND logic. Tag list is read from localStorage on mount via
 * `getDistinctTags()`. Selection state is managed externally via props.
 */
export const TagFilter: React.FC<TagFilterProps> = ({
  selectedTags,
  onSelectedTagsChange,
  className,
}) => {
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Load distinct tags from storage on mount
  useEffect(() => {
    setAvailableTags(getDistinctTags());
  }, []);

  // Re-load available tags when localStorage tags key changes (same tab + cross-tab)
  useLocalStorageListener(['groovelab_tags'], () => {
    setAvailableTags(getDistinctTags());
  });

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onSelectedTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onSelectedTagsChange([...selectedTags, tag]);
    }
  };

  const handleClearAll = () => {
    onSelectedTagsChange([]);
  };

  const hasSelection = selectedTags.length > 0;

  return (
    <section
      aria-label="Filter by tags"
      className={['flex flex-col gap-3', className].filter(Boolean).join(' ')}
    >
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tags</h3>
      </div>

      {/* Tag buttons */}
      {availableTags.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No tags available</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleTagToggle(tag)}
                className={[
                  'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                  'transition-all duration-100 ease-in-out',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
                  isSelected
                    ? [
                        'bg-green-600 text-white dark:bg-green-500 dark:text-white',
                        'hover:bg-green-500 dark:hover:bg-green-400',
                        'focus-visible:ring-green-500',
                      ].join(' ')
                    : [
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
                        'hover:bg-gray-200 dark:hover:bg-gray-600',
                        'hover:scale-105',
                        'focus-visible:ring-gray-400',
                      ].join(' '),
                ].join(' ')}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {/* Clear All button — visible only when tags are selected */}
      {hasSelection && (
        <button
          type="button"
          aria-label="Clear all tag filters"
          onClick={handleClearAll}
          className={[
            'self-start inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium',
            'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
            'hover:bg-red-200 dark:hover:bg-red-800/60',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-red-400',
            'transition-colors duration-100',
          ].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            width="14"
            height="14"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
          Clear All
        </button>
      )}

      {/* Feedback text — AND logic indicator */}
      {hasSelection && (
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Filtering by: </span>
          {selectedTags.map((tag, i) => (
            <React.Fragment key={tag}>
              <span className="font-semibold text-green-700 dark:text-green-400">
                &ldquo;{tag}&rdquo;
              </span>
              {i < selectedTags.length - 1 && (
                <span className="text-gray-500 dark:text-gray-500"> AND </span>
              )}
            </React.Fragment>
          ))}
        </p>
      )}
    </section>
  );
};
