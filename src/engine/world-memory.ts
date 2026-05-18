import { Entity } from '../types/entity.js';
import { WorldMemorySnapshot, WorldState } from '../types/world.js';
import { CanonReader } from './canon-reader.js';

export function createInitialWorldState(): WorldState {
  return {
    currentEra: 'Age of Fractured Light',
    cosmicState: {
      celestialFracture: 'occurred',
      moonFragments: 'scattered',
      magicStability: 'declining',
    },
    majorConflicts: [],
    totalEntities: 0,
    lastEventId: null,
  };
}

export function computeNewMemory(
  entity: Entity,
  previous: WorldState | null,
  allEntities: Entity[],
  snapshotNum: number,
): WorldMemorySnapshot {
  const prev = previous ?? createInitialWorldState();

  const newConflicts = [...prev.majorConflicts];

  if (entity.type === 'event') {
    const participants = (entity.attributes.participants as string[]) ?? [];
    if (participants.length >= 2) {
      const existingConflict = newConflicts.find(c =>
        c.between.length === participants.length &&
        c.between.every((p, i) => p === participants[i])
      );
      if (!existingConflict) {
        newConflicts.push({
          between: participants,
          status: 'active',
          startEvent: entity.id,
        });
      }
    }
  }

  const state: WorldState = {
    currentEra: prev.currentEra,
    cosmicState: { ...prev.cosmicState },
    majorConflicts: newConflicts,
    totalEntities: allEntities.length,
    lastEventId: entity.type === 'event' ? entity.id : prev.lastEventId,
  };

  return {
    snapshot: snapshotNum,
    timestamp: new Date().toISOString(),
    generation: entity.generatedBy,
    state,
  };
}

export async function getCurrentWorldState(canonDir: string): Promise<WorldState | null> {
  const reader = new CanonReader(canonDir);
  const latest = await reader.loadLatestMemory();
  return latest?.state ?? null;
}
