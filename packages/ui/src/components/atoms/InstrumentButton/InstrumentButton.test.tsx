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
