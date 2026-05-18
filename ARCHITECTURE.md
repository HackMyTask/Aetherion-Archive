# AETHERION ARCHIVE — System Architecture

## 1. ARCHITECTURE OVERVIEW

Aetherion Archive is a **5-layer synthetic universe engine**:

```
┌─────────────────────────────────────────────────────┐
│                LAYER 5: STATIC SITE                  │
│              Astro + TailwindCSS + CF Pages           │
├─────────────────────────────────────────────────────┤
│                LAYER 4: SEO ENGINE                    │
│     Clustering · Schema.org · Sitemap · Links         │
├─────────────────────────────────────────────────────┤
│                LAYER 3: GENERATION PIPELINE           │
│   Context Assembly → AI → Post-Process → Validate    │
├─────────────────────────────────────────────────────┤
│                LAYER 2: AI ABSTRACTION                │
│   Provider Interface · OpenAI · Gemini · Groq · OR   │
├─────────────────────────────────────────────────────┤
│                LAYER 1: CANON (THE TRUTH)             │
│   World Core · Memory · Entities · Timeline · Rules  │
└─────────────────────────────────────────────────────┘
```

### Data flows DOWN, content flows UP

- Layer 1 (canon) is the **single source of truth**. Nothing is generated without consulting it.
- Layer 2 (AI) is **pluggable**. Swap providers without changing a single line of pipeline code.
- Layer 3 (pipeline) is the **generation factory** — it reads canon, generates, validates, writes.
- Layer 4 (SEO) is **derivative** — it reads canon and generates metadata, never the reverse.
- Layer 5 (static site) is **output** — it consumes canon + content + SEO metadata and renders pages.

---

## 2. CANON LAYER (LAYER 1)

### 2.1 Store Architecture

```
canon/
├── world-core.json           # Immutable: universe identity, cosmic laws
├── memory/
│   ├── journal.jsonl         # Append-only world state snapshots
│   └── index.json            # Quick reference to latest state
├── generation-plan.json      # Distribution weights + current focus
├── naming-registry.json      # All used names (collision prevention)
├── entities/                 # Per-type JSONL files
│   ├── kingdoms.jsonl
│   ├── factions.jsonl
│   ├── races.jsonl
│   ├── gods.jsonl
│   ├── artifacts.jsonl
│   ├── spells.jsonl
│   ├── events.jsonl
│   ├── monsters.jsonl
│   ├── cities.jsonl
│   └── religions.jsonl
├── timeline.jsonl            # All chronological events
└── rules/
    ├── lore-rules.md
    ├── anti-slop-rules.md
    ├── tone-guide.md
    └── prompts/              # Per-type generation prompt templates
```

### 2.2 Design Principles

| Principle | Why |
|---|---|
| **JSONL over JSON-per-file** | Append efficiency, streaming reads, clean git diffs |
| **Decoupled rules from code** | Non-developers can edit lore rules without touching TypeScript |
| **All relationships in entities** | No secondary edge list to maintain; graph is dynamically built |
| **Memory is append-only** | Full history preserved; rollback = replay from previous line |
| **Content split from structure** | `canon/` = queryable data, `content/` = rendered prose |

### 2.3 Read Pattern

```typescript
const canon = new CanonReader('./canon');
const entities = canon.getAllEntities();           // All 10 JSONL files merged
const kingdoms = canon.getEntitiesByType('kingdom');  // Single type
const entity = canon.getEntity('kingdom-of-eldoria');  // By slug
const graph = canon.buildGraph();                 // Dynamic graph from all relationships
const state = canon.getLatestMemory();            // Last line of journal.jsonl
```

Graph is **never stored as a file**. It is constructed at load time by iterating entity relationship arrays. For 300 entities this takes < 50ms.

---

## 3. AI ABSTRACTION LAYER (LAYER 2)

### 3.1 Provider Interface

```typescript
interface AIProvider {
  readonly id: string;           // "openai", "gemini", "groq"
  readonly name: string;         // Display name
  generate(request: AIRequest): Promise<AIResponse>;
  isAvailable(): boolean;        // API key configured + healthy
  supportsStreaming(): boolean;  // For future use
}

interface AIRequest {
  prompt: string;
  systemPrompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'error';
}
```

### 3.2 Provider Implementations

