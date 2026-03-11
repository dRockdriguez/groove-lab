import React from 'react';
import { ExerciseBrowser } from '@groovelab/ui';
import type { InstrumentExercises } from '@groovelab/types';
import { WelcomeBanner } from './WelcomeBanner';

export interface HomepageProps {
  exercisesByInstrument: InstrumentExercises[];
}

export const Homepage: React.FC<HomepageProps> = ({ exercisesByInstrument }) => {
  return (
    <>
      <WelcomeBanner />
      <ExerciseBrowser exercisesByInstrument={exercisesByInstrument} />
    </>
  );
};
