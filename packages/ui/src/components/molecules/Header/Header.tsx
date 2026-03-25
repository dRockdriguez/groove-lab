import React, { useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from '../../atoms/ThemeToggle';
import { NavigationMenu, NavigationMenuItem } from '../../atoms/NavigationMenu';

export interface HeaderProps {
  navigationItems?: NavigationMenuItem[];
  activeHref?: string;
}

const DEFAULT_NAV_ITEMS: NavigationMenuItem[] = [
  { href: '/', label: 'Home' },
  { href: '/import', label: 'Import' },
];

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  const stored = sessionStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  const mq =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : undefined;
  if (mq?.matches) {
    return 'dark';
  }

  return 'light';
}

/**
 * Normalize a pathname by stripping hash, query params, and trailing slash.
 * Returns the normalized path string.
 */
function normalizePathname(pathname: string): string {
  // Strip hash
  const withoutHash = pathname.split('#')[0];
  // Strip query params
  const withoutQuery = withoutHash.split('?')[0];
  // Strip trailing slash (but preserve root "/")
  const normalized = withoutQuery.length > 1 ? withoutQuery.replace(/\/$/, '') : withoutQuery;
  return normalized;
}

/**
 * Detect the active href from the current pathname.
 * Returns the matching menu href, or undefined if no match.
 */
function detectActiveHref(pathname: string): string | undefined {
  const normalized = normalizePathname(pathname);

  if (normalized === '/') return '/';
  if (normalized === '/import') return '/import';
  if (normalized.startsWith('/practice')) return '/practice';

  return undefined;
}

function getCurrentPathname(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.pathname;
}

export const Header: React.FC<HeaderProps> = ({ navigationItems, activeHref: activeHrefProp }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);
  const [detectedActiveHref, setDetectedActiveHref] = useState<string | undefined>(undefined);
  const [toolsButtonVisible, setToolsButtonVisible] = useState(false);
  const [toolsSidebarOpen, setToolsSidebarOpen] = useState(false);

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    setMounted(true);

    // Detect active route from current pathname
    const pathname = getCurrentPathname();
    if (pathname !== undefined) {
      setDetectedActiveHref(detectActiveHref(pathname));
    }
  }, []);

  useEffect(() => {
    // Update active href when browser navigates (back/forward)
    const handlePopState = () => {
      const pathname = getCurrentPathname();
      if (pathname !== undefined) {
        setDetectedActiveHref(detectActiveHref(pathname));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, mounted]);

  const handleToggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      sessionStorage.setItem('theme', next);
      return next;
    });
  }, []);

  // Listen for tools sidebar availability and state changes
  useEffect(() => {
    const onAvailable = () => setToolsButtonVisible(true);
    const onUnavailable = () => {
      setToolsButtonVisible(false);
      setToolsSidebarOpen(false);
    };
    const onState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      setToolsSidebarOpen(customEvent.detail.isOpen);
    };

    document.addEventListener('tools-sidebar-available', onAvailable);
    document.addEventListener('tools-sidebar-unavailable', onUnavailable);
    document.addEventListener('tools-sidebar-state', onState);

    return () => {
      document.removeEventListener('tools-sidebar-available', onAvailable);
      document.removeEventListener('tools-sidebar-unavailable', onUnavailable);
      document.removeEventListener('tools-sidebar-state', onState);
    };
  }, []);

  // Use prop-provided values if given, otherwise use internal defaults
  const resolvedItems = navigationItems ?? DEFAULT_NAV_ITEMS;
  const resolvedActiveHref = activeHrefProp ?? detectedActiveHref;

  return (
    <header className="w-full flex items-center justify-between px-4 py-2">
      <NavigationMenu items={resolvedItems} activeHref={resolvedActiveHref} />
      <div className="flex items-center gap-2">
        {toolsButtonVisible && !toolsSidebarOpen && (
          <button
            type="button"
            onClick={() => document.dispatchEvent(new CustomEvent('tools-sidebar-toggle'))}
            aria-label="Toggle tools sidebar (Ctrl+T)"
            aria-controls="tools-sidebar-panel"
            data-testid="tools-sidebar-toggle"
            className={[
              'flex items-center justify-center w-10 h-10 rounded-md',
              'bg-gray-100 dark:bg-gray-800',
              'hover:bg-gray-200 dark:hover:bg-gray-700',
              'border border-gray-200 dark:border-gray-700',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-green-500',
            ].join(' ')}
          >
            <span aria-hidden="true" className="text-lg leading-none">≡</span>
          </button>
        )}
        <ThemeToggle theme={theme} onToggle={handleToggle} />
      </div>
    </header>
  );
};
