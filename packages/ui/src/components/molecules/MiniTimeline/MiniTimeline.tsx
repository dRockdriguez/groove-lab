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
  loopStartMs,
  loopEndMs,
  isLoopActive = false,
  onLoopStartChange,
  onLoopEndChange,
  onLoopDragStart,
  onLoopDragEnd,
  className = '',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // ─── Drag-to-create loop state ─────────────────────────────────────────────
  const [dragStartMs, setDragStartMs] = React.useState<number | null>(null);
  const [dragCurrentMs, setDragCurrentMs] = React.useState<number | null>(null);
  const [isDraggingLoop, setIsDraggingLoop] = React.useState(false);

  // ─── Mobile tap fallback ───────────────────────────────────────────────────
  const [tapStartMs, setTapStartMs] = React.useState<number | null>(null);

  const beatMarkers = React.useMemo(
    () => (metronomeEnabled ? calculateBeatMarkers(bpm, durationMs) : []),
    [bpm, durationMs, metronomeEnabled]
  );

  const getTimeFromMouseEvent = (e: React.MouseEvent<HTMLDivElement>): number => {
    if (!containerRef.current || durationMs <= 0) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return Math.round(ratio * durationMs);
  };

  // ─── Mouse handlers for drag-to-select ────────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onLoopStartChange || !onLoopEndChange) return;
    const timeMs = getTimeFromMouseEvent(e);
    setDragStartMs(timeMs);
    setDragCurrentMs(timeMs);
    setIsDraggingLoop(true);
    onLoopDragStart?.();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingLoop || dragStartMs === null) return;
    const timeMs = getTimeFromMouseEvent(e);
    setDragCurrentMs(timeMs);
  };

  const handleMouseUp = () => {
    if (!isDraggingLoop) return;
    if (dragStartMs !== null && dragCurrentMs !== null) {
      const start = Math.min(dragStartMs, dragCurrentMs);
      const end = Math.max(dragStartMs, dragCurrentMs);
      if (end - start >= 500) {
        onLoopStartChange?.(start);
        onLoopEndChange?.(end);
      }
    }
    setDragStartMs(null);
    setDragCurrentMs(null);
    setIsDraggingLoop(false);
    onLoopDragEnd?.();
  };

  // ─── Click handler for seek (when no loop callbacks) ──────────────────────
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingLoop) return;
    if (onLoopStartChange && onLoopEndChange) return; // drag handles this
    if (!containerRef.current || durationMs <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(Math.round(ratio * durationMs));
  };

  // ─── Touch handler (mobile tap-to-loop fallback) ───────────────────────────
  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!onLoopStartChange || !onLoopEndChange) return;
    if (!containerRef.current || durationMs <= 0) return;
    const touch = e.changedTouches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const timeMs = Math.round(ratio * durationMs);

    if (tapStartMs === null) {
      setTapStartMs(timeMs);
    } else {
      const start = Math.min(tapStartMs, timeMs);
      const end = Math.max(tapStartMs, timeMs);
      if (end - start >= 500) {
        onLoopStartChange(start);
        onLoopEndChange(end);
      }
      setTapStartMs(null);
    }
  };

  // ─── Bracket drag handlers ─────────────────────────────────────────────────
  const handleBracketMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    bracketType: 'start' | 'end'
  ) => {
    e.stopPropagation();
    if (!containerRef.current || durationMs <= 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const initialX = e.clientX;
    const initialMs = bracketType === 'start' ? (loopStartMs ?? 0) : (loopEndMs ?? 0);
    // Capture current loop bounds at drag start time
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

  const playheadPercent = durationMs > 0 ? (currentTimeMs / durationMs) * 100 : 0;

  // Drag preview
  const isDragging = isDraggingLoop && dragStartMs !== null && dragCurrentMs !== null;
  const dragPreviewStart = isDragging ? Math.min(dragStartMs!, dragCurrentMs!) : 0;
  const dragPreviewEnd = isDragging ? Math.max(dragStartMs!, dragCurrentMs!) : 0;
  const dragPreviewLeft = durationMs > 0 ? (dragPreviewStart / durationMs) * 100 : 0;
  const dragPreviewWidth = durationMs > 0 ? ((dragPreviewEnd - dragPreviewStart) / durationMs) * 100 : 0;

  // Loop marker positions
  const hasLoop = loopStartMs !== undefined && loopEndMs !== undefined && loopStartMs < loopEndMs;
  const loopStartPercent = hasLoop ? (loopStartMs! / durationMs) * 100 : 0;
  const loopEndPercent = hasLoop ? (loopEndMs! / durationMs) * 100 : 0;
  const loopFillWidth = loopEndPercent - loopStartPercent;

  const hasLoopCallbacks = Boolean(onLoopStartChange && onLoopEndChange);

  return (
    <div
      ref={containerRef}
      role="presentation"
      aria-label={
        hasLoop
          ? `Timeline overview — loop from ${Math.round(loopStartMs! / 1000)}s to ${Math.round(loopEndMs! / 1000)}s`
          : 'Timeline overview — click to seek'
      }
      onMouseDown={hasLoopCallbacks ? handleMouseDown : undefined}
      onMouseMove={hasLoopCallbacks ? handleMouseMove : undefined}
      onMouseUp={hasLoopCallbacks ? handleMouseUp : undefined}
      onClick={handleClick}
      onTouchEnd={hasLoopCallbacks ? handleTouchEnd : undefined}
      className={[
        'relative h-8 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer overflow-hidden',
        className,
      ].join(' ')}
      style={{ cursor: isDragging ? 'col-resize' : 'pointer' }}
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

      {/* Drag preview (blue outline while dragging) */}
      {isDragging && dragPreviewWidth > 0 && (
        <div
          data-testid="loop-drag-preview"
          aria-hidden="true"
          className="absolute top-0 bottom-0"
          style={{
            left: `${dragPreviewLeft}%`,
            width: `${dragPreviewWidth}%`,
            backgroundColor: '#3B82F6',
            opacity: 0.2,
            outline: '2px solid #3B82F6',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Loop region fill + brackets */}
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
            }}
          />

          {/* Start bracket "[" */}
          <div
            data-testid="loop-start-marker"
            aria-hidden="true"
            className="absolute top-0 bottom-0 flex items-center"
            style={{
              left: `${loopStartPercent}%`,
              transform: 'translateX(-50%)',
              cursor: 'col-resize',
              zIndex: 10,
            }}
            onMouseDown={(e) => handleBracketMouseDown(e, 'start')}
          >
            <span
              style={{
                color: '#10B981',
                fontWeight: 'bold',
                fontSize: '14px',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              [
            </span>
          </div>

          {/* End bracket "]" */}
          <div
            data-testid="loop-end-marker"
            aria-hidden="true"
            className="absolute top-0 bottom-0 flex items-center"
            style={{
              left: `${loopEndPercent}%`,
              transform: 'translateX(-50%)',
              cursor: 'col-resize',
              zIndex: 10,
            }}
            onMouseDown={(e) => handleBracketMouseDown(e, 'end')}
          >
            <span
              style={{
                color: '#10B981',
                fontWeight: 'bold',
                fontSize: '14px',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              ]
            </span>
          </div>
        </>
      )}

      {/* Mobile tap hint */}
      {tapStartMs !== null && (
        <div
          data-testid="loop-tap-hint"
          aria-live="polite"
          className="absolute bottom-0 left-0 right-0 text-center text-xs text-white bg-black bg-opacity-50 py-0.5"
        >
          Tap to set loop end
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
