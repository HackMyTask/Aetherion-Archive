# Aetherion Archive — Current Architecture Snapshot

---

## Folder Structure

```
aetherion-archive/
├── package.json              # ESM, tsx runner, dev deps only
├── tsconfig.json             # strict, ES2022, bundler moduleResolution
├── .gitignore
├── .env.example              # 4 provider API key slots
│
├── scripts/                  # CLI entry points (run via `npx tsx` or `npm run`)
│   ├── helpers.ts              # PROJECT_ROOT, CANON_DIR constants
│   ├── provider-config.ts      # Reads env vars → creates provider instances
│   ├── init-world.ts           # Seeds canon/ with world-core, plan, registry, memory
│   ├── generate-one.ts         # Single entity generation
│   ├── generate-batch.ts       # Gap-fill from generation plan
│   └── validate-canon.ts       # Full validation + bidirectional check + summary
│
├── src/
│   ├── index.ts                # Barrel re-export
│   │
│   ├── types/                  # Pure type definitions, no logic
│   │   ├── entity.ts            # Entity, EntityType enum, EntityStatus, Relationship, SEOData
│   │   ├── relationship.ts      # RelationshipType catalog + bidirectional mapping
│   │   ├── ai.ts                # AIRequest, AIResponse, AIProvider interface, ProviderEntry
│   │   └── world.ts             # WorldCore, WorldState, WorldMemorySnapshot, GenerationPlan, etc.
│   │
│   ├── ai/                     # AI provider abstraction
│   │   ├── provider.ts          # BaseProvider (abstract HTTP POST, shared plumbing)
│   │   ├── fallback-chain.ts    # Priority-sorted provider list, sequential fallback, retry
│   │   ├── index.ts             # Re-exports
│   │   └── providers/
│   │       ├── gemini.ts        # GeminiProvider (key as query param)
│   │       └── openai-compatible.ts  # GroqProvider, OpenRouterProvider, OpenAICompatibleProvider
│   │
│   └── engine/                 # Core logic
│       ├── jsonl.ts             # Async JSONL reader/writer, JSON read/write
│       ├── canon-reader.ts      # CanonReader — loads all canon data from files
│       ├── canon-writer.ts      # CanonWriter — writes entities, snapshots, markdown
│       ├── naming-registry.ts   # Name/slug conflict checks, fuzzy matching, registration
│       ├── entity-graph.ts      # In-memory graph builder, neighbor queries, bidir gap detection
│       ├── world-memory.ts      # World state diff computation, snapshot creation
│       ├── context-assembler.ts # System prompt builder for AI generation
│       ├── validator.ts         # Entity validation (structural, relationships, lore consistency)
│       ├── markdown-renderer.ts # Entity → SEO-optimized markdown conversion
│       ├── pipeline.ts          # Generation orchestrator (context → AI → validate → write)
│       └── prompts/
│           └── entity-prompts.ts # 10 type-specific AI prompt templates
│
├── canon/                     # Structured universe data (auto-generated)
│   ├── world-core.json          # Premise, cosmic laws, magic system
│   ├── generation-plan.json     # Entity type distribution targets
│   ├── naming-registry.json     # Used names/slugs + naming conventions
│   ├── entities/                # One JSONL per type
│   │   ├── kingdom.jsonl
│   │   ├── faction.jsonl
│   │   └── ... (10 files)
│   └── memory/
│       ├── index.json           # Latest snapshot pointer
│       └── journal.jsonl        # Append-only state history
│
├── content/                   # Rendered markdown pages (auto-generated)
│   ├── kingdoms/
│   ├── factions/
│   └── ... (one dir per type)
│
├── docs/                      # Architecture documents (created in planning)
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── ENTITY_SYSTEM.md
│   └── ... (7 files)
│
├── PROJECT_STATE.md           # ← This file
├── DECISIONS.md
├── NEXT_STEPS.md
├── KNOWN_RISKS.md
└── AGENTS.md
```

---

## Data Flow

