import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { readJSONL, readAllJSONL, appendToJSONL, writeJSON, readJSON } from '../../src/engine/jsonl.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'jsonl-test-'));
});

afterEach(async () => {
  await fsp.rm(tmpDir, { recursive: true, force: true });
});

describe('writeJSON', () => {
  it('writes JSON to file with formatting', async () => {
    const p = path.join(tmpDir, 'test.json');
    await writeJSON(p, { name: 'test', value: 42 });
    const content = await fsp.readFile(p, 'utf-8');
    expect(content).toBe(JSON.stringify({ name: 'test', value: 42 }, null, 2));
  });

  it('creates intermediate directories', async () => {
    const p = path.join(tmpDir, 'sub', 'nested', 'test.json');
    await writeJSON(p, { ok: true });
    expect(fs.existsSync(p)).toBe(true);
  });
});

describe('readJSON', () => {
  it('returns null for missing file', async () => {
    expect(await readJSON(path.join(tmpDir, 'nope.json'))).toBeNull();
  });

  it('returns parsed content for existing file', async () => {
    const p = path.join(tmpDir, 'test.json');
    await fsp.writeFile(p, JSON.stringify({ hello: 'world' }), 'utf-8');
    const result = await readJSON<{ hello: string }>(p);
    expect(result).toEqual({ hello: 'world' });
  });
});

describe('appendToJSONL', () => {
  it('appends a JSON line to an existing file', async () => {
    const p = path.join(tmpDir, 'data.jsonl');
    await appendToJSONL(p, { a: 1 });
    await appendToJSONL(p, { b: 2 });
    const content = await fsp.readFile(p, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(2);
    expect(JSON.parse(lines[0]!)).toEqual({ a: 1 });
    expect(JSON.parse(lines[1]!)).toEqual({ b: 2 });
  });

  it('creates a new file if it does not exist', async () => {
    const p = path.join(tmpDir, 'new.jsonl');
    await appendToJSONL(p, { first: true });
    expect(fs.existsSync(p)).toBe(true);
    const content = await fsp.readFile(p, 'utf-8');
    expect(JSON.parse(content.trim())).toEqual({ first: true });
  });

  it('cleans up .tmp file after write', async () => {
    const p = path.join(tmpDir, 'cleanup.jsonl');
    await appendToJSONL(p, { test: true });
    expect(fs.existsSync(p + '.tmp')).toBe(false);
  });
});

describe('writeJSON', () => {
  it('cleans up .tmp file after write', async () => {
    const p = path.join(tmpDir, 'cleanup.json');
    await writeJSON(p, { test: true });
    expect(fs.existsSync(p + '.tmp')).toBe(false);
  });
});

describe('readAllJSONL', () => {
  it('returns empty array for missing file', async () => {
    expect(await readAllJSONL(path.join(tmpDir, 'nope.jsonl'))).toEqual([]);
  });

  it('reads all lines from file', async () => {
    const p = path.join(tmpDir, 'data.jsonl');
    await appendToJSONL(p, { id: 1 });
    await appendToJSONL(p, { id: 2 });
    await appendToJSONL(p, { id: 3 });
    const results = await readAllJSONL<{ id: number }>(p);
    expect(results.map(r => r.id)).toEqual([1, 2, 3]);
  });
});

describe('readJSONL (async generator)', () => {
  it('yields each line', async () => {
    const p = path.join(tmpDir, 'data.jsonl');
    await appendToJSONL(p, { x: 10 });
    await appendToJSONL(p, { x: 20 });
    const items: number[] = [];
    for await (const item of readJSONL<{ x: number }>(p)) {
      items.push(item.x);
    }
    expect(items).toEqual([10, 20]);
  });
});
