import React from 'react';
import type { Exercise, InstrumentType } from '@groovelab/types';

export interface ExerciseCardProps {
  exercise: Exercise;
  instrumentType: InstrumentType;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  instrumentType,
}) => {
  return (
    <a
      href={`/practice/${instrumentType}/${exercise.id}`}
      className="group flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-5 py-4 hover:border-green-500/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-offset-white"
    >
      <div>
        <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{exercise.title}</h3>
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
  );
};
