import React from 'react';
import { getDrumName } from '@groovelab/utils';

export interface TrackLabelProps {
  noteNumber: number;
  className?: string;
}

/** Known hyphenated compound words within drum names */
const HYPHENATED_COMPOUNDS: string[] = ['hi-hat'];

function humanizeDrumName(slug: string): string {
  let result = slug;
  // Protect known hyphenated compound words with a placeholder
  const placeholders: Record<string, string> = {};
  HYPHENATED_COMPOUNDS.forEach((compound, i) => {
    const key = `__COMPOUND_${i}__`;
    placeholders[key] = compound
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('-');
    result = result.replace(compound, key);
  });

  // Split the rest on hyphens and title-case
  const words = result.split('-').map((word) => {
    // Restore compound placeholders
    for (const [k, v] of Object.entries(placeholders)) {
      if (word === k) return v;
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  return words.join(' ');
}

export const TrackLabel: React.FC<TrackLabelProps> = ({ noteNumber, className = '' }) => {
  const rawName = getDrumName(noteNumber);
  const label = rawName ? humanizeDrumName(rawName) : `Note ${noteNumber}`;

  return (
    <div
      className={[
        'flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap',
        className,
      ].join(' ')}
    >
      {label}
    </div>
  );
};
