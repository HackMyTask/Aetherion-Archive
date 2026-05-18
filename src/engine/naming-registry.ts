import { NamingRegistry } from '../types/world.js';

export function createEmptyRegistry(): NamingRegistry {
  return {
    usedNames: {},
    usedSlugs: {},
    patterns: {
      kingdom: { suffix: ['Kingdom', 'Realm', 'Dominion'], style: 'of-construction', examples: ['Kingdom of Eldoria'] },
      faction: { style: 'adjective-noun', examples: ['Order of the Celestial Blade'] },
      race: { style: 'plural-noun', examples: ['Aetherials', 'Voidborn'] },
      god: { style: 'name-the-descriptor', examples: ['Nyxara the Shattered'] },
      artifact: { style: 'of-construction', examples: ['Shard of Eternity'] },
      spell: { style: 'adjective-noun', examples: ['Soul Erosion'] },
      event: { style: 'the-noun', examples: ['The Celestial Fracture'] },
      monster: { style: 'adjective-noun', examples: ['Void Wraith'] },
      city: { style: 'compound-word', examples: ['Eldor', 'Frosthold'] },
      religion: { style: 'of-construction', examples: ['Cult of the Broken Moon'] },
    },
  };
}

export function fuzzyMatch(a: string, b: string): number {
  const an = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const bn = b.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (an === bn) return 1.0;
  if (an.includes(bn) || bn.includes(an)) return 0.8;

  const len = Math.max(an.length, bn.length);
  const dist = levenshtein(an, bn);
  return 1 - dist / len;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
    }
  }
  return dp[m]![n]!;
}

export interface NameCheckResult {
  available: boolean;
  conflict?: string;
  similarity: number;
}

export function checkNameAvailable(registry: NamingRegistry, name: string): NameCheckResult {
  const lower = name.toLowerCase();

  for (const [usedName, entry] of Object.entries(registry.usedNames)) {
    const sim = fuzzyMatch(usedName, lower);
    if (sim >= 1.0) {
      return { available: false, conflict: `Exact match: "${usedName}" (${entry.type}: ${entry.id})`, similarity: sim };
    }
    if (sim >= 0.85) {
      return { available: false, conflict: `Close match: "${usedName}" (${entry.type}: ${entry.id})`, similarity: sim };
    }
  }

  return { available: true, similarity: 0 };
}

export function checkSlugAvailable(registry: NamingRegistry, slug: string): NameCheckResult {
  if (registry.usedSlugs[slug]) {
    return {
      available: false,
      conflict: `Slug "${slug}" already used by ${registry.usedSlugs[slug]!.type}: ${registry.usedSlugs[slug]!.id}`,
      similarity: 1.0,
    };
  }
  return { available: true, similarity: 0 };
}

export function registerName(registry: NamingRegistry, name: string, id: string, type: string): void {
  const lower = name.toLowerCase();
  registry.usedNames[lower] = { type, id, status: 'active' };
}

export function registerSlug(registry: NamingRegistry, slug: string, name: string, type: string): void {
  registry.usedSlugs[slug] = { type, id: name, status: 'active' };
}
