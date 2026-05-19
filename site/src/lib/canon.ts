import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Entity, SEOData, Relationship } from '../../../src/types/entity';
import { EntityType, EntityStatus } from '../../../src/types/entity';

const ENTITIES_DIR = join(import.meta.dirname, '..', '..', '..', 'canon', 'entities');

const TYPE_FILE_MAP: Record<string, string> = {
  god: 'god.jsonl',
  kingdom: 'kingdom.jsonl',
  faction: 'faction.jsonl',
  event: 'event.jsonl',
  city: 'city.jsonl',
  religion: 'religion.jsonl',
  race: 'race.jsonl',
  monster: 'monster.jsonl',
  artifact: 'artifact.jsonl',
  spell: 'spell.jsonl',
  region: 'region.jsonl',
};

let _cache: Map<string, Entity> | null = null;

function readJSONL(filePath: string): Entity[] {
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim().length > 0);
  const entities: Entity[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      entities.push(parsed as Entity);
    } catch {
      console.warn(`[canon] Skipping malformed JSONL line in ${filePath}`);
    }
  }
  return entities;
}

function buildCache(): Map<string, Entity> {
  if (_cache) return _cache;
  _cache = new Map();
  for (const file of Object.values(TYPE_FILE_MAP)) {
    const path = join(ENTITIES_DIR, file);
    const entities = readJSONL(path);
    for (const e of entities) {
      _cache.set(e.slug, e);
    }
  }
  return _cache;
}

export function getAllEntities(): Entity[] {
  return Array.from(buildCache().values());
}

export function getEntitiesByType(type: string): Entity[] {
  const all = getAllEntities();
  return all.filter(e => e.type === type);
}

export function getEntityBySlug(slug: string): Entity | undefined {
  return buildCache().get(slug);
}

export function getEntityGraph(): Map<string, Entity> {
  return buildCache();
}

export function entityExists(slug: string): boolean {
  return buildCache().has(slug);
}

export function getResolvedRelationships(entity: Entity): Array<{ target: Entity; relation: Relationship }> {
  const graph = buildCache();
  return entity.relationships
    .filter(r => graph.has(r.targetId))
    .map(r => ({ target: graph.get(r.targetId)!, relation: r }));
}

export function getEntityCount(): number {
  return buildCache().size;
}

export function getEntityTypeCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of buildCache().values()) {
    counts[e.type] = (counts[e.type] || 0) + 1;
  }
  return counts;
}
