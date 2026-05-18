# AETHERION ARCHIVE — Content Generation Pipeline

## 1. PIPELINE OVERVIEW

```
┌────────────┐
│  SELECTOR  │  ← generation-plan.json (weights + focus)
└─────┬──────┘
      │ { type: "kingdom", name: "Frostveil", focus: "Echoes of the North" }
      ▼
┌──────────────────┐
│ CONTEXT ASSEMBLER│  ← world-core, world-memory, neighbors, rules, prompts
└─────┬────────────┘
      │ { systemPrompt, userPrompt, contextEntities[] }
      ▼
┌──────────────────┐
│ AI FALLBACK CHAIN│  ← openai → groq → gemini → openrouter
└─────┬────────────┘
      │ AIResponse { content, provider, model, tokens }
      ▼
┌──────────────────┐
│ POST-PROCESSOR   │  ← parse, resolve refs, normalize names
└─────┬────────────┘
      │ PartialEntity { id, name, attributes, relationships[], excerpt, content }
      ▼
┌──────────────────┐
│   VALIDATOR      │  ← canon checks, warnings-only
└─────┬────────────┘
      │ ValidationReport { warnings[], passed: boolean }
      ▼
┌──────────────────┐
│   COMMITTER      │  ← write JSONL → write markdown → update memory → update registry → update weights
└─────┬────────────┘
      │ Done
```

---

## 2. STAGE 1 — SELECTOR

### Purpose
Determine what entity to generate next, based on distribution balance and thematic focus.

### Input
- `canon/generation-plan.json`

### Algorithm

```typescript
function selectNextEntity(plan: GenerationPlan): GenerateTask {
  // 1. Check batch queue first (manual pre-planned entities)
  if (plan.currentFocus.remainingBatch.length > 0) {
    return plan.currentFocus.remainingBatch.shift()!;
  }
  
  // 2. Compute scores for each type
  const scores = Object.entries(plan.distribution).map(([type, data]) => {
    const gap = Math.max(0, data.target - data.current);
    let score = gap * data.weight * plan.gapMultiplier;
    
    // Focus bonus
    if (plan.currentFocus?.entityTypes?.includes(type)) {
      score *= 2.5;
    }
    
    return { type: type as EntityType, score };
  });
  
  // 3. Weighted random selection
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  if (totalScore === 0) return null; // All targets met
  
  let random = Math.random() * totalScore;
  for (const entry of scores) {
    random -= entry.score;
    if (random <= 0) return { type: entry.type, count: 1 };
  }
  
  return scores[scores.length - 1];
}
```

### Output
```typescript
interface GenerateTask {
  type: EntityType;
  count: number;
  name?: string;       // Pre-defined name or generate
  requiredRelationships?: string[];  // Must-link entities
}
```

---

## 3. STAGE 2 — CONTEXT ASSEMBLER

### Purpose
Build the AI prompt context from canon. The goal is to give the AI **everything it needs and nothing it doesn't**.

### Context Sources

```
CONTEXT PACKAGE
├── world-core.json           → system prompt (identity, cosmic laws)
├── lore-rules.md             → system prompt (hard constraints)
├── anti-slop-rules.md        → system prompt (forbidden patterns)
├── tone-guide.md             → system prompt (writing style)
├── prompts/{type}.md         → user prompt structure template
├── world-memory latest       → user prompt (current state, ~15 lines)
├── neighbor entities (1-hop) → user prompt (must-link targets, max 10)
├── naming-registry           → user prompt (collision prevention)
└── generation-plan.focus    → user prompt (thematic guidance)
```

### Neighbor Selection

When generating a new kingdom, which entities does the AI need to know about?

```typescript
function getNeighborContext(type: EntityType, name: string, graph: EntityGraph): ContextEntity[] {
  // 1. Get the currentFocus region entities
  const focusEntities = getFocusRegionEntities(graph, plan.currentFocus.region);
  
  // 2. Get entities that WOULD logically connect to this type
  const logicalNeighbors = getLogicalConnections(type, focusEntities);
  // e.g., new kingdom → needs: existing kingdoms (borders), gods (worship), factions (presence)
  
  // 3. Select top 10 by relationship potential + pillar weight
  return logicalNeighbors
    .sort((a, b) => b.seo.pillarWeight - a.seo.pillarWeight)
    .slice(0, 10);
}
```

### Prompt Template (kingdom example)

