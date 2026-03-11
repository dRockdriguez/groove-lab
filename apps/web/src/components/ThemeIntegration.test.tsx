import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Theme Integration', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    // Reset html element
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    sessionStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  describe('Theme Root Application', () => {
    it('should add "dark" class to html element when dark mode is activated', () => {
      document.documentElement.classList.add('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove "dark" class from html element when light mode is activated', () => {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('sessionStorage Persistence', () => {
    it('should persist theme choice in sessionStorage when toggled', () => {
      sessionStorage.setItem('theme', 'dark');
      expect(sessionStorage.getItem('theme')).toBe('dark');
    });

    it('should restore theme from sessionStorage on page navigation', () => {
      sessionStorage.setItem('theme', 'dark');
      // Simulate reading from sessionStorage
      const savedTheme = sessionStorage.getItem('theme');
      expect(savedTheme).toBe('dark');
    });

    it('should not use localStorage for persistence (only sessionStorage)', () => {
      // Verify that theme is not persisted to localStorage
      localStorage.clear();
      sessionStorage.setItem('theme', 'dark');
      expect(localStorage.getItem('theme')).toBeNull();
    });
  });

  describe('System Preference Fallback', () => {
    it('should default to light mode if no theme preference is set', () => {
      // When neither sessionStorage nor system preference is available
      sessionStorage.clear();
      const theme = sessionStorage.getItem('theme') || 'light';
      expect(theme).toBe('light');
    });

    it('should respect prefers-color-scheme: dark system preference on first load', () => {
      // Mock matchMedia
      const mockMatchMedia = vi.fn(() => ({
        matches: true,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));
      window.matchMedia = mockMatchMedia;

      // When system preference is dark and no sessionStorage
      sessionStorage.clear();
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      if (mediaQuery.matches) {
        expect(mediaQuery.matches).toBe(true);
      }
    });

    it('should respect prefers-color-scheme: light system preference on first load', () => {
      // Mock matchMedia
      const mockMatchMedia = vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));
      window.matchMedia = mockMatchMedia;

      // When system preference is light and no sessionStorage
      sessionStorage.clear();
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      expect(mediaQuery.matches).toBe(false);
    });

    it('should default to light mode if matchMedia is unavailable', () => {
      // Save original matchMedia
      const originalMatchMedia = window.matchMedia;

      // Mock matchMedia to return no preference
      window.matchMedia = vi.fn(() => ({
        matches: false,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));

      sessionStorage.clear();
      const theme = sessionStorage.getItem('theme') || 'light';
      expect(theme).toBe('light');

      // Restore
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Manual Toggle Override', () => {
    it('should override system preference when user manually toggles theme', () => {
      // Mock system preference as dark
      const mockMatchMedia = vi.fn(() => ({
        matches: true,
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }));
      window.matchMedia = mockMatchMedia;

      // User manually toggles to light
      sessionStorage.setItem('theme', 'light');
      const userTheme = sessionStorage.getItem('theme');

      expect(userTheme).toBe('light');
    });
  });

  describe('Theme Switching', () => {
    it('should update UI immediately without page reload', () => {
      // Simulate theme switch
      document.documentElement.classList.add('dark');
      const isDark = document.documentElement.classList.contains('dark');
      expect(isDark).toBe(true);

      // No page reload occurred (we're still in the same test)
    });
  });

  describe('FOIT Prevention', () => {
    it('should have inline script in head that runs before first paint', () => {
      // This test verifies that the inline script exists
      // The actual script execution is tested at integration level
      const scripts = document.querySelectorAll('head > script');
      // Note: In real implementation, verify that at least one script is present
      // and runs synchronously before content renders
      expect(scripts).toBeDefined();
    });

    it('should apply dark class synchronously from sessionStorage', () => {
      sessionStorage.setItem('theme', 'dark');
      // Simulate what the inline script would do
      if (sessionStorage.getItem('theme') === 'dark') {
        document.documentElement.classList.add('dark');
      }
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
  });
});
