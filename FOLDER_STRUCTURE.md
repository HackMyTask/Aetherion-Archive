# AETHERION ARCHIVE — Complete Directory Structure

```
aetherion-archive/
│
├── .github/
│   └── workflows/
│       ├── daily-seed.yml            # Daily 03:00 UTC — generate 1-3 entities → PR
│       ├── validate.yml              # On PR — validate canon, run tests, comment
│       ├── build-deploy.yml          # On main — Astro build → Cloudflare Pages
│       └── weekly-maintenance.yml    # Sunday 04:00 UTC — rewire links, refresh SEO
│
├── canon/                            # ▲ SINGLE SOURCE OF TRUTH
│   ├── world-core.json               #   Universe identity, cosmic laws, constant rules
│   ├── memory/
│   │   ├── journal.jsonl             #   Append-only world state snapshots (history)
│   │   └── index.json                #   Quick reference: latest state pointer
│   ├── generation-plan.json          #   Entity distribution weights + thematic focus
│   ├── naming-registry.json          #   All used names (collision prevention)
│   ├── entities/                     #   Per-type JSONL storage
│   │   ├── kingdoms.jsonl
│   │   ├── factions.jsonl
│   │   ├── races.jsonl
│   │   ├── gods.jsonl
│   │   ├── artifacts.jsonl
│   │   ├── spells.jsonl
│   │   ├── events.jsonl
│   │   ├── monsters.jsonl
│   │   ├── cities.jsonl
│   │   └── religions.jsonl
│   ├── timeline.jsonl                #   All chronological events
│   └── rules/                        #   Generation rules (read by AI context assembler)
│       ├── lore-rules.md             #   Hard world constraints
│       ├── anti-slop-rules.md        #   Forbidden tropes and patterns
│       ├── tone-guide.md             #   Writing style reference
│       └── prompts/                  #   Per-entity-type AI prompt templates
│           ├── kingdom.md
│           ├── faction.md
│           ├── race.md
│           ├── god.md
│           ├── artifact.md
│           ├── spell.md
│           ├── event.md
│           ├── monster.md
│           ├── city.md
│           └── religion.md
│
├── content/                          # ▲ GENERATED MARKDOWN (one per entity)
│   ├── kingdoms/
│   │   └── kingdom-of-eldoria.md
│   ├── factions/
│   ├── races/
│   ├── gods/
│   ├── artifacts/
│   ├── spells/
│   ├── events/
│   ├── monsters/
│   ├── cities/
│   └── religions/
│
├── src/                              # ▲ ENGINE (TypeScript)
│   ├── engine/                       #   Core canon operations
│   │   ├── canon-reader.ts           #     Load canon/ into typed memory
│   │   ├── entity-graph.ts           #     Dynamic graph from relationship arrays
│   │   ├── canon-validator.ts        #     Warning-based consistency checks
│   │   ├── linker.ts                 #     Relationship-based internal link generator
│   │   ├── timeline.ts              #     Timeline operations + validation
│   │   ├── resolver.ts               #     Entity reference resolution
│   │   └── world-memory.ts           #     Read/update World Memory Engine
│   │
│   ├── ai/                           #   AI provider abstraction
│   │   ├── provider.ts               #     AIProvider interface
│   │   ├── openai.ts                 #     OpenAI provider
│   │   ├── gemini.ts                 #     Gemini provider
│   │   ├── groq.ts                   #     Groq provider
│   │   ├── openrouter.ts             #     OpenRouter provider
│   │   ├── openai-compatible.ts      #     Generic OpenAI-compatible provider
│   │   ├── fallback-chain.ts         #     Priority-based provider fallback
│   │   └── mock-provider.ts          #     Local dev/test provider
│   │
│   ├── pipeline/                     #   Content generation pipeline
│   │   ├── orchestrator.ts           #     Pipeline orchestrator (stages 1-6)
│   │   ├── context-assembler.ts      #     Build prompt from canon + neighbors
│   │   ├── entity-factory.ts         #     Scaffold entity scaffold from type def
│   │   ├── weighted-selector.ts      #     Pick entity type by distribution gap
│   │   ├── post-processor.ts         #     Clean AI output, resolve refs
│   │   ├── validator.ts              #     Post-generation validation
│   │   └── renderer.ts              #     Entity data → markdown content file
│   │
│   ├── seo/                          #   SEO engine
│   │   ├── cluster.ts                #     Topical cluster analysis
│   │   ├── schema.ts                 #     Schema.org JSON-LD generator
│   │   ├── sitemap.ts               #     Sitemap generator (per-type split)
│   │   └── link-optimizer.ts         #     Link density analysis + optimization
│   │
│   └── types/                        #   Shared TypeScript type definitions
│       ├── entity.ts                 #     Entity, EntityType, EntityStatus, SEOData
│       ├── relationship.ts           #     Relationship, RelationshipType catalog
│       ├── world.ts                  #     WorldCore, WorldMemory, TimelineEntry
│       ├── ai.ts                     #     AIProvider, AIRequest, AIResponse
│       └── seo.ts                    #     SEOData, TopicalCluster, SitemapEntry
│
├── src-astro/                        # ▲ STATIC SITE (Astro)
│   ├── pages/
│   │   ├── index.astro               #     Homepage — world overview + featured entities
│   │   ├── [type]/
│   │   │   └── [...slug].astro       #     Dynamic entity page route
│   │   ├── timeline.astro            #     Timeline page
│   │   └── sitemap.xml.ts            #     Dynamic sitemap generator
│   ├── components/
│   │   ├── EntityCard.astro          #     Entity preview card
│   │   ├── InternalLinks.astro       #     Renders relationship links
│   │   ├── RelationshipList.astro    #     Full relationship listing
│   │   ├── Breadcrumbs.astro         #     SEO breadcrumb navigation
│   │   └── SEOMeta.astro             #     Schema.org + meta tag injector
│   ├── layouts/
│   │   ├── BaseLayout.astro          #     Global layout (header, nav, footer)
│   │   ├── EntityLayout.astro        #     Entity page layout
│   │   └── ListingLayout.astro       #     Entity type listing layout
│   └── styles/
│       └── base.css                  #     TailwindCSS imports + theme
│
├── scripts/                          # ▲ EXECUTABLE AUTOMATION
│   ├── seed-world.ts                 #     Initial world seeding (30-50 entities)
│   ├── generate-one.ts               #     Generate single entity (CLI args)
│   ├── generate-batch.ts             #     Batch generation (CI entry point)
│   ├── validate-canon.ts             #     Canon consistency check
│   ├── rewire-links.ts               #     Refresh all internal links
│   ├── update-world-memory.ts        #     Recompute world state
│   └── seo-audit.ts                  #     Generate SEO report
│
├── tests/                            # ▲ TEST SUITE
│   ├── canon/
│   │   ├── canon-reader.test.ts      #     Canon loading tests
│   │   └── canon-validator.test.ts   #     Validation logic tests
│   ├── graph/
│   │   ├── entity-graph.test.ts      #     Graph construction tests
│   │   └── linker.test.ts            #     Link generation tests
│   ├── pipeline/
│   │   ├── context-assembler.test.ts #     Prompt assembly tests
│   │   ├── post-processor.test.ts    #     AI output cleanup tests
│   │   └── validator.test.ts         #     Validation logic tests
│   └── seo/
│       ├── cluster.test.ts           #     Topical clustering tests
│       └── schema.test.ts            #     Schema.org generation tests
│
├── docs/                             # ▲ ARCHITECTURE DOCUMENTS (this set)
│   ├── PRD.md                        #     Product Requirements Document
│   ├── ARCHITECTURE.md               #     System Architecture
│   ├── ENTITY_SYSTEM.md              #     Entity System Design
│   ├── CONTENT_PIPELINE.md           #     Content Generation Pipeline
│   ├── SEO_STRATEGY.md               #     SEO Architecture
│   ├── AUTOMATION_FLOW.md            #     Automation & Workflow
│   └── FOLDER_STRUCTURE.md           #     This file
│
├── astro.config.mjs                  #     Astro configuration
├── tailwind.config.mjs               #     TailwindCSS configuration
├── tsconfig.json                     #     TypeScript strict mode
├── vitest.config.ts                  #     Vitest configuration
├── package.json                      #     Dependencies + scripts
├── .env.example                      #     Environment variable template
├── .gitignore
├── .editorconfig
├── AGENTS.md                         #     AI agent guide
└── README.md                         #     Project overview
```

