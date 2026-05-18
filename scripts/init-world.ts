import * as fs from 'node:fs';
import * as path from 'node:path';
import { CANON_DIR } from './helpers.js';
import { writeJSON, appendToJSONL, fileExists } from '../src/engine/jsonl.js';

interface InitOptions {
  name?: string;
  premise?: string;
}

const DEFAULT_NAME = 'Aetherion Archive';
const DEFAULT_PREMISE = `In the Age of Fractured Light, the celestial moon shattered without warning — an event known as the Celestial Fracture. Its fragments rained down across the world, each shard pulsing with raw magical energy.

But the magic came at a terrible price: every spell cast consumes a fragment of the caster's soul. The greater the magic, the greater the cost. Some have bargained away memories, emotions, even their very identity for power.

Now, kingdoms vie for control of the largest fragments. Factions debate whether magic should be regulated or embraced. Cults worship the broken moon, while scholars race to understand the Fracture before the world descends into chaos. The old gods have fallen silent, and new deities rise from the ashes of the old order.

This is the Aetherion Archive — a living record of a world struggling to redefine itself after the sky broke.`;

async function main() {
  const opts: InitOptions = {};
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) opts.name = args[++i];
    if (args[i] === '--premise' && args[i + 1]) opts.name = args[++i];
  }

  if (await fileExists(path.join(CANON_DIR, 'world-core.json'))) {
    console.log('Canon already initialized. Delete world-core.json to reinitialize.');
    return;
  }

  // Create directory structure
  const dirs = [
    CANON_DIR,
    path.join(CANON_DIR, 'entities'),
    path.join(CANON_DIR, 'memory'),
    path.join(CANON_DIR, '..', 'content'),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // World core
  const worldCore = {
    name: opts.name ?? DEFAULT_NAME,
    centralEvent: 'The Celestial Fracture — the moon shattered, releasing uncontrolled magic across the world.',
    premise: opts.premise ?? DEFAULT_PREMISE,
    cosmicLaws: [
      'Magic consumes soul essence — every spell has a permanent cost',
      'Moon fragments amplify magic but accelerate soul erosion',
      'The old gods fell silent after the Fracture',
      'New deities emerge from concentrated magical fallout',
      'Reality is thinnest near impact sites of large fragments',
    ],
    magicSystem: 'Soulmancy — spellcasters draw on ambient magical energy, but every casting erodes a piece of their identity. Minor spells cost fleeting memories or emotions. Major spells can cost years of life, core personality traits, or even physical senses. Moon fragments can be used as a power source, amplifying spells while shielding the caster — but fragment use accelerates the world\'s magical decay.',
  };
  await writeJSON(path.join(CANON_DIR, 'world-core.json'), worldCore);

  // Generation plan
  const generationPlan = {
    distribution: {
      kingdom: { current: 0, target: 8, weight: 1 },
      faction: { current: 0, target: 12, weight: 1.5 },
      race: { current: 0, target: 6, weight: 1 },
      god: { current: 0, target: 10, weight: 1.5 },
      artifact: { current: 0, target: 15, weight: 2 },
      spell: { current: 0, target: 20, weight: 2 },
      event: { current: 0, target: 25, weight: 1.5 },
      monster: { current: 0, target: 15, weight: 1.5 },
      city: { current: 0, target: 12, weight: 1 },
      religion: { current: 0, target: 8, weight: 1.5 },
    },
    currentFocus: null,
    strategy: 'Seed top-down: start with 2 kingdoms, 3 factions, 2 races, 3 gods → then fill events, cities, artifacts, spells, monsters, and religions in waves. Each wave adds depth to existing relationships.',
    gapMultiplier: 1,
  };
  await writeJSON(path.join(CANON_DIR, 'generation-plan.json'), generationPlan);

  // Naming registry
  const namingRegistry = createNamedRegistry();
  await writeJSON(path.join(CANON_DIR, 'naming-registry.json'), namingRegistry);

  // Initial memory snapshot
  const initialMemory = {
    snapshot: 0,
    timestamp: new Date().toISOString(),
    generation: 'system',
    state: {
      currentEra: 'Age of Fractured Light',
      cosmicState: {
        celestialFracture: 'occurred',
        moonFragments: 'scattered',
        magicStability: 'declining',
      },
      majorConflicts: [],
      totalEntities: 0,
      lastEventId: null,
    },
  };
  await writeJSON(path.join(CANON_DIR, 'memory', 'index.json'), { latest: initialMemory, updatedAt: initialMemory.timestamp });
  await appendToJSONL(path.join(CANON_DIR, 'memory', 'journal.jsonl'), initialMemory);

  console.log(`\nInitialized canon at: ${CANON_DIR}`);
  console.log(`World: ${worldCore.name}`);
  console.log(`Entity types: ${Object.keys(generationPlan.distribution).length}`);
  console.log(`Target entities: ${Object.values(generationPlan.distribution).reduce((s, d) => s + d.target, 0)}`);
  console.log('\nReady to generate. Run:');
  console.log('  npx tsx scripts/generate-one.ts kingdom');
  console.log('  npx tsx scripts/generate-one.ts faction');
  console.log('  npx tsx scripts/validate-canon.ts');
}

function createNamedRegistry() {
  return {
    usedNames: {},
    usedSlugs: {},
    patterns: {
      kingdom: { suffix: ['Kingdom', 'Realm', 'Dominion'], style: 'of-construction', examples: ['Kingdom of Eldoria', 'Dominion of Ashen Skies'] },
      faction: { style: 'adjective-noun', examples: ['Order of the Celestial Blade', 'Children of the Void'] },
      race: { style: 'plural-noun', examples: ['Aetherials', 'Voidborn', 'Stonekin'] },
      god: { style: 'name-the-descriptor', examples: ['Nyxara the Shattered', 'Valdris the Soulforge'] },
      artifact: { style: 'of-construction', examples: ['Shard of Eternity', 'Crown of Falling Stars'] },
      spell: { style: 'adjective-noun', examples: ['Soul Erosion', 'Memory Weave', 'Fragment Pulse'] },
      event: { style: 'the-noun', examples: ['The Celestial Fracture', 'The War of Shards'] },
      monster: { style: 'adjective-noun', examples: ['Void Wraith', 'Crystal Golem', 'Soul Leech'] },
      city: { style: 'compound-word', examples: ['Eldor', 'Frosthold', 'Crystal Rest'] },
      religion: { style: 'of-construction', examples: ['Cult of the Broken Moon', 'Church of the Unbroken Light'] },
    },
  };
}

main();
