# Next Steps — IMMEDIATE NEXT SESSION

## 1 task only: Fix context-assembler.ts token bloat

**Why:** `ContextAssembler` currently injects ALL 36 canon entities into every generation prompt. This uses ~1500–2000 tokens per call. At 100+ entities this will exhaust daily token limits on all providers.

**Required changes in `src/engine/context-assembler.ts`:**

Add function:
```typescript
getRelevantContext(entityType: string, hints?: string[]): Entity[]
```

- Max **15 entities** injected into prompt (not all canon)
- Top 10 by relationship count always included
- `world-core.json` always included
- Campaign / generation context always included
- Remaining slots filled with type-relevant neighbors

---

### Canon status
- 36 unique entities across 11 types
- 182 relationships, 0 orphans, 0 bidirectional gaps
- 1 error (forbidden-moon-rituals placeholder)
- 18 warnings (non-blocking metadata)

### Site
- LIVE at aetherion-archive.pages.dev
- 49 pages, static output, ~5s build time
- Tailwind v4, dark fantasy theme
- Cloudflare Pages auto-deploys on push to master

### Generation
- 3x/day via GitHub Actions (2am/9am/3pm UTC)
- Rotating provider strategy (balanced/cheap/quality)
- 429 → backoff → fall through
- Manual trigger with provider + count options
