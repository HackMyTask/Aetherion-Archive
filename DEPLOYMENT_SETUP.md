# Deployment Setup

## Required GitHub Secrets

| Secret | Where to get it |
|--------|----------------|
| `CF_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token (use "Cloudflare Pages" template, grant `Read` + `Write` on `Cloudflare Pages`) |
| `CF_ACCOUNT_ID` | Cloudflare dashboard → right sidebar → Account ID (hex string) |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) → API Keys → Create API Key |
| `GROQ_API_KEY` | [Groq Console](https://console.groq.com/) → API Keys → Create API Key |

## Adding secrets to GitHub

1. Go to repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret from the table above

## Creating Cloudflare Pages project

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Go to **Workers & Pages** → **Pages** → **Create application**
3. Click the **"Direct Upload"** tab (not "Connect to Git" — the GitHub Action handles git)
4. Set project name to `aetherion-archive`
5. No need to upload anything — the GitHub Action will deploy via API
6. (Optional) Configure a custom domain under the project's deployment settings

## Triggering a manual deploy

1. Go to repo → Actions → **Deploy** workflow
2. Click **"Run workflow"** (uses `workflow_dispatch` trigger)
3. Select `main` branch and click **"Run workflow"**

The workflow runs these steps in order:
1. **install** — `npm ci` in root + site/
2. **typecheck** — `tsc --noEmit` on root engine
3. **validate** — `validate-canon.ts` (warns if errors ≤ 5)
4. **build-and-deploy** — `astro build` + upload to Cloudflare Pages

## Triggering a manual canon generation

1. Go to repo → Actions → **Daily Canon Generation** workflow
2. Click **"Run workflow"** (uses `workflow_dispatch` trigger)
3. Select `main` branch and click **"Run workflow"**

The generation workflow:
1. Runs `generate-batch` (creates 5 new entities)
2. Commits any changes to `canon/` and `content/`
3. This push to `main` automatically triggers the **Deploy** workflow

## Automatic triggers

- **Deploy:** Every push to `main`
- **Generation:** Every day at 2:00 AM UTC (configurable in `.github/workflows/generate.yml`)
