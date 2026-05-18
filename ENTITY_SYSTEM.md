# AETHERION ARCHIVE — Entity System Design

## 1. CORE ENTITY MODEL

```typescript
interface Entity {
  // Identity
  id: string;                    // Canonical slug (e.g., "kingdom-of-eldoria")
  type: EntityType;             // One of 10 types
  name: string;                 // Display name
  aliases: string[];            // Alternative names for linking and SEO
  
  // Lifecycle
  status: EntityStatus;         // active | deprecated | rewritten | archived
  
  // Graph position (the core of the system)
  relationships: Relationship[];
  
  // Core content
  excerpt: string;              // 1-3 sentence summary
  attributes: Record<string, unknown>;  // Type-specific structured fields
  
  // Provenance
  version: number;
  generatedBy: string;          // "seed" | "ai-openai" | "ai-gemini" | "manual"
  createdAt: string;            // ISO 8601
  updatedAt: string;
  
  // SEO
  seo: SEOData;
}

interface Relationship {
  targetId: string;             // Slug of the target entity
  type: RelationshipType;       // Semantic type (see 4.1)
  label: string;                // Human-readable phrase ("Capital of", "Worships")
  bidirectional: boolean;       // Must create reverse link
}

enum EntityType {
  KINGDOM = 'kingdom',
  FACTION = 'faction',
  RACE = 'race',
  GOD = 'god',
  ARTIFACT = 'artifact',
  SPELL = 'spell',
  EVENT = 'event',
  MONSTER = 'monster',
  CITY = 'city',
  RELIGION = 'religion',
}

enum EntityStatus {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  REWRITTEN = 'rewritten',
  ARCHIVED = 'archived',
}

interface SEOData {
  title: string;                // <title> tag
  metaDescription: string;      // Meta description
  keywords: string[];           // Target keywords
  pillarWeight: number;         // 1-10 centrality in universe
  topicalCluster: string;       // "world-power" | "divine-magic" | "beings-conflict"
}
```

---

## 2. JSONL STORAGE FORMAT

### 2.1 Entity JSONL (`canon/entities/{type}.jsonl`)

Each line is a complete entity JSON object:

```jsonl
{"id":"kingdom-of-eldoria","type":"kingdom","name":"Kingdom of Eldoria","aliases":["Eldoria","The Eldorian Realm"],"status":"active","relationships":[{"targetId":"city-of-eldor","type":"contains","label":"Capital city","bidirectional":true},{"targetId":"god-nyxara","type":"worships","label":"Primary deity","bidirectional":true}],"excerpt":"The Kingdom of Eldoria is the oldest surviving realm, built atop the ruins of a pre-fracture civilization.","attributes":{"capital":"City of Eldor","foundingEra":"Age of Celestial Light","government":"Constitutional monarchy","ruler":"Queen Seraphine Vex","militaryStrength":7,"magicTolerance":"restricted"},"version":1,"generatedBy":"seed","createdAt":"2026-05-18T20:00:00Z","updatedAt":"2026-05-18T20:00:00Z","seo":{"title":"Kingdom of Eldoria — Aetherion Archive","metaDescription":"Explore the Kingdom of Eldoria, the oldest surviving realm in the Aetherion universe. Learn about its capital, rulers, and role after the Celestial Fracture.","keywords":["Eldoria","fantasy kingdom","dark fantasy realm","Celestial Fracture"],"pillarWeight":8,"topicalCluster":"world-power"}}
```

### 2.2 Timeline JSONL (`canon/timeline.jsonl`)

```jsonl
{"id":"event-the-celestial-fracture","type":"event","date":"0 AF","title":"The Celestial Fracture","summary":"The moon shattered without warning, scattering fragments across the world.","significance":10,"relatedEntities":["god-nyxara","kingdom-of-eldoria"]}
{"id":"event-founding-of-eldor","type":"event","date":"~200 BF","title":"Founding of Eldor","summary":"The city that would become the capital of Eldoria was established by refugee survivors.","significance":6,"relatedEntities":["city-of-eldor","kingdom-of-eldoria"]}
```

### 2.3 World Memory Journal (`canon/memory/journal.jsonl`)

```jsonl
{"snapshot":1,"timestamp":"2026-05-18T20:00:00Z","generation":"seed","state":{"currentEra":"Age of Fractured Light","cosmicState":{"celestialFracture":"occurred","moonFragments":"scattered","magicStability":"declining"},"majorConflicts":[{"between":["kingdom-of-eldoria","void-cult"],"status":"simmering"}],"totalEntities":5,"lastEventId":"event-the-celestial-fracture"}}
```

---

## 3. PER-TYPE ATTRIBUTE SCHEMAS

### 3.1 Kingdom
```typescript
attributes: {
  capital: string;               // Reference to city ID
  foundingEra: string;
  government: string;            // "monarchy", "theocracy", "council", "military junta"
  ruler: string;
  population?: number;
  militaryStrength: number;      // 1-10
  magicTolerance: string;        // "forbidden", "restricted", "tolerated", "embraced"
  primaryExport?: string;
  currentStatus: string;         // "thriving", "declining", "war-torn", "fallen"
}
```

