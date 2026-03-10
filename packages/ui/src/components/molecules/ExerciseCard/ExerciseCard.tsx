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
      className="block rounded-lg border border-gray-700 bg-gray-800 p-4 hover:border-green-500 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      <h3 className="font-medium text-white">{exercise.title}</h3>
      <p className="mt-1 text-sm text-gray-400">{exercise.description}</p>
    </a>
  );
};
