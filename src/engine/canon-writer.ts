import * as path from 'node:path';
import * as fs from 'node:fs';
import { Entity, EntityType, entityTypeDir } from '../types/entity.js';
import { WorldMemorySnapshot, GenerationPlan, NamingRegistry, TimelineEntry } from '../types/world.js';
import { appendToJSONL, writeJSON } from './jsonl.js';

export class CanonWriter {
  private canonDir: string;

  constructor(canonDir: string) {
    this.canonDir = canonDir;
  }

  async appendEntity(entity: Entity): Promise<void> {
    const dir = path.join(this.canonDir, 'entities');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${entity.type}.jsonl`);
    await appendToJSONL(filePath, entity);
  }

  async writeMemorySnapshot(snapshot: WorldMemorySnapshot): Promise<void> {
    const dir = path.join(this.canonDir, 'memory');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const journalPath = path.join(dir, 'journal.jsonl');
    await appendToJSONL(journalPath, snapshot);
    const indexPath = path.join(dir, 'index.json');
    await writeJSON(indexPath, { latest: snapshot, updatedAt: new Date().toISOString() });
  }

  async writeGenerationPlan(plan: GenerationPlan): Promise<void> {
    await writeJSON(path.join(this.canonDir, 'generation-plan.json'), plan);
  }

  async writeNamingRegistry(registry: NamingRegistry): Promise<void> {
    await writeJSON(path.join(this.canonDir, 'naming-registry.json'), registry);
  }

  async appendTimeline(entry: TimelineEntry): Promise<void> {
    await appendToJSONL(path.join(this.canonDir, 'timeline.jsonl'), entry);
  }

  async writeWorldCore(core: Record<string, unknown>): Promise<void> {
    await writeJSON(path.join(this.canonDir, 'world-core.json'), core);
  }

  contentDir(): string {
    return path.join(this.canonDir, '..', 'content');
  }

  async writeContent(type: EntityType, slug: string, markdown: string): Promise<void> {
    const dir = path.join(this.contentDir(), entityTypeDir(type));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filePath = path.join(dir, `${slug}.md`);
    await fs.promises.writeFile(filePath, markdown, 'utf-8');
  }
}
