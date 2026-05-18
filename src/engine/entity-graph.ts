import { Entity } from '../types/entity.js';
import { isBidirectionalPair } from '../types/relationship.js';

export interface GraphEdge {
  from: string;
  to: string;
  type: string;
  label: string;
}

export interface EntityGraph {
  nodes: Map<string, Entity>;
  edges: GraphEdge[];
  adjacency: Map<string, GraphEdge[]>;
  incoming: Map<string, { from: string; edge: GraphEdge }[]>;
}

export function buildGraph(entities: Entity[]): EntityGraph {
  const nodes = new Map<string, Entity>();
  const edges: GraphEdge[] = [];
  const adjacency = new Map<string, GraphEdge[]>();
  const incoming = new Map<string, { from: string; edge: GraphEdge }[]>();

  for (const entity of entities) {
    if (entity.status === 'archived') continue;
    nodes.set(entity.id, entity);
  }

  for (const entity of entities) {
    if (entity.status === 'archived') continue;
    for (const rel of entity.relationships) {
      if (!nodes.has(rel.targetId)) continue;
      const edge: GraphEdge = {
        from: entity.id,
        to: rel.targetId,
        type: rel.type,
        label: rel.label,
      };
      edges.push(edge);

      const fromList = adjacency.get(entity.id) ?? [];
      fromList.push(edge);
      adjacency.set(entity.id, fromList);

      const inList = incoming.get(rel.targetId) ?? [];
      inList.push({ from: entity.id, edge });
      incoming.set(rel.targetId, inList);
    }
  }

  return { nodes, edges, adjacency, incoming };
}

export function getNeighbors(entityId: string, graph: EntityGraph): Entity[] {
  const outEdges = graph.adjacency.get(entityId) ?? [];
  const inEdges = graph.incoming.get(entityId) ?? [];
  const neighborIds = new Set<string>();

  for (const e of outEdges) neighborIds.add(e.to);
  for (const { from } of inEdges) neighborIds.add(from);

  return Array.from(neighborIds)
    .map(id => graph.nodes.get(id))
    .filter((n): n is Entity => n !== undefined);
}

export function getTwoHopNeighbors(entityId: string, graph: EntityGraph): Entity[] {
  const direct = new Set(getNeighbors(entityId, graph).map(e => e.id));
  direct.add(entityId);
  const twoHop: Entity[] = [];

  for (const neighborId of direct) {
    if (neighborId === entityId) continue;
    const neighborNeighbors = getNeighbors(neighborId, graph);
    for (const n of neighborNeighbors) {
      if (!direct.has(n.id) && !twoHop.some(e => e.id === n.id)) {
        twoHop.push(n);
      }
    }
  }

  return twoHop;
}

export function getInboundLinks(entityId: string, graph: EntityGraph): { from: Entity; edge: GraphEdge }[] {
  const inEdges = graph.incoming.get(entityId) ?? [];
  return inEdges
    .map(({ from, edge }) => {
      const entity = graph.nodes.get(from);
      return entity ? { from: entity, edge } : null;
    })
    .filter((x): x is { from: Entity; edge: GraphEdge } => x !== null);
}

export function getOutboundLinks(entityId: string, graph: EntityGraph): { to: Entity; edge: GraphEdge }[] {
  const outEdges = graph.adjacency.get(entityId) ?? [];
  return outEdges
    .map(edge => {
      const entity = graph.nodes.get(edge.to);
      return entity ? { to: entity, edge } : null;
    })
    .filter((x): x is { to: Entity; edge: GraphEdge } => x !== null);
}

export function getBidirectionalGaps(graph: EntityGraph): { from: string; to: string; type: string }[] {
  const gaps: { from: string; to: string; type: string }[] = [];

  for (const edge of graph.edges) {
    const reverseType = isBidirectionalPair(edge.type);
    if (!reverseType) continue;

    const hasReverse = graph.edges.some(
      e => e.from === edge.to && e.to === edge.from && e.type === reverseType
    );
    if (!hasReverse) {
      gaps.push({ from: edge.to, to: edge.from, type: reverseType });
    }
  }

  return gaps;
}
