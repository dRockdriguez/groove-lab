import React from 'react';
import type { InstrumentType } from '@groovelab/types';

export interface InstrumentButtonProps {
  instrumentType: InstrumentType;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  id?: string;
  tabIndex?: number;
  onKeyDown?: React.KeyboardEventHandler;
}

export const InstrumentButton = React.forwardRef<
  HTMLButtonElement,
  InstrumentButtonProps
>(({ label, isSelected, onClick, id, tabIndex, onKeyDown }, ref) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
    onKeyDown?.(e);
  };

  return (
    <button
      ref={ref}
      id={id}
      role="tab"
      aria-selected={isSelected}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={[
        'px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ring-offset-white dark:ring-offset-gray-900',
        'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700',
        isSelected
          ? 'bg-indigo-600 dark:bg-indigo-500 text-white dark:text-white ring-1 ring-green-500/40'
          : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800',
      ].join(' ')}
    >
      {label}
    </button>
  );
});
