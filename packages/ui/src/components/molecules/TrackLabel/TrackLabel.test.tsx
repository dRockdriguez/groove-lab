import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TrackLabel } from './TrackLabel';

describe('TrackLabel', () => {
  it('renders the drum element name', () => {
    render(<TrackLabel noteNumber={36} />);
    expect(screen.getByText(/kick drum/i)).toBeInTheDocument();
  });

  it('renders the snare drum name for note 38', () => {
    render(<TrackLabel noteNumber={38} />);
    expect(screen.getByText(/snare drum/i)).toBeInTheDocument();
  });

  it('renders the closed hi-hat name for note 42', () => {
    render(<TrackLabel noteNumber={42} />);
    expect(screen.getByText(/closed hi-hat/i)).toBeInTheDocument();
  });

  it('renders a fallback label for unknown note numbers', () => {
    render(<TrackLabel noteNumber={99} />);
    expect(screen.getByText(/note 99/i)).toBeInTheDocument();
  });

  it('renders note number as a human-readable label', () => {
    render(<TrackLabel noteNumber={36} />);
    const label = screen.getByText(/kick drum/i);
    expect(label).toBeInTheDocument();
  });
});
