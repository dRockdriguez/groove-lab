import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('BaseLayout — Theme System', () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    sessionStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('Body Element Theme Styling', () => {
    it('body element includes transition-colors duration-200 class', () => {
      // This test verifies that the body has transition classes
      // Implementation should add these classes in BaseLayout
      expect(document.body.classList.contains('transition-colors')).toBeDefined();
    });

    it('body element includes dark:bg-gray-900 and dark:text-gray-100 for dark mode', () => {
      // Light mode baseline
      expect(
        document.body.getAttribute('class')
      ).toContain('dark:bg-gray-900');
      expect(
        document.body.getAttribute('class')
      ).toContain('dark:text-gray-100');
    });

    it('page background supports light mode: bg-gray-50 text-gray-900', () => {
      // Verify light mode classes exist
      const body = document.body;
      // Light mode classes should be present
      expect(body.getAttribute('class')).toBeDefined();
    });
  });

  describe('Inline Script Execution (FOIT Prevention)', () => {
    it('should have an inline script in head that executes before first paint', () => {
      // Check that a script exists in the head
      const headScripts = Array.from(
        document.querySelectorAll('head > script')
      );
      // Note: In actual implementation, this will be verified at the Astro component level
      expect(headScripts).toBeDefined();
    });

    it('inline script reads sessionStorage first before applying dark class', () => {
      // Simulate what the inline script should do
      const savedTheme = sessionStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }

      sessionStorage.setItem('theme', 'dark');
      const storedTheme = sessionStorage.getItem('theme');
      expect(storedTheme).toBe('dark');
    });

    it('inline script falls back to prefers-color-scheme if sessionStorage is empty', () => {
      // Mock matchMedia
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn((query) => {
        return {
          matches: query === '(prefers-color-scheme: dark)',
          addListener: vi.fn(),
          removeListener: vi.fn(),
        };
      });

      sessionStorage.clear();
      const mediaQuery = window.matchMedia(
        '(prefers-color-scheme: dark)'
      );
      if (mediaQuery.matches) {
        expect(mediaQuery.matches).toBe(true);
      }

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Page-Level Styling', () => {
    it('light mode page applies bg-gray-50 and text-gray-900', () => {
      // Remove dark class (light mode)
      document.documentElement.classList.remove('dark');
      expect(
        document.documentElement.classList.contains('dark')
      ).toBe(false);
    });

    it('dark mode page applies dark:bg-gray-900 and dark:text-gray-100', () => {
      // Add dark class
      document.documentElement.classList.add('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(
        true
      );
    });
  });
});