---

## FILE SIZE ESTIMATES

| Directory | Files at 300 entities | Total Size |
|---|---|---|
| `canon/entities/*.jsonl` | 10 files | ~3MB |
| `canon/memory/journal.jsonl` | 1 file | ~150KB |
| `canon/` total | ~25 files | ~4MB |
| `content/` | 300 markdown files | ~15MB |
| `src/` | ~35 TypeScript files | ~200KB |
| `src-astro/` | ~15 Astro files | ~50KB |
| `scripts/` | 7 scripts | ~30KB |
| `tests/` | ~10 test files | ~20KB |
| **Total repo** | **~400 files** | **~20MB** |

---

## KEY DESIGN DECISIONS

### Why JSONL per entity type?
- Append-only writes avoid rewriting large files
- Independent generation cycles (generate kingdoms without touching gods)
- Stream reading: read only the entity type you need
- Parallel generation possible (multiple types simultaneously)
- Git diff shows only appended lines, not entire file

### Why split `canon/` from `content/`?
- `canon/` = structured, typed, machine-queryable data
- `content/` = human-readable markdown (rendered by Astro)
- Validation reads only `canon/` (fast, no markdown parsing)
- SEO engine reads `canon/` for relationship data
- Content can be regenerated from canon without data loss

### Why `src/` separate from `src-astro/`?
- `src/` = engine code (runs in Node.js, used by scripts + CLI)
- `src-astro/` = Astro code (runs at build time, consumes engine output)
- Clear separation of concerns
- Engine can be tested independently of Astro
- Engine can be ported to other static generators later

### No `node_modules/`, `dist/`, `.astro/`?
- All in `.gitignore`
- Generated by `npm install` and `npm run build`

---

## FILE CONVENTIONS

| Convention | Rule |
|---|---|
| **Entity IDs** | `{type}-of-{name}` or `{name}-the-{descriptor}` — kebab-case |
| **Entity JSONL** | One complete entity object per line, no trailing comma |
| **Markdown files** | Frontmatter with `title`, `type`, `id` fields |
| **TypeScript** | strict mode, no `any`, interfaces over types for props |
| **Test files** | `*.test.ts` alongside source or in `tests/` mirror |
| **Scripts** | Executable via `npm run`, CLI args via `process.argv` |
| **Workflows** | One YAML file per trigger pattern |
