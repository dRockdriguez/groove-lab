import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { NavigationMenu } from './NavigationMenu';

describe('NavigationMenu', () => {
  // AC1: Component renders <nav> with role="navigation"
  describe('Navigation structure', () => {
    it('renders <nav> element with role="navigation"', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav.tagName).toBe('NAV');
    });

    it('renders as <nav> element not other container', () => {
      const items = [{ href: '/', label: 'Home' }];
      const { container } = render(<NavigationMenu items={items} />);
      const nav = container.querySelector('nav[role="navigation"]');
      expect(nav).toBeInTheDocument();
    });
  });

  // AC2 & AC3: Each item renders as <a> element with href and label
  describe('Link rendering', () => {
    it('renders each item as <a> element with correct href', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} />);
      expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
      expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    });

    it('renders link label as text content', () => {
      const items = [{ href: '/contact', label: 'Contact Us' }];
      render(<NavigationMenu items={items} />);
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
    });

    it('renders multiple links from items array', () => {
      const items = [
        { href: '/home', label: 'Home' },
        { href: '/services', label: 'Services' },
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' },
      ];
      render(<NavigationMenu items={items} />);
      items.forEach((item) => {
        const link = screen.getByRole('link', { name: item.label });
        expect(link).toHaveAttribute('href', item.href);
      });
    });

    it('handles items with special characters in labels', () => {
      const items = [{ href: '/q&a', label: 'Q&A' }];
      render(<NavigationMenu items={items} />);
      expect(screen.getByText('Q&A')).toBeInTheDocument();
    });
  });

  // AC4: When activeHref matches item href, link gets active styling
  describe('Active state styling', () => {
    it('applies active styling when activeHref matches item href exactly', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} activeHref="/" />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      expect(homeLink).toHaveClass('font-semibold', 'text-blue-600', 'dark:text-blue-400');
    });

    it('applies active styling to correct link when multiple items present', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/services', label: 'Services' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} activeHref="/services" />);
      const servicesLink = screen.getByRole('link', { name: 'Services' });
      expect(servicesLink).toHaveClass('font-semibold', 'text-blue-600');
    });

    it('marks only the matching link as active, not others', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} activeHref="/" />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      const aboutLink = screen.getByRole('link', { name: 'About' });
      expect(homeLink).toHaveClass('font-semibold');
      expect(aboutLink).not.toHaveClass('font-semibold');
    });

    it('applies active color classes: font-semibold text-blue-600 dark:text-blue-400', () => {
      const items = [{ href: '/dashboard', label: 'Dashboard' }];
      render(<NavigationMenu items={items} activeHref="/dashboard" />);
      const link = screen.getByRole('link', { name: 'Dashboard' });
      const className = link.getAttribute('class');
      expect(className).toContain('font-semibold');
      expect(className).toContain('text-blue-600');
      expect(className).toContain('dark:text-blue-400');
    });
  });

  // AC5: Inactive links render without active styling
  describe('Inactive link styling', () => {
    it('inactive links have inactive classes', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} activeHref="/" />);
      const aboutLink = screen.getByRole('link', { name: 'About' });
      expect(aboutLink).toHaveClass('text-gray-700', 'dark:text-gray-300');
    });

    it('inactive links have hover classes', () => {
      const items = [{ href: '/about', label: 'About' }];
      render(<NavigationMenu items={items} activeHref="/" />);
      const link = screen.getByRole('link', { name: 'About' });
      const className = link.getAttribute('class');
      expect(className).toContain('hover:text-blue-600');
      expect(className).toContain('dark:hover:text-blue-400');
    });

    it('all inactive links share transition-colors duration-200 classes', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} activeHref="/" />);
      const aboutLink = screen.getByRole('link', { name: 'About' });
      expect(aboutLink).toHaveClass('transition-colors', 'duration-200');
    });

    it('active link also has transition-colors duration-200 classes', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} activeHref="/" />);
      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).toHaveClass('transition-colors', 'duration-200');
    });
  });

  // AC6: When activeHref is undefined, no links are marked active
  describe('Undefined activeHref', () => {
    it('no links marked active when activeHref is undefined', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} activeHref={undefined} />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      const aboutLink = screen.getByRole('link', { name: 'About' });
      expect(homeLink).not.toHaveClass('font-semibold');
      expect(aboutLink).not.toHaveClass('font-semibold');
    });

    it('renders all links as inactive when activeHref not provided', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/services', label: 'Services' },
      ];
      render(<NavigationMenu items={items} />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      const servicesLink = screen.getByRole('link', { name: 'Services' });
      expect(homeLink).toHaveClass('text-gray-700');
      expect(servicesLink).toHaveClass('text-gray-700');
    });
  });

  // AC7: When activeHref matches no items, no links are marked active
  describe('No matching activeHref', () => {
    it('no links marked active when activeHref matches no items', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} activeHref="/nonexistent" />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      const aboutLink = screen.getByRole('link', { name: 'About' });
      expect(homeLink).not.toHaveClass('font-semibold');
      expect(aboutLink).not.toHaveClass('font-semibold');
    });

    it('all links render with inactive styling when no match found', () => {
      const items = [{ href: '/dashboard', label: 'Dashboard' }];
      render(<NavigationMenu items={items} activeHref="/missing" />);
      const link = screen.getByRole('link', { name: 'Dashboard' });
      expect(link).toHaveClass('text-gray-700');
      expect(link).not.toHaveClass('font-semibold');
    });
  });

  // AC8: Component applies className prop to <nav> wrapper
  describe('Custom className prop', () => {
    it('applies custom className to nav wrapper', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} className="custom-nav-class" />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('custom-nav-class');
    });

    it('applies multiple custom classes when provided', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(
        <NavigationMenu
          items={items}
          className="mb-4 px-6 justify-center"
        />
      );
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('mb-4', 'px-6', 'justify-center');
    });

    it('applies custom className along with default flex and gap-4 classes', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} className="mt-2" />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('flex', 'gap-4', 'mt-2');
    });

    it('applies empty string className without issues', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} className="" />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveClass('flex', 'gap-4');
    });
  });

  // AC9: Links spaced with gap-4 using flexbox
  describe('Link spacing and layout', () => {
    it('nav has flex layout class', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('flex');
    });

    it('nav has gap-4 spacing class', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('gap-4');
    });

    it('nav has items-center alignment', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('items-center');
    });
  });

  // AC10: Component works in both light and dark modes
  describe('Dark mode support', () => {
    it('active link has dark:text-blue-400 class for dark mode', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} activeHref="/" />);
      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).toHaveClass('dark:text-blue-400');
    });

    it('inactive link has dark:text-gray-300 class for dark mode', () => {
      const items = [{ href: '/about', label: 'About' }];
      render(<NavigationMenu items={items} activeHref="/" />);
      const link = screen.getByRole('link', { name: 'About' });
      expect(link).toHaveClass('dark:text-gray-300');
    });

    it('inactive link has dark:hover:text-blue-400 for dark mode hover', () => {
      const items = [{ href: '/about', label: 'About' }];
      render(<NavigationMenu items={items} activeHref="/" />);
      const link = screen.getByRole('link', { name: 'About' });
      expect(link).toHaveClass('dark:hover:text-blue-400');
    });

    it('both light and dark mode classes present on active link', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} activeHref="/" />);
      const link = screen.getByRole('link', { name: 'Home' });
      const className = link.getAttribute('class');
      expect(className).toContain('text-blue-600');
      expect(className).toContain('dark:text-blue-400');
    });
  });

  // AC11: All links are keyboard accessible
  describe('Keyboard accessibility', () => {
    it('links are focusable with Tab key', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/about', label: 'About' },
      ];
      render(<NavigationMenu items={items} />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      const aboutLink = screen.getByRole('link', { name: 'About' });
      expect(homeLink).toHaveProperty('href');
      expect(aboutLink).toHaveProperty('href');
    });

    it('links render as native <a> elements supporting keyboard navigation', () => {
      const items = [{ href: '/contact', label: 'Contact' }];
      render(<NavigationMenu items={items} />);
      const link = screen.getByRole('link', { name: 'Contact' });
      expect(link.tagName).toBe('A');
    });

    it('multiple links are all keyboard navigable', () => {
      const items = [
        { href: '/page1', label: 'Page 1' },
        { href: '/page2', label: 'Page 2' },
        { href: '/page3', label: 'Page 3' },
      ];
      render(<NavigationMenu items={items} />);
      items.forEach((item) => {
        const link = screen.getByRole('link', { name: item.label });
        expect(link).toHaveAttribute('href', item.href);
      });
    });
  });

  // AC12: Links have descriptive text content for screen readers
  describe('Screen reader accessibility', () => {
    it('links have descriptive text content', () => {
      const items = [{ href: '/documentation', label: 'Documentation' }];
      render(<NavigationMenu items={items} />);
      expect(screen.getByText('Documentation')).toBeInTheDocument();
    });

    it('screen reader can identify all links via accessible name', () => {
      const items = [
        { href: '/', label: 'Home Page' },
        { href: '/about', label: 'About Company' },
      ];
      render(<NavigationMenu items={items} />);
      expect(screen.getByRole('link', { name: 'Home Page' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'About Company' })).toBeInTheDocument();
    });

    it('nav has semantic role="navigation" for screen reader', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} />);
      const nav = screen.getByRole('navigation');
      expect(nav.getAttribute('role')).toBe('navigation');
    });
  });

  // Edge cases
  describe('Edge cases', () => {
    it('handles empty items array and renders empty nav', () => {
      render(<NavigationMenu items={[]} />);
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
      const links = screen.queryAllByRole('link');
      expect(links).toHaveLength(0);
    });

    it('renders empty nav when items array is empty', () => {
      const { container } = render(<NavigationMenu items={[]} />);
      const links = container.querySelectorAll('a');
      expect(links).toHaveLength(0);
    });

    it('activeHref as empty string does not match non-empty hrefs', () => {
      const items = [{ href: '/', label: 'Home' }];
      render(<NavigationMenu items={items} activeHref="" />);
      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).not.toHaveClass('font-semibold');
    });

    it('trailing slash in activeHref does not match href without trailing slash', () => {
      const items = [{ href: '/import', label: 'Import' }];
      render(<NavigationMenu items={items} activeHref="/import/" />);
      const link = screen.getByRole('link', { name: 'Import' });
      expect(link).not.toHaveClass('font-semibold');
    });

    it('activeHref "/" matches only "/" not "/import"', () => {
      const items = [
        { href: '/', label: 'Home' },
        { href: '/import', label: 'Import' },
      ];
      render(<NavigationMenu items={items} activeHref="/" />);
      const homeLink = screen.getByRole('link', { name: 'Home' });
      const importLink = screen.getByRole('link', { name: 'Import' });
      expect(homeLink).toHaveClass('font-semibold');
      expect(importLink).not.toHaveClass('font-semibold');
    });

    it('very long link labels render without fixed width', () => {
      const items = [
        {
          href: '/very/long/path',
          label: 'This is a very long navigation link label that might wrap to multiple lines',
        },
      ];
      render(<NavigationMenu items={items} />);
      const link = screen.getByText(/This is a very long navigation link label/);
      expect(link).toBeInTheDocument();
      const style = window.getComputedStyle(link);
      expect(style.width).not.toBe('0px');
    });

    it('items with href="#" render correctly', () => {
      const items = [{ href: '#', label: 'Anchor' }];
      render(<NavigationMenu items={items} />);
      const link = screen.getByRole('link', { name: 'Anchor' });
      expect(link).toHaveAttribute('href', '#');
    });

    it('items with relative paths render correctly', () => {
      const items = [{ href: '../parent', label: 'Parent' }];
      render(<NavigationMenu items={items} />);
      const link = screen.getByRole('link', { name: 'Parent' });
      expect(link).toHaveAttribute('href', '../parent');
    });

    it('case-sensitive activeHref matching', () => {
      const items = [{ href: '/Home', label: 'Home' }];
      render(<NavigationMenu items={items} activeHref="/home" />);
      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).not.toHaveClass('font-semibold');
    });

    it('case-sensitive href does not match different case activeHref', () => {
      const items = [{ href: '/ABOUT', label: 'About' }];
      render(<NavigationMenu items={items} activeHref="/about" />);
      const link = screen.getByRole('link', { name: 'About' });
      expect(link).not.toHaveClass('font-semibold');
    });

    it('whitespace in activeHref does not match without whitespace', () => {
      const items = [{ href: '/about', label: 'About' }];
      render(<NavigationMenu items={items} activeHref=" /about" />);
      const link = screen.getByRole('link', { name: 'About' });
      expect(link).not.toHaveClass('font-semibold');
    });

    it('conflicting Tailwind classes in className - custom class appears after defaults', () => {
      const items = [{ href: '/', label: 'Home' }];
      const { container } = render(
        <NavigationMenu
          items={items}
          className="gap-8"
        />
      );
      const nav = container.querySelector('nav');
      const classString = nav?.getAttribute('class') || '';
      expect(classString).toContain('gap-8');
    });

    it('unicode characters in labels render correctly', () => {
      const items = [{ href: '/international', label: '国際' }];
      render(<NavigationMenu items={items} />);
      expect(screen.getByText('国際')).toBeInTheDocument();
    });

    it('emoji in labels render correctly', () => {
      const items = [{ href: '/settings', label: '⚙️ Settings' }];
      render(<NavigationMenu items={items} />);
      expect(screen.getByText('⚙️ Settings')).toBeInTheDocument();
    });
  });
});
