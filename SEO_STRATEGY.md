# AETHERION ARCHIVE — SEO Strategy

## 1. CORE PRINCIPLE

Aetherion Archive's SEO strategy is **graph-derived, not keyword-derived**.

Traditional SEO: find keywords → write articles → add links.
Aetherion SEO: define entities → build relationships → links emerge from structure.

The entity graph IS the topical authority. Google ranks sites that demonstrate comprehensive coverage of a subject. A graph of 300+ densely interlinked entities, each with Schema.org markup, organized into topical clusters, with a clear semantic hierarchy — this is what E-E-A-T looks like for a fantasy universe.

---

## 2. TOPICAL CLUSTER ARCHITECTURE

### 2.1 Three Pillar Clusters

```
CLUSTER: WORLD & POWER (topical pillar: kingdoms)
├── kingdoms/        ← Pillar page (hub, links to all children)
│   ├── cities/      ← Cluster content (linked to parent kingdom)
│   ├── factions/    ← Cluster content (linked to parent kingdom)
│   └── events/      ← Cluster content (linked to affected kingdoms)
│
CLUSTER: DIVINE & MAGIC (topical pillar: gods)
├── gods/            ← Pillar page
│   ├── religions/   ← Cluster content
│   ├── artifacts/   ← Cluster content
│   └── spells/      ← Cluster content
│
CLUSTER: BEINGS & CONFLICT (topical pillar: races)
├── races/           ← Pillar page
│   ├── monsters/    ← Cluster content
│   └── events/      ← Cluster content (linked to participating races)
```

Each pillar page links to every cluster page. Each cluster page links back to its pillar. This creates a **hub-and-spoke** topology that search engines reward.

### 2.2 Entity-Type Listing Pages

Every entity type gets a listing page at `/[type]/`:

```
/kingdoms/     → List of all kingdoms with excerpts and links
/gods/         → List of all gods
/spells/       → List of all spells
...
```

These listing pages serve as **secondary hubs** — they link to every entity of that type, and Googlebot can crawl the entire graph from any listing page.

---

## 3. INTERNAL LINKING SYSTEM

### 3.1 The Cardinal Rule

> Every internal link MUST originate from a defined relationship in the entity graph.
> No keyword-matching auto-links. No "related by same category" links.

### 3.2 Link Sources

Links appear in 3 places on every entity page:

```
Primary Links (from entity's own relationships)
  ├── "Capital: City of Eldor"           (type: contains)
  ├── "Primary Deity: Nyxara"           (type: worships)
  ├── "Rival: Kingdom of Vex'Mor"       (type: at_war_with)
  └── "Hosts: Order of the Blade"       (type: hosts)

Secondary Links (from other entities' relationships TO this entity)
  └── "Referenced by: 5 other entities"  (auto-generated list)

Distant Connections (2-hop neighbors, max 5)
  └── "Related: Frostveil Spire"         (my neighbor's neighbor)
```

### 3.3 Link Density Targets

| Scope | Target | Enforcement |
|---|---|---|
| Outbound links per page | ≥ 5 | Validator warns if < 3 |
| Inbound links per page | ≥ 3 | Link freshness pass checks |
| Bidirectional ratio | 100% | Enforced at commit time |
| Link text uniqueness | All different | Generated from relationship labels |
| Broken links | 0 | Validator checks all target IDs exist |

### 3.4 URL Structure

```
/[type]/[slug]

Examples:
/kingdoms/kingdom-of-eldoria
/gods/nyxara-the-shattered
/events/the-celestial-fracture

Rules:
- Type directory = entity type (singular)
- Slug = kebab-case of entity name
- No nested paths (not /kingdoms/eldoria/cities/eldor)
- No trailing slashes
- No query parameters
```

### 3.5 Breadcrumb Structure

```
Home > Kingdoms > Kingdom of Eldoria
Home > Gods > Nyxara the Shattered
Home > Events > The Celestial Fracture > Battle of the Shattered Gate
```

Implemented via `Breadcrumbs.astro` component, reads entity type + parent relationships.

---

## 4. STRUCTURED DATA (Schema.org)

### 4.1 Per-Entity Schema

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "AdministrativeArea",
  "name": "Kingdom of Eldoria",
  "description": "The oldest surviving realm, built atop the ruins of a pre-fracture civilization.",
  "url": "https://aetherion-archive.com/kingdoms/kingdom-of-eldoria",
  "containedInPlace": { ... },
  "containsPlace": [ ... ]
}
</script>
```

### 4.2 Schema Type Mapping

| Entity Type | Schema.org Type | Key Properties |
|---|---|---|
| kingdom | `AdministrativeArea` | `containedInPlace`, `containsPlace`, `description` |
| faction | `Organization` | `member`, `foundingDate`, `numberOfEmployees` |
| race | `Thing` (+ `BioChemEntity`) | `additionalProperty`, `taxonomicRank` |
| god | `Person` (+ `ReligiousLeadership`) | `affiliation`, `knows`, `description` |
| artifact | `Product` (+ `CreativeWork`) | `material`, `category`, `creator` |
| spell | `CreativeWork` | `abstract`, `citation`, `about` |
| event | `Event` | `startDate`, `location`, `attendee`, `duration` |
| monster | `Thing` + `BioChemEntity` | `additionalProperty`, `location`, `description` |
| city | `City` | `containedInPlace`, `population`, `founder` |
| religion | `Organization` | `foundingDate`, `founder`, `member`, `slogan` |

### 4.3 Site-Wide Schema

```html
<!-- WebSite -->
{
  "@type": "WebSite",
  "name": "Aetherion Archive",
  "url": "https://aetherion-archive.com",
  "description": "A living encyclopedia of the Aetherion dark fantasy universe.",
  "inLanguage": "en",
  "about": { "@type": "Thing", "name": "Aetherion" },
  "genre": ["dark fantasy", "worldbuilding", "fantasy universe"]
}

