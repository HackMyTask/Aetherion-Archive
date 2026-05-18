# AETHERION ARCHIVE — Product Requirements Document

## 1. PRODUCT OVERVIEW

**Aetherion Archive** is an AI-native fantasy universe engine that generates, maintains, and serves a living encyclopedia of a dark fantasy world. It is not a blog, not a wiki, and not an article generator — it is a **semantic entity graph** that renders as a static website.

The core premise: after the **Celestial Fracture** shattered the moon, fragments fell to the world, becoming the source of all magic — but every spell cast erodes the caster's soul.

### 1.1 Why This Exists

Existing fantasy wikis (Fandom, Wikia) are:
- Human-curated and slow to expand
- SEO-hostile due to ad-heavy platforms
- Inconsistent by nature (multiple editors, no canon enforcement)
- Not designed for discovery graph optimization

Aetherion Archive solves this by:
- AI-generated entity expansion with canon enforcement
- Graph-native internal linking (not keyword-stuffed)
- Static-first, infinitely scalable deployment
- Topical authority through semantic clustering

### 1.2 Core Differentiators

| Dimension | Traditional Fantasy Wiki | Aetherion Archive |
|---|---|---|
| Content source | Human editors | AI + canon validation |
| Internal linking | Manual, inconsistent | Graph-derived, automatic |
| Lore consistency | Varies by editor | Enforced by rules engine |
| Expandability | Requires human effort | Automated pipeline |
| SEO strategy | Afterthought | Graph-first architecture |
| Deployment | CMS/server | Static (Cloudflare Pages) |
| Scale ceiling | Database/bandwidth | CDN edge (unlimited) |

---

## 2. TARGET AUDIENCE

### Primary: SEO Content Consumer
- Searchers for dark fantasy / worldbuilding content
- TTRPG players seeking campaign inspiration
- Fantasy readers exploring new lore
- Discovered via long-tail SEO queries

### Secondary: Worldbuilding Community
- Writers and game masters
- People who explore fictional universes
- Referenced by other worldbuilding sites

### Tertiary: AI/Engineering Audience
- Developers interested in AI content pipelines
- People studying semantic SEO at scale
- Open source contributors

---

## 3. USER STORIES

### 3.1 Reader
- "I want to learn about the Kingdom of Eldoria and its gods"
- "Show me how the Celestial Fracture connects to this artifact"
- "Give me related entities I haven't explored yet"
- "Let me browse all spells in the universe"

### 3.2 Search Engine
- "Index this entity page and understand its topic"
- "Follow internal links to discover related content"
- "Understand the topical authority of the domain"
- "Surface this page for relevant fantasy queries"

### 3.3 System Operator
- "Generate 3 new entities focused on the Northern Kingdoms"
- "Validate canon consistency before deploying"
- "Show me which entity types are underrepresented"
- "Rerun the link freshness pass"

---

## 4. FUNCTIONAL REQUIREMENTS

### 4.1 Core — Entity System
| ID | Requirement | Priority |
|---|---|---|
| F-01 | System shall support 10 entity types: kingdoms, factions, races, gods, artifacts, spells, events, monsters, cities, religions | P0 |
| F-02 | Each entity shall have structured metadata (type, name, aliases, relationships, attributes) | P0 |
| F-03 | Each entity shall have a relationship array linking to other entities | P0 |
| F-04 | Entities shall support lifecycle states: active, deprecated, rewritten, archived | P0 |
| F-05 | System shall prevent naming collisions via naming registry | P0 |
| F-06 | System shall support per-type JSONL storage for independent generation | P0 |

### 4.2 Core — World Memory Engine
| ID | Requirement | Priority |
|---|---|---|
| F-07 | World memory shall track current era, cosmic state, faction influence, major conflicts | P0 |
| F-08 | World memory shall be append-only journal with snapshot history | P0 |
| F-09 | World memory shall be updated after every entity generation | P0 |
| F-10 | World memory shall be included in every AI generation prompt | P0 |

### 4.3 AI Generation
| ID | Requirement | Priority |
|---|---|---|
| F-11 | System shall support multiple AI providers: OpenAI, Gemini, Groq, OpenRouter, OpenAI-compatible | P0 |
| F-12 | System shall implement provider abstraction via AIProvider interface | P0 |
| F-13 | System shall implement priority-based fallback chain | P0 |
| F-14 | System shall assemble context from canon before generation | P0 |
| F-15 | System shall validate generated content against canon rules | P0 |
| F-16 | System shall weight entity type selection by distribution gap | P0 |
| F-17 | System shall support thematic generation seeds / regional focus | P1 |

### 4.4 Static Site
| ID | Requirement | Priority |
|---|---|---|
| F-18 | System shall generate a fully static site via Astro | P0 |
| F-19 | Every entity shall have a dedicated page at /[type]/[slug] | P0 |
| F-20 | Every page shall include internal links from its relationship array | P0 |
| F-21 | Every page shall include Schema.org JSON-LD structured data | P0 |
| F-22 | System shall generate a sitemap organized by entity type | P0 |
| F-23 | System shall have a timeline page | P1 |
| F-24 | System shall support TailwindCSS theming | P0 |

