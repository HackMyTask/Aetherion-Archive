import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { appendToDeadLetter, readDeadLetter, removeFromDeadLetter, deadLetterPath } from '../../src/engine/dead-letter.js';

const TEST_DIR = path.join(import.meta.dirname, '..', '..', 'canon', 'test-dead-letter');
const TEST_FILE = deadLetterPath(TEST_DIR);

beforeEach(async () => {
  await fsp.mkdir(TEST_DIR, { recursive: true });
  try { await fsp.unlink(TEST_FILE); } catch { /* ok */ }
});

afterEach(async () => {
  try { await fsp.rm(TEST_DIR, { recursive: true, force: true }); } catch { /* ok */ }
});

const sampleEntry = {
  id: 'dlq-001',
  timestamp: '2025-01-01T00:00:00.000Z',
  type: 'kingdom',
  nameHint: 'Test Kingdom',
  promptExcerpt: 'Generate a kingdom...',
  lastError: 'All providers returned null',
  providerAttempts: [{ providerId: 'openai', name: 'gpt-4', error: 'rate limited' }],
};

describe('deadLetterPath', () => {
  it('returns path to failed.jsonl in canon dir', () => {
    expect(deadLetterPath('/some/canon')).toBe(path.join('/some/canon', 'failed.jsonl'));
  });
});

describe('appendToDeadLetter', () => {
  it('writes entry to failed.jsonl', async () => {
    await appendToDeadLetter(TEST_DIR, sampleEntry);
    const content = await fsp.readFile(TEST_FILE, 'utf-8');
    const parsed = JSON.parse(content.trim());
    expect(parsed.id).toBe('dlq-001');
  });
});

describe('readDeadLetter', () => {
  it('returns empty array when no file exists', async () => {
    const entries = await readDeadLetter(TEST_DIR);
    expect(entries).toEqual([]);
  });

  it('reads entries back', async () => {
    await appendToDeadLetter(TEST_DIR, sampleEntry);
    const entries = await readDeadLetter(TEST_DIR);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe('dlq-001');
  });

  it('reads multiple entries', async () => {
    await appendToDeadLetter(TEST_DIR, sampleEntry);
    await appendToDeadLetter(TEST_DIR, { ...sampleEntry, id: 'dlq-002' });
    const entries = await readDeadLetter(TEST_DIR);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.id).toBe('dlq-001');
    expect(entries[1]?.id).toBe('dlq-002');
  });
});

describe('removeFromDeadLetter', () => {
  it('removes one entry from file', async () => {
    await appendToDeadLetter(TEST_DIR, sampleEntry);
    await appendToDeadLetter(TEST_DIR, { ...sampleEntry, id: 'dlq-002' });
    await removeFromDeadLetter(TEST_DIR, 'dlq-001');
    const entries = await readDeadLetter(TEST_DIR);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.id).toBe('dlq-002');
  });

  it('deletes the file when last entry removed', async () => {
    await appendToDeadLetter(TEST_DIR, sampleEntry);
    await removeFromDeadLetter(TEST_DIR, 'dlq-001');
    const entries = await readDeadLetter(TEST_DIR);
    expect(entries).toHaveLength(0);
  });

  it('handles non-existent file gracefully', async () => {
    await removeFromDeadLetter(TEST_DIR, 'does-not-exist');
    const entries = await readDeadLetter(TEST_DIR);
    expect(entries).toHaveLength(0);
  });
});