### 3.2 Faction
```typescript
attributes: {
  ideology: string;
  leader: string;
  headquarters?: string;         // Reference to city or kingdom
  membership: number;            // Approximate size
  influence: number;             // 1-10
  primaryGoal: string;
  methods: string[];             // ["diplomacy", "espionage", "warfare", "magic"]
  isSecret: boolean;
}
```

### 3.3 Race
```typescript
attributes: {
  homeland: string;              // Reference to region/kingdom
  averageLifespan: number;
  physicalTraits: string[];
  culturalTraits: string[];
  innateAbilities: string[];
  magicAffinity: string;         // "none", "low", "medium", "high", "innate"
  relationshipWith: string[];    // Other races they interact with
}
```

### 3.4 God
```typescript
attributes: {
  domain: string[];              // ["war", "death", "knowledge", "trickery"]
  alignment: string;             // "benevolent", "neutral", "malevolent", "cosmic"
  symbol: string;
  followers: number;             // 1-10 scale
  powerLevel: number;            // 1-10
  status: string;                // "active", "slumbering", "fallen", "imprisoned"
  celestialOrigin: boolean;      // Was this god affected by the Fracture?
}
```

### 3.5 Artifact
```typescript
attributes: {
  type: string;                  // "weapon", "armor", "reliquary", "scroll", "jewelry"
  material: string;
  discoveredBy?: string;         // Reference to entity
  currentOwner?: string;
  powerSource: string;           // "moon-fragment", "soul-bond", "divine-gift"
  soulCost: number;              // 1-10, how much it erodes the user
  isCorrupted: boolean;
}
```

### 3.6 Spell
```typescript
attributes: {
  school: string;                // "abjuration", "evocation", "necromancy", "illusion", etc.
  difficulty: string;            // "novice", "adept", "master", "forbidden"
  soulCost: number;              // 1-10
  castingTime: string;           // "instant", "ritual", "prolonged"
  range: string;                 // "touch", "sight", "regional", "planar"
  inventedBy?: string;           // Reference to entity
  isForbidden: boolean;
}
```

### 3.7 Event
```typescript
attributes: {
  date: string;                  // "X AF" or "X BF" (After Fracture / Before Fracture)
  datePrecision: string;         // "exact", "year", "era"
  participants: string[];        // References to entities involved
  outcome: string;
  significance: number;          // 1-10
  affectedTypes: string[];       // ["kingdom", "race", "magic"]
  isFractureRelated: boolean;
}
```

### 3.8 Monster
```typescript
attributes: {
  habitat: string;               // "forest", "mountains", "void", "underground"
  dangerLevel: number;           // 1-10
  intelligence: string;          // "mindless", "animal", "sapient"
  isIntelligent: boolean;
  originatesFrom: string;        // "natural", "corrupted", "summoned", "fracture-spawned"
  weaknesses: string[];
  abilities: string[];
}
```

### 3.9 City
```typescript
attributes: {
  kingdom?: string;              // Reference to kingdom
  population: number;
  founded: string;               // Date or era
  ruler: string;
  primaryIndustry: string;
  districts: string[];
  defenses: string;
  magicLevel: string;            // "none", "low", "moderate", "high"
}
```

### 3.10 Religion
```typescript
attributes: {
  deity: string;                 // Reference to god(s) worshipped
  type: string;                  // "monotheistic", "polytheistic", "ancestor", "cosmic"
  origin: string;
  sacredText?: string;
  clergyStructure: string;
  primaryTenets: string[];
  influence: number;             // 1-10
  status: string;                // "dominant", "declining", "persecuted", "forbidden"
}
```

---

## 4. RELATIONSHIP SYSTEM

### 4.1 Relationship Type Catalog

| Code | Meaning | Bidirectional Pair |
|---|---|---|
| `contains` | A contains B | `contained_by` |
| `capital_is` | A's capital is B | `capital_of` |
| `worships` | A worships B | `worshipped_by` |
| `at_war_with` | A is at war with B | `at_war_with` |
| `allied_with` | A is allied with B | `allied_with` |
| `created` | A created B | `created_by` |
| `inhabits` | A inhabits B | `inhabited_by` |
| `located_in` | A is located in B | `contains` |
| `rules` | A rules B | `ruled_by` |
| `member_of` | A is a member of B | `has_member` |
| `invented` | A invented B | `invented_by` |
| `wields` | A wields B | `wielded_by` |
| `seeks` | A seeks B | `sought_by` |
| `caused` | A caused B | `caused_by` |
| `participated_in` | A participated in B | `had_participant` |
| `founded` | A founded B | `founded_by` |
| `destroyed` | A destroyed B | `destroyed_by` |
| `guarded_by` | A is guarded by B | `guards` |
| `opposes` | A opposes B | `opposed_by` |
| `originates_from` | A originates from B | `source_of` |

### 4.2 Valid Relationship Matrix

