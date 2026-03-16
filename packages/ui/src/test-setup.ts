import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Make `jest` available as a global alias for `vi`.
// @testing-library/react's asyncWrapper checks `typeof jest !== 'undefined'` to
// decide whether to call `jest.advanceTimersByTime(0)` after dispatching events.
// Without this, any `await user.keyboard(...)` call hangs when vi.useFakeTimers()
// is active because the internal setTimeout(resolve, 0) is faked and never fired.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).jest = vi;

// Fix setSelectionRange for input[type=range].
// userEvent v14 calls setSelectionRange on Home/End key presses which jsdom
// does not implement for range inputs, causing "Not implemented" errors.
const originalSetSelectionRange = HTMLInputElement.prototype.setSelectionRange;
Object.defineProperty(HTMLInputElement.prototype, 'setSelectionRange', {
  value: function (
    this: HTMLInputElement,
    ...args: Parameters<typeof originalSetSelectionRange>
  ) {
    if (this.type === 'range') return;
    return originalSetSelectionRange.apply(this, args);
  },
  writable: true,
  configurable: true,
});
