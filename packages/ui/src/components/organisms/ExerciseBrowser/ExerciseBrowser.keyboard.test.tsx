import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExerciseBrowser } from './ExerciseBrowser';
import type { InstrumentExercises } from '@groovelab/types';

const testData: InstrumentExercises[] = [
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
    sections: [],
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

describe('ExerciseBrowser — empty state', () => {
  it('displays "No hay ejercicios disponibles" when instrument has no exercises', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    // Switch to Bass which has empty sections array
    fireEvent.click(screen.getByRole('tab', { name: 'Bass' }));
    expect(
      screen.getByText('No hay ejercicios disponibles')
    ).toBeInTheDocument();
  });

  it('does not display empty message when instrument has exercises', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    // Drums is selected by default and has exercises
    expect(
      screen.queryByText('No hay ejercicios disponibles')
    ).not.toBeInTheDocument();
  });
});

describe('ExerciseBrowser — Arrow key navigation (WAI-ARIA Tabs)', () => {
  it('Arrow Right moves focus to the next tab', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    const bassTab = screen.getByRole('tab', { name: 'Bass' });

    drumsTab.focus();
    fireEvent.keyDown(drumsTab, { key: 'ArrowRight' });
    expect(bassTab).toHaveFocus();
  });

  it('Arrow Left moves focus to the previous tab', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    const bassTab = screen.getByRole('tab', { name: 'Bass' });

    bassTab.focus();
    fireEvent.keyDown(bassTab, { key: 'ArrowLeft' });
    expect(drumsTab).toHaveFocus();
  });

  it('Arrow Right wraps from last tab to first tab', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    const guitarTab = screen.getByRole('tab', { name: 'Guitar' });

    guitarTab.focus();
    fireEvent.keyDown(guitarTab, { key: 'ArrowRight' });
    expect(drumsTab).toHaveFocus();
  });

  it('Arrow Left wraps from first tab to last tab', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    const guitarTab = screen.getByRole('tab', { name: 'Guitar' });

    drumsTab.focus();
    fireEvent.keyDown(drumsTab, { key: 'ArrowLeft' });
    expect(guitarTab).toHaveFocus();
  });
});

describe('ExerciseBrowser — tab focus management', () => {
  it('only the selected tab has tabindex="0", others have tabindex="-1"', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    const bassTab = screen.getByRole('tab', { name: 'Bass' });
    const guitarTab = screen.getByRole('tab', { name: 'Guitar' });

    // Drums is selected by default
    expect(drumsTab).toHaveAttribute('tabindex', '0');
    expect(bassTab).toHaveAttribute('tabindex', '-1');
    expect(guitarTab).toHaveAttribute('tabindex', '-1');
  });

  it('tabpanel is focusable so Tab key can move into it', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('tabindex', '0');
  });

  it('tabindex values update when selected instrument changes', () => {
    render(<ExerciseBrowser exercisesByInstrument={testData} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Guitar' }));

    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    const bassTab = screen.getByRole('tab', { name: 'Bass' });
    const guitarTab = screen.getByRole('tab', { name: 'Guitar' });

    expect(guitarTab).toHaveAttribute('tabindex', '0');
    expect(drumsTab).toHaveAttribute('tabindex', '-1');
    expect(bassTab).toHaveAttribute('tabindex', '-1');
  });
});
