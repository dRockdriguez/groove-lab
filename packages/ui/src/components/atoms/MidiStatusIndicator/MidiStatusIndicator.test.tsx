import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MidiStatusIndicator } from './MidiStatusIndicator';

describe('MidiStatusIndicator', () => {
  it('shows "no device" message when status is disconnected', () => {
    render(<MidiStatusIndicator status="disconnected" />);
    expect(
      screen.getByText(/no midi drum kit detected/i)
    ).toBeInTheDocument();
  });

  it('shows connected message when status is connected', () => {
    render(<MidiStatusIndicator status="connected" />);
    expect(screen.getByText(/midi drum kit connected/i)).toBeInTheDocument();
  });

  it('shows permission denied message when status is denied', () => {
    render(<MidiStatusIndicator status="denied" />);
    expect(screen.getByText(/midi access denied/i)).toBeInTheDocument();
  });

  it('shows a green indicator dot when connected', () => {
    const { container } = render(<MidiStatusIndicator status="connected" />);
    const dot = container.querySelector('.bg-green-500');
    expect(dot).toBeInTheDocument();
  });

  it('has an aria-live region for status announcements', () => {
    const { container } = render(<MidiStatusIndicator status="disconnected" />);
    const liveRegion = container.querySelector('[aria-live]');
    expect(liveRegion).toBeInTheDocument();
  });

  it('renders status text that is accessible', () => {
    render(<MidiStatusIndicator status="connected" deviceName="Roland TD-17" />);
    expect(screen.getByText(/Roland TD-17/i)).toBeInTheDocument();
  });

  it('shows default message when no device name provided and connected', () => {
    render(<MidiStatusIndicator status="connected" />);
    expect(screen.getByText(/midi drum kit connected/i)).toBeInTheDocument();
  });
});