```
# System Prompt

You are a worldbuilder writing for AETHERION ARCHIVE, a dark fantasy universe.

## Core Premise
The Celestial Fracture shattered the moon. Fragments fell to the world,
becoming the source of all magic. Every spell cast erodes the caster's soul.

## World Rules
{lore-rules.md condensed}

## Anti-Slop Rules
{anti-slop-rules.md condensed}

## Tone Guide
{tone-guide.md condensed}

# User Prompt

## Current World State
{world-memory.json latest snapshot - 15 lines max}

## Existing Canon (Neighbors)
You must connect this entity to the following existing entities:

{list of 3-10 entities with their excerpts and relationship expectations}

Example:
- "City of Eldor" (city) — This kingdom should contain Eldor as its capital
- "Nyxara the Shattered" (god) — This kingdom should worship Nyxara
- "Order of the Celestial Blade" (faction) — This kingdom should host this faction

## Naming Rules
{entity-type naming patterns}
Do NOT use these existing names: {list of similar used names}

## Generation Focus
{currentFocus description — e.g., "This entity is part of the 'Echoes of the North' 
campaign. It should have a cold, isolated, survivalist tone."}

---

Generate a new {type} named {name}.

Output valid JSON with:
- name, aliases, excerpt, content, attributes, relationships, seo

The "content" field should be structured markdown with sections.
The "relationships" array must include links to the required entities above.
```

---

## 4. STAGE 3 — AI GENERATION

### Provider Call

```typescript
async function generate(prompt: ContextPackage, task: GenerateTask): Promise<AIResponse | null> {
  const chain = new FallbackChain(config.providers);
  
  const request: AIRequest = {
    systemPrompt: prompt.systemPrompt,
    userPrompt: prompt.userPrompt,
    temperature: 0.7,          // Balance creativity vs coherence
    maxTokens: 4000,           // Long enough for detailed content
  };
  
  try {
    return await chain.execute(request);
  } catch (e) {
    console.error(`All providers failed for ${task.type} "${task.name}":`, e);
    return null;
  }
}
```

### Fallback Chain Behavior

| Position | Provider | Timeout | Retry |
|---|---|---|---|
| 1 | OpenAI (gpt-4o-mini) | 30s | 1 immediate retry |
| 2 | Groq (llama-3.3-70b) | 30s | 1 immediate retry |
| 3 | Gemini (gemini-2.0-flash) | 30s | 1 immediate retry |
| 4 | OpenRouter (routed) | 45s | No retry |

If all 4 fail → entity is skipped, logged, and batch continues.

---

## 5. STAGE 4 — POST-PROCESSOR

### Purpose
Convert raw AI output into a structured, consistent entity.

### Steps

```typescript
function postProcess(raw: string, task: GenerateTask): PartialEntity {
  // Step 1: Parse JSON from AI response
  // AI may wrap in ```json ... ``` or return raw JSON
  const parsed = parseAIOutput(raw);
  
  // Step 2: Generate ID from name
  const id = slugify(parsed.name);
  
  // Step 3: Validate and normalize relationships
  const relationships = parsed.relationships
    .filter(r => canon.entityExists(r.targetId))  // Remove invalid targets
    .map(r => ({
      ...r,
      targetId: canon.resolveAlias(r.targetId),    // Normalize to canonical ID
      bidirectional: true,                          // Enforce bidirectional
    }));
  
  // Step 4: Resolve entity references in content
  // Replace {{EntityName}} or [EntityName] with internal links
  let content = parsed.content;
  for (const rel of relationships) {
    const targetEntity = canon.getEntity(rel.targetId);
    if (targetEntity) {
      content = content.replace(
        new RegExp(`{{\\s*${targetEntity.name}\\s*}}`, 'g'),
        `[${targetEntity.name}](/rel.targetId)`
      );
    }
  }
  
  // Step 5: Normalize names against naming registry
  // Check for accidental rename of existing entities
  content = normalizeEntityNames(content, canon.namingRegistry);
  
  // Step 6: Structure SEO data
  const seo = generateSEO(task.type, parsed, relationships);
  
  return {
    id,
    type: task.type,
    name: parsed.name,
    aliases: parsed.aliases || [],
    status: 'active',
    relationships,
    excerpt: parsed.excerpt,
    attributes: parsed.attributes || {},
    content,
    seo,
    version: 1,
    generatedBy: `ai-${response.provider}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
