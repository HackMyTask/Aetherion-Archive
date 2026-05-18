import { FallbackChain } from '../src/ai/fallback-chain.js';
import { Pipeline } from '../src/engine/pipeline.js';
import { CANON_DIR } from './helpers.js';
import { loadProviderConfig, createProviders } from './provider-config.js';

async function main() {
  const config = loadProviderConfig();
  const providers = createProviders(config);

  const fallback = new FallbackChain();
  const pipeline = new Pipeline(CANON_DIR, fallback);
  pipeline.setProviders(providers);

  const plan = await pipeline.generateBatchFromPlan();
  console.log(`Generated ${plan.length} entities from plan`);
  for (const result of plan) {
    console.log(`  ${result.entity.type}: ${result.entity.name} (${result.contentPath})`);
  }
}

main();
