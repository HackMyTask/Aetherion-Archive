import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallbackChain } from '../../src/ai/fallback-chain.js';
import { AIRequest, AIResponse, AIProvider } from '../../src/types/ai.js';

const sampleRequest: AIRequest = { systemPrompt: '', userPrompt: '' };

function mockProvider(id: string, name: string, available = true, response?: AIResponse): AIProvider {
  return {
    id,
    name,
    isAvailable: vi.fn(() => available),
    generate: vi.fn(async () => {
      if (response) return response;
      throw new Error(`${name} failed`);
    }),
  };
}

function successResponse(content = '{"ok":true}', provider = 'test', model = 'test-model'): AIResponse {
  return { content, provider, model, tokensIn: 10, tokensOut: 20, latencyMs: 50, finishReason: 'stop' };
}

describe('FallbackChain', () => {
  let chain: FallbackChain;

  beforeEach(() => {
    chain = new FallbackChain();
  });

  describe('add / setProviders / getProviders', () => {
    it('starts with empty providers', () => {
      expect(chain.getProviders()).toEqual([]);
    });

    it('sorts providers by priority on add', () => {
      chain.add(mockProvider('b', 'B'), 2);
      chain.add(mockProvider('a', 'A'), 1);
      const providers = chain.getProviders();
      expect(providers[0]?.priority).toBe(1);
      expect(providers[1]?.priority).toBe(2);
    });

    it('setProviders replaces and sorts providers', () => {
      const a = mockProvider('a', 'A');
      const b = mockProvider('b', 'B');
      chain.setProviders([
        { provider: b, priority: 2 },
        { provider: a, priority: 1 },
      ]);
      expect(chain.getProviders()[0]?.provider.id).toBe('a');
    });
  });

  describe('execute', () => {
    it('returns null response with empty providers', async () => {
      const result = await chain.execute(sampleRequest);
      expect(result.response).toBeNull();
      expect(result.attempts).toEqual([]);
    });

    it('returns response from first available provider', async () => {
      chain.add(mockProvider('p1', 'P1', true, successResponse('{"a":1}')), 1);
      const result = await chain.execute(sampleRequest);
      expect(result.response?.content).toBe('{"a":1}');
      expect(result.attempts.length).toBe(1);
      expect(result.attempts[0]?.success).toBe(true);
    });

    it('skips unavailable providers and tries next', async () => {
      chain.add(mockProvider('p1', 'P1', false), 1);
      chain.add(mockProvider('p2', 'P2', true, successResponse('{"ok":true}')), 2);
      const result = await chain.execute(sampleRequest);
      expect(result.response?.content).toBe('{"ok":true}');
      expect(result.attempts.length).toBe(2);
      expect(result.attempts[0]?.success).toBe(false);
      expect(result.attempts[1]?.success).toBe(true);
    });

    it('falls through all providers when all fail', async () => {
      chain.add(mockProvider('p1', 'P1', true), 1);
      chain.add(mockProvider('p2', 'P2', true), 2);
      const result = await chain.execute(sampleRequest);
      expect(result.response).toBeNull();
      expect(result.attempts.length).toBe(2);
      expect(result.attempts.every(a => !a.success)).toBe(true);
    });

    it('records error messages in attempts', async () => {
      chain.add(mockProvider('p1', 'P1', true), 1);
      const result = await chain.execute(sampleRequest);
      expect(result.attempts[0]?.error).toContain('P1 failed');
      expect(result.attempts[0]?.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('executeWithRetry', () => {
    it('returns result on first success without retry', async () => {
      chain.add(mockProvider('p1', 'P1', true, successResponse('{"ok":true}')), 1);
      const result = await chain.executeWithRetry(sampleRequest, 2);
      expect(result.response?.content).toBe('{"ok":true}');
    });

    it('retries on failure up to maxRetries', async () => {
      let callCount = 0;
      const provider = mockProvider('p1', 'P1', true);
      vi.mocked(provider.generate).mockImplementation(async () => {
        callCount++;
        if (callCount < 3) throw new Error('temporary failure');
        return successResponse('{"ok":true}');
      });
      chain.add(provider, 1);
      const result = await chain.executeWithRetry(sampleRequest, 3);
      expect(result.response?.content).toBe('{"ok":true}');
      expect(callCount).toBe(3);
    });

    it('returns null after exhausting retries', async () => {
      chain.add(mockProvider('p1', 'P1', true), 1);
      const result = await chain.executeWithRetry(sampleRequest, 1);
      expect(result.response).toBeNull();
    });
  });
});
