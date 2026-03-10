import type { InstrumentExercises } from '@groovelab/types';

export const mockExercises: InstrumentExercises[] = [
  {
    instrumentType: 'electronic-drums',
    sections: [
      {
        id: 'drums-basic-rhythms',
        title: 'Ritmos básicos',
        exercises: [
          {
            id: 'drums-basic-1',
            title: 'Ejercicio 1',
            description: 'Patrón básico de batería para practicar ritmo.',
          },
        ],
      },
    ],
  },
  {
    instrumentType: 'bass-guitar',
    sections: [
      {
        id: 'bass-lines',
        title: 'Líneas de bajo',
        exercises: [
          {
            id: 'bass-basic-1',
            title: 'Ejercicio 1',
            description: 'Línea de bajo sencilla para practicar el pulso.',
          },
        ],
      },
    ],
  },
  {
    instrumentType: 'guitar',
    sections: [
      {
        id: 'guitar-basic-chords',
        title: 'Acordes básicos',
        exercises: [
          {
            id: 'guitar-basic-1',
            title: 'Ejercicio 1',
            description: 'Progresión de acordes básica para principiantes.',
          },
        ],
      },
    ],
  },
];
