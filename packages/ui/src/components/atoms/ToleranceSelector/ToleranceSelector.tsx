import React, { useRef } from 'react';
import type { TolerancePreset } from '@groovelab/utils';

export interface ToleranceSelectorProps {
  preset: TolerancePreset;
  onPresetChange: (preset: TolerancePreset) => void;
}

const OPTIONS: { value: TolerancePreset; label: string }[] = [
  { value: 'easy', label: 'Easy (300ms)' },
  { value: 'medium', label: 'Medium (200ms)' },
  { value: 'hard', label: 'Hard (100ms)' },
];

export const ToleranceSelector: React.FC<ToleranceSelectorProps> = ({ preset, onPresetChange }) => {
  const groupRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (index + 1) % OPTIONS.length;
      onPresetChange(OPTIONS[next].value);
      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[next]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (index - 1 + OPTIONS.length) % OPTIONS.length;
      onPresetChange(OPTIONS[prev].value);
      const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
      buttons?.[prev]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onPresetChange(OPTIONS[index].value);
    }
  };

  return (
    <div ref={groupRef} role="radiogroup" aria-label="Hit detection tolerance" className="flex gap-1">
      {OPTIONS.map((option, index) => {
        const isSelected = option.value === preset;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onPresetChange(option.value)}
            onKeyDown={e => handleKeyDown(e, index)}
            tabIndex={isSelected ? 0 : -1}
            className={[
              'flex-1 px-2 py-1.5 text-xs font-medium rounded-md border transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-green-500',
              isSelected
                ? 'bg-green-600 border-green-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
