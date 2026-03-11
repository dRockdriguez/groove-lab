import React from 'react';
import type { ExerciseSection, InstrumentType } from '@groovelab/types';
import { ExerciseCard } from '../ExerciseCard';

export interface ExerciseSectionListProps {
  section: ExerciseSection;
  instrumentType: InstrumentType;
}

export const ExerciseSectionList: React.FC<ExerciseSectionListProps> = ({
  section,
  instrumentType,
}) => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-1 h-5 rounded-full bg-green-500 shrink-0" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{section.title}</h2>
      </div>
      <div className="space-y-2">
        {section.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            instrumentType={instrumentType}
          />
        ))}
      </div>
    </div>
  );
};
