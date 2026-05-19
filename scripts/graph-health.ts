import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const canonDir = "canon/entities";
const files = readdirSync(canonDir).filter(f => f.endsWith(".jsonl"));
const entities: Array<{ id: string; type: string; name: string; relationships: any[] }> = [];

for (const file of files) {
  const lines = readFileSync(join(canonDir, file), "utf-8").trim().split("\n").filter(Boolean);
  const seen = new Set<string>();
  for (const line of lines) {
    try {
      const e = JSON.parse(line);
      if (!seen.has(e.id)) {
        seen.add(e.id);
        entities.push(e);
      }
    } catch {}
  }
}

const relCounts = entities.map(e => ({
  id: e.id,
  type: e.type,
  name: e.name,
  count: e.relationships?.length || 0,
}));

relCounts.sort((a, b) => b.count - a.count);

console.log("=== GRAPH HEALTH ===");
console.log(`Unique entities: ${entities.length}`);
console.log(`Total relationships: ${relCounts.reduce((s, r) => s + r.count, 0)}`);
console.log(`Avg relationships/entity: ${(relCounts.reduce((s, r) => s + r.count, 0) / relCounts.length).toFixed(2)}`);

console.log("\n--- Top 3 (most relationships) ---");
for (const r of relCounts.slice(0, 3)) {
  console.log(`  ${r.id} (${r.type}): ${r.count} relationships`);
}

console.log("\n--- Bottom 3 (fewest relationships) ---");
for (const r of relCounts.filter(r => r.count > 0).slice(-3).reverse()) {
  console.log(`  ${r.id} (${r.type}): ${r.count} relationships`);
}

const orphans = relCounts.filter(r => r.count === 0);
if (orphans.length > 0) {
  console.log(`\n--- ORPHANS (0 relationships) ---`);
  for (const o of orphans) console.log(`  ${o.id} (${o.type})`);
} else {
  console.log("\n--- Orphans: NONE ---");
}

const types = new Map<string, number>();
for (const e of entities) {
  types.set(e.type, (types.get(e.type) || 0) + 1);
}
console.log("\n--- Entity types ---");
for (const [t, c] of types) console.log(`  ${t}: ${c}`);
