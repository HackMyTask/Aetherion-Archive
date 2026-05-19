# Aetherion Archive

A self-building fantasy universe website.

---

## 1. What Is Aetherion Archive?

Aetherion Archive is a project that writes a fantasy universe and builds it into a website — automatically.

Here's what happens:

- An AI generates fantasy lore: gods, kingdoms, cities, monsters, spells, and more
- Each piece of lore is saved as a page on a website
- Every page links to related pages — so you can click from a god to their kingdom to the city where they are worshipped
- The whole site is rebuilt every time new lore is added

The end result is a living fantasy encyclopedia. You can browse through it like a wiki, reading about a world that grows and changes over time.

This project is for:
- Fantasy writers who want help exploring a world
- Worldbuilders who want to see their ideas take shape as a website
- Anyone curious about what happens when AI helps build a fictional universe

---

## 2. What You Need Before Starting

You will need to install a few free tools. Each one is linked below.

**Node.js v20+** (https://nodejs.org)
This is the engine that runs the project. Think of it like a car engine — it makes everything go. Download the "LTS" version (the one recommended for most users).

**Git** (https://git-scm.com)
Git is a tool that tracks changes to files. It lets you save versions of your work and upload them to the internet. Download and install the default options.

**VS Code** (https://code.visualstudio.com)
VS Code is a text editor — a program for reading and editing code files. You will use it to open the project and make small changes. Any text editor works, but VS Code is recommended.

**A Google account** (free at https://accounts.google.com)
You need this to get a Gemini API key. An API key is like a password that lets this project talk to Google's AI. It is free.

**A Groq account** (free at https://console.groq.com)
Groq provides a backup AI in case Google is unavailable. Also free.

**A GitHub account** (free at https://github.com)
GitHub stores your code online. You will use it to publish your website to the internet. Free accounts can host public websites.

**A Cloudflare account** (free at https://dash.cloudflare.com)
Cloudflare will host your website so anyone can visit it. The free plan is all you need.

---

## 3. Installation (Step by Step)

### Step 1: Download this project

**Option A (recommended):** Open a terminal and type:

```
git clone https://github.com/YOUR_USERNAME/aetherion-archive
```

Replace `YOUR_USERNAME` with your GitHub username. If you don't have a repo yet, skip this and use Option B.

**Option B:** Click the green "Code" button on the project's GitHub page, then click "Download ZIP". Unzip the file somewhere on your computer.

### Step 2: Open a terminal in the project folder

- **Windows:** Open the folder, click the address bar, type `cmd`, press Enter
- **Mac:** Right-click the folder, select "New Terminal at Folder"
- **VS Code:** Open the folder in VS Code, then go to Terminal > New Terminal

The terminal is where you type commands. You will see a blinking cursor — that is where you type.

### Step 3: Install the project's tools

Type this command and press Enter:

```
npm install
```

This downloads all the helper tools the project needs. You will see lines of text fly by — that is normal. Wait until it finishes (you get your blinking cursor back).

### Step 4: Install the website tools

Type:

```
cd site
npm install
cd ..
```

This does the same thing but for the website part of the project.

### Step 5: Create your settings file

Type:

```
copy .env.example .env
```

(On Mac or Linux, use `cp .env.example .env` instead.)

This creates a settings file where you will put your AI key.

### Step 6: Get your Gemini API key

1. Go to https://aistudio.google.com
2. Sign in with your Google account
3. Click "Get API key" in the left sidebar
4. Click "Create API key"
5. Copy the long string of letters and numbers that appears

### Step 7: Open .env and paste your key

In VS Code, open the .env file you just created. You will see a line that looks like:

```
# GEMINI_API_KEY=your-gemini-key
```

Remove the `#` at the start and replace `your-gemini-key` with the key you copied. It should look like:

```
GEMINI_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

Save the file (Ctrl+S or Cmd+S).

### Step 8: Test the setup

Type:

```
npm run validate:canon
```

If you see "All entities pass validation" or a list of warnings (yellow text) but no errors in red, the project is working correctly.

---

## 4. Generate Your First Entity

Now you can create a new piece of fantasy lore.

### Initialize the world

```
npm run init:world
```

This sets up the world's core rules and naming system. You only need to do this once.

### Generate one entity

```
npx tsx scripts/generate-one.ts god "Your God Name"
```

Replace "Your God Name" with whatever you like — "The Watcher in the Dark", "The Flame That Never Dies", anything fantasy-sounding.

The AI will create a god with:
- A description and backstory
- Relationships to other entities
- Attributes (domains, symbols, etc.)
- Full written lore content

It takes about 10-30 seconds.

### See what was created

Open the folder `canon/entities/gods.jsonl` in VS Code. Each line is one entity stored as data.

For the full written lore, look in `content/gods/`. You will find a markdown file named after your god.

### Build the website

```
cd site
npx astro build
cd ..
```

This builds all the website pages. When it finishes, you will see something like "48 page(s) built".

### Preview the website locally

```
cd site
npx astro preview
```

Open your browser and go to `http://localhost:4321`. You will see your fantasy universe as a live website.

Press Ctrl+C in the terminal to stop the preview.

---

## 5. CLI Commands Reference

| Command | What it does |
|---------|-------------|
| `npm run init:world` | Sets up the fantasy world's core rules and naming system. Run once at the start. |
| `npm run generate:one` | Creates a single new lore entry (use with `npx tsx scripts/generate-one.ts [type] [name]`). |
| `npm run generate:batch` | Creates multiple lore entries at once (5 by default). |
| `npm run validate:canon` | Checks all lore for problems — missing connections, broken references, incomplete data. |
| `npm run retry:failed` | Re-tries generating any lore entries that failed the first time. |
| `npm run session:stats` | Shows how many AI calls were made and what they cost. |
| `npm run compact:memory` | Cleans up the project's memory files so they don't get too large. |

---

## 6. Project Structure

```
aetherion-archive/
├── canon/              Fantasy lore database
├── content/            Written lore pages (one per entity)
├── scripts/            Tools that run the project
├── site/               The website itself
├── src/                The engine that generates lore
├── .github/workflows/  Automatic tasks (daily updates, website deploy)
├── .env                Your settings and API keys
└── DEPLOYMENT_SETUP.md Guide for putting the site online
```

- **canon/** — This is the brain of the project. It stores everything about your fantasy world: entities, timelines, world rules, naming systems.
- **content/** — Each entity gets a full lore page written here. These are markdown files you can read or edit.
- **scripts/** — The command-line tools you use to generate, validate, and manage the project.
- **site/** — The Astro website that turns all the lore into HTML pages. This is what gets deployed online.
- **src/** — The engine behind the scenes. It talks to AI providers, validates data, and manages the lore database.
- **.github/workflows/** — Automations that run daily (generate new lore) and on every update (rebuild and deploy the website).

---

## 7. Deploying Your Website (Making It Live)

Once you are ready to share your fantasy universe with the world, follow these steps.

### Step 1: Create a GitHub repository

1. Go to https://github.com/new
2. Name it `aetherion-archive`
3. Click "Create repository"
4. Do NOT check "Add a README" or ".gitignore" (the project already has them)

### Step 2: Push your code to GitHub

In your terminal, type:

```
git remote add origin https://github.com/YOUR_USERNAME/aetherion-archive.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Set up Cloudflare Pages

Cloudflare will host your website for free. See `DEPLOYMENT_SETUP.md` in this project for step-by-step instructions on:

- Creating a Cloudflare Pages project
- Getting your Cloudflare API token
- Finding your Cloudflare account ID

### Step 4: Add your secrets to GitHub

Go to your GitHub repository, click **Settings > Secrets and variables > Actions**. Add these four secrets:

| Secret name | What it is |
|-------------|-----------|
| `CF_API_TOKEN` | Your Cloudflare API token (from Step 3) |
| `CF_ACCOUNT_ID` | Your Cloudflare account ID (from Step 3) |
| `GEMINI_API_KEY` | Your Google AI key (from Installation Step 6) |
| `GROQ_API_KEY` | Your Groq API key (free from console.groq.com) |

### Step 5: Trigger the first deploy

1. Go to your GitHub repository
2. Click the **Actions** tab
3. Click **Deploy** in the left sidebar
4. Click **Run workflow**
5. Select `main` branch and click **Run workflow**

The workflow will run through several steps. When it finishes (a few minutes), your site is live.

### Step 6: Visit your website

Open:

```
https://aetherion-archive.pages.dev
```

That is your fantasy universe, online and live.

---

## 8. Automatic Daily Updates

Once deployed, the project can generate new lore every day without you doing anything.

**What happens:**
- Every day at 2:00 AM UTC, the system automatically generates 5 new lore entries
- These are saved to the canon database and content folder
- The changes are committed and pushed to GitHub
- This triggers a website rebuild, so your site is always up to date

**You do not need to do anything.** The system handles everything.

**To change the schedule:**
Open `.github/workflows/generate.yml` and find the line:

```yaml
- cron: "0 2 * * *"
```

The `2` means 2 AM UTC. Change it to whatever hour you prefer.

**To trigger a manual update:**
1. Go to your GitHub repository
2. Click **Actions**
3. Click **Daily Canon Generation**
4. Click **Run workflow**

This runs the generation immediately, even outside the scheduled time.

---

## 9. Troubleshooting

**"npm: command not found"**
Node.js is not installed. Go to https://nodejs.org, download the LTS version, install it, and restart your terminal.

**"Cannot find .env"**
You forgot to copy the settings file. Type `copy .env.example .env` (Windows) or `cp .env.example .env` (Mac/Linux) and try again.

**"API key invalid" or "API key not found"**
Your key was not pasted correctly into the `.env` file. Open `.env` in VS Code and make sure the line looks like `GEMINI_API_KEY=AIza...` with no spaces, no quotes, and no `#` at the start.

**"0 entities generated"**
The API key is missing or incorrect. Check your `.env` file and run `npm run validate:canon` to test it.

**"Build failed"**
Run `npm run validate:canon` first to check for errors. If there are errors in the lore data, the website cannot build. Fix the errors (or remove the problematic entity) and try again.

**"Site not updating"**
Go to your GitHub repository, click the **Actions** tab, and look for any failed workflows. Click on a failed run to see what went wrong. Common causes: API key expired, Cloudflare token expired, or the daily generation created lore with errors.

---

## 10. FAQ

**Q: Do I need to pay for anything?**

A: No. Everything you need is free:
- Google Gemini API: Free tier (plenty for this project)
- Groq API: Free tier
- GitHub: Free for public repositories
- Cloudflare Pages: Free plan
- Node.js, Git, VS Code: All free and open source

The AI generation uses Google's free tier, which has generous limits. If you ever hit the limit, Groq kicks in as a backup.

**Q: How many pages will my site have?**

A: Every entity becomes one page. If you have 36 entities, you get 36 entity pages plus 11 type index pages (one for each category) plus a homepage — that is 48 pages total. Every time you generate new entities, new pages appear automatically.

**Q: Can I change the fantasy universe theme?**

A: Yes. Open `canon/world-core.json` in VS Code. You will see the world's name, central event, premise, and magical rules. Edit these to change the world's direction. The next entity you generate will follow the new rules.

**Q: How do I add entities manually?**

A: You can write lore directly into the JSONL files in `canon/entities/` or the markdown files in `content/`. Each line in a JSONL file is one entity. If you edit these files, run `npm run validate:canon` to check for issues, then rebuild with `cd site && npx astro build`.

**Q: How do I stop the daily generation?**

A: Go to your GitHub repository, click **Actions**, click **Daily Canon Generation**, click the three dots (...) in the top right, and select **Disable workflow**. You can re-enable it anytime.

**Q: What if the AI generates something wrong?**

A: Each entity has a status: `active`, `deprecated`, `rewritten`, or `archived`. If you don't like an entity, you can set its status to `archived` in the JSONL file. It will remain in the database but won't appear on the website as prominently. You can also delete it entirely, or generate a replacement and mark the old one as `rewritten`.

**Q: Can I customize the website's look?**

A: The website uses a dark fantasy theme by default (dark background, lunar blue accents, silver text). If you know CSS, you can edit `site/src/styles.css` and `site/src/layouts/BaseLayout.astro` to change colors, fonts, and layout. If you are just getting started, the default theme looks great as-is.
