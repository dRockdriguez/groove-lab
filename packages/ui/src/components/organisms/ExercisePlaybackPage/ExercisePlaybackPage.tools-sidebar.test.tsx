import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';
import type { ExercisePlaybackData } from '@groovelab/types';

const mockExercise: ExercisePlaybackData = {
  id: 'drums-basic-1',
  title: 'Basic Drum Pattern',
  description: 'A simple drum pattern to practice',
  bpm: 120,
  durationMs: 16000,
  audioUrl: '/storage/test/exercise.mp3',
  midiEvents: [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
    { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
  ],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage — Tools Sidebar Integration', () => {
  beforeEach(() => {
    // Mock navigator.requestMIDIAccess
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue({
        inputs: { values: () => [] },
        onstatechange: null,
        addEventListener: vi.fn(),
      }),
      writable: true,
      configurable: true,
    });

    // Mock HTMLMediaElement
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      writable: true,
      value: vi.fn(),
    });

    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // ── AC3: Sidebar has a toggle button

  it('renders the tools sidebar toggle button', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByTestId('tools-sidebar-toggle')).toBeInTheDocument();
  });

  // ── AC4: Sidebar is hidden by default on page load

  it('sidebar is hidden by default on initial load', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sm:-translate-x-full');
  });

  it('toggle button shows hamburger icon when sidebar is closed', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');
    expect(toggleButton.textContent).toContain('≡');
  });

  // ── Sidebar toggle functionality

  it('opens sidebar when toggle button is clicked', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    fireEvent.click(toggleButton);

    await waitFor(() => {
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('sm:translate-x-0');
    });
  });

  it('closes sidebar when toggle button is clicked again', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    // Open
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.getByRole('complementary')).toHaveClass('sm:translate-x-0');
    });

    // Close
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.getByRole('complementary')).toHaveClass('sm:-translate-x-full');
    });
  });

  it('toggle button shows chevron icon when sidebar is open', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(toggleButton.textContent).toContain('◀');
    });
  });

  // ── AC15: Sidebar state persists within session (sessionStorage)

  it('persists sidebar open state to sessionStorage', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    fireEvent.click(toggleButton);

    await waitFor(() => {
      const stored = sessionStorage.getItem('exerciseTools_sidebarOpen');
      expect(stored).toBe('true');
    });
  });

  it('persists sidebar closed state to sessionStorage', async () => {
    // First open, then close
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(sessionStorage.getItem('exerciseTools_sidebarOpen')).toBe('true');
    });

    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(sessionStorage.getItem('exerciseTools_sidebarOpen')).toBe('false');
    });
  });

  it('restores sidebar open state from sessionStorage on mount', () => {
    sessionStorage.setItem('exerciseTools_sidebarOpen', 'true');

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sm:translate-x-0');
  });

  it('restores sidebar closed state from sessionStorage on mount', () => {
    sessionStorage.setItem('exerciseTools_sidebarOpen', 'false');

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sm:-translate-x-full');
  });

  // ── AC10: Keyboard shortcut to toggle sidebar (Ctrl+T)

  it('toggles sidebar when Ctrl+T is pressed', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');

    // Initially closed
    expect(sidebar).toHaveClass('sm:-translate-x-full');

    // Press Ctrl+T
    fireEvent.keyDown(document, { key: 't', ctrlKey: true });

    // Should be open
    await waitFor(() => {
      expect(sidebar).toHaveClass('sm:translate-x-0');
    });
  });

  it('toggles sidebar closed with Ctrl+T when already open', async () => {
    sessionStorage.setItem('exerciseTools_sidebarOpen', 'true');

    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');

    // Initially open
    expect(sidebar).toHaveClass('sm:translate-x-0');

    // Press Ctrl+T
    fireEvent.keyDown(document, { key: 't', ctrlKey: true });

    // Should be closed
    await waitFor(() => {
      expect(sidebar).toHaveClass('sm:-translate-x-full');
    });
  });

  it('prevents default browser behavior when Ctrl+T is pressed', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const event = new KeyboardEvent('keydown', { key: 't', ctrlKey: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  // ── AC8: Mobile backdrop closes sidebar when clicked

  it('renders backdrop when sidebar is open', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByTestId('tools-sidebar-backdrop')).toBeInTheDocument();
    });
  });

  it('backdrop does not render when sidebar is closed', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    expect(screen.queryByTestId('tools-sidebar-backdrop')).not.toBeInTheDocument();
  });

  it('closes sidebar when backdrop is clicked', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    // Open sidebar
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(screen.getByTestId('tools-sidebar-backdrop')).toBeInTheDocument();
    });

    // Click backdrop
    const backdrop = screen.getByTestId('tools-sidebar-backdrop');
    fireEvent.click(backdrop);

    // Sidebar should close
    await waitFor(() => {
      expect(screen.queryByTestId('tools-sidebar-backdrop')).not.toBeInTheDocument();
    });
  });

  // ── MetronomeControl is in sidebar and works

  it('renders MetronomeControl inside the sidebar', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    // MetronomeControl renders a button with aria-label "Toggle metronome"
    expect(screen.getByRole('button', { name: /toggle metronome/i })).toBeInTheDocument();
  });

  it('MetronomeControl receives initial BPM from exercise', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    // Mock exercise has bpm: 120
    expect(screen.getByLabelText('BPM')).toHaveValue(120);
  });

  it('MetronomeControl button is accessible even when sidebar is closed', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    // The sidebar is closed, but MetronomeControl is still in the DOM
    // (just off-screen due to transform)
    const metronomeToggle = screen.getByRole('button', { name: /toggle metronome/i });
    expect(metronomeToggle).toBeInTheDocument();
  });

  // ── LoopRepetitionCounter integration (AC18-24)

  it('does not render LoopRepetitionCounter when loop is inactive', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    // Loop is not active by default (isLoopActive = false)
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // Note: More LoopRepetitionCounter tests would be added once loop controls
  // are wired up in ExercisePlaybackPage (currently they're stubs).

  // ── Accessibility of toggle button

  it('toggle button has aria-label with keyboard shortcut hint', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');
    expect(toggleButton).toHaveAttribute('aria-label', 'Toggle tools sidebar (Ctrl+T)');
  });

  it('toggle button has aria-expanded attribute', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');
    // Should be "false" by default
    expect(toggleButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggle button aria-expanded changes to true when opened', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  // ── Z-index layering

  it('sidebar is positioned above timeline (z-index)', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('z-30');
  });

  it('toggle button is positioned above sidebar (z-index)', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');
    expect(toggleButton).toHaveClass('z-40');
  });

  // ── Dark mode support

  it('sidebar respects dark mode classes', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('dark:bg-gray-900');
  });

  // ── Main content area expands when sidebar is closed (AC7)

  it('main content area has flex-1 to expand when sidebar is closed', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    // The main content wrapper should have flex-1
    const mainContent = screen.getByText('Basic Drum Pattern').closest('.flex-1');
    expect(mainContent).toBeInTheDocument();
  });

  // ── Sidebar does not interfere with timeline (AC11)

  it('timeline is visible and functional when sidebar is open', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    // Open sidebar
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('complementary')).toHaveClass('sm:translate-x-0');
    });

    // Timeline should still be visible
    expect(screen.getByText(/kick drum/i)).toBeInTheDocument();
  });

  // ── Sidebar header

  it('sidebar displays "Tools" label in header', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('Tools')).toBeInTheDocument();
    });
  });

  // ── Layout structure verification

  it('page uses flex layout with h-screen', () => {
    const { container } = render(<ExercisePlaybackPage exercise={mockExercise} />);
    const pageContainer = container.querySelector('.flex.h-screen');
    expect(pageContainer).toBeInTheDocument();
  });

  // ── Sidebar animation classes

  it('sidebar has transition and duration classes for smooth animation', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('transition-transform', 'duration-300', 'ease-in-out');
  });

  // ── Mobile layout classes

  it('sidebar has mobile drawer classes for responsive layout', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    // Should have classes for mobile bottom drawer
    expect(sidebar).toHaveClass('max-sm:bottom-0', 'max-sm:w-full');
  });

  // ── Sidebar visibility across toggle states

  it('toggle button remains visible when sidebar transitions', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const toggleButton = screen.getByTestId('tools-sidebar-toggle');

    // Should be visible initially
    expect(toggleButton).toBeInTheDocument();

    // Open sidebar
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(toggleButton).toBeInTheDocument();
    });

    // Close sidebar
    fireEvent.click(toggleButton);
    await waitFor(() => {
      expect(toggleButton).toBeInTheDocument();
    });
  });

  // ── sessionStorage validation

  it('handles malformed sessionStorage gracefully', () => {
    sessionStorage.setItem('exerciseTools_sidebarOpen', '{invalid json}');

    // Should not throw and sidebar should be in default (closed) state
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sm:-translate-x-full');
  });

  // ── Sidebar accessibility role

  it('sidebar has complementary role for accessibility', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toBeInTheDocument();
  });

  it('sidebar has descriptive aria-label', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute('aria-label');
    expect(sidebar.getAttribute('aria-label')).toContain('metronome');
  });
});
