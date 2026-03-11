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

export const InstrumentButton = React.forwardRef<HTMLButtonElement, InstrumentButtonProps>(
  ({ label, isSelected, onClick, id, tabIndex, onKeyDown }, ref) => {
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
          'px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border',
          'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ring-offset-white dark:ring-offset-gray-900',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          isSelected
            ? 'bg-indigo-600 dark:bg-indigo-500 text-green-400 dark:text-white border-indigo-600 dark:border-indigo-500'
            : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700',
        ].join(' ')}
      >
        {label}
      </button>
    );
  }
);
