import { CanonReader } from '../src/engine/canon-reader.js';
import { CanonWriter } from '../src/engine/canon-writer.js';
import { CANON_DIR } from './helpers.js';

async function main() {
  const reader = new CanonReader(CANON_DIR);
  const writer = new CanonWriter(CANON_DIR);

  const memories = await reader.loadMemories();
  if (memories.length === 0) {
    console.log('No memory snapshots to compact.');
    return;
  }

  const latest = memories[memories.length - 1]!;
  const first = memories[0]!;

  const compactedSnapshot = {
    ...latest,
    snapshot: latest.snapshot,
    timestamp: new Date().toISOString(),
    generation: 'compaction',
    state: {
      ...latest.state,
    },
  };

  await writer.writeMemorySnapshot(compactedSnapshot);

  console.log(`Compacted ${memories.length} memory snapshots (from snapshot ${first.snapshot} to ${latest.snapshot}).`);
  console.log(`Previous snapshots remain in journal.jsonl for history.`);
  console.log(`Latest state: ${compactedSnapshot.state.currentEra}, ${compactedSnapshot.state.totalEntities} entities, ${compactedSnapshot.state.majorConflicts.length} active conflicts.`);
}

main();
