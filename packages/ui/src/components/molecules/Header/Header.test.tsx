import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Header } from './Header';

describe('Header', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    // Clear dark class from document.documentElement
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    sessionStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('Initial Theme Detection', () => {
    it('should render a header element', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('should initialize to light mode when no preference is set', () => {
      render(<Header />);
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to dark mode'
      );
    });

    it('should detect theme from sessionStorage', () => {
      sessionStorage.setItem('theme', 'dark');
      render(<Header />);
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );
    });

    it('should respect system preference when sessionStorage is empty', () => {
      const mockMatchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)' ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      render(<Header />);
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );
    });

    it('should default to light mode if matchMedia is not supported', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: undefined,
      });
      render(<Header />);
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to dark mode'
      );
    });
  });

  describe('Theme Toggle Functionality', () => {
    it('should toggle from light to dark mode on click', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to dark mode'
      );

      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );
    });

    it('should toggle from dark to light mode on click', async () => {
      sessionStorage.setItem('theme', 'dark');
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );

      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to dark mode'
      );
    });

    it('should handle multiple rapid toggles correctly', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');

      await user.click(toggleButton);
      await user.click(toggleButton);
      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );
    });
  });

  describe('DOM Mutations', () => {
    it('should add dark class to document.documentElement when theme is dark', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);

      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class from document.documentElement when theme is light', async () => {
      sessionStorage.setItem('theme', 'dark');
      const user = userEvent.setup();
      render(<Header />);

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('should apply dark class when initialized with dark theme from sessionStorage', async () => {
      sessionStorage.setItem('theme', 'dark');
      render(<Header />);

      // Wait a tick for effects to run
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });

  describe('sessionStorage Persistence', () => {
    it('should write theme to sessionStorage when toggled to dark', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);

      expect(sessionStorage.getItem('theme')).toBe('dark');
    });

    it('should write theme to sessionStorage when toggled to light', async () => {
      sessionStorage.setItem('theme', 'dark');
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);

      expect(sessionStorage.getItem('theme')).toBe('light');
    });

    it('should persist the theme choice across multiple toggles', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');
      await user.click(toggleButton);
      expect(sessionStorage.getItem('theme')).toBe('dark');

      await user.click(toggleButton);
      expect(sessionStorage.getItem('theme')).toBe('light');
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label when in light mode', () => {
      render(<Header />);
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to dark mode'
      );
    });

    it('should have correct aria-label when in dark mode', async () => {
      sessionStorage.setItem('theme', 'dark');
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );

      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to dark mode'
      );
    });

    it('should be keyboard accessible with Tab key', () => {
      render(<Header />);
      const toggleButton = screen.getByRole('button');
      toggleButton.focus();
      expect(toggleButton).toHaveFocus();
    });

    it('should be activatable with Enter key', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');
      toggleButton.focus();
      await user.keyboard('{Enter}');

      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );
    });

    it('should be activatable with Space key', async () => {
      const user = userEvent.setup();
      render(<Header />);

      const toggleButton = screen.getByRole('button');
      toggleButton.focus();
      await user.keyboard(' ');

      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );
    });

    it('should not create a focus trap', async () => {
      const user = userEvent.setup();
      render(
        <div>
          <Header />
          <button>Next button</button>
        </div>
      );

      const toggleButton = screen.getByRole('button', {
        name: /switch to dark mode/i,
      });
      const nextButton = screen.getByRole('button', { name: /next button/i });

      toggleButton.focus();
      expect(toggleButton).toHaveFocus();

      await user.tab();
      expect(nextButton).toHaveFocus();
    });
  });

  describe('Visual Structure', () => {
    it('should render ThemeToggle component', () => {
      render(<Header />);
      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should have proper CSS classes for layout', () => {
      render(<Header />);
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('w-full', 'flex', 'justify-end', 'px-4', 'py-2');
    });
  });
});
