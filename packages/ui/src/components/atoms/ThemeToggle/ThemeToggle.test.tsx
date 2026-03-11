import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  describe('Rendering', () => {
    it('should render a button element', () => {
      const mockOnToggle = vi.fn();
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should display moon emoji (🌙) when theme is light mode', () => {
      const mockOnToggle = vi.fn();
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('🌙');
    });

    it('should display sun emoji (☀️) when theme is dark mode', () => {
      const mockOnToggle = vi.fn();
      render(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('☀️');
    });
  });

  describe('Accessible Labels', () => {
    it('should have aria-label "Switch to dark mode" when light mode is active', () => {
      const mockOnToggle = vi.fn();
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
    });

    it('should have aria-label "Switch to light mode" when dark mode is active', () => {
      const mockOnToggle = vi.fn();
      render(<ThemeToggle theme="dark" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
    });
  });

  describe('Interaction', () => {
    it('should call onToggle when button is clicked', async () => {
      const mockOnToggle = vi.fn();
      const user = userEvent.setup();
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible with Enter key', async () => {
      const mockOnToggle = vi.fn();
      const user = userEvent.setup();
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should be keyboard accessible with Space key', async () => {
      const mockOnToggle = vi.fn();
      const user = userEvent.setup();
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');

      expect(mockOnToggle).toHaveBeenCalledTimes(1);
    });

    it('should be focusable', () => {
      const mockOnToggle = vi.fn();
      render(<ThemeToggle theme="light" onToggle={mockOnToggle} />);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });
  });
});
