import React from 'react';

export const WelcomeBanner: React.FC = () => {
  return (
    <header className="mb-10">
      <h1 className="text-4xl font-bold text-green-400 tracking-tight">GrooveLab</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">Your intelligent music practice companion.</p>
    </header>
  );
};
