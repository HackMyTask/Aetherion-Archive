# Aetherion Archive — Next Steps

> Recommended implementation order. Each step depends on the previous one.

---

## Phase 1B — Production Hardening (Priority: HIGH)

### 1. Test Suite
- Install vitest: `npm install -D vitest`
- Create `tests/` directory matching `src/` structure
- Priority tests:
  - `naming-registry.test.ts` — fuzzyMatch, checkNameAvailable, registerName
  - `entity-graph.test.ts` — buildGraph, getNeighbors, getBidirectionalGaps
  - `jsonl.test.ts` — read/write/append round-trip
  - `validator.test.ts` — structural errors, relationship errors, name conflicts
  - `pipeline.test.ts` — parseEntity, extractAttributes
  - `fallback-chain.test.ts` — priority ordering, failure propagation
- Add `"test": "vitest run"` script

### 2. CI Pipeline
- Create `.github/workflows/ci.yml`
- Steps: checkout → node setup → npm install → typecheck → test
- Do NOT add deployment or release automation yet

### 3. Rate Limiter
- Simple token-bucket or sliding-window per provider
- Configurable RPM (requests per minute)
- Store state in a JSON file (not a database)
- Wire into `FallbackChain` before the provider call
- Should NOT block — should skip and try next provider if rate limited

### 4. Token Budget / Cost Tracker
- Read-only tracker: load all entities, sum tokens by provider
- Optional budget config: `max_tokens_per_session` per provider
- Log warning when approaching budget
- Store budget config in `canon/budget.json`

### 5. Dead Letter Queue
- After all providers fail in `FallbackChain`, write a failed generation job to `canon/dead-letter.jsonl`
- Include: timestamp, entity type, prompt excerpt, last error, provider attempts
- Add `scripts/retry-dead.ts` command
- Optional: expose via `Pipeline.retryDeadLetter()`

### 6. Memory Journal Compaction
- Add `scripts/compact-memory.ts`
- Reads `journal.jsonl`, keeps last N snapshots (configurable, default 50)
- Also keep any snapshot referenced by an active timeline entry
- Rewrites the journal file atomically

---

## Phase 1C — Scale Preparation (Priority: MEDIUM)

### 7. Seed 30–50 Entities
- Run `npm run generate:one` for each type in waves:
  - Wave 1: 2 kingdoms, 3 factions, 2 races, 3 gods, 2 cities
  - Wave 2: 3 events, 3 artifacts, 3 spells, 3 monsters, 2 religions
  - Wave 3: fill gaps, connect relationships
- Validate after each wave with `npm run validate:canon`

### 8. Bulk Rendering
- Add `scripts/render-all.ts` calling `renderAllEntityPages()`
- This should be a no-op if all entities are already rendered (add dirty flag or hash check)

### 9. Bidirectional Gap Auto-Fix
- On generation, detect missing reverse relationships
- Queue fix entities for the next generation pass
- Extract to `scripts/fix-bidirectional-gaps.ts`

---

## Phase 2 — Frontend & Advanced Features (Priority: LOW until 1B/C done)

### 10. Astro Frontend (`src-astro/`)
- Astro project with static output
- Reads `content/` at build time
- Entity detail pages, category indexes, search
- Do NOT create until Phase 1B is complete and canon has 50+ entities

### 11. Visual Workflow Builder
- React Flow DnD canvas
- Backend: `src/modules/workflow-engine/`
- Requires the API endpoints and admin UI

### 12–16. Phase 2 features
- Research Layer, Batch CSV, Internal Links, Content Roast, Analytics
- See `AGENTS.md` section 11 for full details

---

## What NOT to Touch Yet

| Area | Reason |
|---|---|
| `src-astro/` directory | Not created yet. Don't create until Phase 2. |
| React / frontend deps | No `react`, `react-dom`, `next`, `vite`, or `astro` in package.json |
| Database | No SQLite, PostgreSQL, or MySQL. JSONL is the database. |
| Graph visualization | No D3, vis-network, or cytoscape deps |
| Authentication | No auth system. Not needed for CLI. |
| Web server | No Express, Fastify, or HTTP framework |
| Package manager change | Stick with npm. No pnpm or yarn migration. |
| GitHub Pages / deployment | Don't set up until content/ has at least 50 pages |
| Renaming entity types | Don't rename the 10 types. Every file, folder, and prompt references them. |
| Removing deprecated fields | Even unused fields (like `targetId` vs `to` in some contexts) should remain until Phase 2 cleanup. |
