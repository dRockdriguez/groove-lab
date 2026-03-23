import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { FavoritesStore, TagsStore } from '@groovelab/types';
import {
  // Favorites
  getFavorites,
  setFavorites,
  isFavorite,
  toggleFavorite,
  // Tags
  getTags,
  setTags,
  getExerciseTags,
  addTag,
  removeTag,
  setExerciseTags,
  getDistinctTags,
  // Filter State
  getSelectedFilterTags,
  setSelectedFilterTags,
  clearSelectedFilterTags,
} from './index';

describe('Favorites & Tags Storage Layer', () => {
  beforeEach(() => {
    // Clear localStorage and sessionStorage before each test
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // ──────────────────────────────────────────────────────────────────
  // Storage Keys
  // ──────────────────────────────────────────────────────────────────

  describe('Storage Keys', () => {
    it('should store favorites at key "groovelab_favorites"', () => {
      const favorites: FavoritesStore = { 'ex-1': true, 'ex-2': true };
      setFavorites(favorites);
      expect(localStorage.getItem('groovelab_favorites')).toEqual(JSON.stringify(favorites));
    });

    it('should store tags at key "groovelab_tags"', () => {
      const tags: TagsStore = { 'ex-1': ['beginner', 'groove'] };
      setTags(tags);
      expect(localStorage.getItem('groovelab_tags')).toEqual(JSON.stringify(tags));
    });

    it('should store filter tags at key "groovelab_filter_tags" in sessionStorage', () => {
      const filterTags = ['groove', 'beginner'];
      setSelectedFilterTags(filterTags);
      expect(sessionStorage.getItem('groovelab_filter_tags')).toEqual(JSON.stringify(filterTags));
    });

    it('should follow naming convention "groovelab_*"', () => {
      setFavorites({ 'ex-1': true });
      setTags({ 'ex-1': ['test'] });
      setSelectedFilterTags(['test']);

      const localStorageKeys = Object.keys(localStorage).filter(k => k.startsWith('groovelab_'));
      const sessionStorageKeys = Object.keys(sessionStorage).filter(k => k.startsWith('groovelab_'));

      expect(localStorageKeys).toContain('groovelab_favorites');
      expect(localStorageKeys).toContain('groovelab_tags');
      expect(sessionStorageKeys).toContain('groovelab_filter_tags');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Favorites Functions
  // ──────────────────────────────────────────────────────────────────

  describe('Favorites: getFavorites()', () => {
    it('should return {} if key does not exist', () => {
      expect(getFavorites()).toEqual({});
    });

    it('should return valid FavoritesStore on success', () => {
      const favorites: FavoritesStore = { 'ex-1': true, 'ex-2': true };
      localStorage.setItem('groovelab_favorites', JSON.stringify(favorites));
      expect(getFavorites()).toEqual(favorites);
    });

    it('should return {} for invalid JSON', () => {
      localStorage.setItem('groovelab_favorites', 'invalid json {');
      expect(getFavorites()).toEqual({});
    });
  });

  describe('Favorites: setFavorites()', () => {
    it('should persist to localStorage', () => {
      const favorites: FavoritesStore = { 'ex-1': true, 'ex-2': true };
      setFavorites(favorites);
      expect(localStorage.getItem('groovelab_favorites')).toEqual(JSON.stringify(favorites));
    });

    it('subsequent getFavorites() returns same data', () => {
      const favorites: FavoritesStore = { 'ex-1': true, 'ex-2': true };
      setFavorites(favorites);
      expect(getFavorites()).toEqual(favorites);
    });

    it('should clear all favorites when passed empty object', () => {
      setFavorites({ 'ex-1': true });
      setFavorites({});
      expect(getFavorites()).toEqual({});
    });
  });

  describe('Favorites: isFavorite()', () => {
    it('should return true if id in store', () => {
      setFavorites({ 'ex-1': true });
      expect(isFavorite('ex-1')).toBe(true);
    });

    it('should return false if id not in store', () => {
      setFavorites({ 'ex-1': true });
      expect(isFavorite('ex-2')).toBe(false);
    });

    it('should return false for non-existent id in empty store', () => {
      expect(isFavorite('ex-1')).toBe(false);
    });

    it('should return false if id exists but value is not true', () => {
      localStorage.setItem('groovelab_favorites', JSON.stringify({ 'ex-1': false }));
      expect(isFavorite('ex-1')).toBe(false);
    });
  });

  describe('Favorites: toggleFavorite()', () => {
    it('should set to true if currently false', () => {
      expect(toggleFavorite('ex-1')).toBe(true);
      expect(isFavorite('ex-1')).toBe(true);
    });

    it('should set to false if currently true', () => {
      setFavorites({ 'ex-1': true });
      expect(toggleFavorite('ex-1')).toBe(false);
      expect(isFavorite('ex-1')).toBe(false);
    });

    it('should return new state', () => {
      const newState = toggleFavorite('ex-1');
      expect(newState).toBe(true);
      const anotherNewState = toggleFavorite('ex-1');
      expect(anotherNewState).toBe(false);
    });

    it('should persist change immediately to localStorage', () => {
      toggleFavorite('ex-1');
      const stored = JSON.parse(localStorage.getItem('groovelab_favorites') || '{}');
      expect(stored['ex-1']).toBe(true);

      toggleFavorite('ex-1');
      const updatedStored = JSON.parse(localStorage.getItem('groovelab_favorites') || '{}');
      expect(updatedStored['ex-1']).toBeUndefined();
    });

    it('should not affect other favorites', () => {
      setFavorites({ 'ex-1': true, 'ex-2': true });
      toggleFavorite('ex-1');
      expect(isFavorite('ex-2')).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Tags Functions
  // ──────────────────────────────────────────────────────────────────

  describe('Tags: getTags()', () => {
    it('should return {} if key does not exist', () => {
      expect(getTags()).toEqual({});
    });

    it('should return valid TagsStore on success', () => {
      const tags: TagsStore = { 'ex-1': ['beginner', 'groove'] };
      localStorage.setItem('groovelab_tags', JSON.stringify(tags));
      expect(getTags()).toEqual(tags);
    });

    it('should return {} for invalid JSON', () => {
      localStorage.setItem('groovelab_tags', 'invalid {');
      expect(getTags()).toEqual({});
    });
  });

  describe('Tags: setTags()', () => {
    it('should persist to localStorage', () => {
      const tags: TagsStore = { 'ex-1': ['beginner'] };
      setTags(tags);
      expect(localStorage.getItem('groovelab_tags')).toEqual(JSON.stringify(tags));
    });

    it('subsequent getTags() returns same data', () => {
      const tags: TagsStore = { 'ex-1': ['beginner', 'groove'] };
      setTags(tags);
      expect(getTags()).toEqual(tags);
    });
  });

  describe('Tags: getExerciseTags()', () => {
    it('should return [] if exercise not in store', () => {
      expect(getExerciseTags('ex-1')).toEqual([]);
    });

    it('should return array of tags (never null)', () => {
      setTags({ 'ex-1': ['beginner', 'groove'] });
      const tags = getExerciseTags('ex-1');
      expect(Array.isArray(tags)).toBe(true);
      expect(tags).toEqual(['beginner', 'groove']);
    });

    it('should return [] for exercise without tags', () => {
      setTags({ 'ex-2': ['advanced'] });
      expect(getExerciseTags('ex-1')).toEqual([]);
    });
  });

  describe('Tags: addTag()', () => {
    it('should add tag if not already present', () => {
      addTag('ex-1', 'beginner');
      expect(getExerciseTags('ex-1')).toContain('beginner');
    });

    it('should be idempotent (adding same tag twice is no-op)', () => {
      addTag('ex-1', 'beginner');
      addTag('ex-1', 'beginner');
      const tags = getExerciseTags('ex-1');
      const count = tags.filter(t => t === 'beginner').length;
      expect(count).toBe(1);
    });

    it('should trim whitespace from tag', () => {
      addTag('ex-1', '  hello  ');
      expect(getExerciseTags('ex-1')).toContain('hello');
      expect(getExerciseTags('ex-1')).not.toContain('  hello  ');
    });

    it('should ignore empty strings after trimming', () => {
      addTag('ex-1', '   ');
      expect(getExerciseTags('ex-1')).toEqual([]);
    });

    it('should persist immediately', () => {
      addTag('ex-1', 'beginner');
      const stored = JSON.parse(localStorage.getItem('groovelab_tags') || '{}');
      expect(stored['ex-1']).toContain('beginner');
    });

    it('should add multiple tags to same exercise', () => {
      addTag('ex-1', 'beginner');
      addTag('ex-1', 'groove');
      const tags = getExerciseTags('ex-1');
      expect(tags).toContain('beginner');
      expect(tags).toContain('groove');
    });
  });

  describe('Tags: removeTag()', () => {
    it('should remove tag if present', () => {
      addTag('ex-1', 'beginner');
      addTag('ex-1', 'groove');
      removeTag('ex-1', 'beginner');
      expect(getExerciseTags('ex-1')).not.toContain('beginner');
      expect(getExerciseTags('ex-1')).toContain('groove');
    });

    it('should be no-op if tag not found', () => {
      addTag('ex-1', 'beginner');
      removeTag('ex-1', 'nonexistent');
      expect(getExerciseTags('ex-1')).toContain('beginner');
    });

    it('should be no-op if exercise not in store', () => {
      expect(() => removeTag('nonexistent', 'tag')).not.toThrow();
    });

    it('should remove exercise entry if last tag deleted', () => {
      addTag('ex-1', 'beginner');
      removeTag('ex-1', 'beginner');
      const stored = JSON.parse(localStorage.getItem('groovelab_tags') || '{}');
      expect(stored['ex-1']).toBeUndefined();
    });

    it('should persist immediately', () => {
      addTag('ex-1', 'beginner');
      addTag('ex-1', 'groove');
      removeTag('ex-1', 'beginner');
      const stored = JSON.parse(localStorage.getItem('groovelab_tags') || '{}');
      expect(stored['ex-1']).not.toContain('beginner');
    });
  });

  describe('Tags: setExerciseTags()', () => {
    it('should replace all tags for exercise', () => {
      setExerciseTags('ex-1', ['old-tag']);
      setExerciseTags('ex-1', ['new-tag1', 'new-tag2']);
      expect(getExerciseTags('ex-1')).toEqual(['new-tag1', 'new-tag2']);
      expect(getExerciseTags('ex-1')).not.toContain('old-tag');
    });

    it('should persist immediately', () => {
      setExerciseTags('ex-1', ['tag1', 'tag2']);
      const stored = JSON.parse(localStorage.getItem('groovelab_tags') || '{}');
      expect(stored['ex-1']).toEqual(['tag1', 'tag2']);
    });

    it('should remove exercise entry if passed empty array', () => {
      setExerciseTags('ex-1', ['tag']);
      setExerciseTags('ex-1', []);
      const stored = JSON.parse(localStorage.getItem('groovelab_tags') || '{}');
      expect(stored['ex-1']).toBeUndefined();
    });

    it('should not affect other exercises', () => {
      setExerciseTags('ex-1', ['tag1']);
      setExerciseTags('ex-2', ['tag2']);
      setExerciseTags('ex-1', ['new-tag']);
      expect(getExerciseTags('ex-2')).toContain('tag2');
    });
  });

  describe('Tags: getDistinctTags()', () => {
    it('should return all unique tags across all exercises', () => {
      setExerciseTags('ex-1', ['groove', 'beginner']);
      setExerciseTags('ex-2', ['advanced', 'groove']);
      const distinct = getDistinctTags();
      expect(distinct).toContain('groove');
      expect(distinct).toContain('beginner');
      expect(distinct).toContain('advanced');
      expect(distinct.length).toBe(3);
    });

    it('should return sorted alphabetically (case-insensitive)', () => {
      setExerciseTags('ex-1', ['Zebra', 'apple', 'Banana']);
      const distinct = getDistinctTags();
      expect(distinct).toEqual(['apple', 'Banana', 'Zebra']);
    });

    it('should deduplicate tags', () => {
      setExerciseTags('ex-1', ['groove']);
      setExerciseTags('ex-2', ['groove']);
      const distinct = getDistinctTags();
      const count = distinct.filter(t => t === 'groove').length;
      expect(count).toBe(1);
    });

    it('should return empty array if no tags exist', () => {
      expect(getDistinctTags()).toEqual([]);
    });

    it('should return empty array for empty tag store', () => {
      setExerciseTags('ex-1', []);
      expect(getDistinctTags()).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Session Filter State
  // ──────────────────────────────────────────────────────────────────

  describe('Filter State: getSelectedFilterTags()', () => {
    it('should return [] if sessionStorage key does not exist', () => {
      expect(getSelectedFilterTags()).toEqual([]);
    });

    it('should return valid string array on success', () => {
      const filterTags = ['groove', 'beginner'];
      sessionStorage.setItem('groovelab_filter_tags', JSON.stringify(filterTags));
      expect(getSelectedFilterTags()).toEqual(filterTags);
    });

    it('should return [] for invalid JSON', () => {
      sessionStorage.setItem('groovelab_filter_tags', 'invalid {');
      expect(getSelectedFilterTags()).toEqual([]);
    });
  });

  describe('Filter State: setSelectedFilterTags()', () => {
    it('should persist array to sessionStorage', () => {
      const filterTags = ['groove', 'advanced'];
      setSelectedFilterTags(filterTags);
      expect(sessionStorage.getItem('groovelab_filter_tags')).toEqual(JSON.stringify(filterTags));
    });

    it('subsequent getSelectedFilterTags() returns same data', () => {
      const filterTags = ['beginner', 'groove'];
      setSelectedFilterTags(filterTags);
      expect(getSelectedFilterTags()).toEqual(filterTags);
    });

    it('should handle empty array', () => {
      setSelectedFilterTags([]);
      expect(getSelectedFilterTags()).toEqual([]);
    });
  });

  describe('Filter State: clearSelectedFilterTags()', () => {
    it('should remove key from sessionStorage', () => {
      setSelectedFilterTags(['groove']);
      clearSelectedFilterTags();
      expect(sessionStorage.getItem('groovelab_filter_tags')).toBeNull();
    });

    it('subsequent getSelectedFilterTags() returns []', () => {
      setSelectedFilterTags(['groove']);
      clearSelectedFilterTags();
      expect(getSelectedFilterTags()).toEqual([]);
    });

    it('should be safe to call when key does not exist', () => {
      expect(() => clearSelectedFilterTags()).not.toThrow();
    });
  });

  describe('Filter State: session persistence', () => {
    it('should NOT persist across page refresh (sessionStorage behavior)', () => {
      // Simulating page refresh by clearing sessionStorage
      setSelectedFilterTags(['groove']);
      sessionStorage.clear();
      expect(getSelectedFilterTags()).toEqual([]);
    });

    it('should persist across function calls in same session', () => {
      setSelectedFilterTags(['groove']);
      expect(getSelectedFilterTags()).toEqual(['groove']);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Error Handling
  // ──────────────────────────────────────────────────────────────────

  describe('Error Handling: Corrupt JSON', () => {
    it('getFavorites() returns {} for corrupted localStorage', () => {
      localStorage.setItem('groovelab_favorites', '{invalid json');
      expect(getFavorites()).toEqual({});
    });

    it('getTags() returns {} for corrupted localStorage', () => {
      localStorage.setItem('groovelab_tags', '{invalid json');
      expect(getTags()).toEqual({});
    });

    it('getSelectedFilterTags() returns [] for corrupted sessionStorage', () => {
      sessionStorage.setItem('groovelab_filter_tags', '{invalid json');
      expect(getSelectedFilterTags()).toEqual([]);
    });

    it('should not throw exceptions on read', () => {
      localStorage.setItem('groovelab_favorites', 'bad json');
      expect(() => getFavorites()).not.toThrow();
    });
  });

  describe('Error Handling: Unavailable Storage (Private Browsing)', () => {
    it('getFavorites() should fallback to in-memory when localStorage unavailable', () => {
      // Mock localStorage to simulate private browsing
      const mockStorage = {
        getItem: () => {
          throw new Error('QuotaExceededError');
        },
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {
          throw new Error('QuotaExceededError');
        },
        clear: () => {},
        length: 0,
        key: () => null,
      };

      vi.stubGlobal('localStorage', mockStorage);

      // First set should fall back to memory
      setFavorites({ 'ex-1': true });

      // Get should return from memory
      expect(getFavorites()).toEqual({ 'ex-1': true });

      vi.unstubAllGlobals();
    });

    it('setFavorites() should gracefully degrade when localStorage unavailable', () => {
      const mockStorage = {
        getItem: () => {
          throw new Error('QuotaExceededError');
        },
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {
          throw new Error('QuotaExceededError');
        },
        clear: () => {},
        length: 0,
        key: () => null,
      };

      vi.stubGlobal('localStorage', mockStorage);

      expect(() => setFavorites({ 'ex-1': true })).not.toThrow();

      vi.unstubAllGlobals();
    });

    it('addTag() should not throw when localStorage unavailable', () => {
      const mockStorage = {
        getItem: () => {
          throw new Error('QuotaExceededError');
        },
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {
          throw new Error('QuotaExceededError');
        },
        clear: () => {},
        length: 0,
        key: () => null,
      };

      vi.stubGlobal('localStorage', mockStorage);

      expect(() => addTag('ex-1', 'tag')).not.toThrow();

      vi.unstubAllGlobals();
    });

    it('setSelectedFilterTags() should fallback to in-memory when sessionStorage unavailable', () => {
      const mockStorage = {
        getItem: () => {
          throw new Error('QuotaExceededError');
        },
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {
          throw new Error('QuotaExceededError');
        },
        clear: () => {},
        length: 0,
        key: () => null,
      };

      vi.stubGlobal('sessionStorage', mockStorage);

      setSelectedFilterTags(['groove']);
      expect(getSelectedFilterTags()).toEqual(['groove']);

      vi.unstubAllGlobals();
    });

    it('clearSelectedFilterTags() should gracefully degrade when sessionStorage unavailable', () => {
      const mockStorage = {
        getItem: () => {
          throw new Error('QuotaExceededError');
        },
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        removeItem: () => {
          throw new Error('QuotaExceededError');
        },
        clear: () => {},
        length: 0,
        key: () => null,
      };

      vi.stubGlobal('sessionStorage', mockStorage);

      expect(() => clearSelectedFilterTags()).not.toThrow();

      vi.unstubAllGlobals();
    });

    it('no exceptions thrown on read/write (user experience unaffected)', () => {
      const mockStorage = {
        getItem: () => {
          throw new Error('SecurityError');
        },
        setItem: () => {
          throw new Error('SecurityError');
        },
        removeItem: () => {
          throw new Error('SecurityError');
        },
        clear: () => {},
        length: 0,
        key: () => null,
      };

      vi.stubGlobal('localStorage', mockStorage);
      vi.stubGlobal('sessionStorage', mockStorage);

      expect(() => {
        getFavorites();
        setFavorites({ 'ex-1': true });
        getTags();
        setTags({ 'ex-1': ['tag'] });
        getSelectedFilterTags();
        setSelectedFilterTags(['tag']);
        clearSelectedFilterTags();
      }).not.toThrow();

      vi.unstubAllGlobals();
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Type Safety
  // ──────────────────────────────────────────────────────────────────

  describe('Type Safety', () => {
    it('getFavorites() returns FavoritesStore type', () => {
      const favorites = getFavorites();
      expect(typeof favorites).toBe('object');
      for (const [key, value] of Object.entries(favorites)) {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('boolean');
      }
    });

    it('getTags() returns TagsStore type', () => {
      const tags = getTags();
      expect(typeof tags).toBe('object');
      for (const [key, value] of Object.entries(tags)) {
        expect(typeof key).toBe('string');
        expect(Array.isArray(value)).toBe(true);
      }
    });

    it('getExerciseTags() returns string[]', () => {
      const tags = getExerciseTags('ex-1');
      expect(Array.isArray(tags)).toBe(true);
      for (const tag of tags) {
        expect(typeof tag).toBe('string');
      }
    });

    it('getDistinctTags() returns string[]', () => {
      const tags = getDistinctTags();
      expect(Array.isArray(tags)).toBe(true);
      for (const tag of tags) {
        expect(typeof tag).toBe('string');
      }
    });

    it('getSelectedFilterTags() returns string[]', () => {
      const tags = getSelectedFilterTags();
      expect(Array.isArray(tags)).toBe(true);
      for (const tag of tags) {
        expect(typeof tag).toBe('string');
      }
    });

    it('isFavorite() returns boolean', () => {
      expect(typeof isFavorite('ex-1')).toBe('boolean');
    });

    it('toggleFavorite() returns boolean', () => {
      expect(typeof toggleFavorite('ex-1')).toBe('boolean');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Edge Cases
  // ──────────────────────────────────────────────────────────────────

  describe('Edge Cases: Empty Storage', () => {
    it('first-time user has no favorites', () => {
      expect(getFavorites()).toEqual({});
    });

    it('first-time user has no tags', () => {
      expect(getTags()).toEqual({});
    });

    it('getExerciseTags() returns [] for first-time user', () => {
      expect(getExerciseTags('ex-1')).toEqual([]);
    });

    it('getDistinctTags() returns [] for first-time user', () => {
      expect(getDistinctTags()).toEqual([]);
    });

    it('isFavorite() returns false for first-time user', () => {
      expect(isFavorite('ex-1')).toBe(false);
    });
  });

  describe('Edge Cases: Tag Whitespace', () => {
    it('should trim leading whitespace', () => {
      addTag('ex-1', '  tag');
      expect(getExerciseTags('ex-1')).toContain('tag');
    });

    it('should trim trailing whitespace', () => {
      addTag('ex-1', 'tag  ');
      expect(getExerciseTags('ex-1')).toContain('tag');
    });

    it('should trim both leading and trailing whitespace', () => {
      addTag('ex-1', '  tag  ');
      expect(getExerciseTags('ex-1')).toContain('tag');
      expect(getExerciseTags('ex-1')).not.toContain('  tag  ');
    });

    it('should ignore whitespace-only tags', () => {
      addTag('ex-1', '   ');
      addTag('ex-1', '\t');
      addTag('ex-1', '\n');
      expect(getExerciseTags('ex-1')).toEqual([]);
    });
  });

  describe('Edge Cases: Duplicate Tags', () => {
    it('addTag() is idempotent', () => {
      addTag('ex-1', 'groove');
      addTag('ex-1', 'groove');
      addTag('ex-1', 'groove');
      expect(getExerciseTags('ex-1')).toEqual(['groove']);
    });

    it('getDistinctTags() deduplicates across exercises', () => {
      addTag('ex-1', 'groove');
      addTag('ex-2', 'groove');
      addTag('ex-3', 'groove');
      expect(getDistinctTags()).toEqual(['groove']);
    });
  });

  describe('Edge Cases: Case Sensitivity', () => {
    it('tags are case-sensitive', () => {
      addTag('ex-1', 'Groove');
      addTag('ex-1', 'groove');
      const tags = getExerciseTags('ex-1');
      expect(tags).toContain('Groove');
      expect(tags).toContain('groove');
      expect(tags.length).toBe(2);
    });

    it('getDistinctTags() sorts case-insensitively', () => {
      setExerciseTags('ex-1', ['zebra', 'Apple', 'banana']);
      const distinct = getDistinctTags();
      // Locale-aware case-insensitive sort
      expect(distinct).toEqual(['Apple', 'banana', 'zebra']);
    });
  });

  describe('Edge Cases: Special Characters', () => {
    it('tags can contain special characters', () => {
      addTag('ex-1', 'groove-funk_v2.5');
      expect(getExerciseTags('ex-1')).toContain('groove-funk_v2.5');
    });

    it('tags can contain unicode characters', () => {
      addTag('ex-1', '🥁-drums');
      expect(getExerciseTags('ex-1')).toContain('🥁-drums');
    });

    it('tags can contain spaces', () => {
      addTag('ex-1', 'advanced groove');
      expect(getExerciseTags('ex-1')).toContain('advanced groove');
    });
  });

  describe('Edge Cases: Clearing State', () => {
    it('clearing all favorites results in empty store', () => {
      setFavorites({ 'ex-1': true, 'ex-2': true });
      setFavorites({});
      expect(getFavorites()).toEqual({});
    });

    it('unfavoriting all exercises results in isFavorite() returning false', () => {
      setFavorites({ 'ex-1': true, 'ex-2': true });
      toggleFavorite('ex-1');
      toggleFavorite('ex-2');
      expect(isFavorite('ex-1')).toBe(false);
      expect(isFavorite('ex-2')).toBe(false);
    });

    it('removing all tags results in getDistinctTags() returning []', () => {
      setExerciseTags('ex-1', ['tag1', 'tag2']);
      setExerciseTags('ex-1', []);
      expect(getDistinctTags()).toEqual([]);
    });

    it('clearSelectedFilterTags() results in getSelectedFilterTags() returning []', () => {
      setSelectedFilterTags(['groove']);
      clearSelectedFilterTags();
      expect(getSelectedFilterTags()).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Integration Tests
  // ──────────────────────────────────────────────────────────────────

  describe('Integration: Favorites + Tags', () => {
    it('can manage favorites and tags independently', () => {
      setFavorites({ 'ex-1': true });
      setExerciseTags('ex-1', ['beginner', 'groove']);
      expect(isFavorite('ex-1')).toBe(true);
      expect(getExerciseTags('ex-1')).toEqual(['beginner', 'groove']);
    });

    it('unfavoriting does not affect tags', () => {
      setFavorites({ 'ex-1': true });
      setExerciseTags('ex-1', ['beginner']);
      toggleFavorite('ex-1');
      expect(isFavorite('ex-1')).toBe(false);
      expect(getExerciseTags('ex-1')).toContain('beginner');
    });

    it('removing tags does not affect favorites', () => {
      setFavorites({ 'ex-1': true });
      setExerciseTags('ex-1', ['beginner']);
      removeTag('ex-1', 'beginner');
      expect(isFavorite('ex-1')).toBe(true);
      expect(getExerciseTags('ex-1')).toEqual([]);
    });
  });

  describe('Integration: Multiple Exercises', () => {
    it('can manage favorites for multiple exercises', () => {
      toggleFavorite('ex-1');
      toggleFavorite('ex-2');
      toggleFavorite('ex-3');
      expect(isFavorite('ex-1')).toBe(true);
      expect(isFavorite('ex-2')).toBe(true);
      expect(isFavorite('ex-3')).toBe(true);
    });

    it('can manage tags for multiple exercises', () => {
      addTag('ex-1', 'beginner');
      addTag('ex-2', 'advanced');
      addTag('ex-3', 'beginner');
      const distinct = getDistinctTags();
      expect(distinct).toContain('beginner');
      expect(distinct).toContain('advanced');
    });

    it('can filter by tags across multiple exercises', () => {
      setExerciseTags('ex-1', ['groove', 'funk']);
      setExerciseTags('ex-2', ['groove', 'jazz']);
      setExerciseTags('ex-3', ['funk']);
      setSelectedFilterTags(['groove']);
      expect(getSelectedFilterTags()).toEqual(['groove']);
    });
  });
});
