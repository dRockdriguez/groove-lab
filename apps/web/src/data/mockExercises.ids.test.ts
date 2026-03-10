import { describe, it, expect } from 'vitest';
import { mockExercises } from './mockExercises';
import type { InstrumentExercises } from '@groovelab/types';

/**
 * These tests verify that the mock data uses the exact IDs
 * specified in the browse-exercises spec (v0.4.0).
 */

describe('Mock Exercises — Drums spec IDs', () => {
  it('has section with id "drums-basic-rhythms"', () => {
    const drums = mockExercises.find(
      (e: InstrumentExercises) => e.instrumentType === 'electronic-drums'
    );
    expect(drums).toBeDefined();

    const section = drums!.sections.find(
      (s) => s.id === 'drums-basic-rhythms'
    );
    expect(section).toBeDefined();
    expect(section!.title).toBe('Ritmos básicos');
  });

  it('has exercise with id "drums-basic-1" in section "drums-basic-rhythms"', () => {
    const drums = mockExercises.find(
      (e: InstrumentExercises) => e.instrumentType === 'electronic-drums'
    );
    const section = drums!.sections.find(
      (s) => s.id === 'drums-basic-rhythms'
    );
    expect(section).toBeDefined();

    const exercise = section!.exercises.find((ex) => ex.id === 'drums-basic-1');
    expect(exercise).toBeDefined();
    expect(exercise!.title).toBe('Ejercicio 1');
    expect(exercise!.description).toBe(
      'Patrón básico de batería para practicar ritmo.'
    );
  });
});

describe('Mock Exercises — Bass spec IDs', () => {
  it('has section with id "bass-lines"', () => {
    const bass = mockExercises.find(
      (e: InstrumentExercises) => e.instrumentType === 'bass-guitar'
    );
    expect(bass).toBeDefined();

    const section = bass!.sections.find((s) => s.id === 'bass-lines');
    expect(section).toBeDefined();
    expect(section!.title).toBe('Líneas de bajo');
  });

  it('has exercise with id "bass-basic-1" in section "bass-lines"', () => {
    const bass = mockExercises.find(
      (e: InstrumentExercises) => e.instrumentType === 'bass-guitar'
    );
    const section = bass!.sections.find((s) => s.id === 'bass-lines');
    expect(section).toBeDefined();

    const exercise = section!.exercises.find((ex) => ex.id === 'bass-basic-1');
    expect(exercise).toBeDefined();
    expect(exercise!.title).toBe('Ejercicio 1');
    expect(exercise!.description).toBe(
      'Línea de bajo sencilla para practicar el pulso.'
    );
  });
});

describe('Mock Exercises — Guitar spec IDs', () => {
  it('has section with id "guitar-basic-chords"', () => {
    const guitar = mockExercises.find(
      (e: InstrumentExercises) => e.instrumentType === 'guitar'
    );
    expect(guitar).toBeDefined();

    const section = guitar!.sections.find(
      (s) => s.id === 'guitar-basic-chords'
    );
    expect(section).toBeDefined();
    expect(section!.title).toBe('Acordes básicos');
  });

  it('has exercise with id "guitar-basic-1" in section "guitar-basic-chords"', () => {
    const guitar = mockExercises.find(
      (e: InstrumentExercises) => e.instrumentType === 'guitar'
    );
    const section = guitar!.sections.find(
      (s) => s.id === 'guitar-basic-chords'
    );
    expect(section).toBeDefined();

    const exercise = section!.exercises.find(
      (ex) => ex.id === 'guitar-basic-1'
    );
    expect(exercise).toBeDefined();
    expect(exercise!.title).toBe('Ejercicio 1');
    expect(exercise!.description).toBe(
      'Progresión de acordes básica para principiantes.'
    );
  });
});
