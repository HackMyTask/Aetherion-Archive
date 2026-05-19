# Next Steps — Phase 4 (Post-Deployment)

Campaign: "Echoes of the Northern Fracture" — Region: Northern Velkaris
Status: Phase 3 complete. Phase 4 not started.

## Options

### A) Push to GitHub + configure secrets + deploy
- Create GitHub repo (if not existing)
- Push `main` branch
- Add 4 secrets: CF_API_TOKEN, CF_ACCOUNT_ID, GEMINI_API_KEY, GROQ_API_KEY
- Create Cloudflare Pages project `aetherion-archive`
- Trigger first deploy via workflow_dispatch

### B) SEO improvements
- Add sitemap.xml (`pages/sitemap.xml.ts`)
- Add robots.txt
- Add schema.org structured data (WebPage, CreativeWork) to entity pages
- Add Open Graph / Twitter Card meta tags

### C) Generate more entities (target 50+)
- Run `generate-batch` locally or via workflow_dispatch
- Target thin entity types (religions, races, regions)
- Add missing metadata to close warnings (school, power level, threat level, lifespan)

### D) Content quality pass
- Rewrite entities with thin descriptions or content
- Fill in attributes that are empty strings
- Standardize lore tone across all 11 types

---

### Canon status
- 36 unique entities across 11 types
- 174 relationships, 0 orphans, 0 bidirectional gaps
- 1 error (forbidden-moon-rituals placeholder)
- 18 warnings (non-blocking metadata)

### Astro site status
- 48 pages, static output, ~3.9s build time
- Tailwind v4, dark fantasy theme
- GitHub Actions CI/CD ready (pending secrets)
