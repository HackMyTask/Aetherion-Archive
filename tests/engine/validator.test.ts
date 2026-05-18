import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Entity, EntityType, EntityStatus } from '../../src/types/entity.js';

const mockLoadAllEntities = vi.hoisted(() => vi.fn());

vi.mock('../../src/engine/canon-reader.js', () => ({
  CanonReader: vi.fn(function () {
    return { loadAllEntities: mockLoadAllEntities };
  }),
}));

import { CanonReader } from '../../src/engine/canon-reader.js';
import { Validator } from '../../src/engine/validator.js';

function makeEntity(overrides: Record<string, unknown> = {}): Entity {
  return {
    id: 'ent-test-1',
    type: EntityType.KINGDOM,
    name: 'Test Kingdom',
    slug: 'test-kingdom',
    aliases: [],
    status: EntityStatus.ACTIVE,
    relationships: [],
    excerpt: 'A test kingdom for testing purposes.',
    description: 'A test kingdom for testing purposes.',
    content: 'Full content about the test kingdom. '.repeat(10),
    attributes: { capital: 'Test City', leader: 'Test King' },
    version: 1,
    generatedBy: 'test',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    seo: { title: 'Test Kingdom', metaDescription: 'About Test Kingdom', keywords: ['kingdom'], pillarWeight: 5, topicalCluster: 'kingdom' },
    ...overrides,
  } as unknown as Entity;
}

function existing(id: string, name: string, type = EntityType.KINGDOM, status = EntityStatus.ACTIVE): Entity {
  return makeEntity({ id, name, slug: id, type, status, attributes: {}, excerpt: '', content: 'x'.repeat(20) });
}

describe('Validator', () => {
  let validator: Validator;

  beforeEach(() => {
    vi.clearAllMocks();
    validator = new Validator(new CanonReader(''));
  });

  describe('structural validation', () => {
    it('passes a valid entity', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const result = await validator.validate(makeEntity());
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('rejects entity with missing required field', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const partial = makeEntity();
      delete (partial as any).id;
      const result = await validator.validate(partial);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('"id"'))).toBe(true);
    });

    it('rejects entity with invalid type', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const result = await validator.validate(makeEntity({ type: 'invalid' as EntityType }));
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid entity type'))).toBe(true);
    });

    it('rejects name shorter than 2 characters', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const result = await validator.validate(makeEntity({ name: 'A' }));
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Name'))).toBe(true);
    });

    it('warns on short content', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const result = await validator.validate(makeEntity({ content: 'short' }));
      expect(result.warnings.some(w => w.includes('Content is short'))).toBe(true);
    });

    it('rejects invalid status', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const result = await validator.validate(makeEntity({ status: 'unknown' as EntityStatus }));
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid status'))).toBe(true);
    });
  });

  describe('type-specific validation', () => {
    it('warns when kingdom is missing capital', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const result = await validator.validate(makeEntity({ attributes: {} }));
      expect(result.warnings.some(w => w.includes('capital'))).toBe(true);
    });

    it('warns when god is missing domain', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const result = await validator.validate(makeEntity({ type: EntityType.GOD, attributes: {} }));
      expect(result.warnings.some(w => w.includes('domain'))).toBe(true);
    });

    it('warns when event is missing date', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const result = await validator.validate(makeEntity({ type: EntityType.EVENT, attributes: {} }));
      expect(result.warnings.some(w => w.includes('date'))).toBe(true);
    });
  });

  describe('relationship validation', () => {
    it('errors on relationship target that does not exist', async () => {
      mockLoadAllEntities.mockResolvedValue([existing('ent-other', 'Other')]);
      const result = await validator.validate(makeEntity({
        relationships: [{ targetId: 'ent-missing', type: 'borders', label: 'Borders', bidirectional: true }],
      }));
      expect(result.errors.some(e => e.includes('does not exist'))).toBe(true);
    });

    it('warns when entity has no relationships', async () => {
      mockLoadAllEntities.mockResolvedValue([]);
      const result = await validator.validate(makeEntity());
      expect(result.warnings.some(w => w.includes('no relationships'))).toBe(true);
    });
  });

  describe('name validation', () => {
    it('errors on exact name conflict', async () => {
      mockLoadAllEntities.mockResolvedValue([existing('ent-existing', 'Test Kingdom')]);
      const result = await validator.validate(makeEntity({ name: 'Test Kingdom' }));
      expect(result.errors.some(e => e.includes('identical'))).toBe(true);
    });

    it('warns on similar name', async () => {
      mockLoadAllEntities.mockResolvedValue([existing('ent-existing', 'Kingdom of Eldoria')]);
      const result = await validator.validate(makeEntity({ name: 'Kingdom of Eldorya' }));
      expect(result.warnings.some(w => w.includes('similar'))).toBe(true);
    });
  });

  describe('slug validation', () => {
    it('errors on slug conflict', async () => {
      mockLoadAllEntities.mockResolvedValue([existing('ent-other', 'Other', EntityType.KINGDOM)]);
      const result = await validator.validate(makeEntity({ slug: 'ent-other' }));
      expect(result.errors.some(e => e.includes('already used'))).toBe(true);
    });
  });

  describe('lore consistency', () => {
    it('warns when god does not match their religion deity', async () => {
      const religion = makeEntity({
        id: 'ent-religion',
        name: 'Cult of Nyxara',
        type: EntityType.RELIGION,
        attributes: { deity: 'Nyxara the Shattered' },
        content: 'x'.repeat(20),
      });
      mockLoadAllEntities.mockResolvedValue([religion]);
      const god = makeEntity({
        id: 'ent-god',
        name: 'Different God',
        type: EntityType.GOD,
        relationships: [{ targetId: 'ent-religion', type: 'worshipped_by', label: 'Worshipped by', bidirectional: false }],
        attributes: {},
      });
      const result = await validator.validate(god);
      expect(result.warnings.some(w => w.includes('not the deity'))).toBe(true);
    });
  });
});
