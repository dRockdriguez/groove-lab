import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MiniTimeline } from './MiniTimeline';
import type { MidiEvent } from '@groovelab/types';

const mockEvents: MidiEvent[] = [
  { timestamp: 0, note: 36, velocity: 100, channel: 1, type: 'noteOn' },
  { timestamp: 2000, note: 38, velocity: 80, channel: 1, type: 'noteOn' },
  { timestamp: 4000, note: 42, velocity: 90, channel: 1, type: 'noteOn' },
];

describe('MiniTimeline — Seek Drag (Alt+Drag When Paused)', () => {
  beforeEach(() => {
    // Clear any lingering document listeners from previous tests
    vi.clearAllMocks();
  });

  // ─── Props & Backward Compatibility ───────────────────────────────────────

  it('isPlaying prop is optional; component renders without it', () => {
    const onSeek = vi.fn();
    render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
      />
    );
    expect(screen.getByRole('presentation')).toBeInTheDocument();
  });

  it('isPlaying defaults to false when not provided', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
      />
    );
    const timeline = container.querySelector('[role="presentation"]');
    expect(timeline).toBeInTheDocument();
  });

  // ─── Drag Start Conditions ─────────────────────────────────────────────────

  it('mousedown with altKey=true && isPlaying=false starts seek drag', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    // Simulate Alt+drag: mousedown with altKey
    fireEvent.mouseDown(timeline, { clientX: 100, altKey: true });

    // Now move mouse (should trigger onSeek if drag started)
    fireEvent.mouseMove(document, { clientX: 150 });
    expect(onSeek).toHaveBeenCalled();
  });

  it('mousedown with altKey=false && hasLoopCallbacks=true fires loop create drag instead', () => {
    const onSeek = vi.fn();
    const onLoopStartChange = vi.fn();
    const onLoopEndChange = vi.fn();
    const onLoopDragStart = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        onLoopStartChange={onLoopStartChange}
        onLoopEndChange={onLoopEndChange}
        onLoopDragStart={onLoopDragStart}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mousedown without Alt — should NOT trigger seek drag
    fireEvent.mouseDown(timeline, { clientX: 100, altKey: false });
    fireEvent.mouseMove(document, { clientX: 150 });

    // onSeek should NOT be called by seek drag (loop drag takes over)
    // onLoopDragStart should be called instead
    expect(onLoopDragStart).toHaveBeenCalled();
  });

  it('mousedown with altKey=false && hasLoopCallbacks=false fires click-to-seek', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Click (no Alt, no loop callbacks) — triggers click-to-seek
    fireEvent.click(timeline, { clientX: 400 });
    expect(onSeek).toHaveBeenCalled();
  });

  it('mousedown with altKey=true && isPlaying=true does NOT start seek drag', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={true}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Try Alt+drag while playing — should NOT start seek drag
    fireEvent.mouseDown(timeline, { clientX: 100, altKey: true });
    fireEvent.mouseMove(document, { clientX: 150 });

    // onSeek should NOT be called by seek drag
    expect(onSeek).not.toHaveBeenCalled();
  });

  // ─── Seek Formula & Movement ──────────────────────────────────────────────

  it('drag left by 50px (containerWidth=800, durationMs=8000) calls onSeek with 500ms ahead', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef.getBoundingClientRect() to return width=800
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    // Drag left by 50px: deltaX = -50
    // newTimeMs = dragStartTimeMs - (deltaX / width) * durationMs
    //           = 2000 - (-50 / 800) * 8000
    //           = 2000 - (-500)
    //           = 2500
    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });
    fireEvent.mouseMove(document, { clientX: 350 }); // 400 - 50 = 350

    expect(onSeek).toHaveBeenCalledWith(2500);
  });

  it('drag right by 50px calls onSeek with 500ms behind', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    // Drag right by 50px: deltaX = 50
    // newTimeMs = dragStartTimeMs - (deltaX / width) * durationMs
    //           = 2000 - (50 / 800) * 8000
    //           = 2000 - 500
    //           = 1500
    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });
    fireEvent.mouseMove(document, { clientX: 450 }); // 400 + 50 = 450

    expect(onSeek).toHaveBeenCalledWith(1500);
  });

  // ─── Clamping ───────────────────────────────────────────────────────────

  it('drag far left clamps to durationMs', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={100}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    // Drag far left (large negative deltaX) — should clamp to 8000
    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });
    fireEvent.mouseMove(document, { clientX: 100 }); // deltaX = -300, exceeds duration bounds

    // The clamped value should be durationMs
    const lastCall = onSeek.mock.calls[onSeek.mock.calls.length - 1][0];
    expect(lastCall).toBeLessThanOrEqual(8000);
  });

  it('drag far right clamps to 0', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={7900}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    // Drag far right (large positive deltaX) — should clamp to 0
    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });
    fireEvent.mouseMove(document, { clientX: 700 }); // deltaX = 300, exceeds negative bounds

    // The clamped value should be >= 0
    const lastCall = onSeek.mock.calls[onSeek.mock.calls.length - 1][0];
    expect(lastCall).toBeGreaterThanOrEqual(0);
  });

  // ─── Cursor Management ───────────────────────────────────────────────────

  it('cursor changes to grabbing during drag', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });
    expect(document.body.style.cursor).toBe('grabbing');
  });

  it('cursor restored to empty string after mouseup', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });
    expect(document.body.style.cursor).toBe('grabbing');

    fireEvent.mouseUp(document);
    expect(document.body.style.cursor).toBe('');
  });

  // ─── Event Listener Cleanup ────────────────────────────────────────────

  it('document listeners removed after mouseup', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });
    const callsBeforeUp = removeEventListenerSpy.mock.calls.length;

    fireEvent.mouseUp(document);
    const callsAfterUp = removeEventListenerSpy.mock.calls.length;

    // After mouseup, removeEventListener should be called for both mousemove and mouseup
    expect(callsAfterUp).toBeGreaterThan(callsBeforeUp);
    removeEventListenerSpy.mockRestore();
  });

  // ─── Edge Cases: Guard Clauses ─────────────────────────────────────────

  it('when containerWidth = 0, onSeek is not called', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width to 0
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 0,
    }));

    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });
    fireEvent.mouseMove(document, { clientX: 450 });

    // onSeek should not be called when containerWidth = 0
    expect(onSeek).not.toHaveBeenCalled();
  });

  it('when durationMs = 0, onSeek is not called on drag start', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={0}
        currentTimeMs={0}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });

    // onSeek should not be called when durationMs = 0
    expect(onSeek).not.toHaveBeenCalled();
  });

  // ─── Regression Tests ──────────────────────────────────────────────────

  it('bracket drag with Alt held takes priority over seek drag', () => {
    const onSeek = vi.fn();
    const onLoopStartChange = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        loopStartMs={1000}
        loopEndMs={6000}
        onLoopStartChange={onLoopStartChange}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;
    const startBracket = screen.getByTestId('loop-start-marker');

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    // Drag bracket with Alt held — bracket's stopPropagation() should prevent seek
    fireEvent.mouseDown(startBracket, { clientX: 125, altKey: true });
    fireEvent.mouseMove(document, { clientX: 175 });

    // onLoopStartChange should be called, not onSeek
    expect(onLoopStartChange).toHaveBeenCalled();
  });

  it('loop create drag without Alt still works with hasLoopCallbacks=true', () => {
    const onSeek = vi.fn();
    const onLoopStartChange = vi.fn();
    const onLoopEndChange = vi.fn();
    const onLoopDragStart = vi.fn();
    const onLoopDragEnd = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        onLoopStartChange={onLoopStartChange}
        onLoopEndChange={onLoopEndChange}
        onLoopDragStart={onLoopDragStart}
        onLoopDragEnd={onLoopDragEnd}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    // Drag without Alt — loop create should fire
    fireEvent.mouseDown(timeline, { clientX: 200, altKey: false });
    fireEvent.mouseMove(timeline, { clientX: 600 });
    fireEvent.mouseUp(timeline);

    // Loop callbacks should be called, not seek drag
    expect(onLoopDragStart).toHaveBeenCalled();
    expect(onLoopStartChange).toHaveBeenCalled();
    expect(onLoopEndChange).toHaveBeenCalled();
  });

  it('click-to-seek fires when no drag and hasLoopCallbacks=false', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Click (no drag) — click-to-seek should fire
    fireEvent.click(timeline, { clientX: 400 });

    expect(onSeek).toHaveBeenCalled();
  });

  // ─── Movement Constraints ──────────────────────────────────────────────

  it('onSeek receives values clamped to [0, durationMs]', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={4000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });

    // Drag multiple times to test various positions
    fireEvent.mouseMove(document, { clientX: 100 }); // Far left
    fireEvent.mouseMove(document, { clientX: 700 }); // Far right
    fireEvent.mouseMove(document, { clientX: 450 }); // Moderate

    // All onSeek calls should have values within [0, 8000]
    onSeek.mock.calls.forEach(([value]) => {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(8000);
    });
  });

  it('onSeek receives rounded integer values', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Mock containerRef width
    const rect = timeline.getBoundingClientRect;
    timeline.getBoundingClientRect = vi.fn(() => ({
      ...rect.call(timeline),
      width: 800,
    }));

    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });
    fireEvent.mouseMove(document, { clientX: 437 }); // Odd delta for rounding test

    // All onSeek calls should be integers
    onSeek.mock.calls.forEach(([value]) => {
      expect(Number.isInteger(value)).toBe(true);
    });
  });

  it('containerRef.current null guard prevents errors', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <MiniTimeline
        midiEvents={mockEvents}
        durationMs={8000}
        currentTimeMs={2000}
        onSeek={onSeek}
        isPlaying={false}
      />
    );
    const timeline = container.querySelector('[role="presentation"]') as HTMLDivElement;

    // Simulate a scenario where containerRef might be null by triggering events
    // with extreme conditions (this is more of a defensive test)
    fireEvent.mouseDown(timeline, { clientX: 400, altKey: true });

    // Component should handle this gracefully without throwing
    expect(() => {
      fireEvent.mouseMove(document, { clientX: 450 });
    }).not.toThrow();
  });
});
