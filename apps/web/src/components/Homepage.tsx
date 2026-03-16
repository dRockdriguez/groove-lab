import React, { useEffect, useState } from 'react';
import { ExerciseBrowser } from '@groovelab/ui';
import type { InstrumentExercises } from '@groovelab/types';
import { WelcomeBanner } from './WelcomeBanner';

const API_BASE_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:8000';

export interface HomepageProps {
  exercisesByInstrument?: InstrumentExercises[];
}

export const Homepage: React.FC<HomepageProps> = ({ exercisesByInstrument: initialExercises }) => {
  const [exercises, setExercises] = useState<InstrumentExercises[]>(initialExercises ?? []);
  const [loading, setLoading] = useState(initialExercises === undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/exercises`);
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data: InstrumentExercises[] = await response.json();
      setExercises(data);
    } catch {
      setError('No pudimos cargar los ejercicios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialExercises === undefined) {
      fetchExercises();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <>
        <WelcomeBanner />
        <div aria-live="polite">Cargando ejercicios...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <WelcomeBanner />
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={fetchExercises}>
            Intentar de nuevo
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <WelcomeBanner />
      <ExerciseBrowser exercisesByInstrument={exercises} />
    </>
  );
};
