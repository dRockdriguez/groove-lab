import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is disabled when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies variant class', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('applies size class', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6');
  });
});

/**
 * Dark mode support — specs/theme.md → Component Theme Support → Button
 */
describe('Button — dark mode support', () => {
  it('primary variant has focus ring for dark mode', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('focus:ring-green-500');
  });

  it('ghost variant supports dark mode styling', () => {
    render(<Button variant="ghost">Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-gray-800');
  });

  it('secondary variant supports dark mode styling', () => {
    render(<Button variant="secondary">Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-700');
  });

  it('danger variant supports dark mode styling', () => {
    render(<Button variant="danger">Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
