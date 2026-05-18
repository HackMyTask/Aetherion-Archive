import * as path from 'node:path';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import { appendToJSONL, readAllJSONL } from './jsonl.js';

export interface DeadLetterEntry {
  id: string;
  timestamp: string;
  type: string;
  nameHint?: string;
  promptExcerpt: string;
  lastError: string;
  providerAttempts: { providerId: string; name: string; error: string }[];
}

export function deadLetterPath(canonDir: string): string {
  return path.join(canonDir, 'failed.jsonl');
}

export async function appendToDeadLetter(canonDir: string, entry: DeadLetterEntry): Promise<void> {
  await appendToJSONL(deadLetterPath(canonDir), entry);
}

export async function readDeadLetter(canonDir: string): Promise<DeadLetterEntry[]> {
  return readAllJSONL<DeadLetterEntry>(deadLetterPath(canonDir));
}

export async function removeFromDeadLetter(canonDir: string, id: string): Promise<void> {
  const entries = await readDeadLetter(canonDir);
  const remaining = entries.filter(e => e.id !== id);
  const p = deadLetterPath(canonDir);
  if (remaining.length === 0) {
    if (fs.existsSync(p)) await fsp.unlink(p);
    return;
  }
  const content = remaining.map(e => JSON.stringify(e)).join('\n') + '\n';
  const tmpPath = p + '.tmp';
  await fsp.writeFile(tmpPath, content, 'utf-8');
  await fsp.rename(tmpPath, p);
}
