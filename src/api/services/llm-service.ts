// LLM integration via Anthropic Claude API
import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export function isLLMAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function generateAnswer(
  question: string,
  context: { graphData: string; docSnippets: string; swarmSummary: string }
): Promise<string> {
  const anthropic = getClient();
  if (!anthropic) {
    return ''; // Fall back to keyword-based answers
  }

  const systemPrompt = `You are an expert agent architecture assistant embedded in the Agent Modus Map platform. You help users design, understand, and optimize multi-agent swarms.

You have access to the following context about the user's current swarm:

SWARM SUMMARY:
${context.swarmSummary}

GRAPH ANALYSIS DATA:
${context.graphData}

RELEVANT DOCUMENTATION:
${context.docSnippets}

Answer the user's question clearly and concisely. Reference specific agents by name when relevant. If the graph data shows bottlenecks or risks, mention them. Keep responses practical and actionable.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: question }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    return textBlock?.text || '';
  } catch (err) {
    console.error('LLM call failed:', err);
    return '';
  }
}

export async function generateAgentSuggestions(
  agentConfig: Record<string, unknown>,
  swarmContext: string
): Promise<string[]> {
  const anthropic = getClient();
  if (!anthropic) return [];

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: 'You are an expert agent architect. Given an agent configuration and swarm context, suggest improvements. Return a JSON array of suggestion strings. Only return the JSON array, nothing else.',
      messages: [{
        role: 'user',
        content: `Agent config: ${JSON.stringify(agentConfig)}\n\nSwarm context: ${swarmContext}`,
      }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock?.text) return [];
    try {
      return JSON.parse(textBlock.text);
    } catch {
      return [textBlock.text];
    }
  } catch {
    return [];
  }
}
