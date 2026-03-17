import React from 'react';
import type { MidiEvent } from '@groovelab/types';

export interface MiniTimelineProps {
  midiEvents: MidiEvent[];
  durationMs: number;
  currentTimeMs: number;
  onSeek: (timeMs: number) => void;
  /** Current BPM used to calculate metronome marker positions. */
  bpm?: number;
  /** When true, renders metronome beat markers across the timeline. */
  metronomeEnabled?: boolean;
  className?: string;
}

interface BeatMarker {
  percent: number;
  isDownbeat: boolean;
}

function calculateBeatMarkers(bpm: number | undefined, durationMs: number): BeatMarker[] {
  if (!bpm || bpm <= 0 || durationMs <= 0) return [];
  const beatIntervalMs = 60000 / bpm;
  const numBeats = Math.floor(durationMs / beatIntervalMs);
  const displayBeats = Math.min(numBeats, 1000);
  return Array.from({ length: displayBeats }, (_, i) => ({
    percent: (i * beatIntervalMs / durationMs) * 100,
    isDownbeat: i % 4 === 0,
  }));
}

export const MiniTimeline: React.FC<MiniTimelineProps> = ({
  midiEvents,
  durationMs,
  currentTimeMs,
  onSeek,
  bpm,
  metronomeEnabled = false,
  className = '',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const beatMarkers = React.useMemo(
    () => (metronomeEnabled ? calculateBeatMarkers(bpm, durationMs) : []),
    [bpm, durationMs, metronomeEnabled]
  );

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
      {/* Metronome beat markers */}
      {beatMarkers.length > 0 && (
        <div
          role="img"
          aria-label={`Metronome beats at ${beatMarkers.length} intervals across the timeline`}
          className="absolute inset-0"
          style={{ pointerEvents: 'none' }}
        >
          {beatMarkers.map((beat, i) => (
            <div
              key={i}
              data-testid={beat.isDownbeat ? 'metronome-downbeat-marker' : 'metronome-beat-marker'}
              aria-hidden="true"
              className="absolute top-0 bottom-0"
              style={{
                left: `${beat.percent}%`,
                width: beat.isDownbeat ? '3px' : '2px',
                backgroundColor: '#EF4444',
                opacity: beat.isDownbeat ? 1 : 0.7,
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>
      )}

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
