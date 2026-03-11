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
  it('includes dark:bg-gray-800 class for dark mode background', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('dark:bg-gray-800');
  });

  it('includes dark:text-gray-100 class for dark mode text', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('dark:text-gray-100');
  });

  it('includes dark:border-gray-700 class for dark mode border', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button')).toHaveClass('dark:border-gray-700');
  });
});