<!-- BreadcrumbList -->
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://..." },
    { "@type": "ListItem", "position": 2, "name": "Kingdoms", "item": "https://.../kingdoms/" },
    { "@type": "ListItem", "position": 3, "name": "Kingdom of Eldoria", "item": "https://.../eldoria" }
  ]
}
```

---

## 5. SITEMAP STRATEGY

### 5.1 Sitemap Split

To keep each sitemap under 50KB (Google's recommended limit per file) and enable parallel crawling:

```
sitemap.xml (index)
├── sitemap-kingdoms.xml
├── sitemap-factions.xml
├── sitemap-races.xml
├── sitemap-gods.xml
├── sitemap-artifacts.xml
├── sitemap-spells.xml
├── sitemap-events.xml
├── sitemap-monsters.xml
├── sitemap-cities.xml
├── sitemap-religions.xml
└── sitemap-pillar.xml (homepage + listing pages)
```

### 5.2 Priority Assignment

```
Listing pages (entity type index):     priority="0.9"
Pillar entities (pillarWeight ≥ 8):    priority="0.8"
Standard entities:                      priority="0.6"
Deprecated entities:                    priority="0.1" (or excluded)
Archived entities:                      excluded
```

### 5.3 Sitemap Generation

```typescript
function generateSitemaps(entities: Entity[]): SitemapSet {
  const byType = groupBy(entities, 'type');
  
  const sitemapFiles = [];
  for (const [type, list] of Object.entries(byType)) {
    const urls = list
      .filter(e => e.status === 'active')
      .map(e => ({
        loc: `https://aetherion-archive.com/${type}/${e.id}`,
        lastmod: e.updatedAt,
        priority: e.seo.pillarWeight >= 8 ? '0.8' : '0.6',
        changefreq: 'weekly',
      }));
    
    sitemapFiles.push({
      filename: `sitemap-${type}.xml`,
      urls: renderSitemapXml(urls),
    });
  }
  
  // Pillar sitemap (homepage + all listing pages)
  sitemapFiles.push({
    filename: 'sitemap-pillar.xml',
    urls: [
      { loc: 'https://aetherion-archive.com/', priority: '1.0' },
      ...Object.keys(byType).map(t => ({
        loc: `https://aetherion-archive.com/${t}/`,
        priority: '0.9',
      })),
    ],
  });
  
  // Index
  return {
    indexXml: renderSitemapIndex(sitemapFiles),
    files: sitemapFiles,
  };
}
```

---

## 6. META TAGS (Per Entity)

```html
<title>Kingdom of Eldoria — Aetherion Archive</title>
<meta name="description" content="Explore the Kingdom of Eldoria, the oldest surviving realm in the Aetherion universe...">
<meta name="keywords" content="Eldoria, fantasy kingdom, dark fantasy realm, Celestial Fracture">

<!-- Open Graph -->
<meta property="og:title" content="Kingdom of Eldoria — Aetherion Archive">
<meta property="og:description" content="...">
<meta property="og:type" content="website">
<meta property="og:url" content="https://aetherion-archive.com/kingdoms/kingdom-of-eldoria">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Kingdom of Eldoria — Aetherion Archive">
<meta name="twitter:description" content="...">

<!-- Canonical -->
<link rel="canonical" href="https://aetherion-archive.com/kingdoms/kingdom-of-eldoria">
```

Generated by `SEOMeta.astro` component, consuming entity SEO data.

---

## 7. ROBOTS & CRAWL MANAGEMENT

```txt
# robots.txt
User-agent: *
Allow: /

Sitemap: https://aetherion-archive.com/sitemap.xml
```

Deployed at root, generated during build.

### Crawl Budget Strategy

| Priority | Optimize For |
|---|---|
| Highest | Homepage, listing pages, pillar entities |
| High | Newly generated entities (freshness signal) |
| Standard | All active entities |
| Low | Deprecated entities (exclude from sitemap) |
| None | Archived entities (noindex) |

---

## 8. PERFORMANCE SEO

Since Aetherion Archive is fully static on Cloudflare Pages:

| Factor | Status |
|---|---|
| Core Web Vitals | Static HTML, no JS blockers |
| LCP | Hero content is text, no large images |
| CLS | No dynamic layout shifts |
| INP | No JavaScript interaction on entity pages |
| Mobile | Tailwind responsive by default |
| CDN | Cloudflare global edge cache |
| Compression | Brotli by default |
| HTTP/2 | Cloudflare default |
| Preload | Key CSS inlined |

No JS frameworks on entity pages means near-perfect Lighthouse scores.
