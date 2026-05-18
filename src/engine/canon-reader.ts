import * as path from 'node:path';
import { Entity, EntityType, ENTITY_TYPES } from '../types/entity.js';
import { WorldCore, WorldMemorySnapshot, TimelineEntry, GenerationPlan, NamingRegistry } from '../types/world.js';
import { readAllJSONL, readJSON, readJSONSync } from './jsonl.js';

export interface CanonData {
  entities: Entity[];
  worldCore: WorldCore | null;
  generationPlan: GenerationPlan | null;
  namingRegistry: NamingRegistry | null;
  latestMemory: WorldMemorySnapshot | null;
  allMemories: WorldMemorySnapshot[];
  timeline: TimelineEntry[];
}

export class CanonReader {
  private canonDir: string;

  constructor(canonDir: string) {
    this.canonDir = canonDir;
  }

  entitiesDir(): string {
    return path.join(this.canonDir, 'entities');
  }

  entityPath(type: EntityType): string {
    return path.join(this.entitiesDir(), `${type}.jsonl`);
  }

  memoryDir(): string {
    return path.join(this.canonDir, 'memory');
  }

  memoryJournalPath(): string {
    return path.join(this.memoryDir(), 'journal.jsonl');
  }

  memoryIndexPath(): string {
    return path.join(this.memoryDir(), 'index.json');
  }

  worldCorePath(): string {
    return path.join(this.canonDir, 'world-core.json');
  }

  generationPlanPath(): string {
    return path.join(this.canonDir, 'generation-plan.json');
  }

  namingRegistryPath(): string {
    return path.join(this.canonDir, 'naming-registry.json');
  }

  timelinePath(): string {
    return path.join(this.canonDir, 'timeline.jsonl');
  }

  async loadEntitiesByType(type: EntityType): Promise<Entity[]> {
    return readAllJSONL<Entity>(this.entityPath(type));
  }

  async loadAllEntities(): Promise<Entity[]> {
    const results: Entity[] = [];
    for (const type of ENTITY_TYPES) {
      const entities = await this.loadEntitiesByType(type);
      results.push(...entities);
    }
    return results;
  }

  async loadEntity(id: string): Promise<Entity | null> {
    const all = await this.loadAllEntities();
    return all.find(e => e.id === id) ?? null;
  }

  async loadEntitiesByStatus(status: string): Promise<Entity[]> {
    const all = await this.loadAllEntities();
    return all.filter(e => e.status === status);
  }

  async loadWorldCore(): Promise<WorldCore | null> {
    return readJSON<WorldCore>(this.worldCorePath());
  }

  async loadGenerationPlan(): Promise<GenerationPlan | null> {
    return readJSON<GenerationPlan>(this.generationPlanPath());
  }

  loadGenerationPlanSync(): GenerationPlan | null {
    return readJSONSync<GenerationPlan>(this.generationPlanPath());
  }

  async loadNamingRegistry(): Promise<NamingRegistry | null> {
    return readJSON<NamingRegistry>(this.namingRegistryPath());
  }

  loadNamingRegistrySync(): NamingRegistry | null {
    return readJSONSync<NamingRegistry>(this.namingRegistryPath());
  }

  async loadMemories(): Promise<WorldMemorySnapshot[]> {
    return readAllJSONL<WorldMemorySnapshot>(this.memoryJournalPath());
  }

  async loadLatestMemory(): Promise<WorldMemorySnapshot | null> {
    const memories = await this.loadMemories();
    return memories.length > 0 ? memories[memories.length - 1]! : null;
  }

  async loadTimeline(): Promise<TimelineEntry[]> {
    return readAllJSONL<TimelineEntry>(this.timelinePath());
  }

  async loadAll(): Promise<CanonData> {
    const [entities, worldCore, generationPlan, namingRegistry, memories, timeline] = await Promise.all([
      this.loadAllEntities(),
      this.loadWorldCore(),
      this.loadGenerationPlan(),
      this.loadNamingRegistry(),
      this.loadMemories(),
      this.loadTimeline(),
    ]);
    return {
      entities,
      worldCore,
      generationPlan,
      namingRegistry,
      latestMemory: memories.length > 0 ? memories[memories.length - 1]! : null,
      allMemories: memories,
      timeline,
    };
  }
}
