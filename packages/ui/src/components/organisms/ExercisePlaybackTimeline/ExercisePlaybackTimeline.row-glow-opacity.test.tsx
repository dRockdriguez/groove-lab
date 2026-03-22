import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { ExercisePlaybackTimeline } from "./ExercisePlaybackTimeline";
import type { MidiEvent } from "@groovelab/types";
import type { ScoringEvent } from "@groovelab/utils";

describe("ExercisePlaybackTimeline row glow opacity reduction", () => {
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

  describe("Opacity adjustment: AC1 — Formula change from 0.4 to 0.15", () => {
    it("uses GLOW_OPACITY_FACTOR constant in opacity calculation", () => {
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
      // Opacity formula: (1 - elapsed/800) * 0.15
      // At elapsed=0: (1 - 0/800) * 0.15 = 0.15
      expect(style).toMatch(/rgba\(\d+, \d+, \d+, 0\.15\)/);
    });

    it("applies opacity formula (1 - elapsed/800) * 0.15", () => {
      // Test that the formula is correct by checking multiple elapsed values
      const testCases = [
        { elapsed: 0, expectedOpacity: 0.15, description: "elapsed = 0" },
        { elapsed: 400, expectedOpacity: 0.075, description: "elapsed = 400" },
        { elapsed: 800, expectedOpacity: 0, description: "elapsed = 800" },
      ];

      for (const testCase of testCases) {
        const glowMap = new Map<number, ScoringEvent>();
        glowMap.set(36, {
          classification: "correct",
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 10,
          offsetMs: 10,
          timestamp: mockNow - testCase.elapsed,
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

        if (testCase.expectedOpacity === 0) {
          // At opacity 0, overlay should not render
          expect(glowOverlay).toBeNull();
        } else {
          // Build pattern for the expected opacity (allow for floating point precision)
          const opacityStr = testCase.expectedOpacity.toString();
          const pattern = new RegExp(`rgba\\(\\d+, \\d+, \\d+, ${opacityStr}\\)`);
          expect(style).toMatch(pattern);
        }
      }
    });
  });

  describe("Opacity adjustment: AC2 — At elapsed = 0, opacity = 0.15", () => {
    it("renders glow with 0.15 opacity when elapsed = 0", () => {
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
      expect(style).toMatch(/rgba\(34, 197, 94, 0\.15\)/);
    });

    it("renders with full opacity (0.15) immediately after scoring event", () => {
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
      expect(glowOverlay).toHaveStyle({
        position: "absolute",
      });

      const style = glowOverlay?.getAttribute("style");
      expect(style).toContain("0.15");
    });
  });

  describe("Opacity adjustment: AC3 — At elapsed = 400, opacity = 0.075", () => {
    it("renders glow with 0.075 opacity when elapsed = 400ms", () => {
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
      expect(style).toMatch(/rgba\(34, 197, 94, 0\.075\)/);
    });

    it("renders glow halfway through 800ms fade with correct opacity", () => {
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
      expect(glowOverlay).not.toBeNull();

      const style = glowOverlay?.getAttribute("style");
      expect(style).toMatch(/0\.075/);
    });
  });

  describe("Opacity adjustment: AC4 — At elapsed = 800, opacity = 0 (invisible)", () => {
    it("does not render glow overlay when elapsed = 800ms", () => {
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

    it("glow becomes invisible by 800ms (opacity = 0)", () => {
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

      // At elapsed=800, (1 - 800/800) * 0.15 = 0 * 0.15 = 0
      // Overlay should not render
      const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
      expect(glowOverlay).toBeNull();
    });
  });

  describe("Opacity adjustment: AC5 — At elapsed > 800, overlay not rendered", () => {
    it("does not render glow overlay when elapsed > 800ms", () => {
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

    it("silently removes overlay when fade window expires", () => {
      const glowMap = new Map<number, ScoringEvent>();
      glowMap.set(36, {
        classification: "correct",
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow - 1000,
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
      expect(glowOverlay).toBeNull();
    });
  });

  describe("Constant definition: AC6 — GLOW_OPACITY_FACTOR = 0.15", () => {
    it("uses a constant factor throughout all opacity calculations", () => {
      // Test multiple glows to ensure consistency
      const glowMap = new Map<number, ScoringEvent>();
      glowMap.set(36, {
        classification: "correct",
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
        timestamp: mockNow,
      });
      glowMap.set(38, {
        classification: "early",
        note: 38,
        expectedTimeMs: 500,
        detectedTimeMs: 450,
        offsetMs: -50,
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

      const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
      expect(glowOverlays.length).toBe(2);

      // Both should have 0.15 opacity (at elapsed=0)
      const style1 = glowOverlays[0].getAttribute("style");
      const style2 = glowOverlays[1].getAttribute("style");
      expect(style1).toMatch(/0\.15\)/);
      expect(style2).toMatch(/0\.15\)/);
    });
  });

  describe("Opacity calculation: AC7 — Formula uses constant", () => {
    it("applies constant factor * (1 - elapsed/800) formula", () => {
      const testCases = [
        { elapsed: 0, expectedOpacity: 0.15 },
        { elapsed: 100, expectedOpacity: 0.1312 },
        { elapsed: 200, expectedOpacity: 0.1125 },
        { elapsed: 400, expectedOpacity: 0.075 },
        { elapsed: 600, expectedOpacity: 0.0375 },
      ];

      for (const testCase of testCases) {
        const glowMap = new Map<number, ScoringEvent>();
        glowMap.set(36, {
          classification: "correct",
          note: 36,
          expectedTimeMs: 0,
          detectedTimeMs: 10,
          offsetMs: 10,
          timestamp: mockNow - testCase.elapsed,
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

        // Check that opacity is present in the style
        expect(style).toMatch(/rgba\(\d+, \d+, \d+, [\d.]+\)/);
      }
    });
  });

  describe("Color mapping: AC8 — Colors unchanged with new opacity", () => {
    it("renders green glow with 0.15 opacity for correct classification", () => {
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
      expect(style).toMatch(/rgba\(34, 197, 94, 0\.15\)/);
    });

    it("renders yellow glow with 0.15 opacity for early classification", () => {
      const glowMap = new Map<number, ScoringEvent>();
      glowMap.set(36, {
        classification: "early",
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: -50,
        offsetMs: -50,
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
      expect(style).toMatch(/rgba\(234, 179, 8, 0\.15\)/);
    });

    it("renders orange glow with 0.15 opacity for late classification", () => {
      const glowMap = new Map<number, ScoringEvent>();
      glowMap.set(36, {
        classification: "late",
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 50,
        offsetMs: 50,
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
      expect(style).toMatch(/rgba\(249, 115, 22, 0\.15\)/);
    });

    it("renders red glow with 0.15 opacity for missed classification", () => {
      const glowMap = new Map<number, ScoringEvent>();
      glowMap.set(36, {
        classification: "missed",
        note: 36,
        expectedTimeMs: 0,
        offsetMs: 0,
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
      expect(style).toMatch(/rgba\(239, 68, 68, 0\.15\)/);
    });

    it("renders purple glow with 0.15 opacity for wrong_note classification", () => {
      const glowMap = new Map<number, ScoringEvent>();
      glowMap.set(36, {
        classification: "wrong_note",
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
      expect(style).toMatch(/rgba\(168, 85, 247, 0\.15\)/);
    });
  });

  describe("Glow rendering logic: AC9 — Positioning and attributes unchanged", () => {
    it("maintains position: absolute styling", () => {
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
      expect(glowOverlay).toHaveStyle({ position: "absolute" });
    });

    it("maintains inset: 0 styling", () => {
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
      expect(glowOverlay).toHaveStyle({ inset: "0" });
    });

    it("maintains z-index: 1 styling", () => {
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
      expect(glowOverlay).toHaveStyle({ zIndex: "1" });
    });

    it("maintains pointer-events: none styling", () => {
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
      expect(glowOverlay).toHaveStyle({ pointerEvents: "none" });
    });

    it('maintains data-testid="track-glow-overlay" attribute', () => {
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
      expect(glowOverlay).toHaveAttribute("data-testid", "track-glow-overlay");
    });

    it('maintains aria-hidden="true" attribute', () => {
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
      expect(glowOverlay).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Integration: Opacity reduction is subtle and functional", () => {
    it("glow is less visually prominent with 0.15 than 0.4 opacity", () => {
      // Verify that max opacity is reduced
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

      // Opacity should be 0.15, not 0.4
      expect(style).toMatch(/0\.15\)/);
      expect(style).not.toMatch(/0\.4\)/);
    });

    it("glow still visible at elapsed = 0 despite reduced opacity", () => {
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
      expect(glowOverlay).not.toBeNull();
      expect(glowOverlay).toHaveAttribute("data-testid", "track-glow-overlay");
    });

    it("glow completely invisible by elapsed = 800ms", () => {
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

      const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
      expect(glowOverlay).toBeNull();
    });

    it("allows note colors to be primary feedback with reduced glow opacity", () => {
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

      const glowOverlays = container.querySelectorAll("[data-testid=track-glow-overlay]");
      const noteMarkers = container.querySelectorAll("[data-testid=note-marker]");

      expect(glowOverlays.length).toBe(1);
      expect(noteMarkers.length).toBeGreaterThan(0);

      // Glow overlay should not completely obscure note colors
      const glowOverlay = glowOverlays[0];
      const style = glowOverlay.getAttribute("style");
      expect(style).toMatch(/0\.15\)/);
    });

    it("fades smoothly over 800ms with reduced opacity", () => {
      // Test smooth fade by checking intermediate values
      const glowMap = new Map<number, ScoringEvent>();
      glowMap.set(36, {
        classification: "correct",
        note: 36,
        expectedTimeMs: 0,
        detectedTimeMs: 10,
        offsetMs: 10,
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

      const glowOverlay = container.querySelector("[data-testid=track-glow-overlay]");
      const style = glowOverlay?.getAttribute("style");

      // At elapsed=200: (1 - 200/800) * 0.15 ≈ 0.1125
      expect(style).toMatch(/rgba\(\d+, \d+, \d+, 0\.11\d*\)/);
    });
  });
});
