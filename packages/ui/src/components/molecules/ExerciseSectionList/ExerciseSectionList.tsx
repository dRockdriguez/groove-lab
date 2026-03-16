import React from 'react';
import type { ExerciseSection, InstrumentType } from '@groovelab/types';
import { ExerciseCard } from '../ExerciseCard';

export interface ExerciseSectionListProps {
  section: ExerciseSection;
  instrumentType: InstrumentType;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ExerciseSectionList: React.FC<ExerciseSectionListProps> = ({
  section,
  instrumentType,
  isExpanded = true,
  onToggleExpand,
}) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        aria-expanded={isExpanded}
        type="button"
      >
        <span className="w-1 h-5 rounded-full bg-green-500 shrink-0" />
        <h2 className="flex-1 text-left text-base font-semibold text-gray-900 dark:text-gray-100">
          {section.title}
        </h2>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-2">
          {section.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              instrumentType={instrumentType}
            />
          ))}
        </div>
      )}
    </div>
  );
};
