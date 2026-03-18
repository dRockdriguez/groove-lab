import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ExercisePlaybackData, PlaybackState } from '@groovelab/types';
import { formatDuration, buildHitLookup, validateDrumHit } from '@groovelab/utils';
import type { DrumHitValidation } from '@groovelab/utils';

import { PlaybackControls } from '../../molecules/PlaybackControls';
import { MiniTimeline } from '../../molecules/MiniTimeline';
import { MidiStatusIndicator, type MidiConnectionStatus } from '../../atoms/MidiStatusIndicator';
import { ExercisePlaybackTimeline } from '../ExercisePlaybackTimeline';
import { DrumHitFeedback } from '../../molecules/DrumHitFeedback';
import { ToolsSidebar } from '../ToolsSidebar';

export interface ExercisePlaybackPageProps {
  /** Provide exercise data directly (no fetch needed) */
  exercise?: ExercisePlaybackData;
  /** Provide an exercise ID to fetch data from the API */
  exerciseId?: string;
  className?: string;
}

export const ExercisePlaybackPage: React.FC<ExercisePlaybackPageProps> = ({
  exercise: exerciseProp,
  exerciseId,
  className = '',
}) => {
  // ─── Data loading ──────────────────────────────────────────────────────────
  const [exercise, setExercise] = useState<ExercisePlaybackData | null>(exerciseProp ?? null);
  const [isLoading, setIsLoading] = useState(!exerciseProp && Boolean(exerciseId));
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchExercise = useCallback(async () => {
    if (!exerciseId) return;
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`http://localhost:8000/exercises/${exerciseId}`);
      if (!res.ok) {
        setFetchError('Could not load exercise data. Please try again.');
        return;
      }
      const data: ExercisePlaybackData = await res.json();
      setExercise(data);
    } catch {
      setFetchError('Could not load exercise data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    if (!exerciseProp && exerciseId) {
      void fetchExercise();
    }
  }, [exerciseProp, exerciseId, fetchExercise]);

  // ─── Playback state ────────────────────────────────────────────────────────
  const [playbackState, setPlaybackState] = useState<PlaybackState>('stopped');
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastAudioTimeRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Keep a ref that always reflects the latest playbackState so that event
  // handlers (blur, MIDI statechange) that close over the ref don't become stale.
  const playbackStateRef = useRef<PlaybackState>('stopped');

  // Helper to update both the React state and the synchronous ref together.
  const setPlaybackStateSynced = useCallback((next: PlaybackState) => {
    playbackStateRef.current = next;
    setPlaybackState(next);
  }, []);

  // ─── MIDI state ────────────────────────────────────────────────────────────
  const [midiStatus, setMidiStatus] = useState<MidiConnectionStatus>('disconnected');
  const [midiDeviceName, setMidiDeviceName] = useState<string | undefined>();
  const midiInitializedRef = useRef(false);

  // MIDI message handler — parses Web MIDI bytes and validates drum hits
  const handleMidiMessage = useCallback((e: any) => {
    // Only validate during active playback
    if (playbackStateRef.current !== 'playing') return;

    const data: Uint8Array = e.data;
    if (!data || data.length < 3) return;

    const status = data[0] & 0xF0;
    const note = data[1];
    const velocity = data[2];

    // Only process Note-On (0x90) with velocity > 0
    // velocity=0 on 0x90 is semantically Note-Off per Web MIDI API
    if (status !== 0x90 || velocity === 0) return;

    // Debounce: ignore repeated hits on same note within 50ms
    const now = currentTimeMsRef.current;
    const lastHitTime = lastHitTimePerNoteRef.current[note] ?? -Infinity;
    if (now - lastHitTime < 50) return;
    lastHitTimePerNoteRef.current[note] = now;

    // Validate hit against exercise
    const result = validateDrumHit(note, now, hitLookupRef.current);
    if (result !== null) {
      setValidatedHits(prev => [...prev, result]);
    }
  }, []); // Empty deps — all reads come from refs

  const initMidi = useCallback(async () => {
    if (midiInitializedRef.current) return;
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) return;
    midiInitializedRef.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const access: any = await navigator.requestMIDIAccess();
      midiAccessRef.current = access; // Store for cleanup on unmount

      const inputs = Array.from(access.inputs.values()) as Array<{ name?: string; onmidimessage?: any }>;
      if (inputs.length > 0) {
        setMidiStatus('connected');
        setMidiDeviceName(inputs[0].name);
      } else {
        setMidiStatus('disconnected');
      }

      // Attach MIDI message handlers to all input ports
      for (const input of inputs) {
        (input as any).onmidimessage = handleMidiMessage;
      }

      // Listen for device state changes. Use optional chaining so tests that
      // don't include addEventListener on their mock don't throw.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (access as any).addEventListener?.('statechange', (e: any) => {
        if (e.port?.state === 'disconnected') {
          // Null out handler for disconnected port
          if (e.port?.onmidimessage !== undefined) {
            e.port.onmidimessage = null;
          }
          setMidiStatus('reconnect');
          // Pause playback when MIDI device disconnects during active playback
          if (playbackStateRef.current === 'playing' && audioRef.current) {
            audioRef.current.pause();
            setPlaybackStateSynced('paused');
          }
        } else if (e.port?.state === 'connected') {
          const updatedInputs = Array.from(access.inputs.values()) as Array<{ name?: string; onmidimessage?: any }>;
          if (updatedInputs.length > 0) {
            setMidiStatus('connected');
            setMidiDeviceName(updatedInputs[0].name);
            // Re-attach handlers to reconnected ports
            for (const input of updatedInputs) {
              (input as any).onmidimessage = handleMidiMessage;
            }
          }
        }
      });
    } catch {
      setMidiStatus('denied');
    }
  }, [setPlaybackStateSynced, handleMidiMessage]);

  // Initialize MIDI on page load via setTimeout(0) so it does NOT run during
  // the synchronous render — tests that use vi.useFakeTimers() won't see the
  // requestMIDIAccess call until they explicitly advance timers or click Play.
  useEffect(() => {
    const id = setTimeout(() => {
      void initMidi();
    }, 0);
    return () => clearTimeout(id);
  }, [initMidi]);

  // ─── Loop state ────────────────────────────────────────────────────────────
  const [loopStartMs, setLoopStartMs] = useState(0);
  const [loopEndMs, setLoopEndMs] = useState(0);
  const [isLoopActive, setIsLoopActive] = useState(false);
  const [loopRepetitions, setLoopRepetitions] = useState<number | 'infinite'>(1);
  const [currentLoopRepetition, setCurrentLoopRepetition] = useState(0);

  // Refs for loop state (needed in rAF callback to avoid stale closures)
  const isLoopActiveRef = useRef(false);
  const loopStartMsRef = useRef(0);
  const loopEndMsRef = useRef(0);
  const loopRepetitionsRef = useRef<number | 'infinite'>(1);
  const currentLoopRepetitionRef = useRef(0);

  // Keep refs in sync with state
  useEffect(() => { isLoopActiveRef.current = isLoopActive; }, [isLoopActive]);
  useEffect(() => { loopStartMsRef.current = loopStartMs; }, [loopStartMs]);
  useEffect(() => { loopEndMsRef.current = loopEndMs; }, [loopEndMs]);
  useEffect(() => { loopRepetitionsRef.current = loopRepetitions; }, [loopRepetitions]);
  useEffect(() => { currentLoopRepetitionRef.current = currentLoopRepetition; }, [currentLoopRepetition]);

  const handleLoopStartChange = useCallback((ms: number) => {
    setLoopStartMs(ms);
  }, []);

  const handleLoopEndChange = useCallback((ms: number) => {
    setLoopEndMs(ms);
  }, []);

  const handleLoopToggle = useCallback((enabled: boolean) => {
    setIsLoopActive(enabled);
    if (enabled) {
      setCurrentLoopRepetition(0);
    }
  }, []);

  const handleLoopRepetitionsChange = useCallback((count: number | 'infinite') => {
    setLoopRepetitions(count);
  }, []);

  const handleLoopClear = useCallback(() => {
    setLoopStartMs(0);
    setLoopEndMs(0);
    setIsLoopActive(false);
    setLoopRepetitions(1);
    setCurrentLoopRepetition(0);
  }, []);

  // ─── Ctrl+L keyboard shortcut to toggle loop ──────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        const currentIsActive = isLoopActiveRef.current;
        const currentStart = loopStartMsRef.current;
        const currentEnd = loopEndMsRef.current;
        const isValid = currentStart < currentEnd && currentEnd - currentStart >= 500;
        if (!currentIsActive && !isValid) return;
        setIsLoopActive((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Smooth playhead animation using requestAnimationFrame
  useEffect(() => {
    const updatePlayhead = () => {
      if (audioRef.current && playbackState === 'playing') {
        const currentTime = audioRef.current.currentTime * 1000;
        lastAudioTimeRef.current = currentTime;

        // Loop logic — use tolerance to catch loop end even with frame skips
        const LOOP_END_TOLERANCE_MS = 50; // Allow 50ms tolerance for detecting loop end
        if (
          isLoopActiveRef.current &&
          loopStartMsRef.current < loopEndMsRef.current &&
          currentTime >= loopEndMsRef.current - LOOP_END_TOLERANCE_MS &&
          currentTime >= loopStartMsRef.current // Ensure we're past loop start
        ) {
          const reps = loopRepetitionsRef.current;
          const currRep = currentLoopRepetitionRef.current;
          if (reps === 'infinite' || currRep < (reps as number)) {
            // Jump to loop start and increment counter
            audioRef.current.currentTime = loopStartMsRef.current / 1000;
            const newRep = currRep + 1;
            currentLoopRepetitionRef.current = newRep;
            setCurrentLoopRepetition(newRep);
            currentTimeMsRef.current = Math.round(loopStartMsRef.current);
            setCurrentTimeMs(Math.round(loopStartMsRef.current));
          } else {
            // Repetitions exhausted — disable loop and let playback continue
            isLoopActiveRef.current = false;
            setIsLoopActive(false);
            currentTimeMsRef.current = Math.round(currentTime);
            setCurrentTimeMs(Math.round(currentTime));
          }
        } else {
          currentTimeMsRef.current = Math.round(currentTime);
          setCurrentTimeMs(Math.round(currentTime));
        }

        animationFrameRef.current = requestAnimationFrame(updatePlayhead);
      }
    };

    if (playbackState === 'playing' && audioRef.current) {
      animationFrameRef.current = requestAnimationFrame(updatePlayhead);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [playbackState]);

  // ─── Play / Pause ──────────────────────────────────────────────────────────
  const handleTogglePlay = useCallback(async () => {
    if (!audioRef.current) return;

    if (playbackState === 'playing') {
      audioRef.current.pause();
      setPlaybackStateSynced('paused');
    } else {
      // Clear any previous audio error before re-attempting playback.
      setAudioError(null);

      // If restarting from stopped state, reset hit tracking
      if (playbackState === 'stopped') {
        setValidatedHits([]);
        lastHitTimePerNoteRef.current = {};
      }

      // Ensure MIDI is initialized when Play is clicked. This is especially
      // important for tests that use vi.useFakeTimers() where the setTimeout
      // on page load never fires before play is clicked.
      void initMidi();

      // Update the ref synchronously BEFORE the await so that any synchronous
      // event handlers (window blur, MIDI statechange) that fire between now
      // and the promise resolution see the correct state.
      playbackStateRef.current = 'playing';
      setPlaybackState('playing');

      try {
        await audioRef.current.play();
        // Play succeeded — state was already set to 'playing' above.
      } catch {
        setAudioError('Could not load audio file. Please try again later.');
        setPlaybackStateSynced('stopped');
      }
    }
  }, [playbackState, initMidi, setPlaybackStateSynced]);

  const handleSeek = useCallback((timeMs: number) => {
    currentTimeMsRef.current = timeMs;
    setCurrentTimeMs(timeMs);
    if (audioRef.current) {
      audioRef.current.currentTime = timeMs / 1000;
    }
  }, []);

  const handleBpmChange = useCallback((newBpm: number) => {
    setCurrentBpm(newBpm);
    if (audioRef.current && exercise) {
      // Convert BPM to playback rate relative to exercise's original BPM
      const playbackRate = newBpm / exercise.bpm;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [exercise]);

  // Pause playback when the browser window loses focus (tab switch or reload).
  useEffect(() => {
    const handleBlur = () => {
      if (playbackStateRef.current === 'playing' && audioRef.current) {
        audioRef.current.pause();
        setPlaybackStateSynced('paused');
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [setPlaybackStateSynced]);

  // Clean up MIDI debounce state when playback stops
  useEffect(() => {
    if (playbackState === 'stopped') {
      lastHitTimePerNoteRef.current = {};
    }
  }, [playbackState]);

  // Stop audio and clean up on unmount.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) audio.pause();
      // Null out any attached MIDI handlers to prevent stale state updates
      if (midiAccessRef.current) {
        const inputs = Array.from((midiAccessRef.current as any).inputs.values()) as any[];
        for (const input of inputs) {
          input.onmidimessage = null;
        }
      }
    };
  }, []);

  // ─── Metronome visualization state ─────────────────────────────────────────
  const [metronomeEnabled, setMetronomeEnabled] = useState(false);
  const [currentBpm, setCurrentBpm] = useState(exerciseProp?.bpm ?? 120);

  // Keep currentBpm in sync when exercise data loads (e.g., via fetch).
  useEffect(() => {
    if (exercise) {
      setCurrentBpm(exercise.bpm);
    }
  }, [exercise]);

  // ─── Tools sidebar state ───────────────────────────────────────────────────
  const [toolsSidebarOpen, setToolsSidebarOpen] = useState(false);

  // Restore sidebar state from sessionStorage on mount.
  useEffect(() => {
    const stored = sessionStorage.getItem('exerciseTools_sidebarOpen');
    if (stored !== null) {
      try {
        setToolsSidebarOpen(JSON.parse(stored) as boolean);
      } catch {
        // ignore malformed sessionStorage value
      }
    }
  }, []);

  const handleToggleToolsSidebar = useCallback(() => {
    setToolsSidebarOpen(prev => {
      const next = !prev;
      sessionStorage.setItem('exerciseTools_sidebarOpen', JSON.stringify(next));
      return next;
    });
  }, []);

  // Keyboard shortcut: Ctrl+T to toggle tools sidebar.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        handleToggleToolsSidebar();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleToolsSidebar]);

  // ─── MIDI Hit Detection ────────────────────────────────────────────────────
  const [validatedHits, setValidatedHits] = useState<DrumHitValidation[]>([]);

  // Refs for MIDI hit detection (avoid stale closures in async handler)
  const currentTimeMsRef = useRef(0);
  const midiAccessRef = useRef<any>(null);
  const hitLookupRef = useRef<ReturnType<typeof buildHitLookup>>({});
  const lastHitTimePerNoteRef = useRef<Record<number, number>>({});

  // Build hit lookup from exercise MIDI events
  const hitLookup = useMemo(
    () => (exercise ? buildHitLookup(exercise.midiEvents) : {}),
    [exercise]
  );

  // Sync hitLookup to ref (needed in MIDI handler)
  useEffect(() => {
    hitLookupRef.current = hitLookup;
  }, [hitLookup]);

  // Clear hits when exercise changes
  useEffect(() => {
    if (exercise) {
      setValidatedHits([]);
      lastHitTimePerNoteRef.current = {};
    }
  }, [exercise]);

  // ─── Loop validity ─────────────────────────────────────────────────────────
  const hasValidLoop = loopStartMs < loopEndMs && loopEndMs - loopStartMs >= 500;
  // Only pass loop markers to timelines if there's a valid loop set
  const loopMarkerProps = hasValidLoop
    ? { loopStartMs, loopEndMs, isLoopActive }
    : {};

  // ─── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-gray-500 dark:text-gray-400">
        Loading exercise…
      </div>
    );
  }

  if (fetchError) {
    return (
      <div role="alert" className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-red-600 dark:text-red-400">{fetchError}</p>
        <button
          type="button"
          aria-label="Retry loading exercise"
          onClick={() => void fetchExercise()}
          className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="flex items-center justify-center min-h-64 text-gray-500 dark:text-gray-400">
        No exercise selected.
      </div>
    );
  }

  return (
    <div
      className={[
        'flex h-screen overflow-hidden',
        className,
      ].join(' ')}
    >
      {/* ── Tools Sidebar ────────────────────────────────────────────────────
          Fixed left panel (desktop) or bottom drawer (mobile).
          MetronomeControl lives here; the sidebar can be toggled via the
          always-visible toggle button or the Ctrl+T keyboard shortcut.      */}
      <ToolsSidebar
        isOpen={toolsSidebarOpen}
        onToggle={handleToggleToolsSidebar}
        metronomeProps={{
          initialBpm: exercise.bpm,
          originalBpm: exercise.bpm,
          isPlaying: playbackState === 'playing',
          currentTimeMs,
          onBpmChange: handleBpmChange,
          onToggle: setMetronomeEnabled,
        }}
        loopProps={{
          loopStartMs,
          onLoopStartChange: handleLoopStartChange,
          loopEndMs,
          onLoopEndChange: handleLoopEndChange,
          loopRepetitions,
          onLoopRepetitionsChange: handleLoopRepetitionsChange,
          isLoopActive,
          onLoopToggle: handleLoopToggle,
          currentLoopRepetition,
          onLoopClear: handleLoopClear,
          durationMs: exercise.durationMs,
        }}
      />

      {/* ── Main content area ────────────────────────────────────────────────
          flex-1 so it fills all space not occupied by the sidebar.          */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header — use flat text (no nested child spans) so getByText(/bpm/i)
            matches exactly one element, not the label span + the container span. */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {exercise.title}
          </h1>
          <div
            className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400"
            aria-live="polite"
          >
            <span>BPM: {exercise.bpm}</span>
            <span>Duration: {formatDuration(exercise.durationMs)}</span>
          </div>
        </div>

        {/* Audio load error message */}
        {audioError && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400 px-4 sm:px-6">
            {audioError}
          </p>
        )}

        {/* MIDI connection status */}
        <div className="px-4 sm:px-6">
          <MidiStatusIndicator status={midiStatus} deviceName={midiDeviceName} />
        </div>

        {/* Audio element — requestAnimationFrame handles smooth playhead updates */}
        {exercise.audioUrl ? (
          <audio
            ref={audioRef}
            src={exercise.audioUrl}
            onEnded={() => setPlaybackStateSynced('stopped')}
            onError={() => {
              setAudioError('Could not load audio file. Please try again later.');
              setPlaybackStateSynced('stopped');
            }}
            aria-hidden="true"
          />
        ) : (
          <p
            className="text-sm text-yellow-700 dark:text-yellow-400 px-4 sm:px-6"
            role="note"
          >
            No audio file found for this exercise.
          </p>
        )}

        {/* Playback controls */}
        <div className="px-4 sm:px-6 py-2">
          <PlaybackControls
            state={playbackState}
            currentTimeMs={currentTimeMs}
            durationMs={exercise.durationMs}
            onTogglePlay={() => void handleTogglePlay()}
            onSeek={handleSeek}
          />
        </div>

        {/* Timeline area — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 flex flex-col gap-4">
          {/* Mini timeline overview */}
          <MiniTimeline
            midiEvents={exercise.midiEvents}
            durationMs={exercise.durationMs}
            currentTimeMs={currentTimeMs}
            onSeek={handleSeek}
            bpm={exercise.bpm}
            metronomeEnabled={metronomeEnabled}
            {...loopMarkerProps}
          />

          {/* Main timeline */}
          <ExercisePlaybackTimeline
            midiEvents={exercise.midiEvents}
            durationMs={exercise.durationMs}
            currentTimeMs={currentTimeMs}
            bpm={exercise.bpm}
            metronomeEnabled={metronomeEnabled}
            {...loopMarkerProps}
            onLoopStartChange={handleLoopStartChange}
            onLoopEndChange={handleLoopEndChange}
            isLoopActive={isLoopActive}
          />

          {/* Drum hit feedback — directly below timeline */}
          <DrumHitFeedback
            validatedHits={validatedHits}
            totalExpectedHits={exercise.midiEvents.length}
            isPlaying={playbackState === 'playing'}
          />
        </div>
      </div>
    </div>
  );
};
