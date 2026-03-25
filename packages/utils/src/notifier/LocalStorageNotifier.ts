/**
 * LocalStorageNotifier — singleton event bus for in-tab localStorage change notifications.
 *
 * The browser's native `storage` event only fires in OTHER tabs, not the current one.
 * This notifier fills that gap: storage utility functions call `notifyChange()` after
 * writing to localStorage, and components can `subscribe()` to receive instant updates
 * within the same tab.
 */

type Listener = (value: string | null) => void;

class LocalStorageNotifierClass {
  private readonly _listeners: Map<string, Set<Listener>> = new Map();

  /**
   * Subscribe to changes for a specific localStorage key.
   * Returns an unsubscribe function — call it on cleanup.
   */
  subscribe(key: string, listener: Listener): () => void {
    if (!this._listeners.has(key)) {
      this._listeners.set(key, new Set());
    }
    this._listeners.get(key)!.add(listener);

    return () => {
      const set = this._listeners.get(key);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this._listeners.delete(key);
        }
      }
    };
  }

  /**
   * Notify all subscribers for the given key with the new value.
   * Called by storage utility functions after writing to localStorage.
   */
  notifyChange(key: string, value: string | null): void {
    const set = this._listeners.get(key);
    if (!set) return;
    for (const listener of set) {
      listener(value);
    }
  }
}

/** Singleton instance — import and use directly. */
export const LocalStorageNotifier = new LocalStorageNotifierClass();
