import { EntityType } from '../src/types/entity.js';
import { FallbackChain } from '../src/ai/fallback-chain.js';
import { Pipeline } from '../src/engine/pipeline.js';
import { CANON_DIR } from './helpers.js';
import { loadProviderConfig, createProviders } from './provider-config.js';

async function main() {
  const args = process.argv.slice(2);
  const typeArg = args[0] as EntityType | undefined;
  const nameArg = args[1];

  if (!typeArg) {
    console.error('Usage: npx tsx scripts/generate-one.ts <entity-type> [name-hint]');
    console.error('Types: kingdom, faction, race, god, artifact, spell, event, monster, city, religion');
    process.exit(1);
  }

  const config = loadProviderConfig();
  const providers = createProviders(config);

  const fallback = new FallbackChain();
  const pipeline = new Pipeline(CANON_DIR, fallback);
  pipeline.setProviders(providers);

  try {
    const result = await pipeline.generateOne({
      type: typeArg,
      name: nameArg,
    });

    console.log(`\n--- GENERATED: ${result.entity.name} ---`);
    console.log(`ID: ${result.entity.id}`);
    console.log(`Type: ${result.entity.type}`);
    console.log(`Slug: ${result.entity.slug}`);
    console.log(`Content: ${result.contentPath}`);
    console.log(`Provider: ${result.aiResponse.provider} (${result.aiResponse.model})`);
    console.log(`Tokens: ${result.aiResponse.tokensIn} in / ${result.aiResponse.tokensOut} out`);
    console.log(`Latency: ${result.aiResponse.latencyMs}ms`);
    console.log(`\nExcerpt: ${result.entity.excerpt.slice(0, 200)}`);
    if (result.validation.warnings.length > 0) {
      console.log(`\nWarnings:\n${result.validation.warnings.join('\n')}`);
    }
  } catch (err) {
    console.error('Generation failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
