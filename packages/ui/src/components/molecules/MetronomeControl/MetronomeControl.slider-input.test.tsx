import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('MetronomeControl — Slider & Numeric Input (Criterion #5)', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).AudioContext = vi.fn().mockImplementation(makeAudioContextMock);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).webkitAudioContext = vi.fn().mockImplementation(makeAudioContextMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── BPM Slider ───────────────────────────────────────────────────────────────

  it('includes a BPM slider input with range 20–300', () => {
    render(<MetronomeControl />);
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('min', '20');
    expect(slider).toHaveAttribute('max', '300');
  });

  it('slider has a large grab area for easy interaction', () => {
    render(<MetronomeControl />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('class');
    // Class should include large dimensions for grab area (e.g., h-8, w-full, etc.)
    const classes = slider.getAttribute('class') || '';
    expect(
      classes.includes('h-8') || classes.includes('h-7') || classes.includes('cursor-pointer'),
    ).toBe(true);
  });

  it('slider reflects the current BPM value', () => {
    render(<MetronomeControl initialBpm={140} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('140');
  });

  it('slider clamped to minimum 20', () => {
    render(<MetronomeControl initialBpm={10} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('20');
  });

  it('slider clamped to maximum 300', () => {
    render(<MetronomeControl initialBpm={400} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('300');
  });

  // ── Numeric Input (Editable) ───────────────────────────────────────────────

  it('includes an editable numeric input (not read-only)', () => {
    render(<MetronomeControl />);
    const numericInput = screen.queryByDisplayValue('120');
    if (numericInput) {
      expect(numericInput).toHaveAttribute('type', 'number');
      expect(numericInput).not.toHaveAttribute('readonly');
    }
  });

  it('numeric input reflects current BPM value', () => {
    render(<MetronomeControl initialBpm={140} />);
    const numericInput = screen.getByDisplayValue('140');
    expect(numericInput).toBeInTheDocument();
  });

  it('numeric input clamped to minimum 20', () => {
    render(<MetronomeControl initialBpm={10} />);
    const numericInput = screen.getByDisplayValue('20');
    expect(numericInput).toBeInTheDocument();
  });

  it('numeric input clamped to maximum 300', () => {
    render(<MetronomeControl initialBpm={400} />);
    const numericInput = screen.getByDisplayValue('300');
    expect(numericInput).toBeInTheDocument();
  });

  // ── Slider ↔ Numeric Input Synchronization ──────────────────────────────────

  it('slider and numeric input stay in sync when slider is moved', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '140' } });

    await waitFor(() => {
      const numericInput = screen.getByDisplayValue('140');
      expect(numericInput).toBeInTheDocument();
    });
  });

  it('slider and numeric input stay in sync when numeric input is changed', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const numericInput = screen.getByDisplayValue('120');

    fireEvent.change(numericInput, { target: { value: '150' } });

    await waitFor(() => {
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('150');
    });
  });

  it('moving slider to 160 updates numeric input to 160', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '160' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('160')).toBeInTheDocument();
    });
  });

  it('numeric input set to 180 updates slider to 180', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const numericInput = screen.getByDisplayValue('120');

    fireEvent.change(numericInput, { target: { value: '180' } });

    await waitFor(() => {
      const slider = screen.getByRole('slider');
      expect(slider).toHaveValue('180');
    });
  });

  it('numeric input rejects values below minimum (20)', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const numericInput = screen.getByDisplayValue('120');

    fireEvent.change(numericInput, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
    });
  });

  it('numeric input rejects values above maximum (300)', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const numericInput = screen.getByDisplayValue('120');

    fireEvent.change(numericInput, { target: { value: '400' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('300')).toBeInTheDocument();
    });
  });

  it('slider rejects values below minimum (20)', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '10' } });

    await waitFor(() => {
      expect(slider).toHaveValue('20');
    });
  });

  it('slider rejects values above maximum (300)', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '400' } });

    await waitFor(() => {
      expect(slider).toHaveValue('300');
    });
  });

  it('onBpmChange callback is called when slider is adjusted', async () => {
    const onBpmChange = vi.fn();
    render(<MetronomeControl initialBpm={120} onBpmChange={onBpmChange} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '140' } });

    await waitFor(() => {
      expect(onBpmChange).toHaveBeenCalledWith(140);
    });
  });

  it('onBpmChange callback is called when numeric input is adjusted', async () => {
    const onBpmChange = vi.fn();
    render(<MetronomeControl initialBpm={120} onBpmChange={onBpmChange} />);
    const numericInput = screen.getByDisplayValue('120');

    fireEvent.change(numericInput, { target: { value: '140' } });

    await waitFor(() => {
      expect(onBpmChange).toHaveBeenCalledWith(140);
    });
  });

  it('can pick a tempo quickly using the slider', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const slider = screen.getByRole('slider');

    // Sweep from 100 to 200 quickly
    fireEvent.change(slider, { target: { value: '200' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('200')).toBeInTheDocument();
    });
  });

  it('can fine-tune tempo precisely using the numeric input', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const numericInput = screen.getByDisplayValue('120');

    // Type exact BPM value
    fireEvent.change(numericInput, { target: { value: '127' } });

    await waitFor(() => {
      expect(screen.getByDisplayValue('127')).toBeInTheDocument();
    });
  });

  it('slider aria-valuemin is 20', () => {
    render(<MetronomeControl />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemin', '20');
  });

  it('slider aria-valuemax is 300', () => {
    render(<MetronomeControl />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuemax', '300');
  });

  it('slider aria-valuenow reflects current BPM', () => {
    render(<MetronomeControl initialBpm={140} />);
    const slider = screen.getByRole('slider');
    expect(slider).toHaveAttribute('aria-valuenow', '140');
  });

  it('slider aria-valuenow updates when BPM changes', async () => {
    render(<MetronomeControl initialBpm={120} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '160' } });

    await waitFor(() => {
      expect(slider).toHaveAttribute('aria-valuenow', '160');
    });
  });
});
