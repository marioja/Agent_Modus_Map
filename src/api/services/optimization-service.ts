// Sprint 23: Optimization engine (bottleneck detection, what-if, cost modeling)
import type { Swarm, Agent, Relationship } from '../../shared/types/index.js';

export interface BottleneckResult {
  agentId: string;
  nickname: string;
  score: number; // 0-100, higher = worse bottleneck
  inDegree: number;
  outDegree: number;
  dependents: number;
  reason: string;
}

export interface WhatIfResult {
  scenario: string;
  impactedAgents: Array<{ nickname: string; impact: 'high' | 'medium' | 'low' }>;
  riskScore: number;
  recommendation: string;
}

export interface CostEstimate {
  totalAgents: number;
  totalRelationships: number;
  estimatedMonthlyCost: number;
  breakdown: Array<{ layer: string; agents: number; estimatedCost: number }>;
  optimizationSuggestions: string[];
}

export function detectBottlenecks(swarm: Swarm): BottleneckResult[] {
  const agentMap = new Map(swarm.agents.map(a => [a.id, a]));
  const results: BottleneckResult[] = [];

  for (const agent of swarm.agents) {
    const inDegree = swarm.relationships.filter(r => r.targetAgentId === agent.id).length;
    const outDegree = swarm.relationships.filter(r => r.sourceAgentId === agent.id).length;
    const dependents = swarm.relationships.filter(
      r => r.targetAgentId === agent.id && r.type === 'dependsOn'
    ).length;

    let score = 0;
    const reasons: string[] = [];

    // High in-degree = potential bottleneck
    if (inDegree >= 4) {
      score += 30;
      reasons.push(`${inDegree} incoming connections`);
    }

    // Many dependents = single point of failure
    if (dependents >= 3) {
      score += 40;
      reasons.push(`${dependents} agents depend on this`);
    }

    // Hub badge with high connectivity
    if (agent.badges.includes('HUB') && (inDegree + outDegree) >= 6) {
      score += 20;
      reasons.push('Hub agent with high connectivity');
    }

    // Critical agent with no redundancy
    if (agent.badges.includes('CRITICAL')) {
      const sameLayer = swarm.agents.filter(a => a.layerId === agent.layerId && a.id !== agent.id);
      if (sameLayer.length === 0) {
        score += 30;
        reasons.push('Critical agent with no layer redundancy');
      }
    }

    if (score > 0) {
      results.push({
        agentId: agent.id,
        nickname: agent.nickname,
        score: Math.min(score, 100),
        inDegree,
        outDegree,
        dependents,
        reason: reasons.join('; '),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}

export function whatIfRemoveAgent(swarm: Swarm, agentNickname: string): WhatIfResult {
  const agent = swarm.agents.find(a => a.nickname === agentNickname);
  if (!agent) {
    return { scenario: `Remove ${agentNickname}`, impactedAgents: [], riskScore: 0, recommendation: 'Agent not found' };
  }

  const directDeps = swarm.relationships
    .filter(r => r.targetAgentId === agent.id && r.type === 'dependsOn')
    .map(r => swarm.agents.find(a => a.id === r.sourceAgentId))
    .filter(Boolean) as Agent[];

  const feedConsumers = swarm.relationships
    .filter(r => r.sourceAgentId === agent.id && r.type === 'feedsInto')
    .map(r => swarm.agents.find(a => a.id === r.targetAgentId))
    .filter(Boolean) as Agent[];

  const collaborators = swarm.relationships
    .filter(r => (r.sourceAgentId === agent.id || r.targetAgentId === agent.id) && r.type === 'collaboratesWith')
    .map(r => {
      const otherId = r.sourceAgentId === agent.id ? r.targetAgentId : r.sourceAgentId;
      return swarm.agents.find(a => a.id === otherId);
    })
    .filter(Boolean) as Agent[];

  const impactedAgents = [
    ...directDeps.map(a => ({ nickname: a.nickname, impact: 'high' as const })),
    ...feedConsumers.map(a => ({ nickname: a.nickname, impact: 'medium' as const })),
    ...collaborators.map(a => ({ nickname: a.nickname, impact: 'low' as const })),
  ];

  const riskScore = Math.min(100,
    directDeps.length * 30 +
    feedConsumers.length * 15 +
    collaborators.length * 5 +
    (agent.badges.includes('CRITICAL') ? 25 : 0) +
    (agent.badges.includes('HUB') ? 15 : 0)
  );

  let recommendation: string;
  if (riskScore >= 70) {
    recommendation = `Removing ${agentNickname} is high-risk. ${directDeps.length} agents directly depend on it. Consider adding a redundant agent in the ${agent.layerId} layer first.`;
  } else if (riskScore >= 40) {
    recommendation = `Moderate risk. ${feedConsumers.length} agents would lose data input. Plan a migration path for downstream consumers.`;
  } else {
    recommendation = `Low risk removal. Minimal impact on the rest of the swarm.`;
  }

  return { scenario: `Remove ${agentNickname}`, impactedAgents, riskScore, recommendation };
}

export function estimateCost(swarm: Swarm): CostEstimate {
  const layerCosts = new Map<string, { agents: number; cost: number }>();

  // Cost model: base cost per agent + connectivity premium
  const BASE_COST = 50; // per agent/month
  const RELATIONSHIP_COST = 5; // per relationship/month
  const CRITICAL_PREMIUM = 1.5;
  const HUB_PREMIUM = 1.3;

  for (const agent of swarm.agents) {
    const layer = swarm.layers.find(l => l.id === agent.layerId);
    const layerName = layer?.name || agent.layerId;

    let agentCost = BASE_COST;
    if (agent.badges.includes('CRITICAL')) agentCost *= CRITICAL_PREMIUM;
    if (agent.badges.includes('HUB')) agentCost *= HUB_PREMIUM;
    if (agent.badges.includes('ALWAYS_ON')) agentCost *= 1.2;

    const existing = layerCosts.get(layerName) || { agents: 0, cost: 0 };
    existing.agents++;
    existing.cost += agentCost;
    layerCosts.set(layerName, existing);
  }

  const relationshipCost = swarm.relationships.length * RELATIONSHIP_COST;
  const breakdown = Array.from(layerCosts.entries()).map(([layer, data]) => ({
    layer,
    agents: data.agents,
    estimatedCost: Math.round(data.cost),
  }));

  const totalAgentCost = breakdown.reduce((sum, b) => sum + b.estimatedCost, 0);
  const total = totalAgentCost + relationshipCost;

  const suggestions: string[] = [];
  const bottlenecks = detectBottlenecks(swarm);
  if (bottlenecks.some(b => b.score >= 60)) {
    suggestions.push('Consider distributing load from high-bottleneck agents to reduce single-point-of-failure costs');
  }

  const layers = [...new Set(swarm.agents.map(a => a.layerId))];
  for (const layerId of layers) {
    const layerAgents = swarm.agents.filter(a => a.layerId === layerId);
    if (layerAgents.length === 1 && layerAgents[0].badges.includes('CRITICAL')) {
      suggestions.push(`Layer "${layerId}" has a single critical agent. Adding redundancy would improve reliability.`);
    }
  }

  if (swarm.agents.length > 20) {
    suggestions.push('Large swarm detected. Consider splitting into sub-swarms for cost isolation and independent scaling.');
  }

  return {
    totalAgents: swarm.agents.length,
    totalRelationships: swarm.relationships.length,
    estimatedMonthlyCost: Math.round(total),
    breakdown,
    optimizationSuggestions: suggestions,
  };
}
