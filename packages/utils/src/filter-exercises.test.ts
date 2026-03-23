import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { InstrumentExercises } from '@groovelab/types';
import { filterExercises, setFavorites, setTags } from './index';

describe('filterExercises()', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Helper to create mock exercise data
  const createMockExercises = (): InstrumentExercises[] => {
    const drumExercises: InstrumentExercises = {
      instrumentType: 'electronic-drums',
      sections: [
        {
          id: 'section-1',
          title: 'Basics',
          exercises: [
            { id: 'ex-1', title: 'Simple 4/4', description: 'Basic kick pattern' },
            { id: 'ex-2', title: 'Groovy 4/4', description: 'Funky kick pattern' },
            { id: 'ex-3', title: 'Double Bass', description: 'Fast kicks' },
          ],
        },
        {
          id: 'section-2',
          title: 'Advanced',
          exercises: [
            { id: 'ex-4', title: 'Jazz Beat', description: 'Jazz fusion beat' },
            { id: 'ex-5', title: 'Metal Blast', description: 'Fast metal beat' },
          ],
        },
      ],
    };

    const bassExercises: InstrumentExercises = {
      instrumentType: 'bass-guitar',
      sections: [
        {
          id: 'section-3',
          title: 'Fundamentals',
          exercises: [
            { id: 'ex-6', title: 'Root Notes', description: 'Basic bass line' },
            { id: 'ex-7', title: 'Walking Bass', description: 'Jazz walking' },
          ],
        },
      ],
    };

    const guitarExercises: InstrumentExercises = {
      instrumentType: 'guitar',
      sections: [
        {
          id: 'section-4',
          title: 'Chords',
          exercises: [
            { id: 'ex-8', title: 'Major Chords', description: 'Basic major chords' },
          ],
        },
      ],
    };

    return [drumExercises, bassExercises, guitarExercises];
  };

  // ──────────────────────────────────────────────────────────────────
  // Basic Filtering: Function Signature & Instrument Selection
  // ──────────────────────────────────────────────────────────────────

  describe('Basic Filtering: Function Signature', () => {
    it('should accept correct parameters and return InstrumentExercises[]', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should have correct function signature with all parameters', () => {
      const data = createMockExercises();
      expect(() => {
        filterExercises(data, 'electronic-drums', false, []);
      }).not.toThrow();
    });
  });

  describe('Basic Filtering: Instrument Selection', () => {
    it('should return InstrumentExercises for selected instrument only (electronic-drums)', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      expect(result.length).toBe(1);
      expect(result[0].instrumentType).toBe('electronic-drums');
    });

    it('should return InstrumentExercises for selected instrument only (bass-guitar)', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'bass-guitar', false, []);
      expect(result.length).toBe(1);
      expect(result[0].instrumentType).toBe('bass-guitar');
    });

    it('should return InstrumentExercises for selected instrument only (guitar)', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'guitar', false, []);
      expect(result.length).toBe(1);
      expect(result[0].instrumentType).toBe('guitar');
    });

    it('should not include other instruments in result', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      const types = result.map(r => r.instrumentType);
      expect(types).not.toContain('bass-guitar');
      expect(types).not.toContain('guitar');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Favorites Filter
  // ──────────────────────────────────────────────────────────────────

  describe('Favorites Filter', () => {
    it('should return all exercises when showFavoritesOnly=false', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true, 'ex-2': true });
      const result = filterExercises(data, 'electronic-drums', false, []);
      // Should have 5 exercises total (3 in basics + 2 in advanced)
      const totalExercises = result[0].sections.reduce((sum, s) => sum + s.exercises.length, 0);
      expect(totalExercises).toBe(5);
    });

    it('should return only favorites when showFavoritesOnly=true', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true, 'ex-2': true });
      const result = filterExercises(data, 'electronic-drums', true, []);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(2);
      expect(allExercises[0].id).toBe('ex-1');
      expect(allExercises[1].id).toBe('ex-2');
    });

    it('should return empty exercises array when no favorites exist and showFavoritesOnly=true', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', true, []);
      const totalExercises = result[0].sections.reduce((sum, s) => sum + s.exercises.length, 0);
      expect(totalExercises).toBe(0);
    });

    it('should filter out non-favorite exercises when showFavoritesOnly=true', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true, 'ex-3': true });
      const result = filterExercises(data, 'electronic-drums', true, []);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toContain('ex-1');
      expect(ids).toContain('ex-3');
      expect(ids).not.toContain('ex-2');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Tag Filter: AND Logic
  // ──────────────────────────────────────────────────────────────────

  describe('Tag Filter: Single Tag (AND Logic)', () => {
    it('should return exercises with a single selected tag', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['rock'],
        'ex-3': ['jazz'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(2);
      expect(allExercises[0].id).toBe('ex-1');
      expect(allExercises[1].id).toBe('ex-2');
    });

    it('should filter out exercises without the selected tag', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['jazz'],
        'ex-3': ['fast'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toEqual(['ex-1']);
      expect(ids).not.toContain('ex-2');
      expect(ids).not.toContain('ex-3');
    });
  });

  describe('Tag Filter: Multiple Tags (AND Logic)', () => {
    it('should return exercises having ALL selected tags (two tags)', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock', 'fast'],
        'ex-2': ['rock', 'slow'],
        'ex-3': ['jazz', 'fast'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock', 'fast']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(1);
      expect(allExercises[0].id).toBe('ex-1');
    });

    it('should filter out exercises missing any required tag (two tags)', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock', 'fast'],
        'ex-2': ['rock'],
        'ex-3': ['fast'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock', 'fast']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toEqual(['ex-1']);
      expect(ids).not.toContain('ex-2');
      expect(ids).not.toContain('ex-3');
    });

    it('should return exercises having ALL selected tags (three tags)', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock', 'fast', 'groove'],
        'ex-2': ['rock', 'fast'],
        'ex-3': ['rock', 'fast', 'groove', 'funk'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock', 'fast', 'groove']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toEqual(['ex-1', 'ex-3']);
    });
  });

  describe('Tag Filter: Empty Tags', () => {
    it('should apply no tag filtering when selectedFilterTags is empty', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['jazz'],
        'ex-3': [],
      });
      const result = filterExercises(data, 'electronic-drums', false, []);
      const totalExercises = result[0].sections.reduce((sum, s) => sum + s.exercises.length, 0);
      expect(totalExercises).toBe(5);
    });

    it('should return all exercises when selectedFilterTags is empty array', () => {
      const data = createMockExercises();
      setTags({ 'ex-1': ['rock'] });
      const result = filterExercises(data, 'electronic-drums', false, []);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(5);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Filter Combinations: Favorites + Tags
  // ──────────────────────────────────────────────────────────────────

  describe('Filter Combinations: Favorites + Tags', () => {
    it('should apply both favorites and tag filters together', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true, 'ex-2': true, 'ex-3': true });
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['rock'],
        'ex-3': ['jazz'],
      });
      const result = filterExercises(data, 'electronic-drums', true, ['rock']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      // Both ex-1 and ex-2 are favorites AND have 'rock' tag
      expect(ids).toEqual(['ex-1', 'ex-2']);
    });

    it('should exclude non-favorite exercises even if they have required tags', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true });
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['rock'],
      });
      const result = filterExercises(data, 'electronic-drums', true, ['rock']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toEqual(['ex-1']);
      expect(ids).not.toContain('ex-2');
    });

    it('should exclude exercises missing required tags even if they are favorites', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true, 'ex-2': true });
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['jazz'],
      });
      const result = filterExercises(data, 'electronic-drums', true, ['rock']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toEqual(['ex-1']);
      expect(ids).not.toContain('ex-2');
    });

    it('should return empty when no exercises satisfy both favorites and tag filters', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true });
      setTags({ 'ex-1': ['rock'] });
      const result = filterExercises(data, 'electronic-drums', true, ['jazz']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(0);
    });
  });

  describe('Filter Combinations: Favorites Only (No Tags)', () => {
    it('should return all favorites regardless of tags when no tag filter selected', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true, 'ex-2': true });
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['jazz'],
      });
      const result = filterExercises(data, 'electronic-drums', true, []);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toEqual(['ex-1', 'ex-2']);
    });

    it('should return favorites without checking tags when selectedFilterTags is empty', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true });
      const result = filterExercises(data, 'electronic-drums', true, []);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(1);
      expect(allExercises[0].id).toBe('ex-1');
    });
  });

  describe('Filter Combinations: Tags Only (Favorites Off)', () => {
    it('should return all exercises with selected tags, favorite or not', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true });
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['rock'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toEqual(['ex-1', 'ex-2']);
    });

    it('should not favor starred exercises when only filtering by tags', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-3': true });
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['rock'],
        'ex-3': ['jazz'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toEqual(['ex-1', 'ex-2']);
      expect(ids).not.toContain('ex-3');
    });
  });

  describe('Filter Combinations: Neither (Defaults)', () => {
    it('should return all exercises when no filters applied', () => {
      const data = createMockExercises();
      setFavorites({ 'ex-1': true });
      setTags({ 'ex-1': ['rock'] });
      const result = filterExercises(data, 'electronic-drums', false, []);
      const totalExercises = result[0].sections.reduce((sum, s) => sum + s.exercises.length, 0);
      expect(totalExercises).toBe(5);
    });

    it('should return all exercises when showFavoritesOnly=false and selectedFilterTags=[]', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(5);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Section Structure Preservation
  // ──────────────────────────────────────────────────────────────────

  describe('Section Structure Preservation', () => {
    it('should preserve section structure when some exercises are filtered out', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
        'ex-4': ['jazz'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      // Should have 2 sections (Basics and Advanced)
      expect(result[0].sections).toHaveLength(2);
      expect(result[0].sections[0].id).toBe('section-1');
      expect(result[0].sections[1].id).toBe('section-2');
    });

    it('should return empty sections when no exercises match', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['rock'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['jazz']);
      // Should still have both sections, but Advanced should be empty
      expect(result[0].sections).toHaveLength(2);
      expect(result[0].sections[0].exercises).toHaveLength(0);
      expect(result[0].sections[1].exercises).toHaveLength(0);
    });

    it('should preserve section metadata (id, title) even with empty exercises', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      const advancedSection = result[0].sections[1];
      expect(advancedSection.id).toBe('section-2');
      expect(advancedSection.title).toBe('Advanced');
      expect(advancedSection.exercises).toHaveLength(0);
    });

    it('should preserve all sections in order', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      const sectionIds = result[0].sections.map(s => s.id);
      expect(sectionIds).toEqual(['section-1', 'section-2']);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Order Preservation
  // ──────────────────────────────────────────────────────────────────

  describe('Order Preservation: Exercises Within Sections', () => {
    it('should preserve order of exercises within sections', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      const basicsExercises = result[0].sections[0].exercises;
      expect(basicsExercises[0].id).toBe('ex-1');
      expect(basicsExercises[1].id).toBe('ex-2');
      expect(basicsExercises[2].id).toBe('ex-3');
    });

    it('should preserve order when filtering favorites', () => {
      const data = createMockExercises();
      setFavorites({
        'ex-3': true,
        'ex-1': true,
        'ex-2': true,
      });
      const result = filterExercises(data, 'electronic-drums', true, []);
      const basicsExercises = result[0].sections[0].exercises;
      expect(basicsExercises[0].id).toBe('ex-1');
      expect(basicsExercises[1].id).toBe('ex-2');
      expect(basicsExercises[2].id).toBe('ex-3');
    });

    it('should preserve order when filtering tags', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['rock'],
        'ex-3': ['rock'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      const basicsExercises = result[0].sections[0].exercises;
      expect(basicsExercises[0].id).toBe('ex-1');
      expect(basicsExercises[1].id).toBe('ex-2');
      expect(basicsExercises[2].id).toBe('ex-3');
    });
  });

  describe('Order Preservation: Sections', () => {
    it('should preserve order of sections', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      expect(result[0].sections[0].id).toBe('section-1');
      expect(result[0].sections[1].id).toBe('section-2');
    });

    it('should preserve section order even when some sections are empty', () => {
      const data = createMockExercises();
      setTags({
        'ex-4': ['rock'],
        'ex-5': ['rock'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      const sectionIds = result[0].sections.map(s => s.id);
      expect(sectionIds).toEqual(['section-1', 'section-2']);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Edge Cases: Tags
  // ──────────────────────────────────────────────────────────────────

  describe('Edge Cases: Tags Not Found', () => {
    it('should return empty exercises when tag does not exist on any exercise', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['jazz'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['nonexistent']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(0);
    });

    it('should return empty sections when filtering by non-existent tag', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, ['nonexistent']);
      expect(result[0].sections[0].exercises).toHaveLength(0);
      expect(result[0].sections[1].exercises).toHaveLength(0);
    });
  });

  describe('Edge Cases: Exercise With No Tags', () => {
    it('should filter out untagged exercise when tags are required', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
        'ex-3': ['rock'],
        // ex-2 has no tags
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      const ids = allExercises.map(e => e.id);
      expect(ids).toEqual(['ex-1', 'ex-3']);
      expect(ids).not.toContain('ex-2');
    });

    it('should include untagged exercise when no tag filter applied', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
        // ex-2, ex-3 have no tags
      });
      const result = filterExercises(data, 'electronic-drums', false, []);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(5);
    });
  });

  describe('Edge Cases: Exercise With Multiple Tags', () => {
    it('should include exercise having superset of required tags', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock', 'fast', 'groove'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(1);
      expect(allExercises[0].id).toBe('ex-1');
    });

    it('should include exercise having exact match to required tags', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock', 'fast'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock', 'fast']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(1);
      expect(allExercises[0].id).toBe('ex-1');
    });

    it('should exclude exercise missing one of required tags despite having others', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock', 'fast'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['rock', 'fast', 'groove']);
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(0);
    });
  });

  describe('Edge Cases: Empty Results', () => {
    it('should preserve section structure with all empty exercises arrays', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', true, []);
      // No favorites set, so all exercises should be filtered
      const allExercises = result.flatMap(r => r.sections.flatMap(s => s.exercises));
      expect(allExercises).toHaveLength(0);
      // But sections should still exist
      expect(result[0].sections).toHaveLength(2);
    });

    it('should return structure with empty exercises when no matches found', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['rock'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['jazz']);
      expect(result).toHaveLength(1);
      expect(result[0].sections).toHaveLength(2);
      const totalExercises = result[0].sections.reduce((sum, s) => sum + s.exercises.length, 0);
      expect(totalExercises).toBe(0);
    });

    it('should return all sections even when all exercises filtered out', () => {
      const data = createMockExercises();
      setFavorites({ 'nonexistent': true });
      const result = filterExercises(data, 'electronic-drums', true, []);
      expect(result[0].sections).toHaveLength(2);
      expect(result[0].sections[0].id).toBe('section-1');
      expect(result[0].sections[1].id).toBe('section-2');
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Type Safety
  // ──────────────────────────────────────────────────────────────────

  describe('Type Safety', () => {
    it('should return InstrumentExercises[] type', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      expect(Array.isArray(result)).toBe(true);
      for (const item of result) {
        expect('instrumentType' in item).toBe(true);
        expect('sections' in item).toBe(true);
      }
    });

    it('should preserve InstrumentExercises structure in returned objects', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      expect(result[0].instrumentType).toBe('electronic-drums');
      expect(Array.isArray(result[0].sections)).toBe(true);
    });

    it('should preserve ExerciseSection structure', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      const section = result[0].sections[0];
      expect('id' in section).toBe(true);
      expect('title' in section).toBe(true);
      expect('exercises' in section).toBe(true);
      expect(Array.isArray(section.exercises)).toBe(true);
    });

    it('should preserve Exercise structure in results', () => {
      const data = createMockExercises();
      const result = filterExercises(data, 'electronic-drums', false, []);
      const exercise = result[0].sections[0].exercises[0];
      expect('id' in exercise).toBe(true);
      expect('title' in exercise).toBe(true);
      expect('description' in exercise).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Immutability
  // ──────────────────────────────────────────────────────────────────

  describe('Immutability: No Mutation of Input', () => {
    it('should not mutate input array', () => {
      const data = createMockExercises();
      const originalLength = data.length;
      const originalInstrumentType = data[0].instrumentType;
      filterExercises(data, 'electronic-drums', false, []);
      expect(data.length).toBe(originalLength);
      expect(data[0].instrumentType).toBe(originalInstrumentType);
    });

    it('should not mutate input sections array', () => {
      const data = createMockExercises();
      const originalSectionCount = data[0].sections.length;
      const originalSectionId = data[0].sections[0].id;
      filterExercises(data, 'electronic-drums', false, []);
      expect(data[0].sections.length).toBe(originalSectionCount);
      expect(data[0].sections[0].id).toBe(originalSectionId);
    });

    it('should not mutate input exercises array', () => {
      const data = createMockExercises();
      const originalExerciseCount = data[0].sections[0].exercises.length;
      const originalExerciseId = data[0].sections[0].exercises[0].id;
      filterExercises(data, 'electronic-drums', false, []);
      expect(data[0].sections[0].exercises.length).toBe(originalExerciseCount);
      expect(data[0].sections[0].exercises[0].id).toBe(originalExerciseId);
    });

    it('should not mutate exercise objects in input', () => {
      const data = createMockExercises();
      const originalTitle = data[0].sections[0].exercises[0].title;
      filterExercises(data, 'electronic-drums', false, []);
      expect(data[0].sections[0].exercises[0].title).toBe(originalTitle);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Integration Tests: Complex Scenarios
  // ──────────────────────────────────────────────────────────────────

  describe('Integration: Complex Filtering Scenarios', () => {
    it('should handle multiple instruments with independent filters', () => {
      const data = createMockExercises();
      setFavorites({
        'ex-1': true,
        'ex-6': true,
      });
      setTags({
        'ex-1': ['rock'],
        'ex-6': ['funk'],
      });
      const drumResult = filterExercises(data, 'electronic-drums', true, ['rock']);
      const bassResult = filterExercises(data, 'bass-guitar', true, ['funk']);

      const drumExercises = drumResult.flatMap(r => r.sections.flatMap(s => s.exercises));
      const bassExercises = bassResult.flatMap(r => r.sections.flatMap(s => s.exercises));

      expect(drumExercises).toHaveLength(1);
      expect(drumExercises[0].id).toBe('ex-1');
      expect(bassExercises).toHaveLength(1);
      expect(bassExercises[0].id).toBe('ex-6');
    });

    it('should handle filtering across multiple sections with mixed results', () => {
      const data = createMockExercises();
      setFavorites({
        'ex-1': true,
        'ex-4': true,
      });
      setTags({
        'ex-1': ['rock'],
        'ex-2': ['rock'],
        'ex-4': ['jazz'],
        'ex-5': ['jazz'],
      });
      const result = filterExercises(data, 'electronic-drums', true, ['rock']);

      const basicsExercises = result[0].sections[0].exercises;
      const advancedExercises = result[0].sections[1].exercises;

      expect(basicsExercises).toHaveLength(1);
      expect(basicsExercises[0].id).toBe('ex-1');
      expect(advancedExercises).toHaveLength(0);
    });

    it('should correctly filter when same tag applied across multiple sections', () => {
      const data = createMockExercises();
      setTags({
        'ex-1': ['groove'],
        'ex-2': ['groove'],
        'ex-4': ['groove'],
        'ex-5': ['fast'],
      });
      const result = filterExercises(data, 'electronic-drums', false, ['groove']);

      const basicsExercises = result[0].sections[0].exercises;
      const advancedExercises = result[0].sections[1].exercises;

      expect(basicsExercises.map(e => e.id)).toEqual(['ex-1', 'ex-2']);
      expect(advancedExercises.map(e => e.id)).toEqual(['ex-4']);
    });
  });

  // ──────────────────────────────────────────────────────────────────
  // Performance: No Unnecessary Iterations
  // ──────────────────────────────────────────────────────────────────

  describe('Performance: Efficient Filtering', () => {
    it('should use O(n) complexity where n = total exercises', () => {
      const data = createMockExercises();
      // Function should iterate through sections and exercises once
      // No nested loops over filter arrays should affect the complexity
      const result = filterExercises(data, 'electronic-drums', false, ['tag1', 'tag2', 'tag3']);
      // Should complete without timeout/performance issue
      expect(result).toBeDefined();
    });

    it('should handle multiple sections efficiently', () => {
      const largeData: InstrumentExercises[] = [
        {
          instrumentType: 'electronic-drums',
          sections: Array.from({ length: 10 }, (_, i) => ({
            id: `section-${i}`,
            title: `Section ${i}`,
            exercises: Array.from({ length: 10 }, (_, j) => ({
              id: `ex-${i}-${j}`,
              title: `Exercise ${i}-${j}`,
              description: `Test exercise ${i}-${j}`,
            })),
          })),
        },
      ];

      const startTime = performance.now();
      const result = filterExercises(largeData, 'electronic-drums', false, []);
      const endTime = performance.now();

      expect(result).toBeDefined();
      // Should complete reasonably fast (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
