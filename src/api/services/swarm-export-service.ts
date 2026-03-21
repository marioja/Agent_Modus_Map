// Stage 5: Swarm Export - generates deployable swarm packages
import type { Swarm, Agent } from '../../shared/types/index.js';

export interface SwarmPackage {
  name: string;
  version: string;
  generatedAt: string;
  files: Array<{ path: string; content: string }>;
}

export function generateSwarmPackage(swarm: Swarm): SwarmPackage {
  const files: Array<{ path: string; content: string }> = [];

  // 1. Main config file
  files.push({
    path: 'swarm.config.json',
    content: JSON.stringify(generateSwarmConfig(swarm), null, 2),
  });

  // 2. Agent prompt files
  for (const agent of swarm.agents) {
    files.push({
      path: `agents/${agent.nickname.toLowerCase()}.prompt.md`,
      content: generateAgentPrompt(agent),
    });
  }

  // 3. Runner script
  files.push({
    path: 'run.ts',
    content: generateRunnerScript(swarm),
  });

  // 4. Package.json
  files.push({
    path: 'package.json',
    content: JSON.stringify({
      name: swarm.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      version: '1.0.0',
      type: 'module',
      scripts: {
        start: 'npx tsx run.ts',
        test: 'npx tsx run.ts --test',
      },
      dependencies: {
        '@anthropic-ai/sdk': '^0.39.0',
      },
    }, null, 2),
  });

  // 5. .env template
  files.push({
    path: '.env.example',
    content: '# Copy this to .env and fill in your API keys\nANTHROPIC_API_KEY=sk-ant-your-key-here\n',
  });

  // 6. README
  files.push({
    path: 'README.md',
    content: generateReadme(swarm),
  });

  // 7. Claude-flow / RuFlo config
  files.push({
    path: 'claude-flow.config.json',
    content: JSON.stringify(generateClaudeFlowConfig(swarm), null, 2),
  });

  return {
    name: swarm.name,
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    files,
  };
}

function generateSwarmConfig(swarm: Swarm) {
  return {
    id: swarm.id,
    name: swarm.name,
    description: swarm.description,
    layers: swarm.layers.map(l => ({
      name: l.name,
      order: l.order,
    })),
    agents: swarm.agents.map(a => {
      const config = a.config as Record<string, any>;
      return {
        id: a.nickname.toLowerCase(),
        nickname: a.nickname,
        formalName: a.formalName,
        descriptor: a.descriptor,
        layer: swarm.layers.find(l => l.id === a.layerId)?.name || 'default',
        badges: a.badges,
        model: {
          provider: config.modelConfig?.provider || 'anthropic',
          model: config.modelConfig?.model || 'claude-sonnet-4-6',
          temperature: config.modelConfig?.temperature ?? 0.7,
          maxTokens: config.modelConfig?.maxTokens || 2048,
        },
        promptFile: `agents/${a.nickname.toLowerCase()}.prompt.md`,
        autonomy: config.autonomyLevel || 'Hybrid',
        coreTask: config.coreTask || '',
      };
    }),
    relationships: swarm.relationships.map(r => ({
      source: swarm.agents.find(a => a.id === r.sourceAgentId)?.nickname || r.sourceAgentId,
      target: swarm.agents.find(a => a.id === r.targetAgentId)?.nickname || r.targetAgentId,
      type: r.type,
    })),
    entryPoints: swarm.agents.filter(a => a.badges.includes('ENTRY')).map(a => a.nickname),
  };
}

function generateAgentPrompt(agent: Agent): string {
  const config = agent.config as Record<string, any>;
  const prompt = config.systemPrompt as Record<string, string> | undefined;
  const lines: string[] = [];

  lines.push(`# ${agent.nickname} (${agent.formalName})`);
  lines.push(`> ${agent.descriptor}`);
  lines.push('');

  if (config.coreTask) {
    lines.push('## Core Task');
    lines.push(config.coreTask);
    lines.push('');
  }

  if (prompt?.persona) {
    lines.push('## Persona');
    lines.push(prompt.persona);
    lines.push('');
  }

  if (prompt?.instructions) {
    lines.push('## Instructions');
    lines.push(prompt.instructions);
    lines.push('');
  }

  if (prompt?.constraints) {
    lines.push('## Constraints');
    lines.push(prompt.constraints);
    lines.push('');
  }

  if (prompt?.outputFormat) {
    lines.push('## Output Format');
    lines.push('```');
    lines.push(prompt.outputFormat);
    lines.push('```');
    lines.push('');
  }

  const guardrails = config.guardrails as Record<string, any> | undefined;
  if (guardrails) {
    const filters = guardrails.contentFilters as string[] | undefined;
    const blocked = guardrails.blockedTopics as string[] | undefined;
    if (filters?.length || blocked?.length) {
      lines.push('## Guardrails');
      if (filters?.length) lines.push(`- Content Filters: ${filters.join(', ')}`);
      if (blocked?.length) lines.push(`- Blocked Topics: ${blocked.join(', ')}`);
      lines.push('');
    }
  }

  if (config.autonomyLevel) {
    lines.push(`## Autonomy: ${config.autonomyLevel}`);
    lines.push('');
  }

  return lines.join('\n');
}

