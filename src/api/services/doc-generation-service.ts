// Sprint 25: Auto-generated documentation for agents and swarms
import type { Swarm, Agent, Relationship, LayerDefinition } from '../../shared/types/index.js';

export function generateSwarmMarkdown(swarm: Swarm): string {
  const lines: string[] = [];

  lines.push(`# ${swarm.name}`);
  lines.push('');
  lines.push(swarm.description || 'No description provided.');
  lines.push('');
  lines.push(`- **ID**: ${swarm.id}`);
  lines.push(`- **Version**: ${swarm.version}`);
  lines.push(`- **Agents**: ${swarm.agents.length}`);
  lines.push(`- **Relationships**: ${swarm.relationships.length}`);
  lines.push(`- **Layers**: ${swarm.layers.length}`);
  if (swarm.templateSource) lines.push(`- **Template**: ${swarm.templateSource}`);
  lines.push(`- **Created**: ${swarm.createdAt}`);
  lines.push(`- **Updated**: ${swarm.updatedAt}`);
  lines.push('');

  // Layer overview
  lines.push('## Layers');
  lines.push('');
  lines.push('| Layer | Agents | Color |');
  lines.push('|-------|--------|-------|');
  for (const layer of swarm.layers.sort((a, b) => a.order - b.order)) {
    const count = swarm.agents.filter(a => a.layerId === layer.id).length;
    lines.push(`| ${layer.name} | ${count} | ${layer.colorTheme} |`);
  }
  lines.push('');

  // Agent catalog
  lines.push('## Agents');
  lines.push('');
  for (const layer of swarm.layers.sort((a, b) => a.order - b.order)) {
    const layerAgents = swarm.agents.filter(a => a.layerId === layer.id);
    if (layerAgents.length === 0) continue;

    lines.push(`### ${layer.name}`);
    lines.push('');
    for (const agent of layerAgents) {
      lines.push(generateAgentSection(agent, swarm));
    }
  }

  // Relationship matrix
  lines.push('## Relationships');
  lines.push('');
  lines.push(`Total: ${swarm.relationships.length}`);
  lines.push('');

  const byType = groupBy(swarm.relationships, r => r.type);
  for (const [type, rels] of Object.entries(byType)) {
    lines.push(`### ${formatRelType(type)} (${rels.length})`);
    lines.push('');
    lines.push('| Source | Target |');
    lines.push('|--------|--------|');
    for (const rel of rels) {
      const source = swarm.agents.find(a => a.id === rel.sourceAgentId)?.nickname || rel.sourceAgentId;
      const target = swarm.agents.find(a => a.id === rel.targetAgentId)?.nickname || rel.targetAgentId;
      lines.push(`| ${source} | ${target} |`);
    }
    lines.push('');
  }

  // Architecture notes
  lines.push('## Architecture Notes');
  lines.push('');
  const hubs = swarm.agents.filter(a => a.badges.includes('HUB'));
  if (hubs.length > 0) {
    lines.push(`**Hub Agents**: ${hubs.map(a => a.nickname).join(', ')}`);
    lines.push('');
  }
  const critical = swarm.agents.filter(a => a.badges.includes('CRITICAL'));
  if (critical.length > 0) {
    lines.push(`**Critical Agents**: ${critical.map(a => a.nickname).join(', ')}`);
    lines.push('');
  }
  const entryPoints = swarm.agents.filter(a => a.badges.includes('ENTRY'));
  if (entryPoints.length > 0) {
    lines.push(`**Entry Points**: ${entryPoints.map(a => a.nickname).join(', ')}`);
    lines.push('');
  }

  lines.push('---');
  lines.push(`*Generated on ${new Date().toISOString().split('T')[0]}*`);

  return lines.join('\n');
}

export function generateAgentMarkdown(agent: Agent, swarm: Swarm): string {
  const lines: string[] = [];
  lines.push(`# ${agent.nickname}`);
  lines.push('');
  lines.push(generateAgentSection(agent, swarm));
  return lines.join('\n');
}

function generateAgentSection(agent: Agent, swarm: Swarm): string {
  const lines: string[] = [];

  lines.push(`#### ${agent.nickname} (${agent.formalName})`);
  lines.push('');
  lines.push(agent.descriptor);
  lines.push('');
  lines.push(`- **Layer**: ${swarm.layers.find(l => l.id === agent.layerId)?.name || agent.layerId}`);
  if (agent.badges.length > 0) {
    lines.push(`- **Badges**: ${agent.badges.join(', ')}`);
  }

  // Dependencies
  const dependsOn = swarm.relationships
    .filter(r => r.sourceAgentId === agent.id && r.type === 'dependsOn')
    .map(r => swarm.agents.find(a => a.id === r.targetAgentId)?.nickname || r.targetAgentId);

  const dependedOnBy = swarm.relationships
    .filter(r => r.targetAgentId === agent.id && r.type === 'dependsOn')
    .map(r => swarm.agents.find(a => a.id === r.sourceAgentId)?.nickname || r.sourceAgentId);

  const feedsInto = swarm.relationships
    .filter(r => r.sourceAgentId === agent.id && r.type === 'feedsInto')
    .map(r => swarm.agents.find(a => a.id === r.targetAgentId)?.nickname || r.targetAgentId);

  const collaborators = swarm.relationships
    .filter(r => (r.sourceAgentId === agent.id || r.targetAgentId === agent.id) && r.type === 'collaboratesWith')
    .map(r => {
      const otherId = r.sourceAgentId === agent.id ? r.targetAgentId : r.sourceAgentId;
      return swarm.agents.find(a => a.id === otherId)?.nickname || otherId;
    });

  if (dependsOn.length > 0) lines.push(`- **Depends on**: ${dependsOn.join(', ')}`);
  if (dependedOnBy.length > 0) lines.push(`- **Depended on by**: ${dependedOnBy.join(', ')}`);
  if (feedsInto.length > 0) lines.push(`- **Feeds into**: ${feedsInto.join(', ')}`);
  if (collaborators.length > 0) lines.push(`- **Collaborates with**: ${collaborators.join(', ')}`);

  lines.push('');
  return lines.join('\n');
}

function formatRelType(type: string): string {
  switch (type) {
    case 'dependsOn': return 'Dependencies';
    case 'feedsInto': return 'Data Flows';
    case 'collaboratesWith': return 'Collaborations';
    case 'canOverride': return 'Override Chains';
    default: return type;
  }
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const k = key(item);
    (groups[k] = groups[k] || []).push(item);
  }
  return groups;
}
