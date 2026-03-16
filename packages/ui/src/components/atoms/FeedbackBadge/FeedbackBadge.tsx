import React from 'react';
import type { FeedbackType } from '@groovelab/types';

export interface FeedbackBadgeProps {
  feedbackType: FeedbackType;
  className?: string;
}

const feedbackConfig: Record<
  FeedbackType,
  { label: string; colorClass: string }
> = {
  hit: { label: 'Hit', colorClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  miss: { label: 'Miss', colorClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  wrongNote: {
    label: 'Wrong Note',
    colorClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  early: {
    label: 'Early',
    colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  late: {
    label: 'Late',
    colorClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  weak: {
    label: 'Weak',
    colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  strong: {
    label: 'Strong',
    colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
};

export const FeedbackBadge: React.FC<FeedbackBadgeProps> = ({
  feedbackType,
  className = '',
}) => {
  const { label, colorClass } = feedbackConfig[feedbackType];

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colorClass,
        className,
      ].join(' ')}
    >
      {label}
    </span>
  );
};
