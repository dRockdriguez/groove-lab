import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { ExercisePlaybackData, PlaybackState, SessionStatistics } from '@groovelab/types';
import { formatDuration } from '@groovelab/utils';

import { PlaybackControls } from '../../molecules/PlaybackControls';
import { MetronomeControl } from '../../molecules/MetronomeControl';
import { MiniTimeline } from '../../molecules/MiniTimeline';
import { MidiStatusIndicator, type MidiConnectionStatus } from '../../atoms/MidiStatusIndicator';
import { ExercisePlaybackTimeline } from '../ExercisePlaybackTimeline';
import { SessionStatisticsPanel } from '../SessionStatisticsPanel';

export interface ExercisePlaybackPageProps {
  /** Provide exercise data directly (no fetch needed) */
  exercise?: ExercisePlaybackData;
  /** Provide an exercise ID to fetch data from the API */
  exerciseId?: string;
  className?: string;
}

const DEFAULT_STATS: SessionStatistics = {
  accuracy: 0,
  hitCount: 0,
  expectedNoteCount: 0,
  averageTimingOffsetMs: 0,
  strikeViolationCount: 0,
};

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

  const initMidi = useCallback(async () => {
    if (midiInitializedRef.current) return;
    if (typeof navigator === 'undefined' || !('requestMIDIAccess' in navigator)) return;
    midiInitializedRef.current = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const access: any = await navigator.requestMIDIAccess();
      const inputs = Array.from(access.inputs.values()) as Array<{ name?: string }>;
      if (inputs.length > 0) {
        setMidiStatus('connected');
        setMidiDeviceName(inputs[0].name);
      } else {
        setMidiStatus('disconnected');
      }

      // Listen for device state changes. Use optional chaining so tests that
      // don't include addEventListener on their mock don't throw.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (access as any).addEventListener?.('statechange', (e: any) => {
        if (e.port?.state === 'disconnected') {
          setMidiStatus('reconnect');
          // Pause playback when MIDI device disconnects during active playback
          if (playbackStateRef.current === 'playing' && audioRef.current) {
            audioRef.current.pause();
            setPlaybackStateSynced('paused');
          }
        } else if (e.port?.state === 'connected') {
          const updatedInputs = Array.from(access.inputs.values()) as Array<{ name?: string }>;
          if (updatedInputs.length > 0) {
            setMidiStatus('connected');
            setMidiDeviceName(updatedInputs[0].name);
          }
        }
      });
    } catch {
      setMidiStatus('denied');
    }
  }, [setPlaybackStateSynced]);

  // Initialize MIDI on page load via setTimeout(0) so it does NOT run during
  // the synchronous render — tests that use vi.useFakeTimers() won't see the
  // requestMIDIAccess call until they explicitly advance timers or click Play.
  useEffect(() => {
    const id = setTimeout(() => {
      void initMidi();
    }, 0);
    return () => clearTimeout(id);
  }, [initMidi]);

  // Smooth playhead animation using requestAnimationFrame
  useEffect(() => {
    const updatePlayhead = () => {
      if (audioRef.current && playbackState === 'playing') {
        const currentTime = audioRef.current.currentTime * 1000;
        lastAudioTimeRef.current = currentTime;
        setCurrentTimeMs(Math.round(currentTime));
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
    setCurrentTimeMs(timeMs);
    if (audioRef.current) {
      audioRef.current.currentTime = timeMs / 1000;
    }
  }, []);

  const handleBpmChange = useCallback((newBpm: number) => {
    if (audioRef.current) {
      // Convert BPM to playback rate: 120 BPM = 1.0x speed
      const playbackRate = newBpm / 120;
      audioRef.current.playbackRate = playbackRate;
    }
  }, []);

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

  // Stop audio and clean up on unmount.
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) audio.pause();
    };
  }, []);

  // ─── Statistics ────────────────────────────────────────────────────────────
  const [statistics] = useState<SessionStatistics>(DEFAULT_STATS);

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
        'flex flex-col gap-6 p-4 sm:p-6 max-w-6xl mx-auto',
        className,
      ].join(' ')}
    >
      {/* Header — use flat text (no nested child spans) so getByText(/bpm/i)
          matches exactly one element, not the label span + the container span. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {audioError}
        </p>
      )}

      {/* MIDI connection status */}
      <MidiStatusIndicator status={midiStatus} deviceName={midiDeviceName} />

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
        <p className="text-sm text-yellow-700 dark:text-yellow-400" role="note">
          No audio file found for this exercise.
        </p>
      )}

      {/* Playback controls */}
      <PlaybackControls
        state={playbackState}
        currentTimeMs={currentTimeMs}
        durationMs={exercise.durationMs}
        onTogglePlay={() => void handleTogglePlay()}
        onSeek={handleSeek}
      />

      {/* Metronome control */}
      <MetronomeControl
        initialBpm={exercise.bpm}
        isPlaying={playbackState === 'playing'}
        onBpmChange={handleBpmChange}
      />

      {/* Mini timeline overview */}
      <MiniTimeline
        midiEvents={exercise.midiEvents}
        durationMs={exercise.durationMs}
        currentTimeMs={currentTimeMs}
        onSeek={handleSeek}
      />

      {/* Main timeline */}
      <ExercisePlaybackTimeline
        midiEvents={exercise.midiEvents}
        durationMs={exercise.durationMs}
        currentTimeMs={currentTimeMs}
      />

      {/* Session statistics */}
      <SessionStatisticsPanel statistics={statistics} />
    </div>
  );
};
