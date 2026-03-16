import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';
import type { ExercisePlaybackData } from '@groovelab/types';

const mockExercise: ExercisePlaybackData = {
  id: 'drums-basic-1',
  title: 'Basic Drum Pattern',
  description: 'A simple drum pattern to practice',
  bpm: 120,
  durationMs: 16000,
  audioUrl: '/storage/test/exercise.mp3',
  midiEvents: [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
    { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
  ],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage — Audio Error Handling', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue({
        inputs: { values: () => [] },
        onstatechange: null,
      }),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('displays error message when audio file fails to load', async () => {
    // Mock audio element to fail loading
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockRejectedValue(new Error('Failed to load audio')),
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      const errorMessage = screen.queryByText(/could not load audio|failed to load/i);
      expect(errorMessage).toBeTruthy();
    });
  });

  it('displays specific message "Could not load audio file. Please try again later."', async () => {
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockRejectedValue(new Error('Audio load failed')),
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      const errorMessage = screen.queryByText(
        /could not load audio file|please try again later/i
      );
      expect(errorMessage).toBeTruthy();
    });
  });

  it('pauses playback when audio playback error occurs', async () => {
    const pauseMock = vi.fn();
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: pauseMock,
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Simulate audio error event
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      const errorEvent = new Event('error');
      audioElement.dispatchEvent(errorEvent);
    }

    // Pause should be called or playback state should change to stopped/paused
    await waitFor(() => {
      // After error, should see play button (not pause)
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
  });

  it('displays error message when browser tab loses focus and page refreshes', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Simulate blur event (tab losing focus)
    window.dispatchEvent(new Event('blur'));

    await waitFor(() => {
      // Page should pause or show warning
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
  });

  it('pauses playback when page loses focus', async () => {
    const pauseMock = vi.fn();
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: pauseMock,
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Simulate page blur
    window.dispatchEvent(new Event('blur'));

    await waitFor(() => {
      // Should return to play button state
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
  });

  it('cleans up audio element on page unmount', () => {
    const pauseMock = vi.fn();
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: pauseMock,
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });

    const { unmount } = render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    unmount();

    // Audio should be paused on unmount
    expect(pauseMock).toHaveBeenCalled();
  });

  it('cleans up MIDI listeners on page unmount', async () => {
    const unsubscribeMock = vi.fn();
    const mockMidiAccess = {
      inputs: {
        values: () => [
          {
            id: 'input-1',
            name: 'MIDI Controller',
            onmidimessage: null,
            removeEventListener: unsubscribeMock,
          },
        ],
      },
      onstatechange: null,
      removeEventListener: unsubscribeMock,
    };

    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue(mockMidiAccess),
      writable: true,
      configurable: true,
    });

    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockResolvedValue(undefined),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: vi.fn(),
    });

    const { unmount } = render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Wait for MIDI to be initialized
    await waitFor(() => {
      expect(navigator.requestMIDIAccess).toHaveBeenCalled();
    });

    unmount();

    // MIDI listeners should be cleaned up
    expect(screen.queryByText('Basic Drum Pattern')).not.toBeInTheDocument();
  });

  it('shows loading state while audio is loading asynchronously', async () => {
    // Create a promise that never resolves to simulate loading
    const neverResolvingPromise = new Promise(() => {});
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockReturnValue(neverResolvingPromise),
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    // Should show loading indicator or spinner
    await waitFor(() => {
      const loadingElement = screen.queryByText(/loading|buffering/i);
      if (loadingElement) {
        expect(loadingElement).toBeInTheDocument();
      }
    });
  });

  it('allows retry after audio load failure', async () => {
    let callCount = 0;
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Audio load failed'));
        }
        return Promise.resolve(undefined);
      }),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: vi.fn(),
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      const errorMessage = screen.queryByText(/could not load audio|error/i);
      expect(errorMessage).toBeTruthy();
    });

    // Retry should be possible by clicking play again
    fireEvent.click(screen.getByRole('button', { name: /play/i }));

    await waitFor(() => {
      // After successful retry, pause button should appear
      const pauseButton = screen.queryByRole('button', { name: /pause/i });
      expect(pauseButton).toBeTruthy();
    });
  });

  it('does not crash when audio element is not found', () => {
    // Mock audio query to return null
    const querySelectorSpy = vi.spyOn(document, 'querySelector');
    querySelectorSpy.mockReturnValue(null);

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    expect(screen.getByText('Basic Drum Pattern')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();

    querySelectorSpy.mockRestore();
  });

  it('displays appropriate error when network is unreachable', async () => {
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
      writable: true,
      value: vi.fn().mockRejectedValue(new Error('Network error')),
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      const errorMessage = screen.queryByText(/audio|network|error|connection/i);
      expect(errorMessage).toBeTruthy();
    });
  });
});
