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

describe('MetronomeControl — Disabled During Playback (Criterion #6)', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).AudioContext = vi.fn().mockImplementation(makeAudioContextMock);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).webkitAudioContext = vi.fn().mockImplementation(makeAudioContextMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── Increment Button Disabled During Playback ──────────────────────────────

  it('increment button is enabled when playback is stopped', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={false} />);
    const incrementBtn = screen.getByRole('button', { name: 'Increase BPM' });
    expect(incrementBtn).not.toBeDisabled();
  });

  it('increment button is disabled when playback is active', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const incrementBtn = screen.getByRole('button', { name: 'Increase BPM' });
    expect(incrementBtn).toBeDisabled();
  });

  it('increment button re-enables when playback is paused', async () => {
    const { rerender } = render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const incrementBtn = screen.getByRole('button', { name: 'Increase BPM' });
    expect(incrementBtn).toBeDisabled();

    rerender(<MetronomeControl initialBpm={120} isPlaying={false} />);

    await waitFor(() => {
      expect(incrementBtn).not.toBeDisabled();
    });
  });

  // ── Decrement Button Disabled During Playback ──────────────────────────────

  it('decrement button is enabled when playback is stopped', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={false} />);
    const decrementBtn = screen.getByRole('button', { name: 'Decrease BPM' });
    expect(decrementBtn).not.toBeDisabled();
  });

  it('decrement button is disabled when playback is active', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const decrementBtn = screen.getByRole('button', { name: 'Decrease BPM' });
    expect(decrementBtn).toBeDisabled();
  });

  it('decrement button re-enables when playback is paused', async () => {
    const { rerender } = render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const decrementBtn = screen.getByRole('button', { name: 'Decrease BPM' });
    expect(decrementBtn).toBeDisabled();

    rerender(<MetronomeControl initialBpm={120} isPlaying={false} />);

    await waitFor(() => {
      expect(decrementBtn).not.toBeDisabled();
    });
  });

  // ── BPM Slider Disabled During Playback ────────────────────────────────────

  it('slider is enabled when playback is stopped', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={false} />);
    const slider = screen.getByLabelText('BPM slider');
    expect(slider).not.toBeDisabled();
  });

  it('slider is disabled when playback is active', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const slider = screen.getByLabelText('BPM slider');
    expect(slider).toBeDisabled();
  });

  it('slider re-enables when playback is paused', async () => {
    const { rerender } = render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const slider = screen.getByLabelText('BPM slider');
    expect(slider).toBeDisabled();

    rerender(<MetronomeControl initialBpm={120} isPlaying={false} />);

    await waitFor(() => {
      expect(slider).not.toBeDisabled();
    });
  });

  // ── BPM Numeric Input Disabled During Playback ─────────────────────────────

  it('numeric input is enabled when playback is stopped', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={false} />);
    const numericInput = screen.getByLabelText('BPM');
    expect(numericInput).not.toBeDisabled();
  });

  it('numeric input is disabled when playback is active', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const numericInput = screen.getByLabelText('BPM');
    expect(numericInput).toBeDisabled();
  });

  it('numeric input re-enables when playback is paused', async () => {
    const { rerender } = render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const numericInput = screen.getByLabelText('BPM');
    expect(numericInput).toBeDisabled();

    rerender(<MetronomeControl initialBpm={120} isPlaying={false} />);

    await waitFor(() => {
      expect(numericInput).not.toBeDisabled();
    });
  });

  // ── All Controls Disabled Simultaneously ────────────────────────────────────

  it('all BPM controls (buttons, slider, numeric) are disabled when playback is active', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);

    const incrementBtn = screen.getByRole('button', { name: 'Increase BPM' });
    const decrementBtn = screen.getByRole('button', { name: 'Decrease BPM' });
    const slider = screen.getByLabelText('BPM slider');
    const numericInput = screen.getByLabelText('BPM');

    expect(incrementBtn).toBeDisabled();
    expect(decrementBtn).toBeDisabled();
    expect(slider).toBeDisabled();
    expect(numericInput).toBeDisabled();
  });

  it('all BPM controls are enabled when playback is stopped', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={false} />);

    const incrementBtn = screen.getByRole('button', { name: 'Increase BPM' });
    const decrementBtn = screen.getByRole('button', { name: 'Decrease BPM' });
    const slider = screen.getByLabelText('BPM slider');
    const numericInput = screen.getByLabelText('BPM');

    expect(incrementBtn).not.toBeDisabled();
    expect(decrementBtn).not.toBeDisabled();
    expect(slider).not.toBeDisabled();
    expect(numericInput).not.toBeDisabled();
  });

  // ── No BPM Adjustments While Playback Active ───────────────────────────────

  it('BPM does not change when increment button is clicked during playback', async () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const incrementBtn = screen.getByRole('button', { name: 'Increase BPM' });

    fireEvent.click(incrementBtn);

    await waitFor(() => {
      expect(screen.getByLabelText('BPM')).toHaveValue(120);
    });
  });

  it('BPM does not change when decrement button is clicked during playback', async () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const decrementBtn = screen.getByRole('button', { name: 'Decrease BPM' });

    fireEvent.click(decrementBtn);

    await waitFor(() => {
      expect(screen.getByLabelText('BPM')).toHaveValue(120);
    });
  });

  it('BPM does not change when slider is moved during playback', async () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const slider = screen.getByLabelText('BPM slider');

    fireEvent.change(slider, { target: { value: '140' } });

    await waitFor(() => {
      expect(screen.getByLabelText('BPM')).toHaveValue(120);
    });
  });

  it('BPM does not change when numeric input is changed during playback', async () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const numericInput = screen.getByLabelText('BPM');

    fireEvent.change(numericInput, { target: { value: '150' } });

    await waitFor(() => {
      expect(screen.getByLabelText('BPM')).toHaveValue(120);
    });
  });

  // ── Keyboard Shortcuts Disabled During Playback ────────────────────────────

  it('= keyboard shortcut does not increase BPM during playback', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    fireEvent.keyDown(window, { key: '=' });
    expect(screen.getByLabelText('BPM')).toHaveValue(120);
  });

  it('- keyboard shortcut does not decrease BPM during playback', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    fireEvent.keyDown(window, { key: '-' });
    expect(screen.getByLabelText('BPM')).toHaveValue(120);
  });

  it('= keyboard shortcut works after playback is paused', async () => {
    const { rerender } = render(<MetronomeControl initialBpm={120} isPlaying={true} />);

    rerender(<MetronomeControl initialBpm={120} isPlaying={false} />);

    fireEvent.keyDown(window, { key: '=' });

    await waitFor(() => {
      expect(screen.getByLabelText('BPM')).toHaveValue(121);
    });
  });

  it('- keyboard shortcut works after playback is paused', async () => {
    const { rerender } = render(<MetronomeControl initialBpm={120} isPlaying={true} />);

    rerender(<MetronomeControl initialBpm={120} isPlaying={false} />);

    fireEvent.keyDown(window, { key: '-' });

    await waitFor(() => {
      expect(screen.getByLabelText('BPM')).toHaveValue(119);
    });
  });

  // ── Tempo Stability During Playback ────────────────────────────────────────

  it('tempo remains stable during active playback (no jitter)', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);
    const initialDisplay = screen.getByLabelText('BPM');
    expect(initialDisplay).toHaveValue(120);

    // Try multiple interactions
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    fireEvent.keyDown(window, { key: '=' });
    fireEvent.change(screen.getByLabelText('BPM slider'), { target: { value: '150' } });

    // BPM should still be 120
    expect(screen.getByLabelText('BPM')).toHaveValue(120);
  });

  it('new BPM can only be selected when audio is stopped', async () => {
    const { rerender } = render(<MetronomeControl initialBpm={120} isPlaying={true} />);

    // Try to change while playing
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    expect(screen.getByLabelText('BPM')).toHaveValue(120);

    // Stop playback
    rerender(<MetronomeControl initialBpm={120} isPlaying={false} />);

    // Now change should work
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    await waitFor(() => {
      expect(screen.getByLabelText('BPM')).toHaveValue(121);
    });
  });

  it('new BPM can only be selected when audio is paused', async () => {
    const { rerender } = render(<MetronomeControl initialBpm={120} isPlaying={true} />);

    // Try to change while playing
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    expect(screen.getByLabelText('BPM')).toHaveValue(120);

    // Pause playback
    rerender(<MetronomeControl initialBpm={120} isPlaying={false} />);

    // Now change should work
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    await waitFor(() => {
      expect(screen.getByLabelText('BPM')).toHaveValue(121);
    });
  });

  it('onBpmChange callback does not fire while playback is active', () => {
    const onBpmChange = vi.fn();
    render(<MetronomeControl initialBpm={120} isPlaying={true} onBpmChange={onBpmChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));

    expect(onBpmChange).not.toHaveBeenCalled();
  });

  it('onBpmChange callback fires once playback is paused', async () => {
    const onBpmChange = vi.fn();
    const { rerender } = render(
      <MetronomeControl initialBpm={120} isPlaying={true} onBpmChange={onBpmChange} />,
    );

    // Try to change while playing (should be blocked)
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    expect(onBpmChange).not.toHaveBeenCalled();

    // Pause playback and try again
    rerender(
      <MetronomeControl initialBpm={120} isPlaying={false} onBpmChange={onBpmChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));

    await waitFor(() => {
      expect(onBpmChange).toHaveBeenCalledWith(121);
    });
  });

  it('avoids race conditions by preventing BPM changes mid-playback', () => {
    render(<MetronomeControl initialBpm={120} isPlaying={true} />);

    // Try to change BPM through all control methods
    fireEvent.click(screen.getByRole('button', { name: 'Increase BPM' }));
    fireEvent.change(screen.getByLabelText('BPM slider'), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText('BPM'), { target: { value: '200' } });

    // All should fail, BPM should remain 120
    expect(screen.getByLabelText('BPM')).toHaveValue(120);
  });
});
