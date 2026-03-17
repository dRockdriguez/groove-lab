import React from 'react';
import type { MidiEvent } from '@groovelab/types';
import { clamp } from '@groovelab/utils';
import { TrackLabel } from '../../molecules/TrackLabel';

export interface ExercisePlaybackTimelineProps {
  midiEvents: MidiEvent[];
  durationMs: number;
  currentTimeMs: number;
  bpm?: number;
  metronomeEnabled?: boolean;
  className?: string;
}

export const ExercisePlaybackTimeline: React.FC<ExercisePlaybackTimelineProps> = ({
  midiEvents,
  durationMs,
  currentTimeMs,
  bpm = 120,
  metronomeEnabled = false,
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

  // Calculate metronome marker positions
  const metronomeMarkers = React.useMemo(() => {
    if (!metronomeEnabled || !bpm || durationMs <= 0) return [];

    const beatIntervalMs = 60000 / bpm;
    const numBeats = Math.floor(durationMs / beatIntervalMs);
    const markers = [];

    for (let i = 0; i <= numBeats; i++) {
      const positionMs = i * beatIntervalMs;
      if (positionMs <= durationMs) {
        const positionPercent = (positionMs / durationMs) * 100;
        const isDownbeat = i % 4 === 0; // Every 4th beat is a downbeat
        markers.push({ positionPercent, isDownbeat, beatIndex: i });
      }
    }
    return markers;
  }, [bpm, durationMs, metronomeEnabled]);

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
          {/* Metronome markers overlay */}
          {metronomeMarkers.length > 0 && (
            <div
              role="img"
              aria-label={`Metronome beats at ${metronomeMarkers.length} intervals across the timeline`}
              className="absolute top-0 bottom-0 w-full pointer-events-none"
            >
              {metronomeMarkers.map((marker) => (
                <div
                  key={`metronome-${marker.beatIndex}`}
                  data-testid={marker.isDownbeat ? 'metronome-downbeat-marker' : 'metronome-beat-marker'}
                  className={`absolute top-0 bottom-0 ${
                    marker.isDownbeat
                      ? 'w-1 bg-red-600'
                      : 'w-px bg-red-400'
                  }`}
                  style={{
                    left: `${marker.positionPercent}%`,
                    opacity: marker.isDownbeat ? 1 : 0.6,
                  }}
                />
              ))}
            </div>
          )}

          {/* Playhead */}
          <div
            data-testid="playhead"
            className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10 pointer-events-none"
            style={{ left: `${playheadPercent}%`, position: 'absolute', pointerEvents: 'none' }}
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