```

---

## 6. STAGE 5 — VALIDATOR

### Purpose
Check the generated entity for issues. **Warning-based** — only structural errors block commitment.

| Check | Type | Action |
|---|---|---|
| Missing required field | ERROR | Block commit |
| Invalid JSON | ERROR | Block commit |
| name collision (exact) | ERROR | Block commit |
| name collision (fuzzy) | WARN | Allow with alias addition |
| Relationship target missing | WARN | Remove invalid edge |
| Content < 50 chars | WARN | Allow (will be flagged for review) |
| No relationships | WARN | Allow (linker will try to add) |
| Anti-slop pattern detected | WARN | Log pattern match, allow |
| Timeline inconsistency | WARN | Allow, flag for human review |
| No internal links in content | INFO | Allow (linker pass handles this) |

```typescript
interface ValidationReport {
  passed: boolean;              // false only if ERROR exists
  errors: string[];
  warnings: string[];
  info: string[];
  antiSlopMatches: string[];    // Which anti-slop patterns fired
}
```

---

## 7. STAGE 6 — COMMITTER

### Purpose
Write the generated entity to all storage locations.

### Commit Sequence

```typescript
async function commit(entity: Entity): Promise<void> {
  // 1. Append to entities JSONL
  await appendToJSONL(`canon/entities/${entity.type}.jsonl`, entity);
  
  // 2. Generate markdown content
  const markdown = renderer.toMarkdown(entity);
  await writeFile(`content/${entity.type}s/${entity.id}.md`, markdown);
  
  // 3. Update naming registry
  namingRegistry.addName(entity.name, entity.id, entity.type);
  namingRegistry.addSlug(entity.id, entity.name, entity.type);
  
  // 4. Update world memory
  const newState = computeNewWorldState(entity, canon.getLatestMemory());
  await appendToJSONL('canon/memory/journal.jsonl', newState);
  await writeJSON('canon/memory/index.json', { latest: newState, updatedAt: new Date() });
  
  // 5. If event, append to timeline
  if (entity.type === 'event') {
    await appendToJSONL('canon/timeline.jsonl', {
      id: entity.id,
      type: 'event',
      date: entity.attributes.date,
      title: entity.name,
      summary: entity.excerpt,
      significance: entity.attributes.significance,
      relatedEntities: entity.relationships.map(r => r.targetId),
    });
  }
  
  // 6. Update generation plan weights
  plan.distribution[entity.type].current += 1;
  await writeJSON('canon/generation-plan.json', plan);
}
```

---

## 8. MARKDOWN RENDERER

### Entity → Markdown Conversion

```markdown
---
title: "Kingdom of Eldoria"
type: kingdom
id: kingdom-of-eldoria
---

# Kingdom of Eldoria

{excerpt}

## Overview

{content - structured AI-generated prose}

## Attributes

| Attribute | Value |
|---|---|
| Capital | City of Eldor |
| Government | Constitutional monarchy |
| Ruler | Queen Seraphine Vex |
| ... | ... |

## Relationships

{relationship links rendered as markdown list}

- **Capital**: [City of Eldor](/cities/city-of-eldor)
- **Primary Deity**: [Nyxara the Shattered](/gods/nyxara-the-shattered)
- **Hosts**: [Order of the Celestial Blade](/factions/order-of-the-celestial-blade)

## Related Entities

{2-hop neighbors from graph traversal}
```

---

## 9. LINKER (Separate Maintenance Pass)

### Purpose
Refresh internal links across all content. Runs as a separate weekly pass, not in the generation pipeline.

### Algorithm

```typescript
function refreshLinks(canon: Canon): void {
  const graph = canon.buildGraph();  // Dynamic from all relationship arrays
  
  for (const entity of canon.getAllEntities()) {
    // 1. Read existing content markdown
    const md = readContent(entity);
    
    // 2. Get relationship links
    const relationshipSection = entity.relationships
      .map(rel => {
        const target = canon.getEntity(rel.targetId);
        return `- **${rel.label}**: [${target.name}](/${target.type}/${target.id})`;
      })
      .join('\n');
    
    // 3. Get 2-hop neighbors (entities related to my related entities)
    const twoHop = graph.getTwoHopNeighbors(entity.id)
      .filter(n => !entity.relationships.some(r => r.targetId === n.id))
      .slice(0, 5);  // Max 5 distant connections
    
    const distantSection = twoHop.length > 0
      ? `## Distant Connections\n\n${twoHop.map(n => `- [${n.name}](/${n.type}/${n.id})`).join('\n')}`
      : '';
    
    // 4. Rebuild content with updated links
    const newContent = rebuildMarkdown(md, relationshipSection, distantSection);
    writeContent(entity, newContent);
  }
}
```

---

## 10. BATCH GENERATION

### `generate-batch.ts` Workflow

```
1. Read generation-plan.json
2. Read world-memory (latest state)
3. Read all existing entities

For N iterations:
  4. Select next entity type (weighted)
  5. Assemble context (neighbors, rules, memory)
  6. Call AI with fallback chain
  7. Post-process AI output
  8. Validate against canon
  9. If validation errors → skip (log reason)
  10. If validation warnings → commit with warnings logged
  11. Commit entity (JSONL + markdown + memory + registry + weights)

12. Print summary:
    - Generated: 12
    - Skipped: 2 (naming collision, malformed)
    - Warnings: 3 (missing relationship targets)
    - New total: 312 entities
```
