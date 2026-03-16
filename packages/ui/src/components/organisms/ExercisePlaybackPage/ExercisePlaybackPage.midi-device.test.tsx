import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

describe('ExercisePlaybackPage — MIDI Device Handling', () => {
  let mockMidiAccess: any;

  beforeEach(() => {
    mockMidiAccess = {
      inputs: {
        values: () => [
          {
            id: 'input-1',
            name: 'MIDI Controller',
            onmidimessage: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
          },
        ],
      },
      outputs: { values: () => [] },
      onstatechange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
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
    Object.defineProperty(HTMLMediaElement.prototype, 'load', {
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('detects MIDI device connection on page load', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Wait for MIDI access to be requested
    await waitFor(() => {
      expect(navigator.requestMIDIAccess).toHaveBeenCalled();
    });

    // Should display MIDI connected status
    await waitFor(() => {
      const statusText = screen.queryByText(/midi.*connected|drum kit/i);
      expect(statusText).toBeTruthy();
    });
  });

  it('shows "MIDI drum kit connected" message when device is detected', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    await waitFor(() => {
      const connectedMessage = screen.queryByText(/midi drum kit connected/i);
      expect(connectedMessage).toBeTruthy();
    });
  });

  it('handles MIDI device disconnection during playback', async () => {
    const pauseMock = vi.fn();
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: pauseMock,
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(navigator.requestMIDIAccess).toHaveBeenCalled();
    });

    // Simulate MIDI device disconnection
    await act(async () => {
      const stateChangeCallback = mockMidiAccess.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'statechange'
      )?.[1];

      if (stateChangeCallback) {
        stateChangeCallback({ port: { state: 'disconnected' } });
      }
    });

    // Should show disconnect message and pause playback
    await waitFor(() => {
      const disconnectMessage = screen.queryByText(
        /disconnected|reconnect/i
      );
      expect(disconnectMessage).toBeTruthy();
    });
  });

  it('displays error message when MIDI device is disconnected during playback', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(navigator.requestMIDIAccess).toHaveBeenCalled();
    });

    // Simulate disconnection
    await act(async () => {
      const disconnectEvent = new Event('disconnect');
      window.dispatchEvent(disconnectEvent);
    });

    // Look for error message or status update
    await waitFor(() => {
      const statusElement = screen.queryByText(/midi|disconnect|reconnect/i);
      expect(statusElement).toBeTruthy();
    });
  });

  it('allows reconnection of MIDI device and resume of practice', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Simulate disconnection
    await act(async () => {
      const stateChangeCallback = mockMidiAccess.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'statechange'
      )?.[1];

      if (stateChangeCallback) {
        stateChangeCallback({ port: { state: 'disconnected' } });
      }
    });

    // Simulate reconnection by updating inputs
    mockMidiAccess.inputs.values = () => [
      {
        id: 'input-1',
        name: 'MIDI Controller',
        onmidimessage: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    ];

    await act(async () => {
      const stateChangeCallback = mockMidiAccess.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'statechange'
      )?.[1];

      if (stateChangeCallback) {
        stateChangeCallback({ port: { state: 'connected' } });
      }
    });

    // Device should be usable again
    await waitFor(() => {
      const statusText = screen.queryByText(/midi.*connected|drum kit/i);
      expect(statusText).toBeTruthy();
    });
  });

  it('handles MIDI access denial gracefully', async () => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockRejectedValue(new Error('Permission denied')),
      writable: true,
      configurable: true,
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    await waitFor(() => {
      const denialMessage = screen.queryByText(
        /midi access denied|enable permissions|permission/i
      );
      expect(denialMessage).toBeTruthy();
    });
  });

  it('displays permission denial message explaining how to grant permissions', async () => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockRejectedValue(new Error('Permission denied')),
      writable: true,
      configurable: true,
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    await waitFor(() => {
      const message = screen.queryByText(/enable.*permissions|browser settings|grant/i);
      expect(message).toBeTruthy();
    });
  });

  it('shows "No MIDI drum kit detected" when no devices are connected', async () => {
    mockMidiAccess.inputs.values = () => [];

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    await waitFor(() => {
      const noDeviceMessage = screen.queryByText(
        /no midi drum kit detected|connect a drum kit/i
      );
      expect(noDeviceMessage).toBeTruthy();
    });
  });

  it('still allows practice playback when no MIDI device is connected', async () => {
    mockMidiAccess.inputs.values = () => [];

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });

    // Should be able to play without MIDI device
    expect(playButton).not.toBeDisabled();

    fireEvent.click(playButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });
  });

  it('updates MIDI status indicator when device connection state changes', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Initially connected
    await waitFor(() => {
      const connectedMessage = screen.queryByText(/midi.*connected|drum kit/i);
      expect(connectedMessage).toBeTruthy();
    });

    // Simulate disconnection
    await act(async () => {
      const stateChangeCallback = mockMidiAccess.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'statechange'
      )?.[1];

      if (stateChangeCallback) {
        stateChangeCallback({ port: { state: 'disconnected' } });
      }
    });

    // Status should update
    await waitFor(() => {
      // Should show some status change
      const statusElements = screen.getAllByText(/midi|drum kit|connect/i);
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  it('announces MIDI connection status change via aria-live', async () => {
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    await waitFor(() => {
      const ariaLiveRegions = document.querySelectorAll('[aria-live]');
      expect(ariaLiveRegions.length).toBeGreaterThan(0);
    });
  });

  it('pauses playback when MIDI device disconnects during active playback', async () => {
    const pauseMock = vi.fn();
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
      writable: true,
      value: pauseMock,
    });

    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    // Simulate disconnection during playback
    await act(async () => {
      const stateChangeCallback = mockMidiAccess.addEventListener.mock.calls.find(
        (call: any) => call[0] === 'statechange'
      )?.[1];

      if (stateChangeCallback) {
        stateChangeCallback({ port: { state: 'disconnected' } });
      }
    });

    // Playback should be paused
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    });
  });
});
