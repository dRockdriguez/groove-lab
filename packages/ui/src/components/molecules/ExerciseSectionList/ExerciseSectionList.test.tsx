import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExerciseSectionList } from './ExerciseSectionList';

const sectionData = {
  id: 'ritmos-basicos',
  title: 'Ritmos básicos',
  exercises: [
    {
      id: 'drums-basic-1',
      title: 'Ejercicio 1',
      description: 'Patrón básico de batería para practicar ritmo.',
    },
    {
      id: 'drums-basic-2',
      title: 'Ejercicio 2',
      description: 'Variación del patrón básico con hi-hat abierto.',
    },
  ],
};

describe('ExerciseSectionList — structure', () => {
  it('renders the section heading', () => {
    render(
      <ExerciseSectionList
        section={sectionData}
        instrumentType="electronic-drums"
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Ritmos básicos' })
    ).toBeInTheDocument();
  });

  it('renders all exercises in the section', () => {
    render(
      <ExerciseSectionList
        section={sectionData}
        instrumentType="electronic-drums"
      />
    );
    expect(screen.getByText('Ejercicio 1')).toBeInTheDocument();
    expect(screen.getByText('Ejercicio 2')).toBeInTheDocument();
  });

  it('renders exercises in the order they appear in the data array', () => {
    render(
      <ExerciseSectionList
        section={sectionData}
        instrumentType="electronic-drums"
      />
    );
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute(
      'href',
      '/practice/electronic-drums/drums-basic-1'
    );
    expect(links[1]).toHaveAttribute(
      'href',
      '/practice/electronic-drums/drums-basic-2'
    );
  });

  it('each exercise card shows title and description', () => {
    render(
      <ExerciseSectionList
        section={sectionData}
        instrumentType="electronic-drums"
      />
    );
    expect(screen.getByText('Ejercicio 1')).toBeInTheDocument();
    expect(
      screen.getByText('Patrón básico de batería para practicar ritmo.')
    ).toBeInTheDocument();
    expect(screen.getByText('Ejercicio 2')).toBeInTheDocument();
    expect(
      screen.getByText('Variación del patrón básico con hi-hat abierto.')
    ).toBeInTheDocument();
  });
});

/**
 * Dark mode support — specs/theme.md → Component Theme Support → ExerciseSectionList
 */
describe('ExerciseSectionList — dark mode support', () => {
  it('section title includes dark:text-gray-100 class', () => {
    render(
      <ExerciseSectionList
        section={sectionData}
        instrumentType="electronic-drums"
      />
    );
    const heading = screen.getByRole('heading', { name: 'Ritmos básicos' });
    expect(heading).toHaveClass('dark:text-gray-100');
  });
});
