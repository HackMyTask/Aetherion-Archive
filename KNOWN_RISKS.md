# Aetherion Archive — Known Risks

> These are monitored risks, not reasons to stop. Each entry includes the risk, trigger conditions, impact, and a mitigation approach.

---

## 1. Context Window Explosion

**Risk:** As the canon grows to 300+ entities, the `ContextAssembler` system prompt becomes too large for the AI's context window (8K–32K tokens depending on provider).

**Trigger:** ~100+ entities. The prompt includes existing entities, neighbors, timeline entries, and world state.

**Impact:** Token costs increase. Provider may truncate or refuse. Generation quality degrades as prompt becomes diluted.

**Mitigation:**
- Limit neighbor injection to the 5 most connected neighbors (already implemented: `.slice(0, 5)`)
- Summarize entity list by type count instead of listing names
- Prioritize recently generated entities over all entities
- Add a `maxContextTokens` config option per generation type
- Truncate system prompt to a hard limit (e.g., 6000 tokens) before sending

---

## 2. AI Drift / Lore Inconsistency

**Risk:** Over 100+ generation cycles, the AI gradually forgets or contradicts established lore. New entities reference relationships that don't exist. Timelines become inconsistent.

**Trigger:** Every generation is a new AI call. No persisted "lore book" beyond what fits in the system prompt.

**Impact:** Entities contradict each other. Relationships form that don't make sense together. The universe becomes incoherent and requires manual cleanup.

**Mitigation:**
- World memory snapshots preserve state deltas — run `validate-canon` after each batch
- The `validateLoreConsistency` method catches some contradictions
- Future: add a lore consistency pass that runs on the full canon and flags contradictions
- Future: seeded lore book file (`canon/lore-book.md`) that is included in every prompt verbatim
- **Not mitigated:** temporal contradictions (event A happens after event B, but entity references say otherwise)

---

## 3. Graph Explosion (N² Relationship Growth)

**Risk:** With 300 entities and an average of 3 relationships each, the in-memory graph has ~900 edges. But if new entities increasingly reference many existing entities, edge count grows quadratically.

**Trigger:** Entities with 10+ relationships each. Relationship-heavy types like events (which reference all participants).

**Impact:** `buildGraph()` becomes slower. `getNeighbors()` over a large set becomes expensive.

**Mitigation:**
- Graph is built fresh each time (not cached) — this is a design choice for consistency but trades speed
- Graph building is O(E) where E = total edges. At 300 entities × 5 edges = 1500 edges, this is fast
- If performance degrades: cache the graph, invalidate only when canon files change (mtime-based)
- Bidirectional gap detection is O(E²) — only run on demand, not in pipeline

---

## 4. Provider Rate Limiting

**Risk:** Rapid batch generation (generating 20+ entities in a loop) hits API rate limits, especially on free-tier accounts (Groq free tier: 30 req/min, Gemini free: 60 req/min).

**Trigger:** `generateBatch()` or `generateBatchFromPlan()` called without backpressure.

**Impact:** Generation fails mid-batch. Partial state written to canon (some entities done, some not). Manually tracking which succeeded is tedious.

