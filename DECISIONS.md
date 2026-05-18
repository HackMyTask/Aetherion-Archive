# Aetherion Archive — Architecture Decisions

> These decisions form the contract of the project. Change them only with explicit consensus.

---

## 1. JSONL Per Entity Type

**Decision:** Each entity type gets its own JSONL file (`canon/entities/kingdoms.jsonl`, `factions.jsonl`, etc.).

**Why:** Append-only format enables crash-safe writes, independent generation cycles (you can generate 10 spells without touching kingdoms), and streaming reads without loading the full dataset. One file per type keeps a single type's data colocated for type-specific operations.

**Rejected:**
- One file per entity → Too many files at scale (300+ entities)
- Single giant JSONL → Hard to parallelize, any corruption loses everything
- SQLite → Over-engineered for the append-only use case, couples to SQL schema, introduces migration burden
- JSON array file → Rewriting the full array for every append is slow at scale

## 2. Relationships Stored Inside Entities

**Decision:** Each entity's relationships array lists target entity IDs with type and label. No separate relationship index or edge list file.

**Why:** Self-contained entities can be moved, copied, or regenerated independently. The relationship graph is rebuilt dynamically at load time from all entities. This avoids sync issues between an entity and a separate edge file.

**Rejected:**
- Centralized `graph.json` → Every entity write requires updating the graph. Race conditions. Hard to reason about partial writes.
- Adjacency list per entity type → More files, same data duplicated.

## 3. `canon/` Separated from `content/`

**Decision:** Structured JSONL data lives in `canon/`. Rendered markdown articles live in `content/`.

**Why:** The canon is the source of truth (machine-readable, entity-level data). Content is derived output (human-readable, article-level prose). Separating them means you can regenerate all content without touching canon data. It also means an Astro build can read `content/` without knowing about the engine.

**Rejected:**
- Single `articles/` with mixed data → Couples rendering to data. Can't re-render without re-parsing.
- Embedding markdown in JSONL → Bloats the canon, makes streaming reads slower.

## 4. Lore-First Internal Links

**Decision:** Every internal link in generated content originates from a defined relationship between entities. No keyword-matching auto-links.

**Why:** Relationship-defined links are contextually meaningful (war between kingdoms, worship of a god). Keyword-based auto-linking produces spammy, irrelevant links and requires a stopword list. The graph constrains links to entities that are actually related in-world.

**Rejected:** Keyword density auto-linking (used by many SEO content tools). Produces garbage links like "the kingdom of Eldoria ruled by the kingdom of..."

## 5. Warning-Based Validation

**Decision:** The validator produces errors (structural problems: missing required fields, broken relationships, name conflicts) and warnings (missing optional attributes like population for cities, short descriptions). The pipeline can proceed past warnings but blocks on errors. After retry, it can optionally force-proceed.

**Why:** AI generation is non-deterministic. Blocking on every missing optional field would require infinite retries. The system should prefer velocity over perfection — generate first, fix gaps on subsequent passes.

**Rejected:** Strict validation that requires 100% completeness. Results in never-ending retry loops.

## 6. Four Entity Lifecycle States

**Decision:** Entities have 4 states: `active` (canon), `deprecated` (superseded but preserved), `rewritten` (replaced by a newer version), `archived` (removed from active graph).

**Why:** Entities accumulate drift as the universe grows. Deprecation preserves history for rollback. Archived entities are excluded from the graph but remain in the JSONL file.

**Rejected:** 
- Hard delete → Loses history, no ability to audit changes
- Version-only → Doesn't express whether an old version is still valid or not

## 7. No Database Runtime

**Decision:** Zero database dependencies. Everything is file-based (JSONL + JSON).

**Why:** Static-first deployment. No PostgreSQL, no MySQL, no SQLite runtime. The entire canon can be committed to git, deployed as static files, and read by Astro at build time. Removes an entire class of operational concerns (migrations, backups, connection pooling).

**Rejected:** 
- SQLite → File-based but introduces SQL coupling and migration burden
- PostgreSQL → Operational overhead contradicts static-first goal

## 8. TypeScript Only — No SDK Dependencies

**Decision:** AI providers use native `fetch()` (Node 18+ built-in). No OpenAI SDK, no Google AI SDK.

**Why:** Each SDK adds 3-10 dependencies and its own error handling patterns. The actual API calls are simple HTTP POSTs with JSON bodies. Native `fetch` is available in Node 20+ (our target). This keeps `node_modules` minimal and deprecation-proof.

**Rejected:** OpenAI SDK, Google AI SDK, Anthropic SDK. All add transitive dependencies for trivial HTTP wrappers.

## 9. `tsx` as Runner (Not `ts-node`)

**Decision:** Scripts run via `npx tsx` (esbuild-based TypeScript runner).

**Why:** `tsx` avoids tsconfig resolution issues with ESM, is faster than `ts-node`, and Just Works with `"type": "module"` without additional configuration.

**Rejected:** `ts-node` with `esm` loader. Required extensive configuration for ESM support.

## 10. Entity Generation Via Structured Prompt

**Decision:** Each entity type has a hand-written prompt template with role, creation guidelines, attribute focus, relationship hints, and a JSON example. The AI generates raw JSON which the pipeline validates.

**Why:** Hand-written prompts give precise control over output shape per entity type. JSON generation avoids the complexity of structured output parsing or function calling. The validator catches malformed output.

**Rejected:**
- Function calling / tool use → Locked to OpenAI-compatible providers. Doesn't work with Groq/Llama or basic Gemini.
- Markdown generation → AI markdown is inconsistent. JSON is parseable and can be rendered deterministically.

## 11. Fallback, Not Parallel Execution

**Decision:** `FallbackChain` tries providers in priority order sequentially, not in parallel.

**Why:** Parallel execution would burn tokens on every provider simultaneously when only one result is needed. Sequential fallback costs at most one provider's tokens per generation.

**Rejected:** Race-all-providers pattern. Expensive and wasteful for token-budgeted generation.

## 12. `generateBatchFromPlan()` Uses Gap-Filling

**Decision:** The batch generator reads the generation plan's target counts, computes gaps (target - current), and generates only enough entities to close the gap (adjusted by `gapMultiplier`).

**Why:** Prevents over-generating one entity type while neglecting others. The generation plan acts as a distribution budget.

**Rejected:** Generating a fixed number per type. Results in unbalanced entity counts as types grow at different rates.

---

## Anti-Patterns to Avoid

1. **`any` types** — The codebase currently uses `as any` in provider response parsing. This is acceptable only there because the AI response shape is unpredictable. Everywhere else, use `unknown` and narrow.

2. **Importing from `src/index.ts` internally** — Barrel files can cause circular imports. Import directly from the source file.

3. **Mutating entities after append** — Once written to the JSONL, an entity is immutable. Write a new version with `status: 'rewritten'` instead.

4. **Hardcoded paths** — All canon paths go through `CanonReader`/`CanonWriter` or `scripts/helpers.ts`. Never construct paths manually.

5. **Mixed sync/async FS** — prefer async (promises) everywhere. Only use `existsSync` in initialization code.

6. **Tightly coupling engine to frontend** — The engine (`src/`) must never import from `src-astro/` or any frontend code. The frontend reads `content/` and `canon/` at build time.
