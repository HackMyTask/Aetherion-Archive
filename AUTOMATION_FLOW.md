# AETHERION ARCHIVE — Automation & Workflow

## 1. WORKFLOW OVERVIEW

Four GitHub Actions workflows manage the entire lifecycle:

```
DAILY (03:00 UTC)              WEEKLY (Sunday 04:00 UTC)
  ┌──────────────┐               ┌──────────────────┐
  │ daily-seed   │               │ weekly-maintenance│
  │ - generate 1-│               │ - rewire links   │
  │   3 entities  │               │ - rebuild content │
  │ - PR if new  │               │ - PR if changes  │
  └──────┬───────┘               └──────────────────┘
         │
         ▼
PR CREATED ──────────────────────────────────────────────┐
         │                                               │
         ▼                                               ▼
  ┌──────────────┐                               ┌──────────────┐
  │ validate     │                               │ build-deploy  │
  │ (on PR)      │                               │ (on main)    │
  │ - canon check│                               │ - npm build  │
  │ - tests      │                               │ - CF Pages   │
  │ - comment    │                               │   deploy     │
  └──────┬───────┘                               └──────────────┘
         │                                            ▲
         ▼                                            │
  Manual review + merge ─────────────────────────────┘
```

---

## 2. WORKFLOW: `daily-seed.yml`

### Trigger
- Scheduled: `0 3 * * *` (daily at 03:00 UTC)
- Manual: `workflow_dispatch` with parameters (type, count, focus override)

### Behavior

```yaml
name: Daily Entity Generation

on:
  schedule:
    - cron: '0 3 * * *'
  workflow_dispatch:
    inputs:
      entityType:
        description: 'Entity type to generate (omit for auto-select)'
        type: choice
        options: [auto, kingdom, faction, race, god, artifact, spell, event, monster, city, religion]
      count:
        description: 'Number of entities to generate'
        type: number
        default: 2
      focus:
        description: 'Thematic focus override'
        type: string
        required: false

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      
      - name: Generate entities
        run: npm run generate:batch
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
          # All keys optional — pipeline uses available ones via fallback chain
      
      - name: Validate generated canon
        run: npm run validate:canon
        continue-on-error: true  # Warnings don't block
      
      - name: Check for changes
        id: changes
        run: |
          if git diff --quiet; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
          fi
      
      - name: Create Pull Request
        if: steps.changes.outputs.has_changes == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: "auto: daily seed $(date +'%Y-%m-%d')"
          title: "auto: daily seed — ${{ steps.generated.outputs.summary }}"
          body: |
            ## Automated Entity Generation
            
            Generated ${{ steps.generated.outputs.count }} new entities.
            
            ### Distribution
            ${{ steps.generated.outputs.distribution }}
            
            ### Warnings
            ${{ steps.generated.outputs.warnings }}
            
            Review and merge if canon checks pass.
          branch: auto/daily-seed
          base: main
          labels: auto-generated
```

### Generation Step (`npm run generate:batch`)

```bash
# scripts/generate-batch.ts
# Reads generation-plan.json
# Calls weighted selector
# Generates 1-3 entities
# Updates all canon files
# Prints summary
```

---

## 3. WORKFLOW: `validate.yml`

### Trigger
- `pull_request` (all PRs to main)

### Checks

```yaml
name: Validate Canon

on:
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      
      - name: Canon validation
        run: npm run validate:canon
        # Exits non-zero on structural errors
        # Warnings printed but don't fail CI
      
      - name: TypeScript check
        run: npm run typecheck
      
      - name: Run tests
        run: npm test
      
      - name: Post PR comment
        uses: actions/github-script@v7
        with:
          script: |
            const output = require('./canon-validator-output.json');
            const summary = [
              `### Canon Validation Report`,
              ``,
              `**Entities:** ${output.totalEntities}`,
              `**Errors:** ${output.errors.length}`,
              `**Warnings:** ${output.warnings.length}`,
              `**Link density avg:** ${output.avgLinksPerEntity}`,
              ``,
              output.errors.length > 0 ? '❌ **Blocking errors found**' : '✅ **Canon valid**',
            ].join('\n');
            
            github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body: summary,
            });
```

---

## 4. WORKFLOW: `build-deploy.yml`

### Trigger
- Push to `main`
- `workflow_dispatch`

### Steps

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      
      - name: Validate canon
        run: npm run validate:canon
      
      - name: Build static site
        run: npm run build
        # Astro outputs to dist/
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    
    environment:
      name: cloudflare
      url: ${{ steps.deployment.outputs.url }}
    
    steps:
      - name: Deploy to Cloudflare Pages
        id: deployment
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          command: pages deploy dist/ --project-name=aetherion-archive
```

---

## 5. WORKFLOW: `weekly-maintenance.yml`

### Trigger
- Scheduled: `0 4 * * 0` (Sunday 04:00 UTC)
- `workflow_dispatch`

### Steps