### 4.5 SEO
| ID | Requirement | Priority |
|---|---|---|
| F-25 | Internal links shall originate from defined relationships only (lore-first, not keyword-first) | P0 |
| F-26 | All links shall be bidirectional at the graph level | P0 |
| F-27 | System shall organize entities into topical clusters | P0 |
| F-28 | Each entity type shall have a listing page | P0 |
| F-29 | Sitemap shall be split by entity type for crawl efficiency | P0 |

### 4.6 Automation
| ID | Requirement | Priority |
|---|---|---|
| F-30 | GitHub Actions shall run daily entity generation | P0 |
| F-31 | GitHub Actions shall validate canon on every PR | P0 |
| F-32 | GitHub Actions shall build and deploy to Cloudflare Pages on main | P0 |
| F-33 | Weekly maintenance shall refresh internal links | P1 |
| F-34 | Generation plan shall balance entity type distribution | P0 |

---

## 5. NON-FUNCTIONAL REQUIREMENTS

| ID | Requirement | Target |
|---|---|---|
| NF-01 | Static build time (300 entities) | < 2 minutes |
| NF-02 | Page load time | < 500ms (CDN cached) |
| NF-03 | Lore consistency violations | < 1% of generated entities |
| NF-04 | Internal link density | ≥ 5 per entity page |
| NF-05 | Entity types in balance | ±20% of target distribution |
| NF-06 | AI generation success rate | > 90% (with fallback) |
| NF-07 | Zero runtime server dependencies | Static files only |
| NF-08 | Incremental build support | Changed entities only |

---

## 6. ENTITY LIFECYCLE

```
Request → Generate → Validate → Canon Store → Content Render → Build → Deploy
                                                                   
                ┌─────────────────────────────────────┐
                │          ENTITY STATES              │
                │                                     │
                │  draft ──→ active ──→ deprecated    │
                │                │          │          │
                │                ↓          ↓          │
                │           rewritten ──→ archived     │
                └─────────────────────────────────────┘
```

- **draft**: Being generated, not yet in canon
- **active**: Live in canon, rendered on site
- **deprecated**: Superseded; page redirects to replacement
- **rewritten**: Content replaced; old version stored in memory journal
- **archived**: Removed from graph; preserved for history

---

## 7. CONSTRAINTS

### 7.1 Technical
- Fully static deployment (Cloudflare Pages)
- No runtime database (JSONL canon)
- Zero JavaScript on entity pages (progressive enhancement only)
- Markdown + JSONL for all content
- Git-tracked canon with full history

### 7.2 Content
- Must originate from the Celestial Fracture as central event
- Magic must always have a soul cost
- No generic fantasy tropes (anti-slop rules enforced)
- Every entity must connect to at least 3 others
- Names must be unique across the entire canon

### 7.3 Process
- AI provider keys loaded from environment only, never committed
- PRs from auto-generation must be reviewed before merge
- Canon validation runs on every change
- Weekly link freshness pass required

---

## 8. SUCCESS METRICS

| Metric | Goal | Measurement |
|---|---|---|
| Entity count | 300+ entities launched | Generated canon count |
| Internal links per entity | ≥ 5 | Linker pass output |
| Entity type balance | All types within 20% of target | Distribution JSON |
| Build time | < 2 min | CI pipeline duration |
| Lore conflicts | < 3 per 100 entities | Validator warnings |
| Generation success | > 90% | Pipeline pass rate |

---

## 9. PHASE PLAN

### Phase 1 — Foundation (Current)
- Canon reader/writer
- Entity types + JSONL storage
- World Memory Engine
- Naming registry
- Provider abstraction layer
- Context assembler + generator pipeline
- Validator (warning-based)
- Renderer (entity → markdown)
- Astro static site (entity pages, listing pages, timeline)
- SEO: Schema.org, sitemap, breadcrumbs
- GitHub Actions: daily seed, validate, build-deploy
- Seed: 30-50 entities across all types

### Phase 2 — Expansion
- Thematic generation seeds / focus campaigns
- Graph visualization (D3.js)
- Client-side search
- Content relationship graph page
- Advanced SEO: pillar/cluster optimization
- Entity diff viewer for PR review

### Phase 3 — Scale
- Million-entity graph optimization
- Dynamic sitemap federation
- Multi-language support
- Community contribution system
- API for external consumption

---

## 10. DEFINITIONS

| Term | Definition |
|---|---|
| Entity | A single node in the universe graph (kingdom, god, spell, etc.) |
| Canon | The complete, authoritative body of lore |
| World Memory | The living state of the universe at a given point |
| Relationship | A directed edge between two entities with a semantic label |
| Topical Cluster | A group of entities forming an SEO-relevant content group |
| Anti-slop | Rules preventing generic, trope-filled AI generation |
| JSONL | JSON Lines — one JSON object per line, append-friendly |
