import { FallbackChain } from '../src/ai/fallback-chain.js';
import { Pipeline } from '../src/engine/pipeline.js';
import { CanonReader } from '../src/engine/canon-reader.js';
import { CANON_DIR } from './helpers.js';
import { loadProviderConfig, createProviders } from './provider-config.js';
import { Entity } from '../src/types/entity.js';

async function main() {
  const config = loadProviderConfig();
  const providers = createProviders(config);

  const fallback = new FallbackChain();
  const pipeline = new Pipeline(CANON_DIR, fallback);
  pipeline.setProviders(providers);

  let hasError = false;

  // 1. Validate all entities
  const results = await pipeline.validateAll();
  if (results.length > 0) {
    console.log(`\nValidation issues found in ${results.length} entities:\n`);
    for (const r of results) {
      for (const e of r.errors) {
        console.error(`  ERROR   ${r.entityId}: ${e}`);
        hasError = true;
      }
      for (const w of r.warnings) {
        console.warn(`  WARN    ${r.entityId}: ${w}`);
      }
    }
  } else {
    console.log('All entities pass validation.');
  }

  // 2. Check bidirectional consistency
  const gaps = await pipeline.checkBidirectionalConsistency();
  if (gaps.length > 0) {
    console.log(`\nBidirectional gaps: ${gaps.length}`);
    for (const g of gaps) {
      console.log(`  ${g.from} --[${g.type}]--> ${g.to} (missing reverse)`);
    }
  } else {
    console.log('All bidirectional relationships are consistent.');
  }

  // 3. Count by type
  const reader = new CanonReader(CANON_DIR);
  const allEntities = await reader.loadAllEntities();
  console.log(`\nEntity summary (${allEntities.length} total):`);
  const byType: Record<string, Entity[]> = {};
  for (const e of allEntities) {
    (byType[e.type] ??= []).push(e);
  }
  for (const [type, entities] of Object.entries(byType)) {
    const active = entities.filter(e => e.status !== 'archived').length;
    const archived = entities.length - active;
    console.log(`  ${type}: ${active} active${archived > 0 ? `, ${archived} archived` : ''}`);
  }

  if (hasError) {
    process.exit(1);
  }
}

main();
