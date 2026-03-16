import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FeedbackBadge } from './FeedbackBadge';

describe('FeedbackBadge', () => {
  it('renders "Hit" label for hit feedback type', () => {
    render(<FeedbackBadge feedbackType="hit" />);
    expect(screen.getByText(/hit/i)).toBeInTheDocument();
  });

  it('renders "Miss" label for miss feedback type', () => {
    render(<FeedbackBadge feedbackType="miss" />);
    expect(screen.getByText(/miss/i)).toBeInTheDocument();
  });

  it('renders "Wrong Note" label for wrongNote feedback type', () => {
    render(<FeedbackBadge feedbackType="wrongNote" />);
    expect(screen.getByText(/wrong note/i)).toBeInTheDocument();
  });

  it('renders "Early" label for early feedback type', () => {
    render(<FeedbackBadge feedbackType="early" />);
    expect(screen.getByText(/early/i)).toBeInTheDocument();
  });

  it('renders "Late" label for late feedback type', () => {
    render(<FeedbackBadge feedbackType="late" />);
    expect(screen.getByText(/late/i)).toBeInTheDocument();
  });

  it('renders "Weak" label for weak feedback type', () => {
    render(<FeedbackBadge feedbackType="weak" />);
    expect(screen.getByText(/weak/i)).toBeInTheDocument();
  });

  it('renders "Strong" label for strong feedback type', () => {
    render(<FeedbackBadge feedbackType="strong" />);
    expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('applies green color class for hit', () => {
    const { container } = render(<FeedbackBadge feedbackType="hit" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/green/);
  });

  it('applies red color class for miss', () => {
    const { container } = render(<FeedbackBadge feedbackType="miss" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/red/);
  });

  it('applies orange color class for wrongNote', () => {
    const { container } = render(<FeedbackBadge feedbackType="wrongNote" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/orange/);
  });

  it('applies yellow color class for weak', () => {
    const { container } = render(<FeedbackBadge feedbackType="weak" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/yellow/);
  });

  it('applies yellow color class for strong', () => {
    const { container } = render(<FeedbackBadge feedbackType="strong" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toMatch(/yellow/);
  });
});
