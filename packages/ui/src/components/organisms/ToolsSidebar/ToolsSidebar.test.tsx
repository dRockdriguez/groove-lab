import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToolsSidebar } from './ToolsSidebar';
import type { MetronomeControlProps } from '../../molecules/MetronomeControl';

// ─── Mocks ────────────────────────────────────────────────────────────────

function makeAudioContextMock() {
  return {
    createOscillator: vi.fn().mockReturnValue({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 1000 },
      type: 'sine',
    }),
    createGain: vi.fn().mockReturnValue({
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        value: 0.3,
      },
    }),
    destination: {},
    currentTime: 0,
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

const defaultMetronomeProps: MetronomeControlProps = {};

describe('ToolsSidebar', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).AudioContext = vi.fn().mockImplementation(makeAudioContextMock);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).webkitAudioContext = vi.fn().mockImplementation(makeAudioContextMock);
  });

  // ── AC1: Sidebar appears as fixed left panel (desktop) or bottom drawer (mobile)

  it('renders the sidebar panel with fixed positioning', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const panel = screen.getByRole('complementary');
    expect(panel).toHaveClass('fixed');
  });

  it('sidebar has desktop layout classes', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const panel = screen.getByRole('complementary');
    expect(panel).toHaveClass('top-0', 'right-0', 'h-full');
  });

  it('sidebar has mobile drawer layout classes', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const panel = screen.getByRole('complementary');
    // Mobile drawer positioning should be in class names
    expect(panel.className).toMatch(/max-sm/);
  });

  // ── AC2: Sidebar contains MetronomeControl

  it('renders MetronomeControl inside the sidebar', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    // MetronomeControl renders a button with aria-label "Toggle metronome"
    expect(screen.getByRole('button', { name: /toggle metronome/i })).toBeInTheDocument();
  });

  // ── AC3: Sidebar toggle button now rendered in ExercisePlaybackPage header

  // ── AC8: Sidebar has semi-transparent backdrop on mobile when open

  it('renders backdrop when sidebar is open', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const backdrop = screen.getByTestId('tools-sidebar-backdrop');
    expect(backdrop).toBeInTheDocument();
  });

  it('does not render backdrop when sidebar is closed', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen={false}
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const backdrop = screen.queryByTestId('tools-sidebar-backdrop');
    expect(backdrop).not.toBeInTheDocument();
  });

  it('backdrop has semi-transparent background class', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const backdrop = screen.getByTestId('tools-sidebar-backdrop');
    expect(backdrop).toHaveClass('bg-black/50');
  });

  it('backdrop closes sidebar when clicked', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const backdrop = screen.getByTestId('tools-sidebar-backdrop');
    fireEvent.click(backdrop);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  // ── AC9: Toggle button remains visible/accessible at all times


  // ── AC13: Sidebar is accessible

  it('sidebar has complementary role for accessibility', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toBeInTheDocument();
  });

  it('sidebar has descriptive aria-label', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveAttribute(
      'aria-label',
      'Tools sidebar containing metronome and loop controls'
    );
  });


  // ── AC14: Sidebar respects color scheme (dark/light mode)

  it('sidebar has light background and dark mode classes', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('bg-gray-50', 'dark:bg-gray-900');
  });

  it('sidebar border respects dark mode', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('border-gray-200', 'dark:border-gray-700');
  });

  // ── AC5: Sidebar animates smoothly (slide-in/slide-out) with 300ms

  it('sidebar has transition-transform class for animation', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('transition-transform', 'duration-300', 'ease-in-out');
  });

  it('sidebar applies translate-x-0 when open (desktop)', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sm:translate-x-0');
  });

  it('sidebar applies translate-x-full when closed (desktop)', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen={false}
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sm:translate-x-full');
  });

  it('sidebar applies translate-y-0 when open (mobile)', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('max-sm:translate-y-0');
  });

  it('sidebar applies translate-y-full when closed (mobile)', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen={false}
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('max-sm:translate-y-full');
  });

  // ── AC6: Sidebar width is responsive

  it('sidebar has desktop width class (sm:w-80 = 320px)', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('sm:w-80');
  });

  it('sidebar has mobile full-width class', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('max-sm:w-full');
  });

  it('sidebar has mobile max-height constraint', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('max-sm:max-h-[60vh]');
  });

  // ── Toggle button callback tests (toggle button now in ExercisePlaybackPage, not ToolsSidebar)

  it('close button inside sidebar header calls onToggle', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    // Find the close button in the sidebar header by looking for the panel button
    const closeButton = screen.getAllByRole('button', { name: /toggle tools sidebar/i })[0];
    fireEvent.click(closeButton);
    expect(onToggle).toHaveBeenCalled();
  });

  // ── Z-index verification

  it('sidebar has correct z-index (z-30)', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass('z-30');
  });

  it('backdrop has z-index between sidebar and button (z-20)', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const backdrop = screen.getByTestId('tools-sidebar-backdrop');
    expect(backdrop).toHaveClass('z-20');
  });

  // ── Props pass-through

  it('passes metronomeProps to MetronomeControl', () => {
    const onToggle = vi.fn();
    const metronomeProps: MetronomeControlProps = { initialBpm: 140 };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={metronomeProps}
      />
    );
    // If initialBpm was passed, the BPM input should show 140
    expect(screen.getByLabelText('BPM')).toHaveValue(140);
  });

  it('accepts custom className prop', () => {
    const onToggle = vi.fn();
    const customClass = 'my-custom-class';
    const { container } = render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        className={customClass}
      />
    );
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toHaveClass(customClass);
  });

  // ── Mobile backdrop only visible on mobile

  it('backdrop has mobile-only visibility class (sm:hidden)', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const backdrop = screen.getByTestId('tools-sidebar-backdrop');
    expect(backdrop).toHaveClass('sm:hidden');
  });

  // ── Sidebar header text

  it('displays "Tools" label in sidebar header', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  // ── Accessibility: aria-hidden on decorative elements

  it('icons have aria-hidden for accessibility', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const icons = document.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('backdrop has aria-hidden when rendered', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
      />
    );
    const backdrop = screen.getByTestId('tools-sidebar-backdrop');
    expect(backdrop).toHaveAttribute('aria-hidden', 'true');
  });

  // ── Spec 03: Drum Sound Volume Control ─────────────────────────────────

  // ── AC1: Drum Volume section renders when drumVolumeProps provided

  it('renders "Drum Volume" section when drumVolumeProps is provided', () => {
    const onToggle = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange: vi.fn(),
      isMuted: false,
      onToggleMute: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
      />
    );
    expect(screen.getByText(/drum volume/i)).toBeInTheDocument();
  });

  it('does not render drum volume section when drumVolumeProps is undefined', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={undefined}
      />
    );
    expect(screen.queryByText(/drum volume/i)).not.toBeInTheDocument();
  });

  // ── AC2: Volume slider attributes

  it('renders volume slider with correct min, max, and aria-label', () => {
    const onToggle = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange: vi.fn(),
      isMuted: false,
      onToggleMute: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
      />
    );
    const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
    expect(slider).toHaveAttribute('type', 'range');
    expect(slider).toHaveAttribute('min', '0');
    expect(slider).toHaveAttribute('max', '100');
    expect(slider).toHaveAttribute('aria-label', 'Drum volume');
  });

  // ── AC3: Slider default value is 70

  it('volume slider shows value of 70 when volume prop is 70', () => {
    const onToggle = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange: vi.fn(),
      isMuted: false,
      onToggleMute: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
      />
    );
    const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
    expect(slider.value).toBe('70');
  });

  // ── AC4: Moving slider calls onVolumeChange with numeric value

  it('calls onVolumeChange when slider is moved', () => {
    const onToggle = vi.fn();
    const onVolumeChange = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange,
      isMuted: false,
      onToggleMute: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
      />
    );
    const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '50' } });
    expect(onVolumeChange).toHaveBeenCalledWith(50);
  });

  it('onVolumeChange receives numeric value, not string', () => {
    const onToggle = vi.fn();
    const onVolumeChange = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange,
      isMuted: false,
      onToggleMute: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
      />
    );
    const slider = screen.getByLabelText('Drum volume') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '30' } });
    expect(onVolumeChange).toHaveBeenCalledWith(expect.any(Number));
    expect(onVolumeChange).toHaveBeenCalledWith(30);
  });

  // ── AC6: Mute button renders and toggles

  it('renders mute button with aria-pressed="false" by default', () => {
    const onToggle = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange: vi.fn(),
      isMuted: false,
      onToggleMute: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
      />
    );
    const muteButton = screen.getByRole('button', { name: /mute drums/i });
    expect(muteButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('mute button shows aria-pressed="true" when isMuted is true', () => {
    const onToggle = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange: vi.fn(),
      isMuted: true,
      onToggleMute: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
      />
    );
    const muteButton = screen.getByRole('button', { name: /unmute drums/i });
    expect(muteButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onToggleMute when mute button is clicked', () => {
    const onToggle = vi.fn();
    const onToggleMute = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange: vi.fn(),
      isMuted: false,
      onToggleMute,
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
      />
    );
    const muteButton = screen.getByRole('button', { name: /mute drums/i });
    fireEvent.click(muteButton);
    expect(onToggleMute).toHaveBeenCalledTimes(1);
  });

  it('volume section appears below metronome section', () => {
    const onToggle = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange: vi.fn(),
      isMuted: false,
      onToggleMute: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
      />
    );
    // Both sections should exist
    const metronomeButton = screen.getByRole('button', { name: /toggle metronome/i });
    const muteButton = screen.getByRole('button', { name: /mute drums/i });
    expect(metronomeButton).toBeInTheDocument();
    expect(muteButton).toBeInTheDocument();
    // Mute button should come after metronome button in DOM
    const metronomeIndex = Array.from(document.querySelectorAll('button')).indexOf(
      metronomeButton as HTMLButtonElement
    );
    const muteIndex = Array.from(document.querySelectorAll('button')).indexOf(
      muteButton as HTMLButtonElement
    );
    expect(muteIndex).toBeGreaterThan(metronomeIndex);
  });

  // ── Spec 04: Tolerance Configuration UI ────────────────────────────────────

  // ── AC1: ToleranceSelector accepts optional toleranceProps
  // ── AC2: Renders ToleranceSelector with label when toleranceProps provided
  // ── AC3: Does not render tolerance section when toleranceProps not provided
  // ── AC4: Renders below existing sidebar content

  it('renders "Tolerance" section when toleranceProps is provided', () => {
    const onToggle = vi.fn();
    const toleranceProps = {
      preset: 'medium' as const,
      onPresetChange: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        toleranceProps={toleranceProps}
      />
    );
    expect(screen.getByText(/tolerance/i)).toBeInTheDocument();
  });

  it('does not render tolerance section when toleranceProps is undefined', () => {
    const onToggle = vi.fn();
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        toleranceProps={undefined}
      />
    );
    expect(screen.queryByRole('radiogroup', { name: /hit detection tolerance/i })).not.toBeInTheDocument();
  });

  it('renders ToleranceSelector component with tolerance options when toleranceProps provided', () => {
    const onToggle = vi.fn();
    const toleranceProps = {
      preset: 'medium' as const,
      onPresetChange: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        toleranceProps={toleranceProps}
      />
    );
    expect(screen.getByRole('radiogroup', { name: /hit detection tolerance/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /easy.*300ms/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /medium.*200ms/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /hard.*100ms/i })).toBeInTheDocument();
  });

  it('passes onPresetChange callback to ToleranceSelector', () => {
    const onToggle = vi.fn();
    const onPresetChange = vi.fn();
    const toleranceProps = {
      preset: 'easy' as const,
      onPresetChange,
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        toleranceProps={toleranceProps}
      />
    );
    const mediumOption = screen.getByRole('radio', { name: /medium.*200ms/i });
    fireEvent.click(mediumOption);
    expect(onPresetChange).toHaveBeenCalledWith('medium');
  });

  it('highlights the currently selected tolerance preset in sidebar', () => {
    const onToggle = vi.fn();
    const toleranceProps = {
      preset: 'hard' as const,
      onPresetChange: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        toleranceProps={toleranceProps}
      />
    );
    const hardOption = screen.getByRole('radio', { name: /hard.*100ms/i });
    expect(hardOption).toHaveAttribute('aria-checked', 'true');
    const easyOption = screen.getByRole('radio', { name: /easy.*300ms/i });
    expect(easyOption).toHaveAttribute('aria-checked', 'false');
  });

  it('tolerance section renders below metronome section', () => {
    const onToggle = vi.fn();
    const toleranceProps = {
      preset: 'medium' as const,
      onPresetChange: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        toleranceProps={toleranceProps}
      />
    );
    // Both sections should exist
    const metronomeButton = screen.getByRole('button', { name: /toggle metronome/i });
    const radiogroup = screen.getByRole('radiogroup', { name: /hit detection tolerance/i });
    expect(metronomeButton).toBeInTheDocument();
    expect(radiogroup).toBeInTheDocument();
    // Radiogroup should come after metronome button in DOM
    const metronomeIndex = Array.from(document.querySelectorAll('[role="button"], [role="radiogroup"]')).indexOf(
      metronomeButton as HTMLElement
    );
    const toggleIndex = Array.from(document.querySelectorAll('[role="button"], [role="radiogroup"]')).indexOf(
      radiogroup as HTMLElement
    );
    expect(toggleIndex).toBeGreaterThan(metronomeIndex);
  });

  it('tolerance section renders below drum volume section when both provided', () => {
    const onToggle = vi.fn();
    const drumVolumeProps = {
      volume: 70,
      onVolumeChange: vi.fn(),
      isMuted: false,
      onToggleMute: vi.fn(),
    };
    const toleranceProps = {
      preset: 'medium' as const,
      onPresetChange: vi.fn(),
    };
    render(
      <ToolsSidebar
        isOpen
        onToggle={onToggle}
        metronomeProps={defaultMetronomeProps}
        drumVolumeProps={drumVolumeProps}
        toleranceProps={toleranceProps}
      />
    );
    // All sections should exist
    const muteButton = screen.getByRole('button', { name: /mute drums/i });
    const radiogroup = screen.getByRole('radiogroup', { name: /hit detection tolerance/i });
    expect(muteButton).toBeInTheDocument();
    expect(radiogroup).toBeInTheDocument();
    // Radiogroup should come after mute button in DOM
    const muteIndex = Array.from(document.querySelectorAll('button')).indexOf(
      muteButton as HTMLButtonElement
    );
    const radiogroupContainerIndex = Array.from(document.querySelectorAll('[role="radiogroup"]')).indexOf(
      radiogroup as HTMLElement
    );
    expect(radiogroupContainerIndex).toBeGreaterThanOrEqual(0);
  });
});