| Provider | Class | Default Model | Key Config |
|---|---|---|---|
| OpenAI | `OpenAIProvider` | gpt-4o-mini | `OPENAI_API_KEY` |
| Gemini | `GeminiProvider` | gemini-2.0-flash | `GEMINI_API_KEY` |
| Groq | `GroqProvider` | llama-3.3-70b | `GROQ_API_KEY` |
| OpenRouter | `OpenRouterProvider` | (routed) | `OPENROUTER_API_KEY` |
| OpenAI-Compatible | `OpenAICompatibleProvider` | (configurable) | Custom base URL + key |

### 3.3 Fallback Chain

```typescript
const chain = new FallbackChain([
  { provider: new OpenAIProvider(key), priority: 1 },
  { provider: new GroqProvider(key), priority: 2 },
  { provider: new GeminiProvider(key), priority: 3 },
]);

const result = await chain.execute(request);
// Tries providers in priority order.
// On failure: logs warning, tries next.
// On all fail: returns null, pipeline aborts entity.
```

---

## 4. GENERATION PIPELINE (LAYER 3)

### 4.1 Pipeline Stages

```
Stage 1: SELECTOR
  Purpose: Pick what to generate next
  Input: generation-plan.json (weights + focus)
  Output: { type: "kingdom", count: 1 }

Stage 2: CONTEXT ASSEMBLER
  Purpose: Build the prompt context from canon
  Input: entity type, world memory, rules, neighbor entities
  Output: Assembled prompt + system prompt

Stage 3: GENERATOR
  Purpose: Call AI provider to generate entity content
  Input: prompts
  Output: Raw AI response text

Stage 4: POST-PROCESSOR
  Purpose: Clean and structure the AI output
  Actions:
    - Parse structured fields from AI output
    - Resolve {{entity}} references
    - Normalize names against naming registry
    - Extract implicit relationships
  Output: Structured Entity object

Stage 5: VALIDATOR
  Purpose: Check generated entity against canon
  Checks (warning-based, non-blocking):
    - Name collision check
    - Relationship target validity
    - Timeline consistency
    - Required field completeness
    - Anti-slop pattern detection
  Output: ValidationReport { warnings[], errors[] }

Stage 6: COMMITTER
  Purpose: Write to canon + content
  Actions:
    - Append entity to entities/{type}.jsonl
    - Generate content/{type}/{slug}.md
    - Update naming-registry.json
    - Append new world memory snapshot
    - Update generation-plan weights
  Output: Write results

Stage 7: LINKER (separate pass, non-pipeline)
  Purpose: Refresh internal links across all content
  Actions:
    - Read all entities
    - For each: read relationships → generate link markdown
    - Write/update content markdown with link sections
```

### 4.2 Context Assembly Strategy

The prompt context is **tightly scoped** to prevent AI confusion:

```
SYSTEM PROMPT:
  [world-core rules]
  [anti-slop-rules]
  [tone-guide]

USER PROMPT:
  Generate a new {type} for Aetherion Archive.

  CURRENT WORLD STATE:
  [world-memory latest snapshot - condensed to 15 lines]

  EXISTING CANON (neighbors only):
  [entities within 1-2 hops of proposed entity]
  [max 10 entities, summarized]

  REQUIRED RELATIONSHIPS:
  [must link to: {list of specific existing entities}]

  NAMING RULES:
  [naming patterns for this entity type]
  [used names that must not be duplicated]

  Generate a {type} named {name} with:
  - Relationships to the required entities above
  - Unique lore that doesn't contradict existing canon
  - Anti-slop compliance (no generic fantasy tropes)
```

### 4.3 Weighted Type Selection

```typescript
function pickNextEntityType(plan: GenerationPlan): EntityType {
  const scores = Object.entries(plan.distribution).map(([type, data]) => {
    const gap = data.target - data.current;
    const score = Math.max(0, gap) * data.weight;
    return { type, score };
  });
  
  // Apply focus multiplier if active
  if (plan.currentFocus) {
    scores.forEach(s => {
      if (plan.currentFocus.entityTypes.includes(s.type)) {
        s.score *= 2.5; // Focus types get 2.5x priority
      }
    });
  }
  
  return weightedRandom(scores);
}
```

---

## 5. SEO ENGINE (LAYER 4)

### 5.1 Topical Clustering

Three pillar clusters derived from entity types:

