import React from 'react';
import type { MidiEvent } from '@groovelab/types';
import { clamp } from '@groovelab/utils';
import { TrackLabel } from '../../molecules/TrackLabel';

export interface ExercisePlaybackTimelineProps {
  midiEvents: MidiEvent[];
  durationMs: number;
  currentTimeMs: number;
  className?: string;
}

export const ExercisePlaybackTimeline: React.FC<ExercisePlaybackTimelineProps> = ({
  midiEvents,
  durationMs,
  currentTimeMs,
  className = '',
}) => {
  if (midiEvents.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        This exercise contains no note data.
      </div>
    );
  }

  // Collect unique note numbers in encounter order
  const uniqueNotes = Array.from(new Set(midiEvents.map((e) => e.note)));

  // Group events by note number
  const eventsByNote: Record<number, MidiEvent[]> = {};
  for (const note of uniqueNotes) {
    eventsByNote[note] = midiEvents.filter((e) => e.note === note);
  }

  const rawPlayheadPercent = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;
  const playheadPercent = clamp(rawPlayheadPercent, 0, 100);

  return (
    <div
      className={['overflow-x-auto', className].join(' ')}
      role="region"
      aria-label="Exercise timeline"
    >
      <div className="flex">
        {/* Labels column (fixed width, no relative positioning) */}
        <div className="w-32 shrink-0">
          {uniqueNotes.map((note) => (
            <div key={`label-${note}`} className="flex items-center border-b border-gray-200 dark:border-gray-700 h-10">
              <div className="px-3 py-2">
                <TrackLabel noteNumber={note} />
              </div>
            </div>
          ))}
        </div>

        {/* Tracks with playhead (relative positioned) */}
        <div className="relative flex-1">
          {/* Playhead */}
          <div
            data-testid="playhead"
            className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10 pointer-events-none"
            style={{ left: `${playheadPercent}%` }}
            aria-hidden="true"
          />

          {/* Tracks */}
          {uniqueNotes.map((note) => (
            <div key={note} className="border-b border-gray-200 dark:border-gray-700 h-10 relative">
              {/* Track lane */}
              {eventsByNote[note].map((event, index) => {
                const leftPercent =
                  durationMs > 0 ? (event.timestamp / durationMs) * 100 : 0;
                const opacity = Math.max(0.3, event.velocity / 127);

                return (
                  <div
                    key={index}
                    data-testid="note-marker"
                    className="absolute top-1 bottom-1 w-2 rounded-sm bg-green-500"
                    style={{
                      left: `${leftPercent}%`,
                      opacity,
                    }}
                    title={`t=${event.timestamp}ms v=${event.velocity}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
