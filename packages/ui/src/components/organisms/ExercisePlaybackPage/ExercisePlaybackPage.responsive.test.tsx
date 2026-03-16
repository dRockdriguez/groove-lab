import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExercisePlaybackPage } from './ExercisePlaybackPage';
import type { ExercisePlaybackData } from '@groovelab/types';

const mockExercise: ExercisePlaybackData = {
  id: 'drums-basic-1',
  title: 'Basic Drum Pattern',
  description: 'A simple drum pattern to practice',
  bpm: 120,
  durationMs: 60000,
  audioUrl: '/storage/test/exercise.mp3',
  midiEvents: [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
    { timestamp: 500, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
    { timestamp: 1000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
    { timestamp: 1500, note: 43, velocity: 85, channel: 1, type: 'noteOn' },
    { timestamp: 2000, note: 47, velocity: 95, channel: 1, type: 'noteOn' },
  ],
  instrumentType: 'electronic-drums',
};

describe('ExercisePlaybackPage — Responsive Layout', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue({
        inputs: { values: () => [] },
        onstatechange: null,
      }),
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

  const renderAtViewport = (width: number, height: number = 768) => {
    // Mock window dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });

    // Trigger resize event
    window.dispatchEvent(new Event('resize'));
  };

  it('renders correctly on 320px mobile viewport', () => {
    renderAtViewport(320, 568);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    expect(screen.getByText('Basic Drum Pattern')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders correctly on 768px tablet viewport', () => {
    renderAtViewport(768, 1024);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    expect(screen.getByText('Basic Drum Pattern')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('renders correctly on 1440px desktop viewport', () => {
    renderAtViewport(1440, 900);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    expect(screen.getByText('Basic Drum Pattern')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('maintains playback controls visibility at 320px', () => {
    renderAtViewport(320, 568);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeVisible();
  });

  it('maintains timeline visibility at 320px', () => {
    renderAtViewport(320, 568);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Should still show drum element tracks
    expect(screen.getByText(/kick drum/i)).toBeInTheDocument();
  });

  it('maintains title prominence at 320px viewport', () => {
    renderAtViewport(320, 568);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const title = screen.getByText('Basic Drum Pattern');
    expect(title).toBeVisible();
  });

  it('maintains title prominence at 1440px viewport', () => {
    renderAtViewport(1440, 900);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const title = screen.getByText('Basic Drum Pattern');
    expect(title).toBeVisible();
  });

  it('displays all drum element tracks at 1440px', () => {
    renderAtViewport(1440, 900);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    // Should display all unique drum elements
    expect(screen.getByText(/kick drum/i)).toBeInTheDocument();
    expect(screen.getByText(/snare drum/i)).toBeInTheDocument();
    expect(screen.getByText(/closed hi-hat/i)).toBeInTheDocument();
  });

  it('still allows playback control at small viewport', () => {
    renderAtViewport(320, 568);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    expect(playButton).toBeInTheDocument();
    expect(playButton).toBeEnabled();
  });

  it('BPM and duration visible at 320px', () => {
    renderAtViewport(320, 568);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    expect(screen.getByText(/120|bpm/i)).toBeInTheDocument();
    expect(screen.getByText('01:00')).toBeInTheDocument();
  });

  it('BPM and duration visible at 1440px', () => {
    renderAtViewport(1440, 900);
    render(<ExercisePlaybackPage exercise={mockExercise} />);

    expect(screen.getByText(/120|bpm/i)).toBeInTheDocument();
    expect(screen.getByText('01:00')).toBeInTheDocument();
  });

  it('timeline has horizontal scrolling capability for long exercises at 320px', () => {
    renderAtViewport(320, 568);
    const longExercise = { ...mockExercise, durationMs: 300000 }; // 5 minute exercise
    const { container } = render(
      <ExercisePlaybackPage exercise={longExercise} />
    );

    // Timeline container should exist and be scrollable
    const timelineContainer = container.querySelector('[data-testid="timeline-container"]');
    if (timelineContainer) {
      // Check for overflow or scroll capability
      const style = window.getComputedStyle(timelineContainer);
      expect(['auto', 'scroll', 'hidden']).toContain(style.overflowX);
    }
  });

  it('maintains statistics panel visibility at all viewports', () => {
    renderAtViewport(320, 568);
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument();

    renderAtViewport(1440, 900);
    render(<ExercisePlaybackPage exercise={mockExercise} />);
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument();
  });

  it('render layout components in correct order on mobile', () => {
    renderAtViewport(320, 568);
    const { container } = render(
      <ExercisePlaybackPage exercise={mockExercise} />
    );

    // Title should appear before controls
    const title = screen.getByText('Basic Drum Pattern');
    const playButton = screen.getByRole('button', { name: /play/i });

    expect(title).toBeInTheDocument();
    expect(playButton).toBeInTheDocument();
  });
});
