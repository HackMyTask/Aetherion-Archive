import { Entity } from '../types/entity.js';
import { CanonReader } from './canon-reader.js';
import { CanonWriter } from './canon-writer.js';

export function renderEntityFrontmatter(entity: Entity, allEntities: Entity[]): string {
  const related = entity.relationships
    .map(r => {
      const target = allEntities.find(e => e.id === r.targetId);
      return target ? `  - ${target.slug}` : null;
    })
    .filter(Boolean)
    .join('\n');

  return `---
title: "${entity.name}"
type: ${entity.type}
id: ${entity.id}
slug: ${entity.slug}
status: ${entity.status}
generated: ${entity.generatedBy}
created: ${entity.createdAt}
relations:
${related}
---`;
}

export function renderEntityBody(entity: Entity, allEntities: Entity[]): string {
  const lines: string[] = [];
  lines.push(`# ${entity.name}`);
  lines.push('');

  function linkify(text: string): string {
    return text.replace(/\[\[([^\]]+)\]\]/g, (_, name: string) => {
      const target = allEntities.find(e => e.name === name || e.slug === name);
      if (target) {
        return `[${name}](/content/${target.type}/${target.slug})`;
      }
      return name;
    });
  }

  lines.push(linkify(entity.content));
  lines.push('');

  // Attributes table for structured data
  const attrKeys = Object.keys(entity.attributes);
  if (attrKeys.length > 0) {
    lines.push('## Attributes');
    lines.push('');
    lines.push('| Attribute | Value |');
    lines.push('|-----------|-------|');
    for (const [key, value] of Object.entries(entity.attributes)) {
      const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const display = typeof value === 'object' ? JSON.stringify(value) : String(value);
      lines.push(`| ${label} | ${linkify(display)} |`);
    }
    lines.push('');
  }

  // Relationships section
  if (entity.relationships.length > 0) {
    lines.push('## Relationships');
    lines.push('');

    const byType: Record<string, typeof entity.relationships> = {};
    for (const rel of entity.relationships) {
      (byType[rel.type] ??= []).push(rel);
    }

    for (const [type, rels] of Object.entries(byType)) {
      const typeLabel = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      lines.push(`### ${typeLabel}`);
      for (const rel of rels) {
        const target = allEntities.find(e => e.id === rel.targetId);
        const link = target
          ? `[${rel.label || target.name}](/content/${target.type}/${target.slug})`
          : rel.label || rel.targetId;
        lines.push(`- ${link}`);
      }
      lines.push('');
    }
  }

  // SEO metadata
  lines.push('<!--');
  lines.push(`  Entity: ${entity.name}`);
  lines.push(`  Type: ${entity.type}`);
  lines.push(`  Generated: ${entity.generatedBy} on ${entity.createdAt}`);
  lines.push('-->');

  return lines.join('\n');
}

export function renderFullPage(entity: Entity, allEntities: Entity[]): string {
  return `${renderEntityFrontmatter(entity, allEntities)}

${renderEntityBody(entity, allEntities)}
`;
}

export async function renderAllEntityPages(
  reader: CanonReader,
  writer: CanonWriter,
): Promise<{ slug: string; type: string }[]> {
  const allEntities = await reader.loadAllEntities();
  const written: { slug: string; type: string }[] = [];

  for (const entity of allEntities) {
    if (entity.status === 'archived') continue;
    const markdown = renderFullPage(entity, allEntities);
    await writer.writeContent(entity.type, entity.slug, markdown);
    written.push({ slug: entity.slug, type: entity.type });
  }

  return written;
}
