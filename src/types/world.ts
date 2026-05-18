export interface WorldCore {
  name: string;
  centralEvent: string;
  premise: string;
  cosmicLaws: string[];
  magicSystem: string;
}

export interface CosmicState {
  celestialFracture: string;
  moonFragments: string;
  magicStability: string;
}

export interface ConflictState {
  between: string[];
  status: string;
  startEvent?: string;
}

export interface WorldState {
  currentEra: string;
  cosmicState: CosmicState;
  majorConflicts: ConflictState[];
  totalEntities: number;
  lastEventId: string | null;
  currentFocusRegion?: string;
}

export interface WorldMemorySnapshot {
  snapshot: number;
  timestamp: string;
  generation: string;
  state: WorldState;
}

export interface TimelineEntry {
  id: string;
  type: string;
  date: string;
  title: string;
  summary: string;
  significance: number;
  relatedEntities: string[];
}

export interface TypeDistribution {
  current: number;
  target: number;
  weight: number;
}

export interface CurrentFocus {
  episode: string;
  region: string;
  theme: string;
  entityTypes: string[];
  since: string;
  remainingBatch: { type: string; name: string }[];
}

export interface GenerationPlan {
  distribution: Record<string, TypeDistribution>;
  currentFocus: CurrentFocus | null;
  strategy: string;
  gapMultiplier: number;
}

export interface NamingEntry {
  type: string;
  id: string;
  status: string;
}

export interface NamingPatterns {
  prefix?: string[];
  suffix?: string[];
  style: string;
  examples: string[];
}

export interface NamingRegistry {
  usedNames: Record<string, NamingEntry>;
  usedSlugs: Record<string, NamingEntry>;
  patterns: Record<string, NamingPatterns>;
}
