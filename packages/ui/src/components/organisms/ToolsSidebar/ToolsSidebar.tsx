import React from 'react';
import type { MetronomeControlProps } from '../../molecules/MetronomeControl';
import { MetronomeControl } from '../../molecules/MetronomeControl';
import type { LoopControlsProps } from '../../molecules/LoopControls';
import { LoopControls } from '../../molecules/LoopControls';
import type { ToleranceSelectorProps } from '../../atoms/ToleranceSelector';
import { ToleranceSelector } from '../../atoms/ToleranceSelector';

export type { LoopControlsProps };
export type { ToleranceSelectorProps };

export interface DrumVolumeProps {
  volume: number;
  onVolumeChange: (v: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export interface ToolsSidebarProps {
  /** Whether the sidebar is currently visible. */
  isOpen: boolean;
  /** Callback invoked when the toggle button is clicked. */
  onToggle: () => void;
  /** Props passed through to the MetronomeControl inside the sidebar. */
  metronomeProps: MetronomeControlProps;
  /** Props passed through to the LoopControls inside the sidebar. */
  loopProps?: LoopControlsProps;
  /** Props for the drum volume section; section is hidden when not provided. */
  drumVolumeProps?: DrumVolumeProps;
  /** Props for the tolerance selector; section is hidden when not provided. */
  toleranceProps?: ToleranceSelectorProps;
  className?: string;
}

export const ToolsSidebar: React.FC<ToolsSidebarProps> = ({
  isOpen,
  onToggle,
  metronomeProps,
  loopProps,
  drumVolumeProps,
  toleranceProps,
  className = '',
}) => {
  return (
    <>
      {/* Semi-transparent backdrop — mobile only (sm: breakpoint), closes drawer on click. */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 sm:hidden"
          aria-hidden="true"
          data-testid="tools-sidebar-backdrop"
          onClick={onToggle}
        />
      )}

      {/* ── Sidebar panel ─────────────────────────────────────────────────────
          Desktop/tablet  : fixed left, 320 px wide, slides horizontally.
          Mobile < 640px  : bottom drawer, full-width, max 60 vh, slides up.
          Very small <320px: full-screen modal (handled by sm:w-full override). */}
      <aside
        id="tools-sidebar-panel"
        className={[
          // Base positioning (desktop / tablet) — now on the right
          'fixed top-0 right-0 h-full z-30',
          // Desktop width
          'sm:w-80',
          // Mobile: bottom drawer
          'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-h-[60vh] max-sm:rounded-t-xl',
          // Very small: full screen modal (< 320px handled by max-sm catching all)
          // Background & border
          'bg-gray-50 dark:bg-gray-900',
          'border-l border-gray-200 dark:border-gray-700 sm:border-l',
          'max-sm:border-t max-sm:border-l-0',
          'shadow-lg',
          // Scroll if content exceeds viewport height
          'overflow-y-auto',
          // Slide animation
          'transition-transform duration-300 ease-in-out',
          // Desktop: slide right (open pushes right edge to 0, closed pushes it off-screen right)
          isOpen ? 'sm:translate-x-0' : 'sm:translate-x-full',
          // Mobile: slide up/down
          isOpen ? 'max-sm:translate-y-0' : 'max-sm:translate-y-full',
          className,
        ].join(' ')}
        role="complementary"
        aria-label="Tools sidebar containing metronome and loop controls"
        data-testid="tools-sidebar-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tools
          </span>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Toggle tools sidebar (Ctrl+T)"
            className={[
              'flex items-center justify-center w-10 h-10',
              'rounded-md',
              'hover:bg-gray-200 dark:hover:bg-gray-700',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-green-500',
            ].join(' ')}
          >
            <span aria-hidden="true" className="text-sm text-gray-600 dark:text-gray-400">
              ▶
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-6">
          <MetronomeControl {...metronomeProps} />
          {loopProps && <LoopControls {...loopProps} />}
          {drumVolumeProps && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Drum Volume
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={drumVolumeProps.volume}
                  aria-label="Drum volume"
                  onChange={e => drumVolumeProps.onVolumeChange(Number(e.target.value))}
                  className="flex-1 accent-green-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 w-8 text-right">
                  {drumVolumeProps.volume}
                </span>
              </div>
              <button
                type="button"
                aria-pressed={drumVolumeProps.isMuted}
                aria-label={drumVolumeProps.isMuted ? 'Unmute drums' : 'Mute drums'}
                onClick={drumVolumeProps.onToggleMute}
                className={[
                  'flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium',
                  'border transition-colors',
                  drumVolumeProps.isMuted
                    ? 'bg-red-100 dark:bg-red-900 border-red-400 text-red-700 dark:text-red-300'
                    : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300',
                  'hover:opacity-80',
                  'focus:outline-none focus:ring-2 focus:ring-green-500',
                ].join(' ')}
              >
                {drumVolumeProps.isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          )}
          {toleranceProps && (
            <div className="flex flex-col gap-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Tolerance
              </span>
              <ToleranceSelector {...toleranceProps} />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
