import React, { useState } from 'react';
import type { Exercise, InstrumentType } from '@groovelab/types';
import { FavoriteButton } from '../FavoriteButton';
import { TagInput } from '../TagInput';

export interface ExerciseCardProps {
  exercise: Exercise;
  instrumentType: InstrumentType;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  instrumentType,
}) => {
  const [tagInputOpen, setTagInputOpen] = useState(false);

  const handleOpenTagInput = () => setTagInputOpen(true);
  const handleCloseTagInput = () => setTagInputOpen(false);

  return (
    <>
      <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-5 py-4 hover:border-green-500/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
        <FavoriteButton
          exerciseId={exercise.id}
          onTagsClick={handleOpenTagInput}
          className="shrink-0"
        />
        <a
          href={`/practice/${instrumentType}/${exercise.id}`}
          className="group flex items-center justify-between min-w-0 flex-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-offset-white rounded px-2 -mx-2"
        >
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
              {exercise.title}
            </h3>
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
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      <TagInput
        exerciseId={exercise.id}
        exerciseTitle={exercise.title}
        isOpen={tagInputOpen}
        onClose={handleCloseTagInput}
      />
    </>
  );
};