```yaml
name: Weekly Maintenance

on:
  schedule:
    - cron: '0 4 * * 0'
  workflow_dispatch:

jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      - run: npm ci
      
      - name: Rewire internal links
        run: npm run rewire-links
        # Refreshes all content markdown with updated relationships
      
      - name: Update world memory
        run: npm run update-world-memory
        # Recomputes world state from all entities
      
      - name: Run SEO audit
        run: npm run seo-audit
        # Generates seo-audit-report.md
      
      - name: Check for changes
        id: changes
        run: |
          if git diff --quiet; then
            echo "has_changes=false" >> $GITHUB_OUTPUT
          else
            echo "has_changes=true" >> $GITHUB_OUTPUT
          fi
      
      - name: Create maintenance PR
        if: steps.changes.outputs.has_changes == 'true'
        uses: peter-evans/create-pull-request@v6
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: "chore: weekly maintenance $(date +'%Y-%m-%d')"
          title: "chore: weekly maintenance — $(date +'%Y-%m-%d')"
          body: "Link refresh and world memory update."
          branch: auto/weekly-maintenance
          base: main
          labels: auto-generated, maintenance
```

---

## 6. NPM SCRIPTS

```json
{
  "scripts": {
    "seed": "tsx scripts/seed-world.ts",
    "generate:one": "tsx scripts/generate-one.ts",
    "generate:batch": "tsx scripts/generate-batch.ts",
    "validate:canon": "tsx scripts/validate-canon.ts",
    "rewire-links": "tsx scripts/rewire-links.ts",
    "update:world-memory": "tsx scripts/update-world-memory.ts",
    "seo-audit": "tsx scripts/seo-audit.ts",
    "build": "astro build",
    "dev": "astro dev",
    "preview": "astro preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

---

## 7. GENERATION FLOW (Detailed)

### 7.1 Daily Seed Flow

```
1. START
   ├── Read generation-plan.json
   ├── Read world-memory (latest from journal)
   ├── Load entity counts from JSONL files
   └── Update plan.distribution with current counts

2. FOR EACH ENTITY TO GENERATE:
   ├── a. Select type (weighted random + focus bonus)
   ├── b. Generate or pick name from batch queue
   ├── c. Assemble context (world memory + neighbors + rules + prompts)
   ├── d. Call AI (try providers in priority order, skip dead providers)
   ├── e. POST-PROCESS: parse JSON, resolve refs, normalize names
   ├── f. VALIDATE: check against canon (warnings only)
   ├── g. COMMIT:
   │   ├── Append to entities/{type}.jsonl
   │   ├── Write content/{type}s/{slug}.md
   │   ├── Update naming-registry.json
   │   ├── Append world-memory snapshot
   │   ├── If event: append to timeline.jsonl
   │   └── Update generation-plan.json weights
   └── h. Log result (success/skip/warnings)

3. END
   ├── Generate summary
   ├── Print distribution table
   └── Exit (0 = has changes, 1 = no changes)
```

### 7.2 Commit Sequencing (Safety)

```typescript
async function safeCommit(entity: Entity): Promise<void> {
  // 1. Write to TEMP location first
  await writeTemp(entity);
  
  // 2. Verify the written data is valid
  const written = await readTemp(entity.id);
  if (!isValid(written)) {
    await rollbackTemp(entity.id);
    throw new Error('Commit verification failed');
  }
  
  // 3. Atomic rename to final location
  await atomicMove(entity);
  
  // 4. Update derived files
  await appendToJSONL('canon/memory/journal.jsonl', newMemoryState);
  await writeJSON('canon/memory/index.json', { latest: newMemoryState });
  
  // 5. Update registry and plan
  namingRegistry.addName(entity.name, entity.id, entity.type);
  plan.distribution[entity.type].current += 1;
  await writeJSON('canon/generation-plan.json', plan);
}
```

---

## 8. DISASTER RECOVERY

### Scenario | Recovery
|---|---|
| Canon corruption on disk | `git checkout -- canon/` to restore last good state |
| AI generates nonsense | PR review catches; reject PR, no production impact |
| Provider outage (all 4) | Pipeline logs "all providers failed", entity skipped, no crash |
| Naming collision | Auto-suffix, human renames in review |
| Schema evolution | Migration script reads old JSONL format → writes new format |
| World memory contradiction | Rollback to previous snapshot in journal.jsonl |

### Rollback Procedure

```bash
# 1. Find the snapshot to rollback to
tail -n 1 canon/memory/journal.jsonl     # current
head -n -5 canon/memory/journal.jsonl    # remove last 5 states

# 2. Restore entity files from git
git checkout HEAD~1 -- canon/entities/

# 3. Rebuild
npm run build
```

---

## 9. ENVIRONMENT VARIABLES

```
# Required for generation (at least one)
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
OPENROUTER_API_KEY=sk-or-...

# Required for deploy
CF_API_TOKEN=...
CF_ACCOUNT_ID=...
CF_PROJECT_NAME=aetherion-archive

# Optional
LOG_LEVEL=info                    # debug | info | warn | error
GENERATION_MAX_TOKENS=4000
GENERATION_TEMPERATURE=0.7
```

All stored as GitHub Actions secrets. Never in `.env` files committed to repo.
