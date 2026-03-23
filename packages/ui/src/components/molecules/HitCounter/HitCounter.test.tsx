import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { ScoringEvent } from '@groovelab/utils';
import { HitCounter } from './HitCounter';

describe('HitCounter', () => {
  // ── AC: Component structure and rendering

  it('renders a container with role="status"', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
  });

  it('renders 4 count boxes in flex layout', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const boxes = screen.getAllByText(/Hits|Early|Late|Violations/);
    expect(boxes.length).toBeGreaterThanOrEqual(4);
  });

  it('renders "Hits" box with label', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    expect(screen.getByText('Hits')).toBeInTheDocument();
  });

  it('renders "Early" box with label', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    expect(screen.getByText('Early')).toBeInTheDocument();
  });

  it('renders "Late" box with label', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    expect(screen.getByText('Late')).toBeInTheDocument();
  });

  it('renders "Violations" box with label', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    expect(screen.getByText('Violations')).toBeInTheDocument();
  });

  // ── AC: Count calculation and filtering

  it('displays 0 for all counts when scoringEvents is empty', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const countElements = screen.getAllByText('0');
    expect(countElements.length).toBeGreaterThanOrEqual(4); // At least 4 zeros for empty state
  });

  it('counts "correct" classification as Hits', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'correct',
        offset: 0,
        timestamp: 100,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const hitsBox = screen.getByText('Hits').closest('div');
    expect(hitsBox).toHaveTextContent('1');
  });

  it('counts "early" classification as Early', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 90,
        expectedTimeMs: 100,
        classification: 'early',
        offset: -10,
        timestamp: 90,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const earlyBox = screen.getByText('Early').closest('div');
    expect(earlyBox).toHaveTextContent('1');
  });

  it('counts "late" classification as Late', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 110,
        expectedTimeMs: 100,
        classification: 'late',
        offset: 10,
        timestamp: 110,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const lateBox = screen.getByText('Late').closest('div');
    expect(lateBox).toHaveTextContent('1');
  });

  it('counts "wrong_note" classification as Violations', () => {
    const events: ScoringEvent[] = [
      {
        note: 38,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'wrong_note',
        offset: 0,
        timestamp: 100,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const violationsBox = screen.getByText('Violations').closest('div');
    expect(violationsBox).toHaveTextContent('1');
  });

  it('does not count "missed" classification', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 0,
        expectedTimeMs: 100,
        classification: 'missed',
        offset: -100,
        timestamp: 0,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const countElements = screen.getAllByText('0');
    expect(countElements.length).toBeGreaterThanOrEqual(4);
  });

  it('accumulates multiple hits of same classification', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'correct',
        offset: 0,
        timestamp: 100,
      },
      {
        note: 38,
        detectedMs: 200,
        expectedTimeMs: 200,
        classification: 'correct',
        offset: 0,
        timestamp: 200,
      },
      {
        note: 42,
        detectedMs: 300,
        expectedTimeMs: 300,
        classification: 'correct',
        offset: 0,
        timestamp: 300,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const hitsBox = screen.getByText('Hits').closest('div');
    expect(hitsBox).toHaveTextContent('3');
  });

  it('counts mixed classifications correctly', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'correct',
        offset: 0,
        timestamp: 100,
      },
      {
        note: 38,
        detectedMs: 190,
        expectedTimeMs: 200,
        classification: 'early',
        offset: -10,
        timestamp: 190,
      },
      {
        note: 42,
        detectedMs: 310,
        expectedTimeMs: 300,
        classification: 'late',
        offset: 10,
        timestamp: 310,
      },
      {
        note: 48,
        detectedMs: 400,
        expectedTimeMs: 400,
        classification: 'wrong_note',
        offset: 0,
        timestamp: 400,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const hitsBox = screen.getByText('Hits').closest('div');
    const earlyBox = screen.getByText('Early').closest('div');
    const lateBox = screen.getByText('Late').closest('div');
    const violationsBox = screen.getByText('Violations').closest('div');
    expect(hitsBox).toHaveTextContent('1');
    expect(earlyBox).toHaveTextContent('1');
    expect(lateBox).toHaveTextContent('1');
    expect(violationsBox).toHaveTextContent('1');
  });

  // ── AC: Color scheme

  it('renders green dot for Hits box', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const hitsBox = screen.getByText('Hits').closest('div');
    const dots = hitsBox?.querySelectorAll('div');
    const coloredDot = Array.from(dots || []).find(
      (el) => (el as HTMLElement).style.borderRadius === '50%'
    ) as HTMLElement;
    expect(coloredDot?.style.backgroundColor).toBe('rgb(34, 197, 94)'); // #22C55E in rgb
  });

  it('renders purple dot for Early box', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const earlyBox = screen.getByText('Early').closest('div');
    const dots = earlyBox?.querySelectorAll('div');
    const coloredDot = Array.from(dots || []).find(
      (el) => (el as HTMLElement).style.borderRadius === '50%'
    ) as HTMLElement;
    expect(coloredDot?.style.backgroundColor).toBe('rgb(168, 85, 247)'); // #A855F7 in rgb
  });

  it('renders orange dot for Late box', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const lateBox = screen.getByText('Late').closest('div');
    const dots = lateBox?.querySelectorAll('div');
    const coloredDot = Array.from(dots || []).find(
      (el) => (el as HTMLElement).style.borderRadius === '50%'
    ) as HTMLElement;
    expect(coloredDot?.style.backgroundColor).toBe('rgb(251, 146, 60)'); // #FB923C in rgb
  });

  it('renders red dot for Violations box', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const violationsBox = screen.getByText('Violations').closest('div');
    const dots = violationsBox?.querySelectorAll('div');
    const coloredDot = Array.from(dots || []).find(
      (el) => (el as HTMLElement).style.borderRadius === '50%'
    ) as HTMLElement;
    expect(coloredDot?.style.backgroundColor).toBe('rgb(239, 68, 68)'); // #EF4444 in rgb
  });

  it('renders circular dots with 12px diameter', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const dots = document.querySelectorAll('div[style*="borderRadius"]');
    dots.forEach((dot) => {
      const el = dot as HTMLElement;
      expect(el.style.width).toBe('12px');
      expect(el.style.height).toBe('12px');
      expect(el.style.borderRadius).toBe('50%');
    });
  });

  // ── AC: Disabled state (isPlaying prop)

  it('has opacity-100 when isPlaying is true', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveClass('opacity-100');
  });

  it('has opacity-60 when isPlaying is false', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={false} />);
    const container = screen.getByRole('status');
    expect(container).toHaveClass('opacity-60');
  });

  it('has cursor-not-allowed when isPlaying is false', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={false} />);
    const container = screen.getByRole('status');
    expect(container).toHaveClass('cursor-not-allowed');
  });

  it('does not have cursor-not-allowed when isPlaying is true', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).not.toHaveClass('cursor-not-allowed');
  });

  it('has bg-gray-100 when isPlaying is true', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const boxes = document.querySelectorAll('.bg-gray-100');
    expect(boxes.length).toBe(4);
  });

  it('has bg-gray-50 when isPlaying is false', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={false} />);
    const boxes = document.querySelectorAll('.bg-gray-50');
    expect(boxes.length).toBe(4);
  });

  // ── AC: Accessibility

  it('has aria-live="polite" for live region updates', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('has aria-label with count summary', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'correct',
        offset: 0,
        timestamp: 100,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', expect.stringContaining('Hit counter'));
  });

  it('aria-label includes hit count', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'correct',
        offset: 0,
        timestamp: 100,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', expect.stringContaining('1 hits'));
  });

  it('aria-label includes early count', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 90,
        expectedTimeMs: 100,
        classification: 'early',
        offset: -10,
        timestamp: 90,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', expect.stringContaining('1 early'));
  });

  it('aria-label includes late count', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 110,
        expectedTimeMs: 100,
        classification: 'late',
        offset: 10,
        timestamp: 110,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', expect.stringContaining('1 late'));
  });

  it('aria-label includes violation count', () => {
    const events: ScoringEvent[] = [
      {
        note: 38,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'wrong_note',
        offset: 0,
        timestamp: 100,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', expect.stringContaining('1 violations'));
  });

  // ── AC: Edge cases

  it('treats undefined scoringEvents as empty array', () => {
    render(
      <HitCounter
        scoringEvents={undefined as any}
        isPlaying={true}
      />
    );
    const countElements = screen.getAllByText('0');
    expect(countElements.length).toBeGreaterThanOrEqual(4);
  });

  it('updates counts when scoringEvents prop changes', () => {
    const { rerender } = render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    let hitsBox = screen.getByText('Hits').closest('div');
    expect(hitsBox).toHaveTextContent('0');

    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'correct',
        offset: 0,
        timestamp: 100,
      },
    ];
    rerender(<HitCounter scoringEvents={events} isPlaying={true} />);
    hitsBox = screen.getByText('Hits').closest('div');
    expect(hitsBox).toHaveTextContent('1');
  });

  it('ignores unknown classifications', () => {
    const events: any[] = [
      {
        note: 36,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'unknown_type',
        offset: 0,
        timestamp: 100,
      },
    ];
    render(<HitCounter scoringEvents={events} isPlaying={true} />);
    const countElements = screen.getAllByText('0');
    expect(countElements.length).toBeGreaterThanOrEqual(4);
  });

  // ── AC: Layout and styling

  it('applies custom className prop', () => {
    render(
      <HitCounter
        scoringEvents={[]}
        isPlaying={true}
        className="custom-class"
      />
    );
    const container = screen.getByRole('status');
    expect(container).toHaveClass('custom-class');
  });

  it('renders boxes in flex layout with gap-2', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveClass('gap-2');
  });

  it('renders boxes with flex-col on mobile (base)', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveClass('flex-col');
  });

  it('renders boxes with sm:flex-row for responsive layout', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const container = screen.getByRole('status');
    expect(container).toHaveClass('sm:flex-row');
  });

  it('boxes have min-w-[80px] and max-w-[100px] constraints', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const hitsBox = screen.getByText('Hits').closest('div');
    expect(hitsBox).toHaveClass('min-w-[80px]');
    expect(hitsBox).toHaveClass('max-w-[100px]');
  });

  it('boxes have padding and rounded corners', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const hitsBox = screen.getByText('Hits').closest('div');
    expect(hitsBox).toHaveClass('p-2');
    expect(hitsBox).toHaveClass('rounded-md');
  });

  it('count text is bold and large', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const hitsBox = screen.getByText('Hits').closest('div');
    const countText = hitsBox?.querySelector('.text-lg.font-bold');
    expect(countText).toBeInTheDocument();
  });

  it('label text is small and gray', () => {
    render(<HitCounter scoringEvents={[]} isPlaying={true} />);
    const hitsBox = screen.getByText('Hits').closest('div');
    const label = Array.from(hitsBox?.querySelectorAll('.text-sm') || []).find(
      (el) => el.textContent === 'Hits'
    );
    expect(label).toHaveClass('text-gray-600');
  });

  // ── AC: Real-time updates (memoization)

  it('memoizes hit count calculation', () => {
    const events: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'correct',
        offset: 0,
        timestamp: 100,
      },
    ];
    const { rerender } = render(
      <HitCounter scoringEvents={events} isPlaying={true} />
    );
    let hitsBox = screen.getByText('Hits').closest('div');
    const countBefore = hitsBox?.textContent;

    rerender(
      <HitCounter scoringEvents={events} isPlaying={false} />
    );
    hitsBox = screen.getByText('Hits').closest('div');
    const countAfter = hitsBox?.textContent;

    expect(countBefore).toBe(countAfter);
  });

  it('updates counts when new events added to array', () => {
    const events1: ScoringEvent[] = [
      {
        note: 36,
        detectedMs: 100,
        expectedTimeMs: 100,
        classification: 'correct',
        offset: 0,
        timestamp: 100,
      },
    ];
    const { rerender } = render(
      <HitCounter scoringEvents={events1} isPlaying={true} />
    );
    let hitsBox = screen.getByText('Hits').closest('div');
    expect(hitsBox).toHaveTextContent('1');

    const events2: ScoringEvent[] = [
      ...events1,
      {
        note: 38,
        detectedMs: 200,
        expectedTimeMs: 200,
        classification: 'correct',
        offset: 0,
        timestamp: 200,
      },
    ];
    rerender(
      <HitCounter scoringEvents={events2} isPlaying={true} />
    );
    hitsBox = screen.getByText('Hits').closest('div');
    expect(hitsBox).toHaveTextContent('2');
  });

  it('handles rapid count changes', () => {
    const { rerender } = render(
      <HitCounter scoringEvents={[]} isPlaying={true} />
    );

    for (let i = 0; i < 5; i++) {
      const events: ScoringEvent[] = Array.from({ length: i + 1 }, (_, j) => ({
        note: 36,
        detectedMs: (j + 1) * 100,
        expectedTimeMs: (j + 1) * 100,
        classification: 'correct' as const,
        offset: 0,
        timestamp: (j + 1) * 100,
      }));
      rerender(
        <HitCounter scoringEvents={events} isPlaying={true} />
      );
      const hitsBox = screen.getByText('Hits').closest('div');
      expect(hitsBox).toHaveTextContent(String(i + 1));
    }
  });
});
