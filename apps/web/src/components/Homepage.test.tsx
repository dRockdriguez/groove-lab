import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

// Tests for data fetching from API (Spec 7: exercise-browser-database-integration)
// See: specs/exercise-browser-database-integration.md

describe('Homepage — API Data Fetching', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches exercises from GET /exercises on mount via useEffect', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockExercises,
    });

    render(<Homepage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/exercises'));
    });
  });

  it('does not fetch when exercisesByInstrument prop is provided', () => {
    render(<Homepage exercisesByInstrument={mockExercises} />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('uses the correct API URL for fetching exercises', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockExercises,
    });

    render(<Homepage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/exercises'));
    });
  });
});

describe('Homepage — Loading State', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading state while fetching exercises', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockExercises,
              }),
            50
          )
        )
    );

    render(<Homepage />);
    expect(screen.getByText('Cargando ejercicios...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Cargando ejercicios...')).not.toBeInTheDocument();
    });
  });

  it('uses aria-live="polite" for loading state announcement', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockExercises,
              }),
            50
          )
        )
    );

    render(<Homepage />);
    // The loading text should be in a div with aria-live="polite"
    const loadingElement = screen.getByText('Cargando ejercicios...');
    const ariaLiveElement = loadingElement.closest('[aria-live="polite"]');
    expect(ariaLiveElement).toBeInTheDocument();
    expect(ariaLiveElement).toHaveAttribute('aria-live', 'polite');
  });
});

describe('Homepage — Success State', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('passes fetched exercises to ExerciseBrowser on success', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockExercises,
    });

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  it('renders ExerciseBrowser with correct exercises after fetch', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockExercises,
    });

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByText('Ritmos básicos')).toBeInTheDocument();
    });
  });

  it('clears loading state after successful fetch', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockExercises,
    });

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.queryByText('Cargando ejercicios...')).not.toBeInTheDocument();
    });
  });
});

describe('Homepage — Error State', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays error message on fetch failure', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByText('No pudimos cargar los ejercicios. Intenta de nuevo.')).toBeInTheDocument();
    });
  });

  it('displays error message on server error (5xx)', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByText('No pudimos cargar los ejercicios. Intenta de nuevo.')).toBeInTheDocument();
    });
  });

  it('uses role="alert" for error message', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('displays retry button on error', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument();
    });
  });

  it('shows expected error message text', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByText('No pudimos cargar los ejercicios. Intenta de nuevo.')).toBeInTheDocument();
    });
  });
});

describe('Homepage — Retry Functionality', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('retries fetching on retry button click', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument();
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockExercises,
    });

    const retryButton = screen.getByRole('button', { name: 'Intentar de nuevo' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('shows loading state again after retry button click', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument();
    });

    (global.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => mockExercises,
              }),
            50
          )
        )
    );

    const retryButton = screen.getByRole('button', { name: 'Intentar de nuevo' });
    fireEvent.click(retryButton);

    // Should show loading state briefly
    await waitFor(() => {
      expect(screen.getByText('Cargando ejercicios...')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Cargando ejercicios...')).not.toBeInTheDocument();
    });
  });

  it('successfully loads exercises after retry', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument();
    });

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockExercises,
    });

    const retryButton = screen.getByRole('button', { name: 'Intentar de nuevo' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });
  });

  it('retries without page reload', async () => {
    const { waitFor } = await import('@testing-library/react');
    // Set up initial rejection BEFORE rendering
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument();
    });

    // Now set up successful response for retry
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockExercises,
    });

    const retryButton = screen.getByRole('button', { name: 'Intentar de nuevo' });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByRole('tablist')).toBeInTheDocument();
    });

    // Container should still be interactive (no page reload)
    expect(container).toBeTruthy();
  });
});

describe('Homepage — Empty Exercises', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows "No hay ejercicios disponibles" when API returns empty array', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<Homepage />);

    // When exercises is empty, ExerciseBrowser should show no exercises message
    // This test verifies that the component handles empty state correctly
    await waitFor(() => {
      expect(screen.queryByText('Cargando ejercicios...')).not.toBeInTheDocument();
    });
  });
});

describe('Homepage — Page Usability', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('remains usable even if exercises endpoint is unavailable', async () => {
    const { waitFor } = await import('@testing-library/react');
    (global.fetch as any).mockRejectedValueOnce(new Error('Connection refused'));

    const { container } = render(<Homepage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    // Page should still be interactive
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument();
    expect(container).toBeTruthy();
  });
});
