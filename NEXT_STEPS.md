# Next Steps — Phase 1C

Campaign: "Echoes of the Northern Fracture" — Region: Northern Velkaris
Target: 30-50 entities (current: 10)

## Immediate (next session)

1. **Historical events (2 more)**
   - "The Fall of Greyvast" — the siege/collapse moment
   - "The First Moon Ritual" — origin of cult practice

2. **Cities (5-8)**
   - Priority: frostcrown-citadel (Valdenmoor capital, already placeholder), ruins of Greyvast

3. **Religions (2-3)**
   - Priority: formal religion of the Pale Dominion

4. **Races (3-4)**

5. **Monsters (5-8)**

6. **Artifacts (5-8)**
   - Priority: moon fragments as artifact type

7. **Spells (5-8)**

## After 30-50 entities

- Run lore quality evaluation
- Check relationship density (target: avg >3 per entity)
- Check naming repetition / AI slop
- Decide if ready for Phase 2 (Astro frontend)

## Lessons learned this session

- Generate ONLY the explicitly named entity — no autonomous next-entity generation
- Manual relationship append is faster than regeneration for single missing refs
- Dependency-first order (gods → kingdoms → factions → events) automatically resolves placeholders
- Gemini 2.5-flash (primary) hits 429 easily; Groq fallback ignores name hints — manual fix often needed
- Bidirectional gaps are caused by `isBidirectionalPair` type mismatches; fix by aligning types with relationship.ts
- Content file in `content/{plural}/` (e.g. `factions/` not `faction/`)

## Blockers

- DO NOT proceed to Phase 2 (Astro frontend) until 30-50 entities exist and lore quality is validated
- Gemini API quota limits generation speed; Groq fallback produces lower-quality entities
