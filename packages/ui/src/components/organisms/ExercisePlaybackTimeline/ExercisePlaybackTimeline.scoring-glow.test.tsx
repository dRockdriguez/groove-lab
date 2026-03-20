import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExercisePlaybackTimeline } from "./ExercisePlaybackTimeline";
import type { MidiEvent } from "@groovelab/types";
import type { ScoringEvent } from "@groovelab/utils";

describe("ExercisePlaybackTimeline scoring glow rendering", () => {
  const mockEvents: MidiEvent[] = [
    { timestamp: 0, note: 36, velocity: 100, channel: 1, type: "noteOn" },
    { timestamp: 500, note: 38, velocity: 80, channel: 1, type: "noteOn" },
    { timestamp: 1000, note: 42, velocity: 90, channel: 1, type: "noteOn" },
  ];

  let mockNow = 1000;

  beforeEach(() => {
    mockNow = 1000;
    vi.spyOn(global.performance, "now").mockReturnValue(mockNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts optional activeGlows prop as Map<number, ScoringEvent>", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    expect(container).toBeTruthy();
  });

  it("renders no glow overlays when activeGlows is undefined", () => {
    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={undefined}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(0);
  });

  it("renders no glow overlays when activeGlows is an empty Map", () => {
    const glowMap = new Map<number, ScoringEvent>();

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(0);
  });

  it("renders a glow overlay for a single active note", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(1);
  });

  it("renders glow overlays for multiple simultaneous notes", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });
    glowMap.set(38, {
      classification: "missed",
      note: 38,
      expectedTimeMs: 500,
      offsetMs: 0,
      timestamp: mockNow - 200,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(2);
  });

  it("applies position: absolute style to glow overlay", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    expect(glowOverlay).toHaveStyle({ position: "absolute" });
  });

  it("applies inset: 0 style to glow overlay", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    expect(glowOverlay).toHaveStyle({ inset: "0" });
  });

  it("applies pointer-events: none style to glow overlay", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    expect(glowOverlay).toHaveStyle({ pointerEvents: "none" });
  });

  it("applies z-index: 1 style to glow overlay", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    expect(glowOverlay).toHaveStyle({ zIndex: "1" });
  });

  it("has data-testid=track-glow-overlay attribute", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    expect(glowOverlay).toHaveAttribute("data-testid", "track-glow-overlay");
  });

  it("has aria-hidden=true attribute for decorative purposes", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    expect(glowOverlay).toHaveAttribute("aria-hidden", "true");
  });

  it("renders green glow for correct classification", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(34, 197, 94,/);
  });

  it("renders yellow glow for early classification", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "early",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: -50,
      offsetMs: -50,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(234, 179, 8,/);
  });

  it("renders orange glow for late classification", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "late",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 50,
      offsetMs: 50,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(249, 115, 22,/);
  });

  it("renders red glow for missed classification", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "missed",
      note: 36,
      expectedTimeMs: 0,
      offsetMs: 0,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(239, 68, 68,/);
  });

  it("renders purple glow for wrong_note classification", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "wrong_note",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(168, 85, 247,/);
  });

  it("silently skips note not present in midiEvents", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(60, {
      classification: "correct",
      note: 60,
      expectedTimeMs: 200,
      detectedTimeMs: 210,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(0);
  });

  it("does not render overlay when elapsed > 800", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 900,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(0);
  });

  it("does not render glow overlay when elapsed >= 800", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 800,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(0);
  });

  it("renders with 0.4 opacity when elapsed = 0", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(\d+, \d+, \d+, 0\.4\)/);
  });

  it("renders with 0.2 opacity when elapsed = 400", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 400,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(\d+, \d+, \d+, 0\.2\)/);
  });

  it("does not render when elapsed = 800", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 800,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(0);
  });

  it("renders different colors for different notes simultaneously", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });
    glowMap.set(38, {
      classification: "missed",
      note: 38,
      expectedTimeMs: 500,
      offsetMs: 0,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(2);

    const style1 = glowOverlays[0].getAttribute("style");
    const style2 = glowOverlays[1].getAttribute("style");
    expect(style1).toMatch(/rgba\(34, 197, 94,/);
    expect(style2).toMatch(/rgba\(239, 68, 68,/);
  });

  it("correct classification uses green rgba", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(34, 197, 94,/);
  });

  it("early classification uses yellow rgba", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "early",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: -50,
      offsetMs: -50,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(234, 179, 8,/);
  });

  it("late classification uses orange rgba", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "late",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 50,
      offsetMs: 50,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(249, 115, 22,/);
  });

  it("missed classification uses red rgba", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "missed",
      note: 36,
      expectedTimeMs: 0,
      offsetMs: 0,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(239, 68, 68,/);
  });

  it("wrong_note classification uses purple rgba", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "wrong_note",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(168, 85, 247,/);
  });

  it("row glow does not interfere with note bar colors", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    const noteMarkers = container.querySelectorAll("[data-testid=note-marker]");

    expect(glowOverlays.length).toBe(1);
    expect(noteMarkers.length).toBeGreaterThan(0);
  });

  it("renders glow overlay with full-width positioning", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    expect(glowOverlay).toHaveStyle({ inset: "0" });
  });

  it("applies z-index: 1 to layer glow behind other elements", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 100,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    expect(glowOverlay).toHaveStyle({ zIndex: "1" });
  });

  it("glow overlay opacity transitions smoothly from 0.4 to 0", () => {
    const opacitiesAtElapsed = [
      { elapsed: 0, expectedOpacity: 0.4 },
      { elapsed: 200, expectedOpacity: 0.3 },
      { elapsed: 400, expectedOpacity: 0.2 },
      { elapsed: 600, expectedOpacity: 0.1 },
    ];

    for (const item of opacitiesAtElapsed) {
      const glowMap = new Map<number, ScoringEvent>();
      glowMap.set(36, {
        classification: "correct",
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow - item.elapsed,
      });

      const { container } = render(
        <ExercisePlaybackTimeline
          midiEvents={mockEvents}
          durationMs={2000}
          currentTimeMs={500}
          activeGlows={glowMap}
        />
      );

      const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
      const style = glowOverlay?.getAttribute("style");
      const regexPattern = "rgba\\(34, 197, 94, " + item.expectedOpacity + "\\)";
      expect(style).toMatch(new RegExp(regexPattern));
    }
  });

  it("calculates elapsed as performance.now() - event.timestamp", () => {
    const eventTimestamp = mockNow - 200;
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: eventTimestamp,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
    const style = glowOverlay?.getAttribute("style");
    expect(style).toMatch(/rgba\(\d+, \d+, \d+, 0\.3\)/);
  });

  it("renders no overlay elements when all glows are expired", () => {
    const glowMap = new Map<number, ScoringEvent>();
    glowMap.set(36, {
      classification: "correct",
      note: 36,
      expectedTimeMs: 0,
      detectedTimeMs: 10,
      offsetMs: 10,
      timestamp: mockNow - 1000,
    });
    glowMap.set(38, {
      classification: "missed",
      note: 38,
      expectedTimeMs: 500,
      offsetMs: 0,
      timestamp: mockNow - 1500,
    });

    const { container } = render(
      <ExercisePlaybackTimeline
        midiEvents={mockEvents}
        durationMs={2000}
        currentTimeMs={500}
        activeGlows={glowMap}
      />
    );

    const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
    expect(glowOverlays.length).toBe(0);
  });
});
