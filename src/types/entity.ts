export enum EntityType {
  KINGDOM = 'kingdom',
  FACTION = 'faction',
  RACE = 'race',
  GOD = 'god',
  ARTIFACT = 'artifact',
  SPELL = 'spell',
  EVENT = 'event',
  MONSTER = 'monster',
  CITY = 'city',
  RELIGION = 'religion',
}

export const ENTITY_TYPES: EntityType[] = Object.values(EntityType);

export function entityTypeDir(type: EntityType): string {
  const plural: Record<EntityType, string> = {
    [EntityType.KINGDOM]: 'kingdoms',
    [EntityType.FACTION]: 'factions',
    [EntityType.RACE]: 'races',
    [EntityType.GOD]: 'gods',
    [EntityType.ARTIFACT]: 'artifacts',
    [EntityType.SPELL]: 'spells',
    [EntityType.EVENT]: 'events',
    [EntityType.MONSTER]: 'monsters',
    [EntityType.CITY]: 'cities',
    [EntityType.RELIGION]: 'religions',
  };
  return plural[type];
}

export enum EntityStatus {
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  REWRITTEN = 'rewritten',
  ARCHIVED = 'archived',
}

export interface Relationship {
  targetId: string;
  type: string;
  label: string;
  bidirectional: boolean;
}

export interface SEOData {
  title: string;
  metaDescription: string;
  keywords: string[];
  pillarWeight: number;
  topicalCluster: string;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  slug: string;
  aliases: string[];
  status: EntityStatus;
  relationships: Relationship[];
  excerpt: string;
  content: string;
  attributes: Record<string, unknown>;
  version: number;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
  seo: SEOData;
  supersededBy?: string;
}

export function createEntityId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function entityTypeLabel(type: EntityType): string {
  const labels: Record<EntityType, string> = {
    [EntityType.KINGDOM]: 'kingdom',
    [EntityType.FACTION]: 'faction',
    [EntityType.RACE]: 'race',
    [EntityType.GOD]: 'god',
    [EntityType.ARTIFACT]: 'artifact',
    [EntityType.SPELL]: 'spell',
    [EntityType.EVENT]: 'event',
    [EntityType.MONSTER]: 'monster',
    [EntityType.CITY]: 'city',
    [EntityType.RELIGION]: 'religion',
  };
  return labels[type];
}

export const VALID_ENTITY_TYPES: ReadonlySet<string> = new Set(ENTITY_TYPES.map(t => t as string));