| → Kingdom | Faction | Race | God | Artifact | Spell | Event | Monster | City | Religion |
|---|---|---|---|---|---|---|---|---|---|
| **Kingdom** | allied, war | hosts, bans | tolerates, exiles | worships | — | — | affected_by | — | contains | state_religion |
| **Faction** | operates_in | allied, rival | recruits | serves, opposes | seeks | uses | caused | controls | based_in | sponsors |
| **Race** | native_to | member_of | allied, war | worships, rebels | — | — | affected_by | — | populates | follows |
| **God** | watches_over | guides | created | parent, rival | wields, created | invented | caused | commands | — | inspires |
| **Artifact** | located_in | held_by | — | created_by | — | powered_by | forged_in | — | hidden_in | — |
| **Spell** | — | — | — | invented_by | required_for | counters, empowers | discovered_in | — | — | — |
| **Event** | affected | involved | involved | set_in_motion | — | — | leads_to | — | happened_at | — |
| **Monster** | threatens | — | — | created_by | — | — | — | — | infests | — |
| **City** | part_of | houses | populated_by | temple_of | — | — | site_of | — | — | seat_of |
| **Religion** | dominates | influences | converts | worships | — | — | started | — | center_of | — |

*(— = uncommon but not impossible; each case validated manually)*

---

## 5. ENTITY LIFECYCLE

```
  ┌──────────┐
  │  DRAFT   │  Being generated, not yet written to canon
  └────┬─────┘
       │ validation passed
       ▼
  ┌──────────┐
  │  ACTIVE  │  Live in canon, rendered on site
  └────┬─────┘
       │
       ├── lore contradiction found → go to DEPRECATED
       ├── manual replacement → go to REWRITTEN
       └── removed from scope → go to ARCHIVED
       │
       ▼
  ┌────────────┐
  │ DEPRECATED │  Superseded by another entity
  └────┬───────┘  Page redirects to replacement
       │
       ▼
  ┌────────────┐
  │ REWRITTEN  │  Content regenerated, old version stored
  └────┬───────┘  in memory journal for provenance
       │
       ▼
  ┌────────────┐
  │  ARCHIVED  │  Excluded from graph traversal
  └────────────┘  Preserved for history only
```

**Transition Rules:**
- `draft → active`: All required fields present, no blocking validation errors
- `active → deprecated`: Replacement entity ID recorded in `supersededBy` field
- `active → rewritten`: Old entity data appended to memory journal before overwrite
- `active → archived`: All incoming relationships from other entities must be removed first
- `deprecated` entities still render as redirect pages to maintain backlinks
- `archived` entities are excluded from sitemap and graph traversal

---

## 6. NAMING REGISTRY

```typescript
// canon/naming-registry.json
interface NamingRegistry {
  usedNames: Record<string, {     // "Eldoria" → lookup
    type: EntityType;
    id: string;
    status: EntityStatus;
  }>;
  usedSlugs: Record<string, {     // "kingdom-of-eldoria" → lookup
    type: EntityType;
    name: string;
    status: EntityStatus;
  }>;
  patterns: Record<EntityType, {
    prefix?: string[];
    suffix?: string[];
    style: string;                // "adjective-noun", "of-construction", "compound-word"
    examples: string[];
  }>;
}
```

**Collision Prevention:**
1. Before generation, proposed name is checked against `usedNames`
2. If exact match found → reject with "Entity with this name already exists"
3. If fuzzy match (Levenshtein < 3) → warn but allow with alias
4. Slug is auto-generated from name: `lowercase(kebab-case(name))`
5. If slug collision → auto-append numeric suffix, log warning

---

## 7. GENERATION PLAN (Distribution Control)

```json
{
  "distribution": {
    "kingdom":   { "current": 15, "target": 40, "weight": 0.8 },
    "faction":   { "current": 22, "target": 40, "weight": 0.6 },
    "race":      { "current": 8,  "target": 20, "weight": 0.7 },
    "god":       { "current": 12, "target": 25, "weight": 0.6 },
    "artifact":  { "current": 30, "target": 40, "weight": 0.3 },
    "spell":     { "current": 35, "target": 40, "weight": 0.2 },
    "event":     { "current": 10, "target": 30, "weight": 0.8 },
    "monster":   { "current": 18, "target": 35, "weight": 0.6 },
    "city":      { "current": 20, "target": 40, "weight": 0.5 },
    "religion":  { "current": 8,  "target": 20, "weight": 0.7 }
  },
  "currentFocus": {
    "episode": "Echoes of the North",
    "region": "The Frozen Wastes",
    "theme": "Survival and isolation in post-fracture arctic",
    "entityTypes": ["kingdom", "city", "monster"],
    "since": "2026-05-18",
    "remainingBatch": []
  },
  "strategy": "gap-fill",
  "gapMultiplier": 2.0
}
```

Selection algorithm:
```
score = max(0, target - current) * weight * gapMultiplier
if type in currentFocus.entityTypes → score *= 2.5
pick type by weighted random
```
