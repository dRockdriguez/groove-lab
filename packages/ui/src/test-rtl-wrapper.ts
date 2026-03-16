/**
 * Custom @testing-library/react wrapper.
 *
 * Calls cleanup() before each render() call to ensure that multiple render()
 * calls within the same test don't accumulate stale DOM nodes. Also registers
 * afterEach(cleanup) for the standard between-test cleanup behaviour.
 */
import { cleanup, render as originalRender } from '@testing-library/react/pure';
import type { RenderOptions, RenderResult } from '@testing-library/react/pure';
import type { ReactElement } from 'react';
import { afterEach } from 'vitest';

// Register standard after-each cleanup (mirrors what the main entry point does).
afterEach(cleanup);

// Re-export everything from the pure entry so callers don't lose any exports.
export * from '@testing-library/react/pure';

// Override render to clean up the DOM before each call.
export function render(ui: ReactElement, options?: RenderOptions): RenderResult {
  cleanup();
  return originalRender(ui, options);
}