| Cluster | Pillar Type | Cluster Types | SEO Strategy |
|---|---|---|---|
| World & Power | kingdoms | cities, factions, events | Geographic + political keywords |
| Divine & Magic | gods | religions, artifacts, spells | Mystical + power keywords |
| Beings & Conflict | races | monsters, events | Creature + conflict keywords |

### 5.2 Schema.org Mapping

| Entity Type | Schema.org Type |
|---|---|
| kingdom | `AdministrativeArea` |
| faction | `Organization` |
| race | `Thing` |
| god | `Person` + `ReligiousLeadership` |
| artifact | `Product` + `CreativeWork` |
| spell | `CreativeWork` |
| event | `Event` |
| monster | `Thing` + `BioChemEntity` |
| city | `City` |
| religion | `Organization` |

### 5.3 Internal Linking Rules

```
1. All links originate from entity relationship arrays
2. No keyword-based auto-linking
3. Every entity page MUST render ≥ 5 relationship links
4. Links must be bidirectional (enforced by entity graph)
5. Link text = relationship label, not keyword
6. "Related entities" section = 2-hop neighbors from graph traversal
7. Breadcrumbs: Entity Type > Entity Name
```

---

## 6. STATIC SITE (LAYER 5)

### 6.1 Page Types

| Route | Template | Content Source |
|---|---|---|
| `/` | index.astro | world-core + featured entities |
| `/[type]` | listing.astro | All entities of that type |
| `/[type]/[slug]` | entity.astro | Single entity + relationships |
| `/timeline` | timeline.astro | timeline.jsonl |
| `/sitemap.xml` | sitemap.xml.ts | All entities, split by type |

### 6.2 Build Pipeline

```
Astro build:
  1. Load all canon (entities + timeline + rules)
  2. Build entity graph from relationship arrays
  3. Generate all entity pages from canon data
  4. Compute internal links for each page
  5. Inject Schema.org JSON-LD for each page
  6. Generate listing pages for each type
  7. Generate timeline page
  8. Generate sitemap (split by type)
  9. Output static HTML/CSS to /dist
  10. Deploy dist/ to Cloudflare Pages
```

### 6.3 Performance Target

| Metric | Target |
|---|---|
| Build time (300 entities) | < 2 minutes |
| Page weight | < 50KB HTML |
| Total assets | < 5MB (no JS bundles) |
| Deploy time | < 1 minute |

---

## 7. DATA FLOW DIAGRAM

```
                         ┌──────────────┐
                         │  World Core   │
                         │  + Rules      │
                         └──────┬───────┘
                                │
                    ┌───────────▼───────────┐
                    │   Naming Registry     │
                    │  (collision check)    │
                    └───────────┬───────────┘
                                │
         ┌──────────────────────▼──────────────────────┐
         │           GENERATION PIPELINE                │
         │                                              │
         │  Selector → Context Assembler → AI →         │
         │  Post-Processor → Validator → Committer      │
         └──────────────────────┬──────────────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
        ┌──────────┐    ┌──────────────┐   ┌──────────────┐
        │ entities │    │   content/   │   │  world-memory│
        │ .jsonl   │    │   {slug}.md  │   │  journal     │
        └──────────┘    └──────┬───────┘   └──────────────┘
                               │
              ┌────────────────▼────────────────┐
              │         ASTRO BUILD             │
              │  Read canon → Generate pages →  │
              │  Inject SEO → Sitemap → /dist   │
              └────────────────┬────────────────┘
                               │
              ┌────────────────▼────────────────┐
              │     CLOUDFLARE PAGES DEPLOY      │
              │         Static HTML/CSS          │
              │        Global CDN Cache          │
              └─────────────────────────────────┘
```

---

## 8. ERROR HANDLING

| Failure | Behavior |
|---|---|
| AI provider rate-limited | Fallback to next provider in chain |
| All providers fail | Skip entity, log error, continue batch |
| Validation warning | Log warning, still commit entity |
| Naming collision | Auto-rename with suffix, log warning |
| Relationship target missing | Remove invalid edge, log warning |
| AI returns malformed JSON | Retry once, then skip |
| Canon file corrupted | Git revert, alert operator |

---

## 9. SECURITY

- API keys loaded from environment variables only
- `.env` never committed (in `.gitignore`)
- Naming registry prevents duplicate key creation
- World memory journal is immutable (append-only)
- No user input processed in the pipeline
- All generated content reviewed via PR before production deploy
