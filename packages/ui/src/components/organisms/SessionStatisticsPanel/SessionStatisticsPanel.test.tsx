import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SessionStatisticsPanel } from './SessionStatisticsPanel';
import type { SessionStatistics } from '@groovelab/types';

const defaultStats: SessionStatistics = {
  accuracy: 85,
  hitCount: 17,
  expectedNoteCount: 20,
  averageTimingOffsetMs: 42,
  strikeViolationCount: 3,
};

describe('SessionStatisticsPanel', () => {
  it('displays accuracy percentage', () => {
    render(<SessionStatisticsPanel statistics={defaultStats} />);
    expect(screen.getByText(/85/)).toBeInTheDocument();
  });

  it('displays hit count and expected note count', () => {
    render(<SessionStatisticsPanel statistics={defaultStats} />);
    expect(screen.getByText(/17/)).toBeInTheDocument();
    expect(screen.getByText(/20/)).toBeInTheDocument();
  });

  it('displays average timing offset in milliseconds', () => {
    render(<SessionStatisticsPanel statistics={defaultStats} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('displays strike violation count', () => {
    render(<SessionStatisticsPanel statistics={defaultStats} />);
    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  it('renders an "Accuracy" label', () => {
    render(<SessionStatisticsPanel statistics={defaultStats} />);
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument();
  });

  it('renders a "Timing Offset" label', () => {
    render(<SessionStatisticsPanel statistics={defaultStats} />);
    expect(screen.getByText(/timing offset/i)).toBeInTheDocument();
  });

  it('renders a "Hits" label', () => {
    render(<SessionStatisticsPanel statistics={defaultStats} />);
    expect(screen.getByText(/hits/i)).toBeInTheDocument();
  });

  it('renders zero statistics correctly', () => {
    const zeroStats: SessionStatistics = {
      accuracy: 0,
      hitCount: 0,
      expectedNoteCount: 0,
      averageTimingOffsetMs: 0,
      strikeViolationCount: 0,
    };
    render(<SessionStatisticsPanel statistics={zeroStats} />);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });
});
