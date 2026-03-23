import React, { useMemo } from 'react';
import type { ScoringEvent } from '@groovelab/utils';

export interface HitCounterProps {
  scoringEvents: ScoringEvent[];
  isPlaying: boolean;
  className?: string;
}

interface CountBox {
  label: string;
  count: number;
  color: string;
}

export const HitCounter: React.FC<HitCounterProps> = ({
  scoringEvents,
  isPlaying,
  className = '',
}) => {
  const events = useMemo(() => scoringEvents ?? [], [scoringEvents]);

  const hitCount = useMemo(
    () => events.filter((e) => e.classification === 'correct').length,
    [events],
  );
  const earlyCount = useMemo(
    () => events.filter((e) => e.classification === 'early').length,
    [events],
  );
  const lateCount = useMemo(
    () => events.filter((e) => e.classification === 'late').length,
    [events],
  );
  const violationCount = useMemo(
    () => events.filter((e) => e.classification === 'wrong_note').length,
    [events],
  );

  const boxes: CountBox[] = [
    { label: 'Hits', count: hitCount, color: '#22C55E' },
    { label: 'Early', count: earlyCount, color: '#A855F7' },
    { label: 'Late', count: lateCount, color: '#FB923C' },
    { label: 'Violations', count: violationCount, color: '#EF4444' },
  ];

  const ariaLabel = `Hit counter: ${hitCount} hits, ${earlyCount} early, ${lateCount} late, ${violationCount} violations`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={[
        'flex flex-col sm:flex-row gap-2',
        !isPlaying ? 'opacity-60 cursor-not-allowed' : 'opacity-100',
        className,
      ].join(' ')}
    >
      {boxes.map((box) => (
        <div
          key={box.label}
          className={[
            'flex flex-col items-center justify-center',
            'min-w-[80px] max-w-[100px] p-2 rounded-md',
            isPlaying ? 'bg-gray-100' : 'bg-gray-50',
          ].join(' ')}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: box.color,
              marginBottom: 4,
            }}
          />
          <span className="text-lg font-bold text-gray-900">{box.count}</span>
          <span className="text-sm text-gray-600">{box.label}</span>
        </div>
      ))}
    </div>
  );
};
