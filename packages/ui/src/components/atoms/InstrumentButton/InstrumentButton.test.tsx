import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InstrumentButton } from './InstrumentButton';

describe('InstrumentButton — rendering', () => {
  it('renders the instrument label text', () => {
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText('Drums')).toBeInTheDocument();
  });

  it('uses role="tab"', () => {
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('tab', { name: 'Drums' })).toBeInTheDocument();
  });
});

describe('InstrumentButton — selection state', () => {
  it('has aria-selected="true" when selected', () => {
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('tab')).toHaveAttribute('aria-selected', 'true');
  });

  it('has aria-selected="false" when not selected', () => {
    render(
      <InstrumentButton
        instrumentType="bass-guitar"
        label="Bass"
        isSelected={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('tab')).toHaveAttribute('aria-selected', 'false');
  });

  it('is visually distinguished when selected', () => {
    const { rerender } = render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={vi.fn()}
      />
    );
    const unselectedClasses = screen.getByRole('tab').className;

    rerender(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={true}
        onClick={vi.fn()}
      />
    );
    const selectedClasses = screen.getByRole('tab').className;

    expect(selectedClasses).not.toBe(unselectedClasses);
  });
});

describe('InstrumentButton — interaction', () => {
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={handleClick}
      />
    );
    fireEvent.click(screen.getByRole('tab'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is keyboard-navigable (activatable with Enter)', () => {
    const handleClick = vi.fn();
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={handleClick}
      />
    );
    const tab = screen.getByRole('tab');
    fireEvent.keyDown(tab, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is keyboard-navigable (activatable with Space)', () => {
    const handleClick = vi.fn();
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={handleClick}
      />
    );
    const tab = screen.getByRole('tab');
    fireEvent.keyDown(tab, { key: ' ' });
    expect(handleClick).toHaveBeenCalledOnce();
  });
});

/**
 * Dark mode support — specs/theme.md → Component Theme Support → InstrumentButton
 */
describe('InstrumentButton — dark mode support (unselected)', () => {
  it('includes dark:bg-gray-800 class', () => {
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('tab')).toHaveClass('dark:bg-gray-800');
  });

  it('includes dark:text-gray-100 class', () => {
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('tab')).toHaveClass('dark:text-gray-100');
  });

  it('includes dark:border-gray-700 class', () => {
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('tab')).toHaveClass('dark:border-gray-700');
  });

  it('includes dark:ring-offset-gray-900 class', () => {
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={false}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('tab')).toHaveClass('dark:ring-offset-gray-900');
  });
});

describe('InstrumentButton — dark mode support (selected)', () => {
  it('includes dark:bg-indigo-500 class when selected', () => {
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('tab')).toHaveClass('dark:bg-indigo-500');
  });

  it('includes dark:text-white class when selected', () => {
    render(
      <InstrumentButton
        instrumentType="electronic-drums"
        label="Drums"
        isSelected={true}
        onClick={vi.fn()}
      />
    );
    expect(screen.getByRole('tab')).toHaveClass('dark:text-white');
  });
});
