import { EntityType } from '../src/types/entity.js';
import { FallbackChain } from '../src/ai/fallback-chain.js';
import { Pipeline } from '../src/engine/pipeline.js';
import { readDeadLetter, removeFromDeadLetter } from '../src/engine/dead-letter.js';
import { CANON_DIR } from './helpers.js';
import { loadProviderConfig, createProviders } from './provider-config.js';

async function main() {
  const config = loadProviderConfig();
  const providers = createProviders(config);

  const fallback = new FallbackChain();
  const pipeline = new Pipeline(CANON_DIR, fallback);
  pipeline.setProviders(providers);

  const entries = await readDeadLetter(CANON_DIR);

  if (entries.length === 0) {
    console.log('No failed generations to retry.');
    return;
  }

  console.log(`Found ${entries.length} failed generation(s) to retry:`);
  for (const entry of entries) {
    console.log(`  [${entry.type}] ${entry.nameHint ?? '(unnamed)'} — ${entry.lastError}`);
  }

  let successes = 0;
  let failures = 0;

  for (const entry of entries) {
    console.log(`\nRetrying ${entry.type}${entry.nameHint ? ` "${entry.nameHint}"` : ''}...`);
    try {
      const result = await pipeline.generateOne({
        type: entry.type as EntityType,
        name: entry.nameHint,
      });
      if (result !== null) {
        console.log(`  ✓ Generated ${result.entity.name} (${result.entity.id})`);
        await removeFromDeadLetter(CANON_DIR, entry.id);
        successes++;
      } else {
        console.error(`  ✗ Failed again`);
        failures++;
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err instanceof Error ? err.message : String(err)}`);
      failures++;
    }
  }

  console.log(`\nDone. ${successes} succeeded, ${failures} remaining.`);
  if (failures > 0) {
    process.exit(1);
  }
}

main();
