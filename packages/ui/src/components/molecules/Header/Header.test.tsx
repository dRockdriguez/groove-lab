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
      expect(header).toHaveClass('w-full', 'flex', 'items-center', 'justify-between', 'px-4', 'py-2');
    });
  });

  describe('NavigationMenu Integration', () => {
    it('should render NavigationMenu component as child', () => {
      const items = [{ href: '/home', label: 'Home' }];
      render(<Header navigationItems={items} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render NavigationMenu as first child (left side)', () => {
      const items = [{ href: '/home', label: 'Home' }];
      render(<Header navigationItems={items} />);
      const header = screen.getByRole('banner');
      const firstChild = header.children[0];
      const nav = screen.getByRole('navigation');
      expect(firstChild).toBe(nav);
    });

    it('should render ThemeToggle as last child (right side)', () => {
      const items = [{ href: '/home', label: 'Home' }];
      render(<Header navigationItems={items} />);
      const header = screen.getByRole('banner');
      const lastChild = header.children[header.children.length - 1];
      const toggleButton = screen.getByRole('button');
      expect(lastChild).toBe(toggleButton);
    });

    it('should pass navigationItems prop to NavigationMenu', () => {
      const items = [
        { href: '/home', label: 'Home' },
        { href: '/about', label: 'About' }
      ];
      render(<Header navigationItems={items} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      const aboutLink = screen.getByRole('link', { name: /about/i });

      expect(homeLink).toBeInTheDocument();
      expect(aboutLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/home');
      expect(aboutLink).toHaveAttribute('href', '/about');
    });

    it('should pass activeHref prop to NavigationMenu', () => {
      const items = [
        { href: '/home', label: 'Home' },
        { href: '/about', label: 'About' }
      ];
      render(<Header navigationItems={items} activeHref="/home" />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      expect(homeLink).toHaveClass('font-semibold', 'text-blue-600');
    });

    it('should render with empty navigationItems array', () => {
      render(<Header navigationItems={[]} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      // No links should exist when items array is empty
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });

    it('should render without navigationItems prop (defaults to empty array)', () => {
      render(<Header />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });

    it('should render NavigationMenu without activeHref when not provided', () => {
      const items = [
        { href: '/home', label: 'Home' },
        { href: '/about', label: 'About' }
      ];
      render(<Header navigationItems={items} />);

      const homeLink = screen.getByRole('link', { name: /home/i });
      const aboutLink = screen.getByRole('link', { name: /about/i });

      // Both should have inactive styling when no activeHref
      expect(homeLink).toHaveClass('text-gray-700');
      expect(aboutLink).toHaveClass('text-gray-700');
    });

    it('should maintain theme toggle functionality alongside navigation', async () => {
      const items = [{ href: '/home', label: 'Home' }];
      const user = userEvent.setup();
      render(<Header navigationItems={items} />);

      const toggleButton = screen.getByRole('button', {
        name: /switch to dark mode/i
      });

      await user.click(toggleButton);

      expect(toggleButton).toHaveAttribute(
        'aria-label',
        'Switch to light mode'
      );

      // NavigationMenu should still be present and unaffected
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should maintain proper layout with multiple navigation items', () => {
      const items = [
        { href: '/home', label: 'Home' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' }
      ];
      render(<Header navigationItems={items} />);

      const header = screen.getByRole('banner');
      const nav = screen.getByRole('navigation');
      const toggleButton = screen.getByRole('button');

      // Header should have justify-between for proper spacing
      expect(header).toHaveClass('justify-between');

      // Nav should be first, toggle should be last
      expect(header.children[0]).toBe(nav);
      expect(header.children[header.children.length - 1]).toBe(toggleButton);
    });

    it('should render navigation with custom active state styling', () => {
      const items = [
        { href: '/practice', label: 'Practice' },
        { href: '/browse', label: 'Browse' }
      ];
      render(<Header navigationItems={items} activeHref="/practice" />);

      const practiceLink = screen.getByRole('link', { name: /practice/i });
      const browseLink = screen.getByRole('link', { name: /browse/i });

      expect(practiceLink).toHaveClass('font-semibold', 'text-blue-600');
      expect(browseLink).not.toHaveClass('font-semibold');
      expect(browseLink).toHaveClass('text-gray-700');
    });
  });
});
