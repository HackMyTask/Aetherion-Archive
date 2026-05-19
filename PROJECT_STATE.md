# Project State

## Phase: 3 — CI/CD & Deployment (COMPLETE)
## Phase: 2 — Astro Frontend (COMPLETE)
## Phase 1C — Sandbox Canon Generation (COMPLETE)
## Pre-Phase 2 Cleanup (COMPLETE)
## Version: 0.1.x
## Status: 36 unique entities, 174 relationships, 0 orphans, 0 bidirectional gaps, 1 remaining error (pre-existing). Phase 3 complete — GitHub Actions workflows ready, pending Cloudflare setup.

### What exists
- Full generation pipeline (context → AI → parse → validate → retry → register → JSONL append → markdown → memory snapshot)
- 11 entity types, JSONL per type in canon/
- 4 AI providers with fallback chain
- Atomic JSONL writes (.tmp → rename)
- Rate limiter (BATCH_DELAY_MS, default 2000ms)
- Dead letter queue (canon/failed.jsonl, retry-failed CLI)
- Session cost tracker (canon/session-stats.jsonl)
- Memory compaction (compact-memory CLI)
- Test suite: 9 files, 90 tests (vitest)
- TypeScript: 0 errors (`tsc --noEmit`)
- **Astro frontend: 48 pages, static output, Tailwind v4, dark fantasy theme**

### Canon entities (36 unique, 48 total entries)
- **Gods (3)**: vel-thara-the-unmade, mourne-the-hollow-king, yssara-of-the-shattered-moon
- **Kingdoms (4)**: valdenmoor-the-ashen-crown, greyvast-the-sunken-throne, the-pale-dominion, kingdom-of-eldoria
- **Factions (3)**: the-oathbound-remnants, the-tide-weavers, the-cult-of-the-broken-moon
- **Events (3)**: the-celestial-fracture, the-fall-of-greyvast, the-first-moon-ritual
- **Cities (5)**: frostcrown-citadel, ashenveil, the-pale-spire, mournwall, the-sunken-quarter (DEPRECATED)
- **Races (2)**: the-greyvasti, the-pale-touched
- **Monsters (4)**: the-hollowed, the-fracture-wyrm, the-grief-echo, the-shard-stalker
- **Religions (2)**: the-doctrine-of-controlled-erosion, the-hollow-covenant
- **Artifacts (4)**: the-hollow-crown-of-aldric, a-moon-fragment-grade-3, the-erosion-codex, the-pact-shard
- **Spells (5)**: soul-tether, moonblind, hollow-whisper, fragment-pulse, memory-seal
- **Regions (1)**: northern-velkaris

### Relationships
- 174 total, 0 orphans, 0 bidirectional gaps
- 1 remaining error (forbidden-moon-rituals placeholder — pre-existing, separate entity)
- 18 warnings (all non-blocking — missing school/power level/threat level/lifespan metadata)

### CLI commands
- `npm run init:world` — bootstrap canon structure
- `npm run generate:one [type] [name]` — single entity
- `npm run generate:batch` — gap-filling batch gen
- `npm run validate:canon` — validate all entities
- `npm run retry:failed` — retry dead letter queue
- `npm run session:stats` — cost/token summary
- `npm run compact:memory` — journal compaction

### Phase 2 — Astro Frontend (COMPLETE)
- 48 static pages built (36 entity + 11 index + 1 homepage)
- Astro 5 + Tailwind v4, static output
- Canon reader: build-time only, 36 entities loaded
- Entity pages: header, description, connections, attributes, SEO meta
- Homepage: hero, stats bar, featured, recent, type grid
- Build time: ~4.6s, 0 errors
- Canon: 1 error (forbidden-moon-rituals placeholder)
- 0 bidirectional gaps

### site/ structure
- `site/package.json` — astro, tailwindcss, @tailwindcss/vite
- `site/astro.config.mts` — static output, @tailwindcss/vite
- `site/tsconfig.json` — strict, astro/tsconfigs/strict base
- `site/src/lib/canon.ts` — build-time canon reader
- `site/src/layouts/BaseLayout.astro` — base HTML shell
- `site/src/styles.css` — @import "tailwindcss"
- `site/src/pages/index.astro` — homepage (hero, stats bar, featured, recent, type grid)
- `site/src/pages/[type]/index.astro` — entity type index pages (11 types)
- `site/src/pages/[type]/[slug].astro` — individual entity pages (36 entities)
- `site/dist/` — static build output (48 pages)
- `site/public/` — static assets

### Phase 2 Styling Spec (agreed)
- Dark bg: #0a0a0f, Text: muted silver/grey, Accent: #8ab4d4 (lunar blue)
- Status badges: active=green, deprecated=red, archived=grey, rewritten=amber
- Mobile responsive, clean readable type

### Phase 3 — CI/CD & Deployment (COMPLETE)
- deploy.yml: install → typecheck → validate → build-and-deploy (Cloudflare Pages)
- generate.yml: daily 2am UTC, generate-batch → commit → triggers deploy
- DEPLOYMENT_SETUP.md: created
- Status: READY FOR DEPLOYMENT (pending: GitHub Secrets + CF project creation)

### What does NOT exist yet
- No search, no embeddings, no graph visualization
- No deployment (production URL, domain, hosting)
- No analytics

### Graph health
- Top 3 by relationship count: valdenmoor-the-ashen-crown (10), greyvast-the-sunken-throne (9), the-oathbound-remnants (8)
- Avg relationships per entity: ~4.8
- Relationship density target (>3/entity): MET

### Session cost (entire Phase 1C)
- Total tokens: 54,583 (39.7K in / 14.9K out)
- Total cost: ~$0.23
- AI calls: 15 (10 Gemini, 5 Groq fallback)
