import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as nodePath from 'node:path';

export async function* readJSONL<T>(path: string): AsyncGenerator<T> {
  const file = await fsp.open(path, 'r');
  try {
    const stream = file.createReadStream({ encoding: 'utf-8' });
    let buffer = '';
    for await (const chunk of stream) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) {
          yield JSON.parse(trimmed) as T;
        }
      }
    }
    if (buffer.trim()) {
      yield JSON.parse(buffer.trim()) as T;
    }
  } finally {
    await file.close();
  }
}

export async function readAllJSONL<T>(path: string): Promise<T[]> {
  if (!fs.existsSync(path)) return [];
  const results: T[] = [];
  for await (const item of readJSONL<T>(path)) {
    results.push(item);
  }
  return results;
}

export async function appendToJSONL<T>(path: string, data: T): Promise<void> {
  const line = JSON.stringify(data) + '\n';
  const tmpPath = path + '.tmp';

  let content: string;
  if (fs.existsSync(path)) {
    content = await fsp.readFile(path, 'utf-8');
  } else {
    content = '';
    const dir = nodePath.dirname(path);
    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir, { recursive: true });
    }
  }

  content += line;
  await fsp.writeFile(tmpPath, content, 'utf-8');
  await fsp.rename(tmpPath, path);
}

export async function writeJSON<T>(path: string, data: T): Promise<void> {
  const dir = nodePath.dirname(path);
  if (!fs.existsSync(dir)) {
    await fsp.mkdir(dir, { recursive: true });
  }
  const tmpPath = path + '.tmp';
  await fsp.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  await fsp.rename(tmpPath, path);
}

export async function readJSON<T>(path: string): Promise<T | null> {
  if (!fs.existsSync(path)) return null;
  const content = await fsp.readFile(path, 'utf-8');
  return JSON.parse(content) as T;
}

export function readJSONSync<T>(path: string): T | null {
  if (!fs.existsSync(path)) return null;
  const content = fs.readFileSync(path, 'utf-8');
  return JSON.parse(content) as T;
}

export async function fileExists(path: string): Promise<boolean> {
  return fs.existsSync(path);
}
