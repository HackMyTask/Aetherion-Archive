import { Entity, EntityType, EntityStatus, createEntityId } from '../types/entity.js';
import { AIResponse } from '../types/ai.js';
import { FallbackChain } from '../ai/fallback-chain.js';
import { BaseProvider } from '../ai/provider.js';
import { CanonReader } from './canon-reader.js';
import { CanonWriter } from './canon-writer.js';
import { Validator } from './validator.js';
import { ContextAssembler } from './context-assembler.js';
import { getEntityPrompt } from './prompts/entity-prompts.js';
import { buildGraph, getBidirectionalGaps } from './entity-graph.js';
import { renderFullPage } from './markdown-renderer.js';
import { computeNewMemory } from './world-memory.js';
import { registerName, registerSlug, createEmptyRegistry } from './naming-registry.js';
import { delayBetweenBatchCalls } from './rate-limiter.js';
import { appendToDeadLetter } from './dead-letter.js';
import { appendSessionStat } from './session-stats.js';
import { TimelineEntry } from '../types/world.js';

export interface GenerateResult {
  entity: Entity;
  contentPath: string;
  aiResponse: AIResponse;
  validation: { errors: string[]; warnings: string[] };
}

export interface GenerateOptions {
  type: EntityType;
  name?: string;
  maxRetries?: number;
  skipValidation?: boolean;
}

export class Pipeline {
  private reader: CanonReader;
  private writer: CanonWriter;
  private fallback: FallbackChain;
  private validator: Validator;
  private assembler: ContextAssembler;
  private canonDir: string;
  private sessionId: string;
  private snapshotCounter = 0;

  constructor(_canonDir: string, fallback: FallbackChain) {
    this.canonDir = _canonDir;
    this.sessionId = process.env.SESSION_ID ?? `sess-${Date.now()}`;
    this.reader = new CanonReader(_canonDir);
    this.writer = new CanonWriter(_canonDir);
    this.fallback = fallback;
    this.validator = new Validator(this.reader);
    this.assembler = new ContextAssembler(this.reader);
  }

  setProviders(providers: BaseProvider[]): void {
    const entries = providers.map((p, i) => ({ provider: p, priority: i + 1 }));
    this.fallback.setProviders(entries);
  }

