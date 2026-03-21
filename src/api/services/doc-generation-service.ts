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

// === HANDOFF DOCUMENT GENERATOR ===

export function generateHandoffDocument(swarm: Swarm): string {
  const lines: string[] = [];
  const cfg = (agent: Agent) => agent.config as Record<string, any>;
  const date = new Date().toISOString().split('T')[0];

  // Title page
  lines.push(`# ${swarm.name} - Implementation Handoff Document`);
  lines.push('');
  lines.push(`> Generated on ${date} by Agent Modus`);
  lines.push('');
  lines.push(swarm.description || '');
  lines.push('');

  // Executive summary
  lines.push('## 1. Executive Summary');
  lines.push('');
  lines.push(`This swarm consists of **${swarm.agents.length} agents** across **${swarm.layers.length} layers** with **${swarm.relationships.length} relationships**.`);
  lines.push('');

  const entryPoints = swarm.agents.filter(a => a.badges.includes('ENTRY'));
  const hubs = swarm.agents.filter(a => a.badges.includes('HUB'));
  const critical = swarm.agents.filter(a => a.badges.includes('CRITICAL'));

  if (entryPoints.length) lines.push(`- **Entry Points**: ${entryPoints.map(a => a.nickname).join(', ')}`);
  if (hubs.length) lines.push(`- **Hub Agents**: ${hubs.map(a => a.nickname).join(', ')}`);
  if (critical.length) lines.push(`- **Critical Agents**: ${critical.map(a => a.nickname).join(', ')}`);
  lines.push('');

  // Architecture overview
  lines.push('## 2. Architecture Overview');
  lines.push('');
  lines.push('### Layers');
  lines.push('');
  lines.push('| # | Layer | Agents | Purpose |');
  lines.push('|---|-------|--------|---------|');
  for (const layer of swarm.layers.sort((a, b) => a.order - b.order)) {
    const layerAgents = swarm.agents.filter(a => a.layerId === layer.id);
    lines.push(`| ${layer.order} | ${layer.name} | ${layerAgents.map(a => a.nickname).join(', ') || 'None'} | - |`);
  }
  lines.push('');

  // Data flow summary
  lines.push('### Data Flow');
  lines.push('');
  const flows = swarm.relationships.filter(r => r.type === 'feedsInto' || r.type === 'dependsOn');
  if (flows.length) {
    lines.push('```');
    for (const rel of flows) {
      const source = swarm.agents.find(a => a.id === rel.sourceAgentId)?.nickname || '?';
      const target = swarm.agents.find(a => a.id === rel.targetAgentId)?.nickname || '?';
      const arrow = rel.type === 'feedsInto' ? '--->' : '==depends==>';
      lines.push(`${source} ${arrow} ${target}`);
    }
    lines.push('```');
  } else {
    lines.push('No data flows defined yet.');
  }
  lines.push('');

  // Implementation order
  lines.push('## 3. Recommended Implementation Order');
  lines.push('');
  lines.push('Build agents in this order to satisfy dependencies:');
  lines.push('');
  const buildOrder = computeBuildOrder(swarm);
  buildOrder.forEach((agent, i) => {
    const deps = swarm.relationships
      .filter(r => r.sourceAgentId === agent.id && r.type === 'dependsOn')
      .map(r => swarm.agents.find(a => a.id === r.targetAgentId)?.nickname || '?');
    const depNote = deps.length ? ` (depends on: ${deps.join(', ')})` : ' (no dependencies)';
    lines.push(`${i + 1}. **${agent.nickname}**${depNote}`);
  });
  lines.push('');

  // Agent specifications
  lines.push('## 4. Agent Specifications');
  lines.push('');

  for (const layer of swarm.layers.sort((a, b) => a.order - b.order)) {
    const layerAgents = swarm.agents.filter(a => a.layerId === layer.id);
    if (!layerAgents.length) continue;

    lines.push(`### Layer: ${layer.name}`);
    lines.push('');

    for (const agent of layerAgents) {
      const c = cfg(agent);
      lines.push(`#### ${agent.nickname} (${agent.formalName})`);
      lines.push('');
      if (agent.descriptor) lines.push(`*"${agent.descriptor}"*`);
      lines.push('');

      if (agent.badges.length) lines.push(`**Badges**: ${agent.badges.join(', ')}`);
      lines.push('');

      // Core task
      if (c.coreTask) {
        lines.push('**Core Task**');
        lines.push('');
        lines.push(c.coreTask);
        lines.push('');
      }

      // Trigger conditions
      if (c.triggerConditions) {
        lines.push(`**Trigger**: ${c.triggerConditions}`);
        lines.push('');
      }

      // Autonomy
      if (c.autonomyLevel) {
        lines.push(`**Autonomy Level**: ${c.autonomyLevel}`);
        lines.push('');
      }

      // System prompt
      const prompt = c.systemPrompt as Record<string, string> | undefined;
      if (prompt) {
        lines.push('**System Prompt**');
        lines.push('');
        if (prompt.persona) lines.push(`- Persona: ${prompt.persona}`);
        if (prompt.instructions) lines.push(`- Instructions: ${prompt.instructions}`);
        if (prompt.constraints) lines.push(`- Constraints: ${prompt.constraints}`);
        if (prompt.outputFormat) lines.push(`- Output Format: \`${prompt.outputFormat}\``);
        lines.push('');
      }

      // Inputs/Outputs
      const inputs = c.inputs as string[] | undefined;
      const outputs = c.outputs as string[] | undefined;
      if (inputs?.length || outputs?.length) {
        lines.push('**Data Contract**');
        lines.push('');
        if (inputs?.length) lines.push(`- Inputs: ${inputs.join(', ')}`);
        if (c.inputFormat) lines.push(`- Input Format: ${c.inputFormat}`);
        if (outputs?.length) lines.push(`- Outputs: ${outputs.join(', ')}`);
        if (c.outputDestination) lines.push(`- Output Destination: ${c.outputDestination}`);
        lines.push('');
      }

      // Model config
      const model = c.modelConfig as Record<string, any> | undefined;
      if (model) {
        lines.push('**Model Configuration**');
        lines.push('');
        lines.push(`| Setting | Value |`);
        lines.push(`|---------|-------|`);
        if (model.provider) lines.push(`| Provider | ${model.provider} |`);
        if (model.model) lines.push(`| Model | ${model.model} |`);
        if (model.temperature !== undefined) lines.push(`| Temperature | ${model.temperature} |`);
        if (model.maxTokens) lines.push(`| Max Tokens | ${model.maxTokens} |`);
        lines.push('');
      }

      // Memory config
      const mem = c.memoryConfig as Record<string, any> | undefined;
      if (mem) {
        lines.push('**Memory**');
        lines.push('');
        const memParts = [];
        if (mem.shortTermEnabled) memParts.push('Short-term');
        if (mem.longTermEnabled) memParts.push('Long-term');
        lines.push(`- Type: ${memParts.join(' + ') || 'None'}`);
        if (mem.memoryBackend) lines.push(`- Backend: ${mem.memoryBackend}`);
        if (mem.contextWindowTokens) lines.push(`- Context Window: ${mem.contextWindowTokens.toLocaleString()} tokens`);
        lines.push('');
      }

      // Integrations
      const skills = c.skills as Array<{ name: string }> | undefined;
      const rag = c.rag as { enabled: boolean; sources: Array<{ name: string; uri: string }> } | undefined;
      const mcp = c.mcp as { enabled: boolean; servers: Array<{ name: string; url: string }> } | undefined;
      const apis = c.apiCalls as Array<{ name: string; method: string; url: string }> | undefined;
      const dbs = c.database as { connections: Array<{ name: string; type: string; readOnly: boolean }> } | undefined;

      const hasIntegrations = (skills?.length || rag?.enabled || mcp?.enabled || apis?.length || dbs?.connections?.length);
      if (hasIntegrations) {
        lines.push('**Integrations**');
        lines.push('');
        if (skills?.length) lines.push(`- Skills: ${skills.map(s => s.name).join(', ')}`);
        if (rag?.enabled && rag.sources.length) {
          lines.push('- RAG Sources:');
          for (const s of rag.sources) lines.push(`  - ${s.name}: \`${s.uri}\``);
        }
        if (mcp?.enabled && mcp.servers.length) {
          lines.push('- MCP Servers:');
          for (const s of mcp.servers) lines.push(`  - ${s.name}: \`${s.url}\``);
        }
        if (apis?.length) {
          lines.push('- API Calls:');
          for (const a of apis) lines.push(`  - ${a.method} ${a.url}`);
        }
        if (dbs?.connections?.length) {
          lines.push('- Databases:');
          for (const d of dbs.connections) lines.push(`  - ${d.type} (${d.readOnly ? 'read-only' : 'read-write'})`);
        }
        lines.push('');
      }

      // Guardrails
      const guardrails = c.guardrails as Record<string, any> | undefined;
      if (guardrails) {
        const filters = guardrails.contentFilters as string[] | undefined;
        const blocked = guardrails.blockedTopics as string[] | undefined;
        const validation = guardrails.outputValidation as string[] | undefined;
        if (filters?.length || blocked?.length || validation?.length) {
          lines.push('**Guardrails**');
          lines.push('');
          if (filters?.length) lines.push(`- Content Filters: ${filters.join(', ')}`);
          if (blocked?.length) lines.push(`- Blocked Topics: ${blocked.join(', ')}`);
          if (validation?.length) lines.push(`- Output Validation: ${validation.join(', ')}`);
          if (guardrails.requireCitation) lines.push('- Requires citations for factual claims');
          lines.push('');
        }
      }

      // Error handling
      const errors = c.errorHandling as Record<string, any> | undefined;
      if (errors) {
        lines.push('**Error Handling**');
        lines.push('');
        lines.push(`| Setting | Value |`);
        lines.push(`|---------|-------|`);
        if (errors.retryCount !== undefined) lines.push(`| Retries | ${errors.retryCount} |`);
        if (errors.timeoutMs) lines.push(`| Timeout | ${errors.timeoutMs}ms |`);
        if (errors.fallbackAgentId) lines.push(`| Fallback | ${errors.fallbackAgentId} |`);
        lines.push('');
      }

      // Cost limits
      const costs = c.costLimits as Record<string, any> | undefined;
      if (costs) {
        lines.push('**Cost Limits**');
        lines.push('');
        if (costs.maxTokensPerRequest) lines.push(`- Max tokens/request: ${costs.maxTokensPerRequest.toLocaleString()}`);
        if (costs.dailyBudgetUsd) lines.push(`- Daily budget: $${costs.dailyBudgetUsd}`);
        if (costs.monthlyBudgetUsd) lines.push(`- Monthly budget: $${costs.monthlyBudgetUsd}`);
        lines.push('');
      }

      // Permissions
      const perms = c.permissions as Record<string, any> | undefined;
      if (perms) {
        const reads = perms.canRead as string[] | undefined;
        const writes = perms.canWrite as string[] | undefined;
        const execs = perms.canExecute as string[] | undefined;
        if (reads?.length || writes?.length || execs?.length) {
          lines.push('**Permissions**');
          lines.push('');
          if (reads?.length) lines.push(`- Read: ${reads.join(', ')}`);
          if (writes?.length) lines.push(`- Write: ${writes.join(', ')}`);
          if (execs?.length) lines.push(`- Execute: ${execs.join(', ')}`);
          if (perms.canAccessExternal) lines.push('- External API access: Yes');
          if (perms.requireApproval) lines.push('- Requires human approval: Yes');
          lines.push('');
        }
      }

      // Performance
      if (c.successMetrics || c.typicalRuntime || c.failureModes) {
        lines.push('**Performance & Reliability**');
        lines.push('');
        if (c.successMetrics) lines.push(`- Success Metrics: ${c.successMetrics}`);
        if (c.typicalRuntime) lines.push(`- Typical Runtime: ${c.typicalRuntime}`);
        if (c.failureModes) lines.push(`- Failure Modes: ${c.failureModes}`);
        if (c.escalationPath) lines.push(`- Escalation: ${c.escalationPath}`);
        lines.push('');
      }

      // Notes
      if (c.knownQuirks || c.maintenanceNeeds || c.futureEnhancements) {
        lines.push('**Notes**');
        lines.push('');
        if (c.knownQuirks) lines.push(`- Known Quirks: ${c.knownQuirks}`);
        if (c.maintenanceNeeds) lines.push(`- Maintenance: ${c.maintenanceNeeds}`);
        if (c.futureEnhancements) lines.push(`- Future: ${c.futureEnhancements}`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }
  }

  // Relationship details
  lines.push('## 5. Relationship Matrix');
  lines.push('');
  if (swarm.relationships.length) {
    lines.push('| Source | Relationship | Target |');
    lines.push('|--------|-------------|--------|');
    for (const rel of swarm.relationships) {
      const source = swarm.agents.find(a => a.id === rel.sourceAgentId)?.nickname || '?';
      const target = swarm.agents.find(a => a.id === rel.targetAgentId)?.nickname || '?';
      lines.push(`| ${source} | ${formatRelType(rel.type)} | ${target} |`);
    }
  } else {
    lines.push('No relationships defined.');
  }
  lines.push('');

  // Integration inventory
  lines.push('## 6. Integration Inventory');
  lines.push('');
  lines.push('All external dependencies across the swarm:');
  lines.push('');

  // Collect all unique providers, models, MCP servers, APIs, DBs
  const providers = new Set<string>();
  const models = new Set<string>();
  const mcpAll = new Map<string, string>();
  const apiAll: string[] = [];
  const dbAll: string[] = [];
  const ragAll: string[] = [];

  for (const agent of swarm.agents) {
    const c = cfg(agent);
    const mc = c.modelConfig as Record<string, any> | undefined;
    if (mc?.provider) providers.add(mc.provider);
    if (mc?.model) models.add(mc.model);

    const mcp = c.mcp as { servers: Array<{ name: string; url: string }> } | undefined;
    if (mcp?.servers) for (const s of mcp.servers) mcpAll.set(s.name, s.url);

    const apis = c.apiCalls as Array<{ method: string; url: string }> | undefined;
    if (apis) for (const a of apis) apiAll.push(`${a.method} ${a.url}`);

    const dbs = c.database as { connections: Array<{ type: string }> } | undefined;
    if (dbs?.connections) for (const d of dbs.connections) dbAll.push(d.type);

    const rag = c.rag as { sources: Array<{ name: string; uri: string }> } | undefined;
    if (rag?.sources) for (const s of rag.sources) ragAll.push(`${s.name}: ${s.uri}`);
  }

  if (providers.size) lines.push(`**LLM Providers**: ${[...providers].join(', ')}`);
  if (models.size) lines.push(`**Models**: ${[...models].join(', ')}`);
  lines.push('');

  if (mcpAll.size) {
    lines.push('**MCP Servers**');
    lines.push('');
    for (const [name, url] of mcpAll) lines.push(`- ${name}: \`${url}\``);
    lines.push('');
  }

  if (apiAll.length) {
    lines.push('**API Endpoints**');
    lines.push('');
    for (const api of [...new Set(apiAll)]) lines.push(`- \`${api}\``);
    lines.push('');
  }

  if (dbAll.length) {
    lines.push('**Databases**');
    lines.push('');
    for (const db of [...new Set(dbAll)]) lines.push(`- ${db}`);
    lines.push('');
  }

  if (ragAll.length) {
    lines.push('**RAG Knowledge Sources**');
    lines.push('');
    for (const r of ragAll) lines.push(`- ${r}`);
    lines.push('');
  }

  // Cost estimate
  lines.push('## 7. Cost Estimate');
  lines.push('');
  let totalDaily = 0;
  let totalMonthly = 0;
  const costRows: string[] = [];
  for (const agent of swarm.agents) {
    const c = cfg(agent);
    const costs = c.costLimits as Record<string, number> | undefined;
    if (costs) {
      const daily = costs.dailyBudgetUsd || 0;
      const monthly = costs.monthlyBudgetUsd || 0;
      totalDaily += daily;
      totalMonthly += monthly;
      if (daily || monthly) costRows.push(`| ${agent.nickname} | $${daily}/day | $${monthly}/mo |`);
    }
  }

  if (costRows.length) {
    lines.push('| Agent | Daily Budget | Monthly Budget |');
    lines.push('|-------|-------------|----------------|');
    lines.push(...costRows);
    lines.push(`| **TOTAL** | **$${totalDaily}/day** | **$${totalMonthly}/mo** |`);
  } else {
    lines.push('No cost limits configured. Set budgets per agent in the Agent Builder.');
  }
  lines.push('');

  // Implementation checklist
  lines.push('## 8. Implementation Checklist');
  lines.push('');
  for (const agent of buildOrder) {
    const c = cfg(agent);
    lines.push(`### ${agent.nickname}`);
    lines.push('');
    lines.push(`- [ ] Set up ${(c.modelConfig as any)?.provider || 'LLM'} provider credentials`);
    lines.push(`- [ ] Implement core task: ${(c.coreTask as string)?.slice(0, 80) || 'TBD'}...`);

    const mcp = c.mcp as { servers: Array<{ name: string }> } | undefined;
    if (mcp?.servers?.length) lines.push(`- [ ] Configure MCP servers: ${mcp.servers.map(s => s.name).join(', ')}`);

    const rag = c.rag as { sources: Array<{ name: string }> } | undefined;
    if (rag?.sources?.length) lines.push(`- [ ] Set up RAG sources: ${rag.sources.map(s => s.name).join(', ')}`);

    const apis = c.apiCalls as Array<{ url: string }> | undefined;
    if (apis?.length) lines.push(`- [ ] Connect API integrations (${apis.length} endpoints)`);

    const dbs = c.database as { connections: Array<{ type: string }> } | undefined;
    if (dbs?.connections?.length) lines.push(`- [ ] Configure database connections: ${dbs.connections.map(d => d.type).join(', ')}`);

    const guardrails = c.guardrails as Record<string, any> | undefined;
    if (guardrails) lines.push('- [ ] Implement guardrails and content filters');

    lines.push('- [ ] Write system prompt and test with sample inputs');
    lines.push('- [ ] Verify error handling and fallback behavior');
    lines.push(`- [ ] Validate success metrics: ${(c.successMetrics as string) || 'TBD'}`);
    lines.push('- [ ] Integration test with connected agents');
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push(`*This handoff document was generated from the "${swarm.name}" design in Agent Modus on ${date}.*`);
  lines.push('*Review all specifications with the design team before implementation.*');

  return lines.join('\n');
}

// Topological sort: agents with no dependencies first
function computeBuildOrder(swarm: Swarm): Agent[] {
  const deps = new Map<string, Set<string>>();
  for (const agent of swarm.agents) deps.set(agent.id, new Set());
  for (const rel of swarm.relationships) {
    if (rel.type === 'dependsOn' && deps.has(rel.sourceAgentId)) {
      deps.get(rel.sourceAgentId)!.add(rel.targetAgentId);
    }
  }

  const ordered: Agent[] = [];
  const visited = new Set<string>();

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    for (const dep of deps.get(id) || []) visit(dep);
    const agent = swarm.agents.find(a => a.id === id);
    if (agent) ordered.push(agent);
  }

  for (const agent of swarm.agents) visit(agent.id);
  return ordered;
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
