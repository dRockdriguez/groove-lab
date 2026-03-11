import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WelcomeBanner } from './WelcomeBanner';

describe('WelcomeBanner', () => {
  it('renders the GrooveLab app name', () => {
    render(<WelcomeBanner />);
    expect(screen.getByRole('heading', { name: 'GrooveLab' })).toBeInTheDocument();
  });

  it('renders the practice companion tagline', () => {
    render(<WelcomeBanner />);
    expect(
      screen.getByText('Your intelligent music practice companion.')
    ).toBeInTheDocument();
  });

  it('displays supported instruments', () => {
    render(<WelcomeBanner />);
    expect(screen.getByText('Drums')).toBeInTheDocument();
    expect(screen.getByText('Bass')).toBeInTheDocument();
    expect(screen.getByText('Guitar')).toBeInTheDocument();
  });
});

/**
 * Dark mode support — specs/theme.md → Component Theme Support → WelcomeBanner
 */
describe('WelcomeBanner — dark mode support', () => {
  it('subtitle includes dark:text-gray-400 class', () => {
    render(<WelcomeBanner />);
    const subtitle = screen.getByText(
      'Your intelligent music practice companion.'
    );
    expect(subtitle).toHaveClass('dark:text-gray-400');
  });
});
