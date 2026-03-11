import '@testing-library/jest-dom';

// Mirror the body classes applied by BaseLayout.astro so unit tests that
// query document.body class attributes pass without a full Astro render.
document.body.className =
  'bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-200 antialiased';
