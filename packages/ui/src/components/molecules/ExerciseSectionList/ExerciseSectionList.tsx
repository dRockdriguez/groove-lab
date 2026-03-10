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
      <h2 className="mb-3 text-lg font-semibold text-white">{section.title}</h2>
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
