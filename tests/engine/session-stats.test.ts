import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { appendSessionStat, readSessionStats, summarizeStats, estimateCost, sessionStatsPath, SessionStatEntry } from '../../src/engine/session-stats.js';
import { EntityType } from '../../src/types/entity.js';

const TEST_DIR = path.join(import.meta.dirname, '..', '..', 'canon', 'test-session-stats');
const TEST_FILE = sessionStatsPath(TEST_DIR);

beforeEach(async () => {
  await fsp.mkdir(TEST_DIR, { recursive: true });
  try { await fsp.unlink(TEST_FILE); } catch { /* ok */ }
});

afterEach(async () => {
  try { await fsp.rm(TEST_DIR, { recursive: true, force: true }); } catch { /* ok */ }
});

const sampleEntry: SessionStatEntry = {
  sessionId: 'sess-001',
  timestamp: '2025-01-01T00:00:00.000Z',
  type: EntityType.KINGDOM,
  entityId: 'ent-001',
  provider: 'openai',
  model: 'gpt-4',
  tokensIn: 500,
  tokensOut: 1000,
  latencyMs: 1200,
};

describe('sessionStatsPath', () => {
  it('returns path to session-stats.jsonl', () => {
    expect(sessionStatsPath('/some/canon')).toBe(path.join('/some/canon', 'session-stats.jsonl'));
  });
});

describe('appendSessionStat / readSessionStats', () => {
  it('writes and reads back a stat entry', async () => {
    await appendSessionStat(TEST_DIR, sampleEntry);
    const entries = await readSessionStats(TEST_DIR);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.sessionId).toBe('sess-001');
    expect(entries[0]?.tokensIn).toBe(500);
  });

  it('reads multiple entries', async () => {
    await appendSessionStat(TEST_DIR, sampleEntry);
    await appendSessionStat(TEST_DIR, { ...sampleEntry, entityId: 'ent-002', tokensIn: 200 });
    const entries = await readSessionStats(TEST_DIR);
    expect(entries).toHaveLength(2);
  });

  it('returns empty array when no file', async () => {
    const entries = await readSessionStats(TEST_DIR);
    expect(entries).toEqual([]);
  });
});

describe('estimateCost', () => {
  it('calculates cost for gpt-4', () => {
    const cost = estimateCost(1000, 2000, 'gpt-4');
    expect(cost).toBeCloseTo(0.03 + 0.12, 5);
  });

  it('calculates cost for gpt-4o-mini', () => {
    const cost = estimateCost(1000, 1000, 'gpt-4o-mini');
    expect(cost).toBeCloseTo(0.00015 + 0.0006, 6);
  });

  it('falls back to default rate for unknown models', () => {
    const cost = estimateCost(1000, 1000, 'unknown-model');
    expect(cost).toBeCloseTo(0.002 + 0.01, 5);
  });
});

describe('summarizeStats', () => {
  it('returns empty summary for no entries', () => {
    const s = summarizeStats([]);
    expect(s.totalSessions).toBe(0);
    expect(s.totalTokensIn).toBe(0);
    expect(s.totalCost).toBe(0);
  });

  it('aggregates by provider/model and entity type', () => {
    const entries: SessionStatEntry[] = [
      { ...sampleEntry, entityId: 'a' },
      { ...sampleEntry, entityId: 'b', tokensIn: 100, tokensOut: 200 },
      { ...sampleEntry, entityId: 'c', type: EntityType.GOD, provider: 'anthropic', model: 'claude-3-sonnet' },
    ];
    const s = summarizeStats(entries);
    expect(s.totalEntries).toBe(3);
    expect(s.totalTokensIn).toBe(1100);
    expect(s.totalTokensOut).toBe(2200);
    expect(s.byType[EntityType.KINGDOM]).toBe(2);
    expect(s.byType[EntityType.GOD]).toBe(1);
    expect(s.byProvider['openai/gpt-4']?.count).toBe(2);
    expect(s.byProvider['anthropic/claude-3-sonnet']?.count).toBe(1);
  });
});
