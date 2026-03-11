import React, { useState, useEffect, useCallback } from 'react';
import { ThemeToggle } from '../../atoms/ThemeToggle';

export interface HeaderProps {}

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

export const Header: React.FC<HeaderProps> = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    setMounted(true);
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

  return (
    <header className="w-full flex justify-end px-4 py-2">
      <ThemeToggle theme={theme} onToggle={handleToggle} />
    </header>
  );
};
