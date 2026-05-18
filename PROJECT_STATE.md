# Aetherion Archive — Project State

## Current Version
0.1.0 — Phase 1A Core Engine (complete)

## Typecheck Status
`tsc --noEmit` → 0 errors, 0 warnings

--- 

## Implemented Systems

### 1. Type System (`src/types/`)
- `Entity` — 10 entity types (kingdom, faction, race, god, artifact, spell, event, monster, city, religion), 4 lifecycle statuses (active/deprecated/rewritten/archived), SEO metadata, relationship array, attributes map
- `Relationship` — targetId, type, label, bidirectional flag
- `RelationshipType` catalog — families (membership/conflict/trade/location etc.) with bidirectional pair mapping
- `AIRequest` / `AIResponse` — standard contract for all providers
- `WorldCore` / `WorldState` / `WorldMemorySnapshot` / `GenerationPlan` / `NamingRegistry` / `TimelineEntry`

### 2. Data Layer (`src/engine/`)
- `jsonl.ts` — Async-generator-based JSONL reader, bulk reader, appender; JSON read/write helpers
- `canon-reader.ts` — Loads entities by type, all entities, by ID, by status; loads world-core, generation-plan, naming-registry, memories, timeline
- `canon-writer.ts` — Appends entity to type-specific JSONL; writes memory snapshots, generation plan, naming registry, world-core, timeline; writes rendered markdown to `content/`
- `naming-registry.ts` — Checks for name conflicts, slug conflicts; fuzzy matching (Levenshtein); name/slug registration; 10 entity type naming patterns

### 3. Entity Graph (`src/engine/entity-graph.ts`)
- Builds in-memory graph from entity array (ignores archived)
- Adjacency list + incoming edge index
- `getNeighbors`, `getTwoHopNeighbors`, `getInboundLinks`, `getOutboundLinks`, `getBidirectionalGaps`
- Bidirectional relationship consistency checker

### 4. AI Layer (`src/ai/`)
- `BaseProvider` — Abstract with shared HTTP POST, timeouts, response parsing
- `GeminiProvider` — Google AI API (key as query param, gemini-2.0-flash default)
- `GroqProvider` — OpenAI-compatible (llama-3.3-70b-versatile default)
- `OpenRouterProvider` — OpenAI-compatible + HTTP-Referer/X-Title headers
- `OpenAICompatibleProvider` — Generic, configurable base URL/model
- `FallbackChain` — Priority-sorted provider chain with full attempt history, retry support (exponential backoff 2^n), cost tracking
- Provider config loader (`scripts/provider-config.ts`) reads from env vars (GEMINI_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY, AI_API_KEY)

### 5. Context & Generation (`src/engine/`)
- `context-assembler.ts` — Builds system prompt from world core, current state, generation strategy, timeline, type-specific rules; loads neighbors for existing entities
- `validator.ts` — Structural, type-specific, relationship, name, slug, lore consistency checks
- `entity-prompts.ts` — 10 type-specific prompt templates with role, creation guidelines, JSON examples
- `pipeline.ts` — Orchestrator: context → AI call → JSON parse → validate → retry → register name/slug → append to canon → render markdown → update memory snapshot → optionally append timeline

### 6. Markdown Rendering (`src/engine/markdown-renderer.ts`)
- Frontmatter (title, type, id, slug, status, relations list)
- Body with linkified description, attributes table, relationships section
- `renderAllEntityPages` bulk renderer

### 7. World Memory (`src/engine/world-memory.ts`)
- Append-only journal (`memory/journal.jsonl`) of world state snapshots
- Tracks era, cosmic state, active conflicts, entity count, last event ID
- `computeNewMemory` computes diff when a new entity is added

### 8. CLI Scripts (`scripts/`)
- `init-world.ts` — Creates canon directory structure, world-core.json, generation-plan.json (130 target entities), naming-registry.json, initial memory snapshot
- `generate-one.ts <type> [name-hint]` — Generate single entity via pipeline
- `generate-batch.ts` — Generate entities from generation plan (gap filling)
- `validate-canon.ts` — Full validation pass: entity validity + bidirectional gaps + type distribution

### 9. Infrastructure
- `package.json` — ESM, tsx runner, TypeScript 5.4, @types/node
- `tsconfig.json` — strict, ES2022, noUncheckedIndexedAccess, noUnusedLocals, noUnusedParameters
- `src/index.ts` — Barrel re-export of all public API
- `.env.example` — All 4 provider key slots documented

---

## Current Working Commands
```
npm run typecheck          # 0 errors
npm run init:world         # Seeds canon directory (dry: no AI needed)
npm run validate:canon     # Full validation pass
npx tsx scripts/generate-one.ts <type>   # AI generation (needs API key)
npm run generate:batch     # Batch from generation plan
```

## Current Limitations

- **No UI** — Phase 1A is engine-only. No React frontend, no Astro output.
- **No server** — No HTTP server, no API endpoints. All operations are CLI.
- **No Astro integration** — `src-astro/` directory exists in plan but is not created.
- **No tests** — No test runner configured. No unit tests, no integration tests.
- **No CI** — No GitHub Actions, no pre-commit hooks.
- **No rate limiting** — All provider calls are unbounded. No queue system.
- **No streaming** — Providers use synchronous HTTP POST. Streaming not implemented.
- **No cost tracking** — Token usage is tracked per-response but not accumulated or budgeted.
- **Single-file memory journal** — `journal.jsonl` grows unbounded. No pruning/compaction.
- **No dead letter queue** — If all providers fail, the error throws. No retry queue.
- **CLI only** — No programmatic API beyond the Pipeline class.
- **Environment-only config** — No settings file or DB for provider config.

---

## What Is NOT Implemented Yet

### Phase 1B (Immediate Next)
- Test suite (vitest or node:test)
- CI pipeline (GitHub Actions: typecheck + test)
- Rate limiter for AI provider calls
- Token budget tracking per provider
- Cost accumulator across generation sessions
- Dead letter queue / failed job persistence
- Memory journal compaction (trim old snapshots)

### Phase 2 (Future)
- Visual Workflow Builder (React Flow DnD)
- Research Layer (SERP, PAA, YouTube transcripts)
- Batch CSV Generation
- Internal Linking Engine
- Content Roast + Humanizer
- Analytics Feedback Loop
- Web UI (Astro frontend)
- search/ page
- graph/ visualization
- export/ tools