function generateRunnerScript(swarm: Swarm): string {
  const entryPoints = swarm.agents.filter(a => a.badges.includes('ENTRY')).map(a => a.nickname.toLowerCase());
  const firstEntry = entryPoints[0] || swarm.agents[0]?.nickname.toLowerCase() || 'agent';

  return `// Auto-generated swarm runner for: ${swarm.name}
// Usage: npx tsx run.ts
// Test:  npx tsx run.ts --test

import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

const config = JSON.parse(readFileSync('swarm.config.json', 'utf-8'));
const client = new Anthropic();

interface AgentResult {
  agent: string;
  output: string;
  tokens: { input: number; output: number };
  durationMs: number;
}

async function runAgent(agentConfig: any, input: string): Promise<AgentResult> {
  const promptFile = readFileSync(agentConfig.promptFile, 'utf-8');
  const start = Date.now();

  const response = await client.messages.create({
    model: agentConfig.model.model,
    max_tokens: agentConfig.model.maxTokens,
    temperature: agentConfig.model.temperature,
    system: promptFile,
    messages: [{ role: 'user', content: input }],
  });

  const output = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\\n');

  return {
    agent: agentConfig.nickname,
    output,
    tokens: {
      input: response.usage?.input_tokens || 0,
      output: response.usage?.output_tokens || 0,
    },
    durationMs: Date.now() - start,
  };
}

async function runSwarm(input: string) {
  console.log('Starting swarm: ' + config.name);
  console.log('Input:', input.slice(0, 100) + '...');
  console.log('---');

  // Build downstream map
  const downstream: Record<string, string[]> = {};
  for (const agent of config.agents) downstream[agent.id] = [];
  for (const rel of config.relationships) {
    if (rel.type === 'feedsInto') {
      const srcId = config.agents.find((a: any) => a.nickname === rel.source)?.id;
      const tgtId = config.agents.find((a: any) => a.nickname === rel.target)?.id;
      if (srcId && tgtId) downstream[srcId]?.push(tgtId);
    }
  }

  // BFS from entry points
  const visited = new Set<string>();
  const queue: Array<{ agentId: string; input: string }> = [];
  const entryIds = config.entryPoints.map((n: string) =>
    config.agents.find((a: any) => a.nickname === n)?.id
  ).filter(Boolean);

  for (const id of entryIds) queue.push({ agentId: id, input });

  const results: AgentResult[] = [];

  while (queue.length > 0) {
    const { agentId, input: agentInput } = queue.shift()!;
    if (visited.has(agentId)) continue;
    visited.add(agentId);

    const agentConfig = config.agents.find((a: any) => a.id === agentId);
    if (!agentConfig) continue;

    console.log(\\\`Running: \\\${agentConfig.nickname}...\\\`);
    const result = await runAgent(agentConfig, agentInput);
    results.push(result);
    console.log(\\\`  Done (\\\${result.durationMs}ms, \\\${result.tokens.input + result.tokens.output} tokens)\\\`);

    // Pass to downstream
    for (const nextId of downstream[agentId] || []) {
      if (!visited.has(nextId)) {
        const nextAgent = config.agents.find((a: any) => a.id === nextId);
        queue.push({
          agentId: nextId,
          input: \\\`Output from \\\${agentConfig.nickname}:\\n\\n\\\${result.output}\\\`,
        });
      }
    }
  }

  console.log('---');
  console.log(\\\`Completed. \\\${results.length} agents processed.\\\`);
  const totalTokens = results.reduce((s, r) => s + r.tokens.input + r.tokens.output, 0);
  console.log(\\\`Total tokens: \\\${totalTokens}\\\`);

  return results;
}

// CLI
const input = process.argv.includes('--test')
  ? 'This is a test run. Process this sample input through all agents.'
  : process.argv.slice(2).join(' ') || 'Process this request through the swarm.';

runSwarm(input).catch(console.error);
`;
}

function generateReadme(swarm: Swarm): string {
  const entryPoints = swarm.agents.filter(a => a.badges.includes('ENTRY'));
  return `# ${swarm.name}

${swarm.description || 'Auto-generated swarm package from Agent Modus.'}

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up your API key:
   \`\`\`bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   \`\`\`

3. Run a test:
   \`\`\`bash
   npm test
   \`\`\`

4. Run with custom input:
   \`\`\`bash
   npm start -- "Your input here"
   \`\`\`

## Swarm Overview

- **Agents**: ${swarm.agents.length}
- **Layers**: ${swarm.layers.length}
- **Relationships**: ${swarm.relationships.length}
- **Entry Points**: ${entryPoints.map(a => a.nickname).join(', ') || 'None defined'}

## Agents

${swarm.agents.map(a => `- **${a.nickname}** (${a.formalName}) - ${a.descriptor}`).join('\n')}

## Files

- \`swarm.config.json\` - Swarm configuration
- \`agents/\` - Individual agent prompt files
- \`run.ts\` - Execution runner
- \`claude-flow.config.json\` - RuFlo/claude-flow configuration

---
*Generated by Agent Modus on ${new Date().toISOString().split('T')[0]}*
`;
}

function generateClaudeFlowConfig(swarm: Swarm) {
  return {
    version: '3',
    swarm: {
      name: swarm.name,
      topology: 'hierarchical',
      maxAgents: swarm.agents.length,
      strategy: 'specialized',
    },
    agents: swarm.agents.map(a => {
      const config = a.config as Record<string, any>;
      return {
        name: a.nickname.toLowerCase(),
        type: 'coder',
        model: config.modelConfig?.model || 'claude-sonnet-4-6',
        instructions: `agents/${a.nickname.toLowerCase()}.prompt.md`,
        badges: a.badges,
      };
    }),
    relationships: swarm.relationships.map(r => ({
      from: swarm.agents.find(a => a.id === r.sourceAgentId)?.nickname?.toLowerCase() || '',
      to: swarm.agents.find(a => a.id === r.targetAgentId)?.nickname?.toLowerCase() || '',
      type: r.type,
    })),
  };
}
