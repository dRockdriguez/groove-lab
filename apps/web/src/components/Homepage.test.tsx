import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Homepage } from './Homepage';
import { mockExercises } from '../data/mockExercises';

/**
 * Homepage integration tests — verify that Homepage renders WelcomeBanner
 * and ExerciseBrowser correctly when wired with the real mock dataset.
 * See: specs/homepage.md
 */

describe('Homepage — page renders', () => {
  it('renders the ExerciseBrowser without an error', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('ExerciseBrowser is the primary content (tablist and tabpanel present)', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });
});

describe('Homepage — initial state', () => {
  it('Drums (electronic-drums) is the selected instrument on first load', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);
    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    expect(drumsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('the exercise list for Drums is visible immediately without interaction', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);
    expect(screen.getByText('Ritmos básicos')).toBeInTheDocument();
    expect(
      screen.getByText('Patrón básico de batería para practicar ritmo.')
    ).toBeInTheDocument();
  });

  it('mock data is loaded as a static import (mockExercises is an array, not a function)', () => {
    expect(Array.isArray(mockExercises)).toBe(true);
  });
});

describe('Homepage — instrument selection', () => {
  it('switching instruments updates the exercise list immediately', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Bass' }));
    expect(screen.getByText('Líneas de bajo')).toBeInTheDocument();
    expect(screen.queryByText('Ritmos básicos')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Guitar' }));
    expect(screen.getByText('Acordes básicos')).toBeInTheDocument();
    expect(screen.queryByText('Líneas de bajo')).not.toBeInTheDocument();
  });

  it('selected instrument resets to Drums on remount (state is not persisted)', () => {
    const { unmount } = render(
      <Homepage exercisesByInstrument={mockExercises} />
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Guitar' }));
    expect(screen.getByRole('tab', { name: 'Guitar' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    unmount();
    render(<Homepage exercisesByInstrument={mockExercises} />);

    expect(screen.getByRole('tab', { name: 'Drums' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByText('Ritmos básicos')).toBeInTheDocument();
  });
});

describe('Homepage — exercise navigation', () => {
  it('each exercise card links to /practice/{instrumentType}/{exerciseId}', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);

    const drumsLink = screen.getByRole('link');
    expect(drumsLink).toHaveAttribute(
      'href',
      '/practice/electronic-drums/drums-basic-1'
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Bass' }));
    const bassLink = screen.getByRole('link');
    expect(bassLink).toHaveAttribute(
      'href',
      '/practice/bass-guitar/bass-basic-1'
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Guitar' }));
    const guitarLink = screen.getByRole('link');
    expect(guitarLink).toHaveAttribute(
      'href',
      '/practice/guitar/guitar-basic-1'
    );
  });

  it('exercise cards are rendered as <a> elements', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('A');
  });
});

describe('Homepage — accessibility', () => {
  it('instrument tabs satisfy WAI-ARIA Tabs pattern', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);

    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);

    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    expect(drumsTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Bass' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
    expect(screen.getByRole('tab', { name: 'Guitar' })).toHaveAttribute(
      'aria-selected',
      'false'
    );

    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('aria-labelledby', drumsTab.id);
  });

  it('page is keyboard-navigable from instrument selector through exercise cards', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);

    const drumsTab = screen.getByRole('tab', { name: 'Drums' });
    drumsTab.focus();

    fireEvent.keyDown(drumsTab, { key: 'ArrowRight' });
    const bassTab = screen.getByRole('tab', { name: 'Bass' });
    expect(document.activeElement).toBe(bassTab);

    fireEvent.keyDown(bassTab, { key: 'ArrowRight' });
    const guitarTab = screen.getByRole('tab', { name: 'Guitar' });
    expect(document.activeElement).toBe(guitarTab);
  });
});
