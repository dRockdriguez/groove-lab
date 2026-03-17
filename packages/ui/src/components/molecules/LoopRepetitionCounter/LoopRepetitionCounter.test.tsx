import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoopRepetitionCounter } from './LoopRepetitionCounter';

describe('LoopRepetitionCounter', () => {
  // ── AC19: Counter displays "Repeat N / M" format for finite repetitions

  it('displays "Repeat 1 / 5" when currentRepetition is 0 and totalRepetitions is 5', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    expect(screen.getByText('Repeat 1 / 5')).toBeInTheDocument();
  });

  it('displays "Repeat 2 / 5" when currentRepetition is 1 and totalRepetitions is 5', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={1}
        totalRepetitions={5}
      />
    );
    expect(screen.getByText('Repeat 2 / 5')).toBeInTheDocument();
  });

  it('displays "Repeat 5 / 5" when currentRepetition is 4 and totalRepetitions is 5', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={4}
        totalRepetitions={5}
      />
    );
    expect(screen.getByText('Repeat 5 / 5')).toBeInTheDocument();
  });

  it('displays "Repeat 1 / 3" when currentRepetition is 0 and totalRepetitions is 3', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={3}
      />
    );
    expect(screen.getByText('Repeat 1 / 3')).toBeInTheDocument();
  });

  it('displays correct format for large repetition counts', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={99}
        totalRepetitions={100}
      />
    );
    expect(screen.getByText('Repeat 100 / 100')).toBeInTheDocument();
  });

  // ── AC20: Counter displays "Repeat N / ∞" format for infinite repetitions

  it('displays "Repeat 1 / ∞" when currentRepetition is 0 and totalRepetitions is "infinite"', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions="infinite"
      />
    );
    expect(screen.getByText(/Repeat 1 \/ ∞/)).toBeInTheDocument();
  });

  it('displays "Repeat 2 / ∞" when currentRepetition is 1 and totalRepetitions is "infinite"', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={1}
        totalRepetitions="infinite"
      />
    );
    expect(screen.getByText(/Repeat 2 \/ ∞/)).toBeInTheDocument();
  });

  it('displays "Repeat 10 / ∞" for high repetition counts with infinite', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={9}
        totalRepetitions="infinite"
      />
    );
    expect(screen.getByText(/Repeat 10 \/ ∞/)).toBeInTheDocument();
  });

  // ── AC24: Counter is styled with high contrast for visibility

  it('has blue background styling for contrast', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveClass('bg-blue-50');
  });

  it('has dark mode background class', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveClass('dark:bg-blue-950');
  });

  it('has blue border styling', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveClass('border', 'border-blue-200', 'dark:border-blue-800');
  });

  it('text is styled with blue color for contrast', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const text = screen.getByText(/Repeat/);
    expect(text).toHaveClass('text-blue-700', 'dark:text-blue-300');
  });

  it('text is bold for visibility', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const text = screen.getByText(/Repeat/);
    expect(text).toHaveClass('font-semibold');
  });

  // ── Accessibility: aria-live and role

  it('has role="status" for screen reader announcements', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveAttribute('role', 'status');
  });

  it('has aria-live="polite" for non-intrusive updates', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('has descriptive aria-label for finite repetitions', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveAttribute('aria-label', 'Loop repetition 1 of 5');
  });

  it('has descriptive aria-label for infinite repetitions', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions="infinite"
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveAttribute('aria-label', 'Loop repetition 1 of ∞');
  });

  // ── Layout and spacing

  it('has flex layout with center alignment', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('has padding on all sides (px-4 py-2)', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveClass('px-4', 'py-2');
  });

  it('has rounded corners (rounded-md)', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveClass('rounded-md');
  });

  // ── Text styling

  it('text has small size class', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    const text = screen.getByText(/Repeat/);
    expect(text).toHaveClass('text-sm');
  });

  // ── Custom className support

  it('accepts custom className prop', () => {
    const customClass = 'my-custom-class';
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
        className={customClass}
      />
    );
    const container = screen.getByText(/Repeat/).closest('div');
    expect(container).toHaveClass(customClass);
  });

  // ── Edge cases

  it('handles zero repetitions (first iteration)', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={1}
      />
    );
    expect(screen.getByText('Repeat 1 / 1')).toBeInTheDocument();
  });

  it('handles high repetition index with finite count', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={49}
        totalRepetitions={50}
      />
    );
    expect(screen.getByText('Repeat 50 / 50')).toBeInTheDocument();
  });

  it('handles very large finite repetition totals', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={999}
        totalRepetitions={1000}
      />
    );
    expect(screen.getByText('Repeat 1000 / 1000')).toBeInTheDocument();
  });

  // ── Infinity symbol display

  it('displays infinity symbol (∞) for infinite repetitions, not the word "infinite"', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions="infinite"
      />
    );
    // The text should contain ∞
    expect(screen.getByText(/∞/)).toBeInTheDocument();
    // It should NOT contain the word "infinite"
    expect(screen.queryByText(/infinite/)).not.toBeInTheDocument();
  });

  // ── Display precision

  it('displays currentRepetition as 1-based, not 0-based', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={0}
        totalRepetitions={5}
      />
    );
    // Should show "Repeat 1 / 5", not "Repeat 0 / 5"
    expect(screen.getByText('Repeat 1 / 5')).toBeInTheDocument();
    expect(screen.queryByText('Repeat 0 / 5')).not.toBeInTheDocument();
  });

  // ── Container accessibility

  it('container is announced to screen readers as a status region', () => {
    render(
      <LoopRepetitionCounter
        currentRepetition={2}
        totalRepetitions={5}
      />
    );
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
  });
});