**Mitigation:**
- `Phase 1B` item: Rate limiter per provider with configurable RPM
- Add a `--dry-run` flag to batch generation (computes gaps but doesn't generate)
- Track batch progress in a JSON file (`canon/batch-progress.json`) for resume capability
- Wrap batch generation in a transaction-like pattern: write to a temp directory, then atomic copy

---

## 5. Memory Journal Bloat

**Risk:** Every entity generation creates a memory snapshot. At 300 entities → 300 JSONL entries. Each entry stores the full world state (era, conflicts, counts, etc.).

**Trigger:** Normal operation.

**Impact:** `journal.jsonl` grows to ~1–2MB. `loadLatestMemory()` reads the full journal and takes the last entry. Startup latency increases.

**Mitigation:**
- `memory/index.json` stores the latest snapshot pointer — use this instead of scanning the journal
- Phase 1B: compaction script that keeps last N snapshots
- Consider a separate `memory/checkpoint.json` that gets overwritten periodically

---

## 6. SEO Duplicate Content Risk

**Risk:** As the AI generates entities with similar themes, their rendered markdown pages may contain overlapping content, triggering SEO duplicate content penalties.

**Trigger:** Multiple entities of the same type in the same topical cluster (e.g., 3 neighboring kingdoms with very similar descriptions).

**Impact:** Search engines may index only one of the pages, or penalize the domain for thin/duplicate content.

**Mitigation:**
- The `SEOData` on each entity includes `pillarWeight` and `topicalCluster` — use these to enforce diversity
- `canon/generation-plan.json` distributes entities across types to prevent clustering
- Future: content diversity checker that compares new markdown against existing pages (cosine similarity on TF-IDF)
- Future: pillar-cluster architecture where high-pillar-weight entities get longer, more detailed pages

---

## 7. JSONL Corruption

**Risk:** A failed write (power loss, crash during `appendToJSONL`) produces a partial line at the end of a JSONL file.

**Trigger:** Power outage, process kill, disk full.

**Impact:** Next read of that JSONL file fails on the malformed line. All entities of that type become unreadable.

**Mitigation:**
- JSONL reader (`readJSONL`) currently throws on malformed JSON — it should skip the last line if it's incomplete (add a `recoverLastLine` option)
- Future: write to `.tmp` file then rename (atomic write pattern)
- Future: periodic validation that reads all JSONL files and reports corruption

---

## 8. Provider API Breaking Changes

**Risk:** Any of the 4 AI providers may change their API format, deprecate models, or require new authentication.

**Trigger:** Provider-side updates. No control or notice period.

**Impact:** Generation fails. Fallback chain may mitigate if at least one provider still works.

**Mitigation:**
- Abstraction layer (`BaseProvider`) means each provider change is isolated to one file
- Fallback chain with diverse providers (Gemini, Groq, OpenRouter, OpenAI-compatible) means a single provider outage doesn't block generation
- Test script that pings each provider and reports success/failure: `scripts/test-providers.ts`
- Pin model versions (e.g., `gemini-2.0-flash` not `gemini-latest`)

---

## 9. Cost Escalation Without Visibility

**Risk:** Batch generation costs are invisible until billing arrives. 300 entities at ~1K tokens each = 300K total tokens. At ~$0.15/M tokens (GPT-4o-mini) this is $0.045. But with 4 providers and retries, could vary 10x.

**Trigger:** Running full batch generation without a budget cap.

**Impact:** Surprise costs. Especially if using expensive models (GPT-4o: $2.50/M tokens) or if retry loops trigger extra generations.

**Mitigation:**
- Phase 1B: cost tracker that accumulates token usage across sessions
- Phase 1B: optional budget config per provider (stop generating when budget exhausted)
- Always use cheapest models for routine generation (Gemini flash, Groq Llama)
- Reserve expensive models (GPT-4o, Claude Sonnet) for specific high-value entity types or rewrites
- Token counts are tracked per entity in the response — log a summary after each batch

---

## 10. Single-File Naming Registry Contention

**Risk:** `naming-registry.json` is a single JSON file read/written synchronously. In concurrent generation scenarios, two processes could overwrite each other's registrations.

**Trigger:** Running multiple `generate-one` scripts in parallel.

**Impact:** Lost name registrations leading to duplicate names in the canon.

**Mitigation:**
- Not currently an issue: generation is serial (one entity at a time in the pipeline)
- If parallelism is needed later: use a lock file (`canon/naming-registry.lock`) or switch to JSONL for the registry
- For now: document that parallel generation is not supported

---

## 11. Duplicate JSONL Entries from Bidirectional Gap Fixes

**Risk:** The current canon has 11 duplicate JSONL lines (entities appended multiple times to fix bidirectional relationship gaps). These duplicates inflate the entity count in validation output and could cause duplicate content rendering in Phase 2.

**Trigger:** The bidir gap fix pattern (append updated entity with reverse relationships) creates a new JSONL line for each fix. These accumulate over time.

**Impact:** Validation reports inflated entity counts (34 unique but 45 total entries). Future frontend may render duplicate pages if it doesn't dedup by ID. Graph health metrics become noisy.

**Mitigation:**
- Pre-Phase 2 JSONL compaction pass: read all JSONL files, deduplicate by ID keeping only the latest version of each entity, rewrite files
- Compaction script is straightforward: `readJSONL()` → group by ID → keep last → `writeJSONL()`
- Must run before any Phase 2 frontend work

---

## 12. Placeholder Entities (northern-velkaris, forbidden-moon-rituals, kingdom-of-eldoria)

**Risk:** 21 validation errors all trace to 3 non-existent entities referenced as relationship targets by AI-generated entities. These placeholders were intentionally deferred but they create a persistent noise floor in validation output.

**Trigger:** The AI generated entities with relationship targets like `northern-velkaris` (a region, not an entity type) that were never created as proper entities.

**Impact:** Every validation run produces 20+ error lines, obscuring real issues. The error count (21) has been flat for the entire session, meaning no new errors are detected because the noise floor hides them.

**Mitigation:**
- Option 1: Create proper entities for `northern-velkaris` (type: location/region), `forbidden-moon-rituals` (type: event), `kingdom-of-eldoria` (type: kingdom) — this resolves ~20 errors immediately
- Option 2: Add these to a validation allowlist — entities that are expected to be missing
- Option 3: Ignore until Phase 2 (they are pre-existing and not getting worse)
- Recommended: Option 1 — quick to create, clears the noise floor

---

## Summary of Urgency

| Risk | Urgency | Needs Phase |
|---|---|---|---|
| Context window explosion | Medium | 1C (when canon > 100) |
| AI drift / lore inconsistency | Low | 1C |
| Graph explosion | Very Low | 2 (when canon > 500) |
| Provider rate limiting | Medium | 1B |
| Memory journal bloat | Low | 1B |
| SEO duplicate content | Low | 2 |
| JSONL corruption | Low | 1C |
| Provider API changes | Low | Ongoing |
| Cost escalation | Medium | 1B |
| Naming registry contention | Very Low | 2 |
| Duplicate JSONL entries | High | Pre-Phase 2 |
| Placeholder entities | Medium | Pre-Phase 2 |
