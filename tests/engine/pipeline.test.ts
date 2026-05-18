import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallbackChain } from '../../src/ai/fallback-chain.js';
import { AIProvider, AIResponse } from '../../src/types/ai.js';
import { EntityType, EntityStatus } from '../../src/types/entity.js';

const mockLoadAllEntities = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockLoadNamingRegistry = vi.hoisted(() => vi.fn().mockResolvedValue({ usedNames: {}, usedSlugs: {}, patterns: {} }));
const mockLoadLatestMemory = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockLoadEntitiesByType = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockLoadGenerationPlan = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockLoadWorldCore = vi.hoisted(() => vi.fn().mockResolvedValue(null));
const mockLoadTimeline = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockAppendEntity = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockWriteContent = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockWriteMemorySnapshot = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockWriteNamingRegistry = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockAppendTimeline = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockAppendToDeadLetter = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockPrepare = vi.hoisted(() => vi.fn().mockResolvedValue({
  systemPrompt: 'Generate a kingdom entity.',
  existingEntities: [],
  neighbors: [],
  relatedEntities: [],
}));

vi.mock('../../src/engine/canon-reader.js', () => ({
  CanonReader: vi.fn(function () {
    return {
      loadAllEntities: mockLoadAllEntities,
      loadNamingRegistry: mockLoadNamingRegistry,
      loadLatestMemory: mockLoadLatestMemory,
      loadEntitiesByType: mockLoadEntitiesByType,
      loadGenerationPlan: mockLoadGenerationPlan,
      loadWorldCore: mockLoadWorldCore,
      loadTimeline: mockLoadTimeline,
    };
  }),
}));

vi.mock('../../src/engine/canon-writer.js', () => ({
  CanonWriter: vi.fn(function () {
    return {
      appendEntity: mockAppendEntity,
      writeContent: mockWriteContent,
      writeMemorySnapshot: mockWriteMemorySnapshot,
      writeNamingRegistry: mockWriteNamingRegistry,
      appendTimeline: mockAppendTimeline,
    };
  }),
}));

vi.mock('../../src/engine/context-assembler.js', () => ({
  ContextAssembler: vi.fn(function () {
    return {
      prepare: mockPrepare,
    };
  }),
}));

vi.mock('../../src/engine/dead-letter.js', () => ({
  appendToDeadLetter: mockAppendToDeadLetter,
}));

vi.mock('../../src/engine/prompts/entity-prompts.js', () => ({
  getEntityPrompt: vi.fn(() => ({
    role: 'You are generating a kingdom.',
    creationGuidelines: ['Describe the kingdom'],
    attributeFocus: ['capital', 'leader'],
    relationshipHints: ['Connect to existing kingdoms'],
    jsonExample: '{"capital": "City"}',
  })),
}));

import { Pipeline } from '../../src/engine/pipeline.js';

function mockProvider(response?: AIResponse): AIProvider {
  return {
    id: 'mock',
    name: 'MockProvider',
    isAvailable: vi.fn(() => true),
    generate: vi.fn(async () => {
      if (response) return response;
      throw new Error('Mock provider failed');
    }),
  };
}

function makeFallback(response?: AIResponse): FallbackChain {
  const chain = new FallbackChain();
  chain.add(mockProvider(response), 1);
  return chain;
}

const validKingdomJson = JSON.stringify({
  name: 'Kingdom of Eldoria',
  type: 'kingdom',
  capital: 'Eldoria City',
  leader: 'King Theron',
  description: 'A prosperous kingdom in the heartlands. Known for its crystal mines and ancient traditions.',
  relationships: [{ targetId: 'ent-existing', type: 'borders', label: 'Borders the Wildlands', bidirectional: true }],
});

const successResp = (content: string): AIResponse => ({
  content,
  provider: 'mock',
  model: 'mock-model',
  tokensIn: 50,
  tokensOut: 100,
  latencyMs: 200,
  finishReason: 'stop',
});

describe('Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAllEntities.mockResolvedValue([{
      id: 'ent-existing',
      type: 'kingdom',
      name: 'Existing',
      slug: 'existing',
      status: 'active',
      relationships: [],
    }]);
  });

  describe('generateOne', () => {
    it('generates an entity from AI response', async () => {
      const fallback = makeFallback(successResp(validKingdomJson));
      const pipeline = new Pipeline('/tmp/canon', fallback);

      const result = await pipeline.generateOne({ type: EntityType.KINGDOM });

      expect(result).not.toBeNull();
      expect(result!.entity.name).toBe('Kingdom of Eldoria');
    });

    it('creates a timeline entry for event entities', async () => {
      const eventJson = JSON.stringify({
        name: 'The Great Battle',
        type: 'event',
        date: '47 AF',
        description: 'A massive battle that changed the course of history. Many fell. Few survived.',
        participants: ['Kingdom of Eldoria'],
        relationships: [],
      });
      const fallback = makeFallback(successResp(eventJson));
      const pipeline = new Pipeline('/tmp/canon', fallback);

      await pipeline.generateOne({ type: EntityType.EVENT });

      expect(mockAppendTimeline).toHaveBeenCalledOnce();
    });

    it('writes naming registry', async () => {
      const fallback = makeFallback(successResp(validKingdomJson));
      const pipeline = new Pipeline('/tmp/canon', fallback);

      await pipeline.generateOne({ type: EntityType.KINGDOM });

      expect(mockWriteNamingRegistry).toHaveBeenCalled();
    });
  });

  describe('parseEntity', () => {
    it('strips markdown fences from AI response', async () => {
      const fenced = '```json\n' + validKingdomJson + '\n```';
      const fallback = makeFallback(successResp(fenced));
      const pipeline = new Pipeline('/tmp/canon', fallback);

      const result = await pipeline.generateOne({ type: EntityType.KINGDOM });
      expect(result).not.toBeNull();
      expect(result!.entity.name).toBe('Kingdom of Eldoria');
    });

    it('uses defaults for missing optional fields', async () => {
      const minimal = JSON.stringify({ name: 'Minimal Kingdom' });
      const fallback = makeFallback(successResp(minimal));
      mockLoadAllEntities.mockResolvedValue([]);
      const pipeline = new Pipeline('/tmp/canon', fallback);

      const result = await pipeline.generateOne({ type: EntityType.KINGDOM, skipValidation: true });
      expect(result).not.toBeNull();
      expect(result!.entity.name).toBe('Minimal Kingdom');
      expect(result!.entity.relationships).toEqual([]);
      expect(result!.entity.status).toBe(EntityStatus.ACTIVE);
    });
  });

  describe('error handling', () => {
    it('returns null when all providers fail and writes to dead letter', async () => {
      const fallback = makeFallback();
      const pipeline = new Pipeline('/tmp/canon', fallback);

      const result = await pipeline.generateOne({ type: EntityType.KINGDOM });

      expect(result).toBeNull();
      expect(mockAppendToDeadLetter).toHaveBeenCalledOnce();
      const entry = mockAppendToDeadLetter.mock.calls[0]![1];
      expect(entry.type).toBe('kingdom');
      expect(entry.lastError).toBeTruthy();
    });
  });
});
