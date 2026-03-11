import React from 'react';

export const WelcomeBanner: React.FC = () => {
  return (
    <header className="mb-10">
      <h1 className="text-4xl font-bold text-green-400 tracking-tight">GrooveLab</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Your intelligent music practice companion.</p>
      <div className="mt-4 flex gap-3 text-sm text-gray-400">
        <span>Drums</span>
        <span>Bass</span>
        <span>Guitar</span>
      </div>
    </header>
  );
};
