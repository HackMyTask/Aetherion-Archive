# Hard Constraints

## NEVER change
- JSONL canon storage format
- Relationships stored inside entities (not central graph)
- canon/ separate from content/
- Lore-first internal linking (not keyword-first)
- Warning-based validation (not hard rejection)
- Four entity lifecycle states (active/deprecated/rewritten/archived)
- No SDK dependencies
- Fallback-only provider execution order
- Gap-filling batch generation logic
- The 10 entity type names (kingdoms/factions/races/gods/artifacts/spells/historical_events/monsters/cities/religions)
- No database, no web server, no auth, no frontend deps in engine
- No barrel file imports internally
- Entities are immutable after append
- Engine must never import frontend code
- generateOne() returns null on all-provider failure (not throw)
- All stats files are append-only JSONL

## NEVER add (until explicitly instructed)
- Semantic search or embeddings
- Graph visualization
- Vector database
- CMS or admin dashboard
- Auth system
- Astro frontend (Phase 2 only)
- GitHub Actions (Phase 4 only)
