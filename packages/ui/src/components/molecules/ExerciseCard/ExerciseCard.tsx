import React, { useState } from 'react';
import type { Exercise, InstrumentType } from '@groovelab/types';
import { getExerciseTags, useLocalStorageListener } from '@groovelab/utils';
import { FavoriteButton } from '../FavoriteButton';
import { TagInput } from '../TagInput';

export interface ExerciseCardProps {
  exercise: Exercise;
  instrumentType: InstrumentType;
  onTagsClick?: (exerciseId: string) => void;
}

const MAX_VISIBLE_TAGS = 3;

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  instrumentType,
  onTagsClick,
}) => {
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [tags, setTags] = useState(() => getExerciseTags(exercise.id));

  // Re-sync tags on localStorage changes (same tab + cross-tab)
  useLocalStorageListener(['groovelab_tags'], () => {
    setTags(getExerciseTags(exercise.id));
  });

  const handleOpenTagInput = () => {
    if (onTagsClick) {
      onTagsClick(exercise.id);
    } else {
      setTagInputOpen(true);
    }
  };

  const handleCloseTagInput = () => setTagInputOpen(false);

  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = tags.length - MAX_VISIBLE_TAGS;

  return (
    <>
      <a
        href={`/practice/${instrumentType}/${exercise.id}`}
        className="group flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-5 py-4 hover:border-green-500/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-offset-white"
      >
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <FavoriteButton
              exerciseId={exercise.id}
              className="shrink-0"
            />
            <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {exercise.title}
            </h3>
            {visibleTags.length > 0 && (
              <span
                className="inline-flex items-center gap-1 flex-wrap"
                aria-label={`Tags: ${tags.join(', ')}`}
              >
                {visibleTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    tabIndex={-1}
                  >
                    {tag}
                  </span>
                ))}
                {hiddenCount > 0 &&
                  (onTagsClick ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenTagInput();
                      }}
                      aria-label={`Show ${hiddenCount} more tags`}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 min-h-[44px] sm:min-h-0 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-gray-400 transition-colors"
                    >
                      +{hiddenCount} more
                    </button>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      +{hiddenCount} more
                    </span>
                  ))}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{exercise.description}</p>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          className="text-gray-400 dark:text-gray-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors shrink-0 ml-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </a>

      <TagInput
        exerciseId={exercise.id}
        exerciseTitle={exercise.title}
        isOpen={tagInputOpen}
        onClose={handleCloseTagInput}
      />
    </>
  );
};
