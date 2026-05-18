import { readSessionStats, summarizeStats } from '../src/engine/session-stats.js';
import { CANON_DIR } from './helpers.js';

async function main() {
  const entries = await readSessionStats(CANON_DIR);
  if (entries.length === 0) {
    console.log('No session stats recorded yet.');
    return;
  }

  const summary = summarizeStats(entries);
  console.log('=== Session Stats ===');
  console.log(`Sessions:      ${summary.totalSessions}`);
  console.log(`Entries:       ${entries.length}`);
  console.log(`Tokens In:     ${summary.totalTokensIn.toLocaleString()}`);
  console.log(`Tokens Out:    ${summary.totalTokensOut.toLocaleString()}`);
  console.log(`Total Cost:    $${summary.totalCost.toFixed(4)}`);
  console.log('');

  console.log('--- By Provider ---');
  for (const [provider, stat] of Object.entries(summary.byProvider).sort((a, b) => b[1].cost - a[1].cost)) {
    console.log(`  ${provider}: ${stat.count} calls, ${stat.tokensIn.toLocaleString()} in / ${stat.tokensOut.toLocaleString()} out, $${stat.cost.toFixed(4)}`);
  }

  console.log('');
  console.log('--- By Entity Type ---');
  for (const [type, count] of Object.entries(summary.byType).sort(([, a], [, b]) => b - a)) {
    console.log(`  ${type}: ${count}`);
  }
}

main();