```
.env vars ──→ scripts/provider-config.ts ──→ BaseProvider instances
                                                    │
                         ┌──────────────────────────┘
                         ▼
              FallbackChain.execute(request)          
                         │                           
              (tries in priority order)              
                         │                           
                    AI Response                       
                         │                           
                         ▼                           
              Pipeline.generateOne()                 
                         │                           
    ┌────────────────────┼────────────────────┐
    ▼                    ▼                    ▼
ContextAssembler    parseEntity()        Validator
(loads canon,       (AI JSON → Entity)   (structural,
 builds prompt)                           relationships,
    │                                      names, lore)
    ▼                    │                    │
    │                    ▼                    │
    │              Entity ready? ──no──→ retry with errors
    │                    │yes
    ▼                    ▼
    │           registerName / registerSlug
    │                    │
    │                    ▼
    │           CanonWriter.appendEntity()
    │                    │
    │                    ▼
    │           MarkdownRenderer → canon-writer.writeContent()
    │                    │
    │                    ▼
    │           WorldMemory.computeNewMemory()
    │                    │
    │                    ▼
    │           CanonWriter.writeMemorySnapshot()
    │                    │
    │                    ▼
    │           [if event] TimelineEntry → appendTimeline()
```

---

## Pipeline Flow (Single Generation)

```
1. ContextAssembler.prepare(type)
   → loads world-core, existing entities, latest memory, timeline
   → builds system prompt with lore + current state + generation strategy
   
2. FallbackChain.execute(request)
   → tries each provider in priority order
   → returns first successful response OR null + attempt log
   
3. Pipeline.parseEntity(content)
   → strips markdown fences
   → JSON.parse()
   → constructs Entity object with defaults for missing fields
   
4. Validator.validate(entity, isNew=true)
   → structural checks (required fields, types)
   → type-specific attribute checks (kingdom needs capital, etc.)
   → relationship target existence
   → name/slug uniqueness
   → lore consistency
   
5. On validation error:
   → if first attempt: retry with error feedback in prompt
   → if second attempt: force-proceed with warnings
   
6. Naming registry update
   → checkNameAvailable / checkSlugAvailable
   → registerName / registerSlug
   → persist naming-registry.json
   
7. Canon write
   → append entity to type-specific JSONL (kingdom.jsonl, etc.)
   → renderFullPage → write to content/<type>/<slug>.md
   
8. World memory update
   → computeNewMemory
   → append to memory/journal.jsonl
   → update memory/index.json
   
9. [if type=event] Timeline append
```

---

## AI Provider Flow

```
scripts/provider-config.ts
    reads: GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, AI_API_KEY
    
    creates: GeminiProvider, GroqProvider, OpenRouterProvider, OpenAICompatibleProvider
    
    ↓
    
FallbackChain.setProviders(providers)
    → sorts by priority (1 = highest)
    
    ↓
    
FallbackChain.execute(request)
    for each provider in priority order:
        1. provider.isAvailable() → skip if no API key
        2. provider.generate(request) → HTTP POST
           [BaseProvider.post() handles timeout, status codes, error extraction]
        3. on success → return AIResponse { content, provider, model, tokens, latency }
        4. on failure → log warning, try next provider
        5. if all fail → return null
```

---

## Canon Flow

### Reading
```
CanonReader
  .loadAllEntities() → all 10 JSONL files merged
  .loadEntitiesByType('kingdom') → single JSONL file
  .loadWorldCore() → world-core.json
  .loadGenerationPlan() → generation-plan.json
  .loadNamingRegistry() → naming-registry.json
  .loadLatestMemory() → memory/index.json → memory/journal.jsonl (last entry)
  .loadMemories() → memory/journal.jsonl (all entries)
  .loadTimeline() → timeline.jsonl
```

### Writing
```
CanonWriter
  .appendEntity(entity) → canon/entities/<type>.jsonl (append line)
  .writeMemorySnapshot(snapshot) → memory/journal.jsonl (append) + memory/index.json (overwrite)
  .writeGenerationPlan(plan) → generation-plan.json (overwrite)
  .writeNamingRegistry(registry) → naming-registry.json (overwrite)
  .writeContent(type, slug, markdown) → content/<type>/<slug>.md (overwrite)
```
