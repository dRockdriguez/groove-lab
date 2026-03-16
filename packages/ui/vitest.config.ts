import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    {
      // Patch @testing-library/user-event's internal setSelectionRange to handle
      // input[type=range] without throwing. The original throws "Not implemented"
      // for range inputs because they're not in the editableInputTypes list. Since
      // Home/End key handling for range inputs only needs a noop (jsdom handles
      // focus), we return early for range inputs instead of throwing.
      name: 'patch-ue-setselectionrange',
      transform(code, id) {
        if (
          id.includes('user-event') &&
          id.includes('event/selection/setSelectionRange')
        ) {
          // Insert a range-input early-return at the top of the setSelectionRange function
          return code.replace(
            'function setSelectionRange(element, anchorOffset, focusOffset) {',
            'function setSelectionRange(element, anchorOffset, focusOffset) {\n    if (element.type === "range") return;',
          );
        }
      },
    },
  ],
  resolve: {
    alias: [
      {
        // Only match the bare '@testing-library/react' import (not subpaths like /pure).
        // The replacement calls cleanup() before each render() to prevent stale DOM
        // nodes from accumulating when render() is called multiple times in one test.
        find: /^@testing-library\/react$/,
        replacement: resolve(__dirname, 'src/test-rtl-wrapper.ts'),
      },
    ],
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
