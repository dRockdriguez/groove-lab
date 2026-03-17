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
  /** Loop region start in ms */
  loopStartMs?: number;
  /** Loop region end in ms */
  loopEndMs?: number;
  /** Whether the loop is currently active */
  isLoopActive?: boolean;
  /** Called when user drags to set a new loop start */
  onLoopStartChange?: (ms: number) => void;
  /** Called when user drags to set a new loop end */
  onLoopEndChange?: (ms: number) => void;
  /** Called when user starts a loop drag interaction */
  onLoopDragStart?: () => void;
  /** Called when user finishes a loop drag interaction */
  onLoopDragEnd?: () => void;
  className?: string;
}

export const ExercisePlaybackTimeline: React.FC<ExercisePlaybackTimelineProps> = ({
  midiEvents,
  durationMs,
  currentTimeMs,
  bpm = 120,
  metronomeEnabled = false,
  loopStartMs,
  loopEndMs,
  isLoopActive = false,
  onLoopStartChange,
  onLoopEndChange,
  onLoopDragStart,
  onLoopDragEnd,
  className = '',
}) => {
  const tracksRef = React.useRef<HTMLDivElement>(null);

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
  // eslint-disable-next-line react-hooks/rules-of-hooks
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

  // ─── Loop marker positions ─────────────────────────────────────────────────
  const hasLoop = loopStartMs !== undefined && loopEndMs !== undefined && loopStartMs < loopEndMs;
  const loopStartPercent = hasLoop ? (loopStartMs! / durationMs) * 100 : 0;
  const loopEndPercent = hasLoop ? (loopEndMs! / durationMs) * 100 : 0;
  const loopFillWidth = loopEndPercent - loopStartPercent;

  // ─── Bracket drag handlers ─────────────────────────────────────────────────
  const handleBracketMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    bracketType: 'start' | 'end'
  ) => {
    e.stopPropagation();
    if (!tracksRef.current || durationMs <= 0) return;

    const rect = tracksRef.current.getBoundingClientRect();
    const initialX = e.clientX;
    const initialMs = bracketType === 'start' ? (loopStartMs ?? 0) : (loopEndMs ?? 0);
    const capturedLoopEndMs = loopEndMs ?? 0;
    const capturedLoopStartMs = loopStartMs ?? 0;

    const handleDrag = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - initialX;
      const deltaPercent = deltaX / rect.width;
      const deltaMs = deltaPercent * durationMs;
      const newMs = Math.max(0, Math.min(durationMs, initialMs + deltaMs));

      if (bracketType === 'start') {
        if (newMs < capturedLoopEndMs) onLoopStartChange?.(newMs);
      } else {
        if (newMs > capturedLoopStartMs) onLoopEndChange?.(newMs);
      }
    };

    const handleDragEnd = () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
      onLoopDragEnd?.();
    };

    onLoopDragStart?.();
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
  };

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
        <div ref={tracksRef} className="relative flex-1">
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

          {/* Loop overlay (full height, behind notes) */}
          {hasLoop && (
            <>
              {/* Semi-transparent fill */}
              <div
                data-testid="loop-region-fill"
                aria-hidden="true"
                className="absolute top-0 bottom-0"
                style={{
                  left: `${loopStartPercent}%`,
                  width: `${loopFillWidth}%`,
                  backgroundColor: isLoopActive ? '#10B981' : '#059669',
                  opacity: 0.15,
                  pointerEvents: 'none',
                  zIndex: 5,
                }}
              />

              {/* Start bracket "[" — draggable, full height */}
              <div
                data-testid="loop-start-marker"
                aria-hidden="true"
                className="absolute top-0 bottom-0 flex items-center"
                style={{
                  left: `${loopStartPercent}%`,
                  transform: 'translateX(-50%)',
                  cursor: 'col-resize',
                  zIndex: 15,
                  pointerEvents: 'auto',
                }}
                onMouseDown={(e) => handleBracketMouseDown(e, 'start')}
              >
                <span
                  style={{
                    color: '#10B981',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  [
                </span>
              </div>

              {/* End bracket "]" — draggable, full height */}
              <div
                data-testid="loop-end-marker"
                aria-hidden="true"
                className="absolute top-0 bottom-0 flex items-center"
                style={{
                  left: `${loopEndPercent}%`,
                  transform: 'translateX(-50%)',
                  cursor: 'col-resize',
                  zIndex: 15,
                  pointerEvents: 'auto',
                }}
                onMouseDown={(e) => handleBracketMouseDown(e, 'end')}
              >
                <span
                  style={{
                    color: '#10B981',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  ]
                </span>
              </div>
            </>
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
