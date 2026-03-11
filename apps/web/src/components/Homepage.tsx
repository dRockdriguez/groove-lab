import React, { useState, useCallback, useEffect } from 'react';
import { ExerciseBrowser, ThemeToggle } from '@groovelab/ui';
import type { InstrumentExercises } from '@groovelab/types';
import { WelcomeBanner } from './WelcomeBanner';

export interface HomepageProps {
  exercisesByInstrument: InstrumentExercises[];
}

function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  const stored = sessionStorage.getItem('theme');
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }

  const mq = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : undefined;
  if (mq?.matches) {
    return 'dark';
  }

  return 'light';
}

export const Homepage: React.FC<HomepageProps> = ({ exercisesByInstrument }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Sync theme from sessionStorage only after mount
    const theme = getInitialTheme();
    setTheme(theme);
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
    <>
      <div className="flex justify-end mb-4">
        <ThemeToggle theme={theme} onToggle={handleToggle} />
      </div>
      <WelcomeBanner />
      <ExerciseBrowser exercisesByInstrument={exercisesByInstrument} />
    </>
  );
};
