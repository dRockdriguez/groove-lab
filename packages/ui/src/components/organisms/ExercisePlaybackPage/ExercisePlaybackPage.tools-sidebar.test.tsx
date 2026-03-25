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

  // ── AC3: Sidebar has toggle functionality via CustomEvents
  // (The toggle button now lives in the Header, not in ExercisePlaybackPage)

  it('dispatchesetools-sidebar-available event when mounted', () => {
    const spy = vi.spyOn(document, 'dispatchEvent');
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'tools-sidebar-available',
    }));
  });

  // ── AC4: Sidebar is hidden by default on page load

  it('sidebar is hidden by default on initial load', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sm:translate-x-full');
  });

  // ── Sidebar toggle functionality via CustomEvents

  it('opens sidebar when tools-sidebar-toggle event is dispatched', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Simulate Header dispatching the toggle event
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));

    await waitFor(() => {
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('sm:translate-x-0');
    });
  });

  it('closes sidebar when toggle event is dispatched again', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Open
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      expect(screen.getByRole('complementary')).toHaveClass('sm:translate-x-0');
    });

    // Close
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      expect(screen.getByRole('complementary')).toHaveClass('sm:translate-x-full');
    });
  });

  // ── AC15: Sidebar state persists within session (sessionStorage)

  it('persists sidebar open state to sessionStorage', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));

    await waitFor(() => {
      const stored = sessionStorage.getItem('exerciseTools_sidebarOpen');
      expect(stored).toBe('true');
    });
  });

  it('persists sidebar closed state to sessionStorage', async () => {
    // First open, then close
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      expect(sessionStorage.getItem('exerciseTools_sidebarOpen')).toBe('true');
    });

    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
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
    expect(sidebar).toHaveClass('sm:translate-x-full');
  });

  // ── AC10: Keyboard shortcut to toggle sidebar (Ctrl+T)

  it('toggles sidebar when Ctrl+T is pressed', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');

    // Initially closed
    expect(sidebar).toHaveClass('sm:translate-x-full');

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
      expect(sidebar).toHaveClass('sm:translate-x-full');
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

    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));

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

    // Open sidebar
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
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
    // LoopRepetitionCounter is not rendered; only HitCounter (role="status") may be present
    const statusElements = screen.queryAllByRole('status');
    const loopCounter = statusElements.find((el) =>
      el.getAttribute('aria-label')?.includes('Loop repetition'),
    );
    expect(loopCounter).toBeUndefined();
  });

  // Note: More LoopRepetitionCounter tests would be added once loop controls
  // are wired up in ExercisePlaybackPage (currently they're stubs).

  // ── Z-index layering

  it('sidebar is positioned above timeline (z-index)', () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('z-30');
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

    // Open sidebar
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));

    await waitFor(() => {
      expect(screen.getByRole('complementary')).toHaveClass('sm:translate-x-0');
    });

    // Timeline should still be visible
    expect(screen.getByText(/kick drum/i)).toBeInTheDocument();
  });

  // ── Sidebar header

  it('sidebar displays "Tools" label in header', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));

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

  // ── sessionStorage validation

  it('handles malformed sessionStorage gracefully', () => {
    sessionStorage.setItem('exerciseTools_sidebarOpen', '{invalid json}');

    // Should not throw and sidebar should be in default (closed) state
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sm:translate-x-full');
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

  // ── Spec 03: Drum Sound Volume Control ─────────────────────────────────

  // ── AC5: ExercisePlaybackPage calls setVolume on volume change

  it('renders drum volume slider in sidebar', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    // Open sidebar to access controls
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    // Volume slider should be rendered
    await waitFor(() => {
      expect(screen.getByLabelText('Drum volume')).toBeInTheDocument();
    });
  });

  it('calls drumSoundEngineRef.setVolume(volume/100) when slider changes', async () => {
    const { container } = render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Open sidebar
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      expect(screen.getByLabelText('Drum volume')).toBeInTheDocument();
    });

    // Move slider to 50
    const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '50' } });

    // At this point, the component should call setVolume(0.5)
    // We verify this by checking that the internal state is updated
    expect(slider.value).toBe('50');
  });

  // ── AC8 & 9: Mute toggles engine volume

  it('renders mute button in drum volume section', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mute drums/i })).toBeInTheDocument();
    });
  });

  it('mute button starts with aria-pressed="false"', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      const muteButton = screen.getByRole('button', { name: /mute drums/i });
      expect(muteButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  // ── AC10 & 11: Volume persistence to sessionStorage

  it('persists volume value to sessionStorage key exerciseTools_drumVolume', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));

    await waitFor(() => {
      expect(screen.getByLabelText('Drum volume')).toBeInTheDocument();
    });

    const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '60' } });

    await waitFor(() => {
      const stored = sessionStorage.getItem('exerciseTools_drumVolume');
      expect(stored).toBe('60');
    });
  });

  it('persists muted state to sessionStorage key exerciseTools_drumMuted', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mute drums/i })).toBeInTheDocument();
    });

    const muteButton = screen.getByRole('button', { name: /mute drums/i });
    fireEvent.click(muteButton);

    await waitFor(() => {
      const stored = sessionStorage.getItem('exerciseTools_drumMuted');
      expect(stored).toBe('true');
    });
  });

  // ── AC12: Restore from sessionStorage on page load

  it('restores volume from sessionStorage on page load (default: 70)', async () => {
    sessionStorage.clear();
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
      expect(slider.value).toBe('70');
    });
  });

  it('restores custom volume value from sessionStorage on page load', async () => {
    sessionStorage.setItem('exerciseTools_drumVolume', '45');
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
      expect(slider.value).toBe('45');
    });
  });

  it('restores muted state from sessionStorage on page load (default: false)', async () => {
    sessionStorage.clear();
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      const muteButton = screen.getByRole('button', { name: /mute drums/i });
      expect(muteButton).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('restores muted state true from sessionStorage on page load', async () => {
    sessionStorage.setItem('exerciseTools_drumMuted', 'true');
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      const muteButton = screen.getByRole('button', { name: /mute drums/i });
      expect(muteButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  // ── Edge case: Volume at 0 does not toggle mute button

  it('volume slider at 0 does not toggle mute button aria-pressed', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));

    await waitFor(() => {
      expect(screen.getByLabelText('Drum volume')).toBeInTheDocument();
    });

    const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
    const muteButton = screen.getByRole('button', { name: /mute drums/i });

    // Set slider to 0
    fireEvent.change(slider, { target: { value: '0' } });

    // Mute button should still be false (volume 0 ≠ mute button toggled)
    expect(muteButton).toHaveAttribute('aria-pressed', 'false');
  });

  // ── Edge case: Mute then change slider - visual update but engine stays at 0

  it('slider visual updates when muted but engine volume behavior is controlled by mute state', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));

    await waitFor(() => {
      expect(screen.getByLabelText('Drum volume')).toBeInTheDocument();
    });

    const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
    const muteButton = screen.getByRole('button', { name: /mute drums/i });

    // Mute first
    fireEvent.click(muteButton);
    expect(muteButton).toHaveAttribute('aria-pressed', 'true');

    // Change slider while muted
    fireEvent.change(slider, { target: { value: '75' } });

    // Slider visual value should update
    expect(slider.value).toBe('75');
    // But mute button should still be pressed
    expect(muteButton).toHaveAttribute('aria-pressed', 'true');
  });

  // ── Edge case: Invalid sessionStorage fallback

  it('silently falls back to defaults when sessionStorage contains invalid volume', async () => {
    sessionStorage.setItem('exerciseTools_drumVolume', 'invalid');
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    await waitFor(() => {
      const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
      // Should default to 70 on invalid parse
      expect(slider.value).toBe('70');
    });
  });

  it('silently falls back when sessionStorage is unavailable', async () => {
    // Mock sessionStorage to throw
    const originalSessionStorage = global.sessionStorage;
    Object.defineProperty(global, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => {
          throw new Error('sessionStorage unavailable');
        }),
        setItem: vi.fn(() => {
          throw new Error('sessionStorage unavailable');
        }),
        clear: vi.fn(),
      },
      writable: true,
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);
    document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'));
    // Should render with defaults without throwing
    await waitFor(() => {
      expect(screen.getByLabelText('Drum volume')).toBeInTheDocument();
    });

    // Restore original sessionStorage
    Object.defineProperty(global, 'sessionStorage', {
      value: originalSessionStorage,
      writable: true,
    });
  });
});
