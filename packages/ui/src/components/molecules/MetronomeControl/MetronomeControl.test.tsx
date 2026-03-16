import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MetronomeControl } from './MetronomeControl';

// ─── Web Audio API mock ───────────────────────────────────────────────────────

function makeAudioContextMock() {
  return {
    createOscillator: vi.fn().mockReturnValue({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 1000 },
      type: 'sine',
    }),
    createGain: vi.fn().mockReturnValue({
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        value: 0.3,
      },
    }),
    destination: {},
    currentTime: 0,
    state: 'running',
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

describe('MetronomeControl', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).AudioContext = vi.fn().mockImplementation(makeAudioContextMock);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).webkitAudioContext = vi.fn().mockImplementation(makeAudioContextMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── BPM display ─────────────────────────────────────────────────────────────

  it('displays current BPM value', () => {
    render(<MetronomeControl />);
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
  });

  it('accepts initial BPM via prop', () => {
    render(<MetronomeControl initialBpm={140} />);
    expect(screen.getByDisplayValue('140')).toBeInTheDocument();
  });

  it('clamps initialBpm below minimum to 20', () => {
    render(<MetronomeControl initialBpm={10} />);
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  it('clamps initialBpm above maximum to 300', () => {
    render(<MetronomeControl initialBpm={400} />);
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
  });

  // ── BPM adjustment ──────────────────────────────────────────────────────────

  it('increases BPM by 1 when increment button is clicked', () => {
    render(<MetronomeControl initialBpm={120} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    expect(screen.getByDisplayValue('121')).toBeInTheDocument();
  });

  it('decreases BPM by 1 when decrement button is clicked', () => {
    render(<MetronomeControl initialBpm={120} />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease BPM' }));
    expect(screen.getByDisplayValue('119')).toBeInTheDocument();
  });

  it('does not increase BPM above 300', () => {
    render(<MetronomeControl initialBpm={300} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();
  });

  it('does not decrease BPM below 20', () => {
    render(<MetronomeControl initialBpm={20} />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease BPM' }));
    expect(screen.getByDisplayValue('20')).toBeInTheDocument();
  });

  it('increment button is disabled when BPM is at maximum (300)', () => {
    render(<MetronomeControl initialBpm={300} />);
    expect(screen.getByRole('button', { name: 'Increase BPM' })).toBeDisabled();
  });

  it('decrement button is disabled when BPM is at minimum (20)', () => {
    render(<MetronomeControl initialBpm={20} />);
    expect(screen.getByRole('button', { name: 'Decrease BPM' })).toBeDisabled();
  });

  // ── ARIA labels ─────────────────────────────────────────────────────────────

  it('increment button has aria-label "Increase BPM"', () => {
    render(<MetronomeControl />);
    expect(screen.getByRole('button', { name: 'Increase BPM' })).toBeInTheDocument();
  });

  it('decrement button has aria-label "Decrease BPM"', () => {
    render(<MetronomeControl />);
    expect(screen.getByRole('button', { name: 'Decrease BPM' })).toBeInTheDocument();
  });

  it('toggle button has aria-label "Toggle metronome"', () => {
    render(<MetronomeControl />);
    expect(screen.getByRole('button', { name: 'Toggle metronome' })).toBeInTheDocument();
  });

  it('BPM input is accessible via aria-label', () => {
    render(<MetronomeControl />);
    expect(screen.getByLabelText('BPM')).toBeInTheDocument();
  });

  // ── aria-live region ────────────────────────────────────────────────────────

  it('has an aria-live region', () => {
    render(<MetronomeControl />);
    const region = document.querySelector('[aria-live]');
    expect(region).toBeInTheDocument();
  });

  it('announces new BPM in aria-live region when BPM increases', () => {
    render(<MetronomeControl initialBpm={120} />);
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    const region = document.querySelector('[aria-live="polite"]');
    expect(region?.textContent).toMatch(/121/);
  });

  it('announces new BPM in aria-live region when BPM decreases', () => {
    render(<MetronomeControl initialBpm={120} />);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease BPM' }));
    const region = document.querySelector('[aria-live="polite"]');
    expect(region?.textContent).toMatch(/119/);
  });

  it('does not announce BPM on initial render', () => {
    render(<MetronomeControl initialBpm={120} />);
    const region = document.querySelector('[aria-live="polite"]');
    expect(region?.textContent?.trim()).toBe('');
  });

  // ── Toggle on/off ────────────────────────────────────────────────────────────

  it('toggle button reflects disabled state via aria-pressed="false" initially', () => {
    render(<MetronomeControl />);
    const toggleButton = screen.getByRole('button', { name: 'Toggle metronome' });
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggle button aria-pressed becomes "true" when clicked', () => {
    render(<MetronomeControl />);
    const toggleButton = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggle button aria-pressed returns to "false" when clicked twice', () => {
    render(<MetronomeControl />);
    const toggleButton = screen.getByRole('button', { name: 'Toggle metronome' });
    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveAttribute('aria-pressed', 'false');
  });

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────

  it('increases BPM when = key is pressed', () => {
    render(<MetronomeControl initialBpm={120} />);
    fireEvent.keyDown(window, { key: '=' });
    expect(screen.getByDisplayValue('121')).toBeInTheDocument();
  });

  it('decreases BPM when - key is pressed', () => {
    render(<MetronomeControl initialBpm={120} />);
    fireEvent.keyDown(window, { key: '-' });
    expect(screen.getByDisplayValue('119')).toBeInTheDocument();
  });

  it('does not trigger keyboard shortcut when input is focused', () => {
    render(<MetronomeControl initialBpm={120} />);
    const input = screen.getByLabelText('BPM');
    fireEvent.keyDown(input, { key: '-' });
    // BPM should not change since the event target is an input
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
  });

  // ── Component presence ───────────────────────────────────────────────────────

  it('renders all three control buttons', () => {
    render(<MetronomeControl />);
    expect(screen.getByRole('button', { name: 'Decrease BPM' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Increase BPM' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Toggle metronome' })).toBeInTheDocument();
  });
});
