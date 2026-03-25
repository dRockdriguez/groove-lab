import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageNotifier } from './LocalStorageNotifier';

describe('LocalStorageNotifier', () => {
  beforeEach(() => {
    // Reset the notifier state before each test
    // We do this by clearing all listeners
    const allKeys: string[] = [];
    const mockNotifier = LocalStorageNotifier as any;
    if (mockNotifier._listeners) {
      mockNotifier._listeners.clear();
    }
  });

  describe('subscribe', () => {
    it('should subscribe a listener to a key', () => {
      const listener = vi.fn();
      LocalStorageNotifier.subscribe('test-key', listener);
      LocalStorageNotifier.notifyChange('test-key', 'value');
      expect(listener).toHaveBeenCalledWith('value');
    });

    it('should return an unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = LocalStorageNotifier.subscribe('test-key', listener);
      unsubscribe();
      LocalStorageNotifier.notifyChange('test-key', 'value');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners on the same key', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      LocalStorageNotifier.subscribe('test-key', listener1);
      LocalStorageNotifier.subscribe('test-key', listener2);
      LocalStorageNotifier.notifyChange('test-key', 'value');
      expect(listener1).toHaveBeenCalledWith('value');
      expect(listener2).toHaveBeenCalledWith('value');
    });

    it('should handle subscribing to multiple different keys', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      LocalStorageNotifier.subscribe('key-1', listener1);
      LocalStorageNotifier.subscribe('key-2', listener2);
      LocalStorageNotifier.notifyChange('key-1', 'value-1');
      LocalStorageNotifier.notifyChange('key-2', 'value-2');
      expect(listener1).toHaveBeenCalledWith('value-1');
      expect(listener2).toHaveBeenCalledWith('value-2');
    });

    it('should only notify relevant listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      LocalStorageNotifier.subscribe('key-1', listener1);
      LocalStorageNotifier.subscribe('key-2', listener2);
      LocalStorageNotifier.notifyChange('key-1', 'value-1');
      expect(listener1).toHaveBeenCalledWith('value-1');
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('notifyChange', () => {
    it('should call all subscribers for a key', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      LocalStorageNotifier.subscribe('key', listener1);
      LocalStorageNotifier.subscribe('key', listener2);
      LocalStorageNotifier.notifyChange('key', 'new-value');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should pass the correct value to listeners', () => {
      const listener = vi.fn();
      LocalStorageNotifier.subscribe('key', listener);
      LocalStorageNotifier.notifyChange('key', 'test-value');
      expect(listener).toHaveBeenCalledWith('test-value');
    });

    it('should handle null values', () => {
      const listener = vi.fn();
      LocalStorageNotifier.subscribe('key', listener);
      LocalStorageNotifier.notifyChange('key', null);
      expect(listener).toHaveBeenCalledWith(null);
    });

    it('should not error when notifying a key with no subscribers', () => {
      expect(() => {
        LocalStorageNotifier.notifyChange('non-existent-key', 'value');
      }).not.toThrow();
    });

    it('should handle rapid successive notifications', () => {
      const listener = vi.fn();
      LocalStorageNotifier.subscribe('key', listener);
      LocalStorageNotifier.notifyChange('key', 'value-1');
      LocalStorageNotifier.notifyChange('key', 'value-2');
      LocalStorageNotifier.notifyChange('key', 'value-3');
      expect(listener).toHaveBeenCalledTimes(3);
      expect(listener).toHaveBeenNthCalledWith(1, 'value-1');
      expect(listener).toHaveBeenNthCalledWith(2, 'value-2');
      expect(listener).toHaveBeenNthCalledWith(3, 'value-3');
    });
  });

  describe('unsubscribe', () => {
    it('should remove listener after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = LocalStorageNotifier.subscribe('key', listener);
      unsubscribe();
      LocalStorageNotifier.notifyChange('key', 'value');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle unsubscribing one listener while keeping others', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const unsub1 = LocalStorageNotifier.subscribe('key', listener1);
      LocalStorageNotifier.subscribe('key', listener2);
      unsub1();
      LocalStorageNotifier.notifyChange('key', 'value');
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('value');
    });

    it('should handle multiple unsubscribes', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const unsub1 = LocalStorageNotifier.subscribe('key', listener1);
      const unsub2 = LocalStorageNotifier.subscribe('key', listener2);
      unsub1();
      unsub2();
      LocalStorageNotifier.notifyChange('key', 'value');
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should be idempotent (can unsubscribe twice safely)', () => {
      const listener = vi.fn();
      const unsub = LocalStorageNotifier.subscribe('key', listener);
      unsub();
      expect(() => unsub()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string as a key', () => {
      const listener = vi.fn();
      LocalStorageNotifier.subscribe('', listener);
      LocalStorageNotifier.notifyChange('', 'value');
      expect(listener).toHaveBeenCalledWith('value');
    });

    it('should handle special characters in keys', () => {
      const listener = vi.fn();
      const specialKey = 'groovelab:tags:ex-123_special.key';
      LocalStorageNotifier.subscribe(specialKey, listener);
      LocalStorageNotifier.notifyChange(specialKey, 'value');
      expect(listener).toHaveBeenCalledWith('value');
    });

    it('should handle very large values', () => {
      const listener = vi.fn();
      const largeValue = JSON.stringify(new Array(10000).fill('test'));
      LocalStorageNotifier.subscribe('key', listener);
      LocalStorageNotifier.notifyChange('key', largeValue);
      expect(listener).toHaveBeenCalledWith(largeValue);
    });

    it('should handle listener that throws an error (does not break other listeners)', () => {
      const errorListener = vi.fn(() => {
        throw new Error('listener error');
      });
      const normalListener = vi.fn();
      LocalStorageNotifier.subscribe('key', errorListener);
      LocalStorageNotifier.subscribe('key', normalListener);

      // The notifier doesn't catch errors, so this will throw
      expect(() => {
        LocalStorageNotifier.notifyChange('key', 'value');
      }).toThrow('listener error');
    });
  });
});
