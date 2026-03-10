import { describe, it, expect } from 'vitest';
import { mockExercises } from './mockExercises';
import type { InstrumentExercises, InstrumentType } from '@groovelab/types';

describe('Mock Exercises — data integrity', () => {
  it('is a static TypeScript constant (not a function or promise)', () => {
    expect(Array.isArray(mockExercises)).toBe(true);
    expect(typeof mockExercises).not.toBe('function');
  });

  it('includes exercises for all three instruments: Drums, Bass, and Guitar', () => {
    const instrumentTypes = mockExercises.map(
      (entry: InstrumentExercises) => entry.instrumentType
    );
    expect(instrumentTypes).toContain('electronic-drums');
    expect(instrumentTypes).toContain('bass-guitar');
    expect(instrumentTypes).toContain('guitar');
  });

  it('each instrument has at least one section and each section has at least one exercise', () => {
    for (const entry of mockExercises) {
      expect(entry.sections.length).toBeGreaterThanOrEqual(1);
      for (const section of entry.sections) {
        expect(section.exercises.length).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('Mock Exercises — Drums content', () => {
  it('includes section "Ritmos básicos" with the specified exercise', () => {
    const drums = mockExercises.find(
      (e: InstrumentExercises) => e.instrumentType === 'electronic-drums'
    );
    expect(drums).toBeDefined();

    const section = drums!.sections.find((s) => s.title === 'Ritmos básicos');
    expect(section).toBeDefined();

    const exercise = section!.exercises.find((ex) => ex.title === 'Ejercicio 1');
    expect(exercise).toBeDefined();
    expect(exercise!.description).toBe(
      'Patrón básico de batería para practicar ritmo.'
    );
  });
});

describe('Mock Exercises — Bass content', () => {
  it('includes section "Líneas de bajo" with the specified exercise', () => {
    const bass = mockExercises.find(
      (e: InstrumentExercises) => e.instrumentType === 'bass-guitar'
    );
    expect(bass).toBeDefined();

    const section = bass!.sections.find((s) => s.title === 'Líneas de bajo');
    expect(section).toBeDefined();

    const exercise = section!.exercises.find((ex) => ex.title === 'Ejercicio 1');
    expect(exercise).toBeDefined();
    expect(exercise!.description).toBe(
      'Línea de bajo sencilla para practicar el pulso.'
    );
  });
});

describe('Mock Exercises — Guitar content', () => {
  it('includes section "Acordes básicos" with the specified exercise', () => {
    const guitar = mockExercises.find(
      (e: InstrumentExercises) => e.instrumentType === 'guitar'
    );
    expect(guitar).toBeDefined();

    const section = guitar!.sections.find((s) => s.title === 'Acordes básicos');
    expect(section).toBeDefined();

    const exercise = section!.exercises.find((ex) => ex.title === 'Ejercicio 1');
    expect(exercise).toBeDefined();
    expect(exercise!.description).toBe(
      'Progresión de acordes básica para principiantes.'
    );
  });
});

describe('Mock Exercises — unique IDs', () => {
  it('each exercise has a unique id within its instrument', () => {
    for (const entry of mockExercises) {
      const ids = entry.sections.flatMap((s) => s.exercises.map((ex) => ex.id));
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    }
  });
});
