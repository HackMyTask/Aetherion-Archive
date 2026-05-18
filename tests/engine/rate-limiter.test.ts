import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { delayBetweenBatchCalls } from '../../src/engine/rate-limiter.js';

const ORIGINAL_ENV = process.env.BATCH_DELAY_MS;

beforeEach(() => {
  delete process.env.BATCH_DELAY_MS;
});

afterEach(() => {
  if (ORIGINAL_ENV) process.env.BATCH_DELAY_MS = ORIGINAL_ENV;
});

describe('delayBetweenBatchCalls', () => {
  it('resolves after default delay when no env var set', async () => {
    const start = Date.now();
    await delayBetweenBatchCalls();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(1900);
  });

  it('respects BATCH_DELAY_MS env var', async () => {
    process.env.BATCH_DELAY_MS = '500';
    const start = Date.now();
    await delayBetweenBatchCalls();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(400);
  });

  it('resolves immediately when delay is 0', async () => {
    process.env.BATCH_DELAY_MS = '0';
    const start = Date.now();
    await delayBetweenBatchCalls();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('falls back to default when env var is invalid', async () => {
    process.env.BATCH_DELAY_MS = 'not-a-number';
    const start = Date.now();
    await delayBetweenBatchCalls();
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(1900);
  });
});
