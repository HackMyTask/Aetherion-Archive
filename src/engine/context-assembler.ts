import { CanonReader } from './canon-reader.js';
import { buildGraph, getNeighbors } from './entity-graph.js';
import { Entity, EntityType, entityTypeLabel } from '../types/entity.js';
import { WorldCore, GenerationPlan, WorldMemorySnapshot } from '../types/world.js';

export interface GenerationContext {
  systemPrompt: string;
  entityType: EntityType;
  existingEntities: Entity[];
  neighbors: Entity[];
  relatedEntities: Entity[];
  worldCore: WorldCore | null;
  plan: GenerationPlan | null;
  memory: WorldMemorySnapshot | null;
}

export class ContextAssembler {
  private reader: CanonReader;

  constructor(reader: CanonReader) {
    this.reader = reader;
  }

  async prepare(type: EntityType): Promise<GenerationContext> {
    const [allEntities, worldCore, plan, memory, timeline] = await Promise.all([
      this.reader.loadAllEntities(),
      this.reader.loadWorldCore(),
      this.reader.loadGenerationPlan(),
      this.reader.loadLatestMemory(),
      this.reader.loadTimeline(),
    ]);

    const graph = buildGraph(allEntities);
    const sameType = allEntities.filter(e => e.type === type && e.status !== 'archived');
    const recentIds = new Set(sameType.slice(-5).map(e => e.id));
    const neighbors = new Map<string, Entity>();

    for (const id of recentIds) {
      const ns = getNeighbors(id, graph);
      for (const n of ns) {
        neighbors.set(n.id, n);
      }
    }

    const existingEntities = allEntities.filter(e => e.status !== 'archived');

    // Filter to entities referenced by timeline entries
    const timelineEntityIds = new Set(timeline.flatMap(t => t.relatedEntities));
    const timelineEntities = allEntities.filter(e => timelineEntityIds.has(e.id));

    return {
      systemPrompt: this.buildSystemPrompt(worldCore, type, plan, memory, timeline),
      entityType: type,
      existingEntities,
      neighbors: Array.from(neighbors.values()),
      relatedEntities: timelineEntities,
      worldCore,
      plan,
      memory,
    };
  }

  private buildSystemPrompt(
    world: WorldCore | null,
    type: EntityType,
    plan: GenerationPlan | null,
    memory: WorldMemorySnapshot | null,
    timeline: { id: string; title: string; summary: string }[],
  ): string {
    const parts: string[] = [
      `You are building the Aetherion Archive, a fantasy universe database.`,
      `Your task is to generate a new ${entityTypeLabel(type)} as a JSON entity conforming to the schema.`,
    ];

    if (world) {
      parts.push(`\n--- WORLD PREMISE ---`);
      parts.push(world.premise);
      parts.push(`\nEvent: ${world.centralEvent}`);
      parts.push(`Magic System: ${world.magicSystem}`);
      if (world.cosmicLaws.length > 0) {
        parts.push(`Cosmic Laws:\n${world.cosmicLaws.map(l => `- ${l}`).join('\n')}`);
      }
    }

    if (memory) {
      parts.push(`\n--- CURRENT WORLD STATE ---`);
      parts.push(`Era: ${memory.state.currentEra}`);
      parts.push(`Fracture: ${memory.state.cosmicState.celestialFracture}`);
      parts.push(`Fragments: ${memory.state.cosmicState.moonFragments}`);
      parts.push(`Magic Stability: ${memory.state.cosmicState.magicStability}`);
      parts.push(`Total Entities: ${memory.state.totalEntities}`);
      if (memory.state.majorConflicts.length > 0) {
        parts.push(`Active Conflicts:\n${memory.state.majorConflicts.map(c => `- ${c.between.join(' vs ')} (${c.status})`).join('\n')}`);
      }
    }

    if (plan) {
      parts.push(`\n--- GENERATION STRATEGY ---`);
      parts.push(plan.strategy);
    }

    if (timeline.length > 0) {
      parts.push(`\n--- TIMELINE (recent) ---`);
      const recent = timeline.slice(-5);
      for (const entry of recent) {
        parts.push(`- ${entry.title}: ${entry.summary}`);
      }
    }

    parts.push(`\n--- OUTPUT RULES ---`);
    parts.push(`Respond with ONLY valid JSON. No markdown fences, no extra text.`);
    parts.push(`The entity must fit within the existing lore without contradiction.`);
    parts.push(`Each entity MUST have at least one relationship to an existing entity.`);
    parts.push(`If existing canon entities are provided in context, at least 1 relationship MUST reference an existing canon entity by its exact slug.`);
    parts.push(`Use unique names that don't conflict with existing entities.`);
    parts.push(`Generate lore-rich descriptions of 100-300 words.`);

    return parts.join('\n');
  }
}