  async generateOne(options: GenerateOptions): Promise<GenerateResult | null> {
    const context = await this.assembler.prepare(options.type);
    const promptDef = getEntityPrompt(options.type);

    const allEntities = await this.reader.loadAllEntities();
    const namingRegistry = (await this.reader.loadNamingRegistry()) ?? createEmptyRegistry();

    const existingJson = allEntities
      .filter(e => e.type === options.type && e.status !== 'archived')
      .slice(-3)
      .map(e => JSON.stringify(e, null, 2))
      .join('\n\n');

    const typeSpecific = getEntityPrompt(options.type);

    const userPrompt = this.buildUserPrompt(
      context,
      promptDef,
      typeSpecific,
      namingRegistry,
      existingJson,
      options.name,
    );

    const result = await this.fallback.executeWithRetry(
      { systemPrompt: context.systemPrompt, userPrompt, temperature: 0.7 },
      options.maxRetries ?? 1,
    );

    if (!result.response) {
      const lastErr = result.attempts[result.attempts.length - 1]?.error ?? 'All providers failed';
      await appendToDeadLetter(this.canonDir, {
        id: `dlq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: new Date().toISOString(),
        type: options.type,
        nameHint: options.name,
        promptExcerpt: userPrompt.slice(0, 500),
        lastError: lastErr,
        providerAttempts: result.attempts.map(a => ({
          providerId: a.providerId ?? 'unknown',
          name: a.providerName ?? 'unknown',
          error: a.error ?? 'unknown',
        })),
      });
      console.warn(`Generation failed for ${options.type}${options.name ? ` (${options.name})` : ''}: ${lastErr} — written to dead letter queue`);
      return null;
    }

    const entity = this.parseEntity(result.response.content, options.type, result.response.provider);
    if (!entity) {
      throw new Error(`Failed to parse entity from AI response:\n${result.response.content}`);
    }

    // Validate unless skipping (warning-only — placeholder targets expected)
    if (!options.skipValidation) {
      const validation = await this.validator.validate(entity);
      if (!validation.valid) {
        validation.warnings.push(...validation.errors.map(e => `PLACEHOLDER TARGET (entity created anyway): ${e}`));
        validation.errors = [];
      }
    }

    registerName(namingRegistry, entity.name, entity.id, entity.type);
    registerSlug(namingRegistry, entity.slug, entity.name, entity.type);
    await this.writer.writeNamingRegistry(namingRegistry);

    // Write entity to canon
    await this.writer.appendEntity(entity);

    // Write markdown content
    await this.writer.writeContent(entity.type, entity.slug, renderFullPage(entity, allEntities));

    // Update world memory
    const lastState = await this.reader.loadLatestMemory();
    this.snapshotCounter++;
    const memory = computeNewMemory(
      entity,
      lastState?.state ?? null,
      [...allEntities, entity],
      this.snapshotCounter,
    );
    await this.writer.writeMemorySnapshot(memory);

    // Record session stats
    await appendSessionStat(this.canonDir, {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      type: entity.type,
      entityId: entity.id,
      provider: result.response.provider,
      model: result.response.model,
      tokensIn: result.response.tokensIn,
      tokensOut: result.response.tokensOut,
      latencyMs: result.response.latencyMs,
    });

    // Add timeline entry if event
    if (entity.type === 'event') {
      const timelineEntry: TimelineEntry = {
        id: entity.id,
        type: 'event',
        date: (entity.attributes.date as string) ?? entity.createdAt,
        title: entity.name,
        summary: entity.excerpt,
        significance: 5,
        relatedEntities: entity.relationships.map(r => r.targetId),
      };
      await this.writer.appendTimeline(timelineEntry);
    }

    return {
      entity,
      contentPath: `content/${entity.type}/${entity.slug}.md`,
      aiResponse: result.response,
      validation: { errors: [], warnings: [] },
    };
  }

  async generateBatch(type: EntityType, count: number): Promise<GenerateResult[]> {
    const results: GenerateResult[] = [];
    for (let i = 0; i < count; i++) {
      const result = await this.generateOne({ type });
      if (result === null) {
        console.warn(`[${i + 1}/${count}] Skipped — dead letter queued`);
      } else {
        results.push(result);
        console.log(`[${i + 1}/${count}] Generated ${result.entity.name} (${result.entity.id})`);
      }
      if (i < count - 1) await delayBetweenBatchCalls();
    }
    return results;
  }

  async generateBatchFromPlan(): Promise<GenerateResult[]> {
    const plan = await this.reader.loadGenerationPlan();
    if (!plan) throw new Error('No generation plan found');

    const results: GenerateResult[] = [];
    for (const [typeStr, dist] of Object.entries(plan.distribution)) {
      const type = typeStr as EntityType;
      const existing = await this.reader.loadEntitiesByType(type);
      const active = existing.filter(e => e.status !== 'archived');
      const gap = (dist.target - active.length) * (plan.gapMultiplier ?? 1);
      const toGenerate = Math.max(0, Math.ceil(gap));

      if (toGenerate > 0) {
        console.log(`Generating ${toGenerate} ${typeStr} entities (gap: ${gap})`);
        for (let i = 0; i < toGenerate; i++) {
          const result = await this.generateOne({ type });
          if (result !== null) results.push(result);
          if (i < toGenerate - 1) await delayBetweenBatchCalls();
        }
      }
    }

    return results;
  }

  async validateAll(): Promise<{ entityId: string; errors: string[]; warnings: string[] }[]> {
    const entities = await this.reader.loadAllEntities();
    const results: { entityId: string; errors: string[]; warnings: string[] }[] = [];

    for (const entity of entities) {
      const validation = await this.validator.validate(entity, false);
      if (!validation.valid || validation.warnings.length > 0) {
        results.push({
          entityId: entity.id,
          errors: validation.errors,
          warnings: validation.warnings,
        });
      }
    }

    return results;
  }

  async checkBidirectionalConsistency(): Promise<{ from: string; to: string; type: string }[]> {
    const entities = await this.reader.loadAllEntities();
    const graph = buildGraph(entities);
    return getBidirectionalGaps(graph);
  }

  async requeueFixes(): Promise<void> {
    const gaps = await this.checkBidirectionalConsistency();
    if (gaps.length === 0) return;

    const entities = await this.reader.loadAllEntities();
    const entityMap = new Map(entities.map(e => [e.id, e]));

    for (const gap of gaps) {
      const source = entityMap.get(gap.from);
      const target = entityMap.get(gap.to);
      if (!source || !target) continue;
      console.log(`Missing reverse relationship: ${source.name} --[${gap.type}]--> ${target.name}`);
    }
  }

  private buildUserPrompt(
    context: { existingEntities: Entity[]; neighbors: Entity[] },
    prompts: { role: string; creationGuidelines: string[]; jsonExample: string },
    typeSpecific: { attributeFocus: string[]; relationshipHints: string[] },
    namingRegistry: { usedNames: Record<string, unknown>; patterns: Record<string, { examples: string[] }> },
    existingJson: string,
    nameHint?: string,
  ): string {
    const parts: string[] = [prompts.role];

    const nameCount = Object.keys(namingRegistry.usedNames || {}).length;
    if (nameCount > 0) {
      parts.push(`\nExisting entities in universe: ${nameCount}`);
    }

    if (context.existingEntities.length > 0) {
      parts.push(`\n=== EXISTING CANON ENTITIES (you MUST reference at least 2) ===`);
      parts.push(`Use these exact slugs in your relationships array:`);
      for (const e of context.existingEntities) {
        parts.push(`- ${e.slug} (${e.type}) — "${e.name}"`);
      }
      parts.push(`=== END CANON ===`);
    } else {
      parts.push(`\n--- UNIVERSE (fresh start) ---`);
    }

    if (existingJson) {
      parts.push(`\n--- EXAMPLES OF THIS TYPE ---`);
      parts.push(existingJson);
    }

    parts.push(`\n--- CREATION GUIDELINES ---`);
    for (const g of prompts.creationGuidelines) parts.push(`- ${g}`);

    parts.push(`\n--- ATTRIBUTES TO INCLUDE ---`);
    for (const a of typeSpecific.attributeFocus) parts.push(`- ${a}`);

    parts.push(`\n--- RELATIONSHIP GUIDELINES ---`);
    for (const h of typeSpecific.relationshipHints) parts.push(`- ${h}`);

    parts.push(`\n--- NAMING CONVENTIONS ---`);
    const typePatterns = namingRegistry.patterns as Record<string, { examples: string[] }>;
    if (typePatterns) {
      // Show all type patterns
      for (const [type, pattern] of Object.entries(typePatterns)) {
        parts.push(`- ${type}: ${pattern.examples.join(', ')}`);
      }
    }

    if (nameHint) {
      parts.push(`\nHint: Consider the name "${nameHint}"`);
    }

    parts.push(`\n${prompts.jsonExample}`);
    parts.push(`\nRespond with ONLY valid JSON. No markdown fences.`);

    return parts.join('\n');
  }

  private parseEntity(content: string, type: EntityType, provider: string): Entity | null {
    // Strip markdown fences if present
    let cleaned = content.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');

    try {
      const parsed = JSON.parse(cleaned);

      return {
        id: parsed.id ?? createEntityId(parsed.name ?? 'unknown'),
        type: parsed.type ?? type,
        name: parsed.name ?? 'Unknown Entity',
        slug: parsed.slug ?? createEntityId(parsed.name ?? 'unknown'),
        aliases: parsed.aliases ?? [],
        status: parsed.status ?? EntityStatus.ACTIVE,
        relationships: parsed.relationships ?? [],
        description: parsed.description ?? parsed.excerpt?.slice(0, 200) ?? '',
        excerpt: parsed.excerpt ?? parsed.description?.slice(0, 200) ?? '',
        content: parsed.content ?? parsed.description ?? '',
        attributes: parsed.attributes ?? this.extractAttributes(parsed),
        version: 1,
        generatedBy: provider,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        seo: parsed.seo ?? {
          title: parsed.name ?? 'Unknown',
          metaDescription: (parsed.excerpt ?? parsed.description ?? '').slice(0, 160),
          keywords: [type],
          pillarWeight: 5,
          topicalCluster: type,
        },
      };
    } catch {
      return null;
    }
  }

  private extractAttributes(obj: Record<string, unknown>): Record<string, unknown> {
    const skip = ['id', 'type', 'name', 'aliases', 'status', 'relationships', 'excerpt', 'content', 'description', 'seo', 'version', 'generatedBy', 'createdAt', 'updatedAt'];
    const attrs: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!skip.includes(key)) {
        attrs[key] = value;
      }
    }
    return attrs;
  }
}
