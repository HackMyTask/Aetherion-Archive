# Project State

## Phase: 1C — Sandbox Canon Generation (IN PROGRESS)
## Version: 0.1.x
## Status: 10 entities generated, 64 relationships, all engines operational

### What exists
- Full generation pipeline (context → AI → parse → validate → retry → register → JSONL append → markdown → memory snapshot)
- 10 entity types, JSONL per type in canon/
- 4 AI providers with fallback chain
- Atomic JSONL writes (.tmp → rename)
- Rate limiter (BATCH_DELAY_MS, default 2000ms)
- Dead letter queue (canon/failed.jsonl, retry-failed CLI)
- Session cost tracker (canon/session-stats.jsonl)
- Memory compaction (compact-memory CLI)
- Test suite: 9 files, 90 tests (vitest)
- TypeScript: 0 errors (`tsc --noEmit`)

### Canon entities (10 total)
- **Gods (3)**: vel-thara-the-unmade, mourne-the-hollow-king, yssara-of-the-shattered-moon
- **Kingdoms (3)**: valdenmoor-the-ashen-crown, greyvast-the-sunken-throne, the-pale-dominion
- **Factions (4)**: the-oathbound-remnants, the-tide-weavers, the-cult-of-the-broken-moon, ~~the-ivory-vigil~~ (DELETED)
- **Events (1)**: the-celestial-fracture

### Relationships
- 64 total, 0 orphans, 0 bidirectional gaps
- 13 placeholder errors (all expected — future layers)

### CLI commands
- `npm run init:world` — bootstrap canon structure
- `npm run generate:one [type] [name]` — single entity
- `npm run generate:batch` — gap-filling batch gen
- `npm run validate:canon` — validate all entities
- `npm run retry:failed` — retry dead letter queue
- `npm run session:stats` — cost/token summary
- `npm run compact:memory` — journal compaction

### What does NOT exist yet
- No Astro frontend
- No search, no embeddings, no graph visualization
- No GitHub Actions
- No deployment
