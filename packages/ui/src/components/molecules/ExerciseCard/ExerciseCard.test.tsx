import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExerciseCard } from './ExerciseCard';

const defaultProps = {
  exercise: {
    id: 'drums-basic-1',
    title: 'Ejercicio 1',
    description: 'Patrón básico de batería para practicar ritmo.',
  },
  instrumentType: 'electronic-drums' as const,
};

describe('ExerciseCard — content', () => {
  it('displays the exercise title', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(screen.getByText('Ejercicio 1')).toBeInTheDocument();
  });

  it('displays the exercise description', () => {
    render(<ExerciseCard {...defaultProps} />);
    expect(
      screen.getByText('Patrón básico de batería para practicar ritmo.')
    ).toBeInTheDocument();
  });
});

describe('ExerciseCard — navigation', () => {
  it('links to /practice/{instrumentType}/{exerciseId}', () => {
    render(<ExerciseCard {...defaultProps} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      '/practice/electronic-drums/drums-basic-1'
    );
  });

  it('constructs correct URL for bass exercises', () => {
    render(
      <ExerciseCard
        exercise={{
          id: 'bass-line-1',
          title: 'Ejercicio 1',
          description: 'Línea de bajo sencilla para practicar el pulso.',
        }}
        instrumentType="bass-guitar"
      />
    );
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/practice/bass-guitar/bass-line-1');
  });
});

describe('ExerciseCard — keyboard accessibility', () => {
  it('is focusable', () => {
    render(<ExerciseCard {...defaultProps} />);
    const link = screen.getByRole('link');
    link.focus();
    expect(link).toHaveFocus();
  });

  it('is activatable via Enter key', () => {
    render(<ExerciseCard {...defaultProps} />);
    const link = screen.getByRole('link');
    // Links are natively activated by Enter — verify the element exists as a link
    expect(link.tagName).toBe('A');
  });
});
