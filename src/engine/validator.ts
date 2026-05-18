import { Entity, VALID_ENTITY_TYPES } from '../types/entity.js';
import { CanonReader } from './canon-reader.js';
import { buildGraph } from './entity-graph.js';
import { fuzzyMatch } from './naming-registry.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class Validator {
  private reader: CanonReader;

  constructor(reader: CanonReader) {
    this.reader = reader;
  }

  async validate(entity: Entity, isNew = true): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Structural validation
    this.validateStructure(entity, errors, warnings);

    // 2. Type-specific validation
    this.validateByType(entity, errors, warnings);

    if (errors.length > 0) {
      return { valid: false, errors, warnings };
    }

    // 3. Cross-entity validation
    const allEntities = await this.reader.loadAllEntities();
    const currentId = isNew ? null : entity.id;

    this.validateRelationships(entity, allEntities, currentId, errors, warnings);
    this.validateName(entity, allEntities, currentId, errors, warnings);
    this.validateSlug(entity, allEntities, currentId, errors);

    // 4. Lore consistency
    const graph = buildGraph(allEntities);
    this.validateLoreConsistency(entity, graph.nodes, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateStructure(entity: Entity, errors: string[], warnings: string[]): void {
    const required = ['id', 'type', 'name', 'slug', 'description', 'attributes', 'relationships', 'status'];
    for (const field of required) {
      if ((entity as any)[field] === undefined || (entity as any)[field] === null) {
        errors.push(`Missing required field: "${field}"`);
      }
    }

    if (!VALID_ENTITY_TYPES.has(entity.type)) {
      errors.push(`Invalid entity type: "${entity.type}". Valid: ${Array.from(VALID_ENTITY_TYPES).join(', ')}`);
    }

    if (typeof entity.name !== 'string' || entity.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    }

    if (typeof entity.content !== 'string' || entity.content.length < 20) {
      warnings.push('Content is short (under 20 characters)');
    }

    if (!Array.isArray(entity.relationships)) {
      errors.push('Relationships must be an array');
    }

    if (!['active', 'deprecated', 'rewritten', 'archived'].includes(entity.status)) {
      errors.push(`Invalid status: "${entity.status}". Must be one of: active, deprecated, rewritten, archived`);
    }
  }

  private validateByType(entity: Entity, _errors: string[], warnings: string[]): void {
    const attr = entity.attributes;

    switch (entity.type) {
      case 'kingdom':
        if (!attr.capital) warnings.push('Kingdom missing capital city');
        if (!attr.leader) warnings.push('Kingdom missing leader');
        break;
      case 'faction':
        if (!attr.ideology) warnings.push('Faction missing ideology');
        if (!attr.leader) warnings.push('Faction missing leader');
        break;
      case 'god':
        if (!attr.domain) warnings.push('God missing domain');
        if (!attr.alignment) warnings.push('God missing alignment');
        break;
      case 'artifact':
        if (!attr.power) warnings.push('Artifact missing power description');
        break;
      case 'city':
        if (!attr.population && attr.population !== 0) warnings.push('City missing population');
        if (!attr.region) warnings.push('City missing region');
        break;
      case 'spell':
        if (!attr.school) warnings.push('Spell missing school');
        if (!attr.power) warnings.push('Spell missing power level');
        break;
      case 'event':
        if (!attr.date) warnings.push('Event missing date');
        break;
      case 'race':
        if (!attr.lifespan) warnings.push('Race missing lifespan');
        break;
      case 'monster':
        if (!attr.threat_level) warnings.push('Monster missing threat level');
        break;
      case 'religion':
        if (!attr.tenets) warnings.push('Religion missing tenets');
        if (!attr.deity) warnings.push('Religion missing primary deity');
        break;
    }
  }

  private validateRelationships(
    entity: Entity,
    allEntities: Entity[],
    currentId: string | null,
    errors: string[],
    warnings: string[],
  ): void {
    const entityMap = new Map(allEntities.map(e => [e.id, e]));

    for (const rel of entity.relationships) {
      if (!entityMap.has(rel.targetId) && rel.targetId !== currentId) {
        errors.push(`Relationship target "${rel.targetId}" (${rel.type}: "${rel.label}") does not exist`);
      }
      if (!rel.type || rel.type.length === 0) {
        errors.push('Relationship missing type');
      }
    }

    if (entity.relationships.length === 0) {
      warnings.push('Entity has no relationships — it will be isolated in the graph');
    }
  }

  private validateName(
    entity: Entity,
    allEntities: Entity[],
    currentId: string | null,
    errors: string[],
    warnings: string[],
  ): void {
    for (const existing of allEntities) {
      if (existing.id === currentId) continue;
      if (existing.status === 'archived') continue;

      const sim = fuzzyMatch(entity.name, existing.name);
      if (sim >= 1.0) {
        errors.push(`Name "${entity.name}" is identical to existing entity "${existing.name}" (${existing.id})`);
        return;
      }
      if (sim >= 0.85) {
        warnings.push(`Name "${entity.name}" is very similar to "${existing.name}" (${existing.id}) — similarity: ${Math.round(sim * 100)}%`);
      }
    }
  }

  private validateSlug(
    entity: Entity,
    allEntities: Entity[],
    currentId: string | null,
    errors: string[],
  ): void {
    for (const existing of allEntities) {
      if (existing.id === currentId) continue;
      if (existing.slug === entity.slug) {
        errors.push(`Slug "${entity.slug}" already used by "${existing.name}" (${existing.id})`);
        return;
      }
    }
  }

  private validateLoreConsistency(
    entity: Entity,
    nodes: Map<string, Entity>,
    _errors: string[],
    warnings: string[],
  ): void {
    for (const rel of entity.relationships) {
      const target = nodes.get(rel.targetId);
      if (!target) continue;

      if (entity.type === 'god' && target.type === 'religion') {
        if (entity.name !== target.name && entity.name !== target.attributes.deity) {
          warnings.push(`God "${entity.name}" is not the deity of their religion "${target.name}"`);
        }
      }
    }
  }
}
