import { useEffect, useReducer } from 'react';
import { LocalStorageNotifier } from '../notifier/LocalStorageNotifier';

/**
 * Hook that subscribes to localStorage changes for specified keys.
 *
 * Triggers a re-render when any watched key's value changes — both from:
 *   - The same tab (via `LocalStorageNotifier`, which storage utilities call after writes)
 *   - Other tabs (via the browser's native `storage` event)
 *
 * SSR-safe: gracefully handles environments where `window` or `localStorage` are absent.
 *
 * @param keys - Array of localStorage keys to watch (e.g., `['groovelab_tags', 'groovelab_favorites']`)
 * @param callback - Optional callback fired with `(changedKey, newValue)` when any watched key changes
 */
export function useLocalStorageListener(
  keys: string[],
  callback?: (changedKey: string, newValue: string | null) => void,
): void {
  // A simple counter-based re-render trigger — no actual state value needed
  const [, forceUpdate] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleChange = (changedKey: string, newValue: string | null) => {
      forceUpdate();
      callback?.(changedKey, newValue);
    };

    // ── Same-tab sync: LocalStorageNotifier ──────────────────────────────
    const unsubscribers = keys.map((key) =>
      LocalStorageNotifier.subscribe(key, (value) => handleChange(key, value)),
    );

    // ── Cross-tab sync: native storage event ─────────────────────────────
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key !== null && keys.includes(e.key)) {
        handleChange(e.key, e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      for (const unsubscribe of unsubscribers) {
        unsubscribe();
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(',')]);
}
