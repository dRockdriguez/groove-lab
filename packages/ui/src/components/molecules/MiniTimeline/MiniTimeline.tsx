import React from 'react';
import type { MidiEvent } from '@groovelab/types';

export interface MiniTimelineProps {
  midiEvents: MidiEvent[];
  durationMs: number;
  currentTimeMs: number;
  onSeek: (timeMs: number) => void;
  className?: string;
}

export const MiniTimeline: React.FC<MiniTimelineProps> = ({
  midiEvents,
  durationMs,
  currentTimeMs,
  onSeek,
  className = '',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || durationMs <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(Math.round(ratio * durationMs));
  };

  const playheadPercent = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;

  return (
    <div
      ref={containerRef}
      role="presentation"
      aria-label="Timeline overview — click to seek"
      onClick={handleClick}
      className={[
        'relative h-8 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer overflow-hidden',
        className,
      ].join(' ')}
    >
      {/* Note markers */}
      {midiEvents.map((event, index) => {
        const leftPercent = durationMs > 0 ? (event.timestamp / durationMs) * 100 : 0;
        return (
          <div
            key={index}
            data-testid="mini-note-marker"
            className="absolute top-1 bottom-1 w-0.5 bg-green-500 opacity-70"
            style={{ left: `${leftPercent}%` }}
          />
        );
      })}

      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white"
        style={{ left: `${playheadPercent}%` }}
        aria-hidden="true"
      />
    </div>
  );
};
