import React from 'react';
import type { MetronomeControlProps } from '../../molecules/MetronomeControl';
import { MetronomeControl } from '../../molecules/MetronomeControl';

// LoopControls type — we define an interface here to allow the sidebar
// to accept loop props even before LoopControls is implemented.
// Once LoopControls exists, import and use its props interface.
export interface LoopControlsProps {
  loopStartMs: number;
  onLoopStartChange: (ms: number) => void;
  loopEndMs: number;
  onLoopEndChange: (ms: number) => void;
  loopRepetitions: number | 'infinite';
  onLoopRepetitionsChange: (reps: number | 'infinite') => void;
  isLoopActive: boolean;
  onLoopToggle: (active: boolean) => void;
  durationMs: number;
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
  className?: string;
}

export const ToolsSidebar: React.FC<ToolsSidebarProps> = ({
  isOpen,
  onToggle,
  metronomeProps,
  loopProps,
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

      {/* ── Always-visible toggle button ──────────────────────────────────────
          Rendered at fixed top-left at a higher z-index than the sidebar so
          it remains accessible whether the sidebar is open or closed.        */}
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle tools sidebar (Ctrl+T)"
        aria-expanded={isOpen}
        aria-controls="tools-sidebar-panel"
        className={[
          'fixed top-4 left-4 z-40',
          'flex items-center justify-center w-10 h-10',
          'rounded-md',
          'bg-gray-100 dark:bg-gray-800',
          'hover:bg-gray-200 dark:hover:bg-gray-700',
          'border border-gray-200 dark:border-gray-700',
          'shadow',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-green-500',
        ].join(' ')}
        data-testid="tools-sidebar-toggle"
      >
        {/* Hamburger (closed) ↔ Left-chevron (open) */}
        <span aria-hidden="true" className="text-lg leading-none">
          {isOpen ? '◀' : '≡'}
        </span>
      </button>

      {/* ── Sidebar panel ─────────────────────────────────────────────────────
          Desktop/tablet  : fixed left, 320 px wide, slides horizontally.
          Mobile < 640px  : bottom drawer, full-width, max 60 vh, slides up.
          Very small <320px: full-screen modal (handled by sm:w-full override). */}
      <aside
        id="tools-sidebar-panel"
        className={[
          // Base positioning (desktop / tablet)
          'fixed top-0 left-0 h-full z-30',
          // Desktop width
          'sm:w-80',
          // Mobile: bottom drawer
          'max-sm:top-auto max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:w-full max-sm:max-h-[60vh] max-sm:rounded-t-xl',
          // Very small: full screen modal (< 320px handled by max-sm catching all)
          // Background & border
          'bg-gray-50 dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-700 sm:border-r',
          'max-sm:border-t max-sm:border-r-0',
          'shadow-lg',
          // Scroll if content exceeds viewport height
          'overflow-y-auto',
          // Slide animation
          'transition-transform duration-300 ease-in-out',
          // Desktop: slide left/right
          isOpen ? 'sm:translate-x-0' : 'sm:-translate-x-full',
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
              ◀
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-6">
          <MetronomeControl {...metronomeProps} />
          {/* TODO: Uncomment when LoopControls component is created */}
          {/* {loopProps && <LoopControls {...loopProps} />} */}
        </div>
      </aside>
    </>
  );
};
