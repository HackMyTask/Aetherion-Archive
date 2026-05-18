import { describe, it, expect } from 'vitest';
import { createEmptyRegistry, fuzzyMatch, checkNameAvailable, checkSlugAvailable, registerName, registerSlug } from '../../src/engine/naming-registry.js';

describe('createEmptyRegistry', () => {
  it('returns registry with empty usedNames and usedSlugs', () => {
    const r = createEmptyRegistry();
    expect(r.usedNames).toEqual({});
    expect(r.usedSlugs).toEqual({});
  });

  it('includes patterns for all 10 entity types', () => {
    const r = createEmptyRegistry();
    expect(Object.keys(r.patterns)).toEqual([
      'kingdom', 'faction', 'race', 'god', 'artifact', 'spell', 'event', 'monster', 'city', 'religion',
    ]);
  });
});

describe('fuzzyMatch', () => {
  it('returns 1.0 for exact match', () => {
    expect(fuzzyMatch('Eldoria', 'Eldoria')).toBe(1.0);
  });

  it('returns 1.0 for case-insensitive match', () => {
    expect(fuzzyMatch('ELDORIA', 'eldoria')).toBe(1.0);
  });

  it('returns 0.8 for substring match', () => {
    expect(fuzzyMatch('Eldoria', 'Eldoria Kingdom')).toBe(0.8);
  });

  it('strips non-alphanumeric characters before matching', () => {
    expect(fuzzyMatch("Eldoria's", 'Eldorias')).toBeGreaterThan(0.9);
  });

  it('returns less than 1.0 for different strings', () => {
    const score = fuzzyMatch('Eldoria', 'Nyxara');
    expect(score).toBeLessThan(0.85);
    expect(score).toBeGreaterThan(0);
  });

  it('returns 0 for completely different strings', () => {
    const score = fuzzyMatch('abc', 'xyzxyzxyz');
    expect(score).toBeLessThan(0.3);
  });
});

describe('checkNameAvailable', () => {
  it('returns available=true for unused name', () => {
    const r = createEmptyRegistry();
    const result = checkNameAvailable(r, 'New Kingdom');
    expect(result.available).toBe(true);
  });

  it('returns available=false for exact match', () => {
    const r = createEmptyRegistry();
    registerName(r, 'Eldoria', 'ent-1', 'kingdom');
    const result = checkNameAvailable(r, 'Eldoria');
    expect(result.available).toBe(false);
    expect(result.conflict).toContain('Exact match');
  });

  it('returns available=false for close fuzzy match (>=0.85)', () => {
    const r = createEmptyRegistry();
    registerName(r, 'Eldoria', 'ent-1', 'kingdom');
    const result = checkNameAvailable(r, 'Eldorya');
    expect(result.available).toBe(false);
    expect(result.conflict).toContain('Close match');
  });
});

describe('checkSlugAvailable', () => {
  it('returns available=true for unused slug', () => {
    const r = createEmptyRegistry();
    expect(checkSlugAvailable(r, 'new-kingdom').available).toBe(true);
  });

  it('returns available=false for used slug', () => {
    const r = createEmptyRegistry();
    registerSlug(r, 'eldoria', 'Eldoria', 'kingdom');
    const result = checkSlugAvailable(r, 'eldoria');
    expect(result.available).toBe(false);
    expect(result.similarity).toBe(1.0);
  });
});

describe('registerName', () => {
  it('stores name in usedNames as lowercase', () => {
    const r = createEmptyRegistry();
    registerName(r, 'Eldoria', 'ent-1', 'kingdom');
    expect(r.usedNames['eldoria']).toEqual({ type: 'kingdom', id: 'ent-1', status: 'active' });
  });
});

describe('registerSlug', () => {
  it('stores slug in usedSlugs', () => {
    const r = createEmptyRegistry();
    registerSlug(r, 'eldoria', 'Eldoria', 'kingdom');
    expect(r.usedSlugs['eldoria']).toEqual({ type: 'kingdom', id: 'Eldoria', status: 'active' });
  });
});
