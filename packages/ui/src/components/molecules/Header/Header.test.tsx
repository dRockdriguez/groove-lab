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

    it('should render without navigationItems prop (uses default Home and Import items)', () => {
      render(<Header />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute('href', '/');
      expect(links[1]).toHaveAttribute('href', '/import');
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

  describe('Active State Detection (Pathname Detection)', () => {
    // Mock window.location.pathname for testing
    beforeEach(() => {
      delete (window as any).location;
      window.location = { pathname: '/' } as any;
    });

    afterEach(() => {
      delete (window as any).location;
      window.location = { pathname: '/' } as any;
    });

    describe('AC1: Detect current pathname on mount', () => {
      it('should detect "/" pathname and set activeHref to "/"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should detect "/import" pathname and set activeHref to "/import"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should detect "/practice/drums/exercise-1" pathname and not highlight Home or Import', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/practice/drums/exercise-1' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(homeLink).not.toHaveClass('font-semibold');
        expect(importLink).not.toHaveClass('font-semibold');
      });
    });

    describe('AC2: Header creates menu items array with Home and Import', () => {
      it('should render Home and Import links when no navigationItems prop provided', () => {
        render(<Header />);
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
        expect(links[0]).toHaveAttribute('href', '/');
        expect(links[1]).toHaveAttribute('href', '/import');
      });

      it('should display Home link with correct label', () => {
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toBeInTheDocument();
      });

      it('should display Import link with correct label', () => {
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toBeInTheDocument();
      });
    });

    describe('AC3: Detect "/" route', () => {
      it('should set activeHref to "/" when pathname is "/"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should mark Home link as active when pathname is "/"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold');
        expect(homeLink).toHaveClass('text-blue-600');
      });

      it('should not mark Import link as active when pathname is "/"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).not.toHaveClass('font-semibold');
        expect(importLink).toHaveClass('text-gray-700');
      });
    });

    describe('AC4: Detect "/import" route', () => {
      it('should set activeHref to "/import" when pathname is "/import"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should mark Import link as active when pathname is "/import"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold');
        expect(importLink).toHaveClass('text-blue-600');
      });

      it('should not mark Home link as active when pathname is "/import"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).not.toHaveClass('font-semibold');
        expect(homeLink).toHaveClass('text-gray-700');
      });
    });

    describe('AC5: Detect "/practice/*" route', () => {
      it('should detect /practice/ pathname as practice route', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/practice/drums/exercise-1' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        const importLink = screen.getByRole('link', { name: /import/i });
        // Practice routes don't match Home or Import, so neither should be active
        expect(homeLink).not.toHaveClass('font-semibold');
        expect(importLink).not.toHaveClass('font-semibold');
      });

      it('should not highlight any menu item for practice route', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/practice/bass/another-exercise' },
          writable: true,
        });
        render(<Header />);
        const links = screen.getAllByRole('link');
        links.forEach((link) => {
          expect(link).not.toHaveClass('font-semibold', 'text-blue-600');
        });
      });

      it('should detect /practice without trailing content', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/practice' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(homeLink).not.toHaveClass('font-semibold');
        expect(importLink).not.toHaveClass('font-semibold');
      });
    });

    describe('AC6: Update activeHref on pathname change (popstate)', () => {
      it('should update activeHref when popstate event fires', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        const { rerender } = render(<Header />);

        let homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold');

        // Simulate browser back/forward navigation
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });

        window.dispatchEvent(new PopStateEvent('popstate'));

        // Re-render to allow effect to run
        rerender(<Header />);

        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold');
      });

      it('should update activeHref from "/" to "/import"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        const { rerender } = render(<Header />);

        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });

        window.dispatchEvent(new PopStateEvent('popstate'));
        rerender(<Header />);

        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should update activeHref from "/import" to "/"', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });
        const { rerender } = render(<Header />);

        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });

        window.dispatchEvent(new PopStateEvent('popstate'));
        rerender(<Header />);

        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold', 'text-blue-600');
      });
    });

    describe('AC7: SSR context (window unavailable)', () => {
      it('should handle SSR context gracefully when window is undefined', () => {
        // This test verifies that no crash occurs when window.location is unavailable
        // In real SSR, window would be undefined, so we can't easily test that here
        // But we verify the component initializes without activeHref prop
        render(<Header navigationItems={[]} />);
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
      });

      it('should render without detected activeHref when no pathname available', () => {
        render(<Header navigationItems={[]} />);
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
      });
    });

    describe('AC8: Component handles mount before pathname detection', () => {
      it('should render Header without crashing on mount', () => {
        render(<Header />);
        const header = screen.getByRole('banner');
        expect(header).toBeInTheDocument();
      });

      it('should render NavigationMenu before activeHref is detected', () => {
        render(<Header />);
        const nav = screen.getByRole('navigation');
        expect(nav).toBeInTheDocument();
      });

      it('should render ThemeToggle without activeHref being set', () => {
        render(<Header />);
        const toggleButton = screen.getByRole('button');
        expect(toggleButton).toBeInTheDocument();
      });
    });

    describe('AC9: NavigationMenu receives updated activeHref', () => {
      it('should pass detected activeHref to NavigationMenu prop', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should reflect activeHref change in NavigationMenu styling', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        const { rerender } = render(<Header />);

        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });

        window.dispatchEvent(new PopStateEvent('popstate'));
        rerender(<Header />);

        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });
    });

    describe('Edge Cases: Pathname Normalization', () => {
      it('should strip query params for route matching', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import?file=test.mid' },
          writable: true,
        });
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should strip trailing slash for route matching', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import/' },
          writable: true,
        });
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should strip hash fragment for route matching', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import#section' },
          writable: true,
        });
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should handle pathname with query params and trailing slash', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import/?source=web' },
          writable: true,
        });
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should handle pathname with all: query, hash, trailing slash', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import/?file=test.mid#top' },
          writable: true,
        });
        render(<Header />);
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should not highlight any link for unknown pathname', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/unknown' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(homeLink).not.toHaveClass('font-semibold');
        expect(importLink).not.toHaveClass('font-semibold');
      });

      it('should not highlight any link for /unknown?params=value', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/unknown?params=value' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        const importLink = screen.getByRole('link', { name: /import/i });
        expect(homeLink).not.toHaveClass('font-semibold');
        expect(importLink).not.toHaveClass('font-semibold');
      });
    });

    describe('Edge Cases: Browser Navigation', () => {
      it('should detect change on browser back button', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });
        const { rerender } = render(<Header />);

        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });

        window.dispatchEvent(new PopStateEvent('popstate'));
        rerender(<Header />);

        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold');
      });

      it('should detect change on browser forward button', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        const { rerender } = render(<Header />);

        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });

        window.dispatchEvent(new PopStateEvent('popstate'));
        rerender(<Header />);

        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold');
      });
    });

    describe('Edge Cases: Root Path Normalization', () => {
      it('should preserve root path "/" without stripping', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold');
      });

      it('should not treat "/?query" as root for match purposes', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/?lang=en' },
          writable: true,
        });
        render(<Header />);
        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold', 'text-blue-600');
      });
    });

    describe('Edge Cases: Rapid Route Changes', () => {
      it('should handle rapid consecutive route changes', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        const { rerender } = render(<Header />);

        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });
        window.dispatchEvent(new PopStateEvent('popstate'));

        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        window.dispatchEvent(new PopStateEvent('popstate'));

        rerender(<Header />);

        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold');
      });
    });

    describe('Prop activeHref takes precedence over detected', () => {
      it('should use activeHref prop when provided, ignoring detected', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/' },
          writable: true,
        });
        render(<Header activeHref="/import" />);

        const importLink = screen.getByRole('link', { name: /import/i });
        expect(importLink).toHaveClass('font-semibold', 'text-blue-600');
      });

      it('should prefer prop activeHref over detected activeHref from pathname', () => {
        Object.defineProperty(window, 'location', {
          value: { pathname: '/import' },
          writable: true,
        });
        render(<Header activeHref="/" />);

        const homeLink = screen.getByRole('link', { name: /home/i });
        expect(homeLink).toHaveClass('font-semibold', 'text-blue-600');
      });
    });
  });
});
