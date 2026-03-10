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
        'px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500',
        isSelected
          ? 'bg-green-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
      ].join(' ')}
    >
      {label}
    </button>
  );
});
