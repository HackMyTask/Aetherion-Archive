import { describe, it, expect } from 'vitest';
import { buildGraph, getNeighbors, getTwoHopNeighbors, getInboundLinks, getOutboundLinks, getBidirectionalGaps } from '../../src/engine/entity-graph.js';
import { Entity, EntityType, EntityStatus } from '../../src/types/entity.js';

function makeEntity(id: string, name: string, type: EntityType = EntityType.KINGDOM, relationships: Entity['relationships'] = [], status = EntityStatus.ACTIVE): Entity {
  return {
    id,
    type,
    name,
    slug: id,
    aliases: [],
    status,
    relationships,
    description: `Description of ${name}`,
    excerpt: `Description of ${name}`,
    content: `Full content about ${name}. `.repeat(10),
    attributes: {},
    version: 1,
    generatedBy: 'test',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    seo: { title: name, metaDescription: `About ${name}`, keywords: [type], pillarWeight: 5, topicalCluster: type },
  };
}

describe('buildGraph', () => {
  it('builds graph with nodes and edges from entities', () => {
    const a = makeEntity('ent-1', 'Kingdom A');
    const b = makeEntity('ent-2', 'Kingdom B', EntityType.KINGDOM, [{ targetId: 'ent-1', type: 'at_war_with', label: 'War', bidirectional: true }]);
    const graph = buildGraph([a, b]);

    expect(graph.nodes.size).toBe(2);
    expect(graph.edges.length).toBe(1);
  });

  it('excludes archived entities', () => {
    const a = makeEntity('ent-1', 'Kingdom A', EntityType.KINGDOM, [], EntityStatus.ARCHIVED);
    const b = makeEntity('ent-2', 'Kingdom B', EntityType.KINGDOM, [{ targetId: 'ent-1', type: 'at_war_with', label: 'War', bidirectional: true }]);
    const graph = buildGraph([a, b]);

    expect(graph.nodes.size).toBe(1);
    expect(graph.edges.length).toBe(0);
  });

  it('skips edges pointing to non-existent nodes', () => {
    const a = makeEntity('ent-1', 'Kingdom A', EntityType.KINGDOM, [{ targetId: 'ent-999', type: 'at_war_with', label: 'War', bidirectional: true }]);
    const graph = buildGraph([a]);

    expect(graph.edges.length).toBe(0);
  });
});

describe('getNeighbors', () => {
  it('returns both outbound and inbound neighbors', () => {
    const a = makeEntity('ent-1', 'Kingdom A');
    const b = makeEntity('ent-2', 'Kingdom B', EntityType.KINGDOM, [{ targetId: 'ent-1', type: 'at_war_with', label: 'War', bidirectional: true }]);
    const c = makeEntity('ent-3', 'Kingdom C', EntityType.KINGDOM, [{ targetId: 'ent-2', type: 'allied_with', label: 'Allies', bidirectional: true }]);
    const graph = buildGraph([a, b, c]);

    // ent-2 has inbound from ent-3 and outbound to ent-1
    const neighbors = getNeighbors('ent-2', graph);
    expect(neighbors.map(n => n.id).sort()).toEqual(['ent-1', 'ent-3']);
  });

  it('returns empty array for isolated entity', () => {
    const a = makeEntity('ent-1', 'Isolated');
    const graph = buildGraph([a]);
    expect(getNeighbors('ent-1', graph)).toEqual([]);
  });
});

describe('getTwoHopNeighbors', () => {
  it('returns neighbors of neighbors excluding direct neighbors', () => {
    const a = makeEntity('ent-1', 'Kingdom A');
    const b = makeEntity('ent-2', 'Kingdom B', EntityType.KINGDOM, [{ targetId: 'ent-1', type: 'at_war_with', label: 'War', bidirectional: true }]);
    const c = makeEntity('ent-3', 'Kingdom C', EntityType.KINGDOM, [{ targetId: 'ent-2', type: 'allied_with', label: 'Allies', bidirectional: true }]);
    const graph = buildGraph([a, b, c]);

    // ent-1's direct neighbor: ent-2
    // ent-2's neighbors: ent-1, ent-3
    // two-hop from ent-1 (excluding direct neighbors and self): ent-3
    const twoHop = getTwoHopNeighbors('ent-1', graph);
    expect(twoHop.map(n => n.id)).toEqual(['ent-3']);
  });
});

describe('getInboundLinks', () => {
  it('returns entities that link to the given entity', () => {
    const a = makeEntity('ent-1', 'Kingdom A');
    const b = makeEntity('ent-2', 'Kingdom B', EntityType.KINGDOM, [{ targetId: 'ent-1', type: 'at_war_with', label: 'War of Shards', bidirectional: true }]);
    const graph = buildGraph([a, b]);

    const links = getInboundLinks('ent-1', graph);
    expect(links.length).toBe(1);
    expect(links[0]?.from.id).toBe('ent-2');
    expect(links[0]?.edge.label).toBe('War of Shards');
  });
});

describe('getOutboundLinks', () => {
  it('returns entities the given entity links to', () => {
    const a = makeEntity('ent-1', 'Kingdom A');
    const b = makeEntity('ent-2', 'Kingdom B', EntityType.KINGDOM, [{ targetId: 'ent-1', type: 'at_war_with', label: 'War of Shards', bidirectional: true }]);
    const graph = buildGraph([a, b]);

    const links = getOutboundLinks('ent-2', graph);
    expect(links.length).toBe(1);
    expect(links[0]?.to.id).toBe('ent-1');
  });
});

describe('getBidirectionalGaps', () => {
  it('detects missing reverse relationship', () => {
    const a = makeEntity('ent-1', 'Kingdom A', EntityType.KINGDOM, [
      { targetId: 'ent-2', type: 'contains', label: 'Contains', bidirectional: false },
    ]);
    const b = makeEntity('ent-2', 'City B', EntityType.CITY);
    const graph = buildGraph([a, b]);

    const gaps = getBidirectionalGaps(graph);
    expect(gaps.length).toBe(1);
    expect(gaps[0]).toEqual({ from: 'ent-2', to: 'ent-1', type: 'contained_by' });
  });

  it('returns no gaps when reverse relationship exists', () => {
    const a = makeEntity('ent-1', 'Kingdom A', EntityType.KINGDOM, [
      { targetId: 'ent-2', type: 'contains', label: 'Contains', bidirectional: false },
    ]);
    const b = makeEntity('ent-2', 'City B', EntityType.CITY, [
      { targetId: 'ent-1', type: 'contained_by', label: 'Contained by', bidirectional: false },
    ]);
    const graph = buildGraph([a, b]);

    expect(getBidirectionalGaps(graph)).toEqual([]);
  });

  it('returns no gaps for symmetric relationship types', () => {
    const a = makeEntity('ent-1', 'Kingdom A', EntityType.KINGDOM, [
      { targetId: 'ent-2', type: 'borders', label: 'Borders', bidirectional: true },
    ]);
    const b = makeEntity('ent-2', 'Kingdom B');
    const graph = buildGraph([a, b]);

    expect(getBidirectionalGaps(graph)).toEqual([]);
  });
});
