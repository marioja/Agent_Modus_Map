// Decision Trace storage (ADR-004: Four-Stage Decision Trace Format)
import type Database from 'better-sqlite3';

export type TraceStage = 'observation' | 'reasoning' | 'action' | 'outcome';

export interface DecisionTrace {
  id: string;
  swarmId: string;
  agentId: string;
  agentNickname: string;
  title: string;
  timestamp: string;
  stages: TraceStageEntry[];
  tags: string[];
  confidence: number;
  durationMs: number;
}

export interface TraceStageEntry {
  stage: TraceStage;
  content: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface TracePattern {
  pattern: string;
  occurrences: number;
  agents: string[];
  avgConfidence: number;
  avgDurationMs: number;
}

export function initDecisionTraceStore(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS decision_traces (
      id TEXT PRIMARY KEY,
      swarm_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      agent_nickname TEXT NOT NULL,
      title TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      stages TEXT NOT NULL DEFAULT '[]',
      tags TEXT NOT NULL DEFAULT '[]',
      confidence REAL NOT NULL DEFAULT 0,
      duration_ms INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_traces_swarm ON decision_traces(swarm_id);
    CREATE INDEX IF NOT EXISTS idx_traces_agent ON decision_traces(agent_id);
    CREATE INDEX IF NOT EXISTS idx_traces_timestamp ON decision_traces(timestamp);
  `);
}

export function insertDecisionTrace(db: Database.Database, trace: DecisionTrace): void {
  db.prepare(`
    INSERT INTO decision_traces (id, swarm_id, agent_id, agent_nickname, title, timestamp, stages, tags, confidence, duration_ms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    trace.id, trace.swarmId, trace.agentId, trace.agentNickname,
    trace.title, trace.timestamp, JSON.stringify(trace.stages),
    JSON.stringify(trace.tags), trace.confidence, trace.durationMs
  );
}

export function getDecisionTraces(
  db: Database.Database, swarmId: string, opts?: { agentId?: string; limit?: number; offset?: number; tag?: string }
): DecisionTrace[] {
  let sql = 'SELECT * FROM decision_traces WHERE swarm_id = ?';
  const params: unknown[] = [swarmId];

  if (opts?.agentId) {
    sql += ' AND agent_id = ?';
    params.push(opts.agentId);
  }
  if (opts?.tag) {
    sql += ' AND tags LIKE ?';
    params.push(`%"${opts.tag}"%`);
  }

  sql += ' ORDER BY timestamp DESC';

  if (opts?.limit) {
    sql += ' LIMIT ?';
    params.push(opts.limit);
  }
  if (opts?.offset) {
    sql += ' OFFSET ?';
    params.push(opts.offset);
  }

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(mapRow);
}

export function getDecisionTrace(db: Database.Database, traceId: string): DecisionTrace | null {
  const row = db.prepare('SELECT * FROM decision_traces WHERE id = ?').get(traceId) as any;
  return row ? mapRow(row) : null;
}

export function detectTracePatterns(db: Database.Database, swarmId: string): TracePattern[] {
  const traces = getDecisionTraces(db, swarmId, { limit: 200 });
  const patternMap = new Map<string, { occurrences: number; agents: Set<string>; totalConf: number; totalDur: number }>();

  for (const trace of traces) {
    for (const tag of trace.tags) {
      const existing = patternMap.get(tag);
      if (existing) {
        existing.occurrences++;
        existing.agents.add(trace.agentNickname);
        existing.totalConf += trace.confidence;
        existing.totalDur += trace.durationMs;
      } else {
        patternMap.set(tag, {
          occurrences: 1,
          agents: new Set([trace.agentNickname]),
          totalConf: trace.confidence,
          totalDur: trace.durationMs,
        });
      }
    }
  }

  return Array.from(patternMap.entries())
    .map(([pattern, data]) => ({
      pattern,
      occurrences: data.occurrences,
      agents: Array.from(data.agents),
      avgConfidence: data.totalConf / data.occurrences,
      avgDurationMs: data.totalDur / data.occurrences,
    }))
    .sort((a, b) => b.occurrences - a.occurrences);
}

function mapRow(row: any): DecisionTrace {
  return {
    id: row.id,
    swarmId: row.swarm_id,
    agentId: row.agent_id,
    agentNickname: row.agent_nickname,
    title: row.title,
    timestamp: row.timestamp,
    stages: JSON.parse(row.stages),
    tags: JSON.parse(row.tags),
    confidence: row.confidence,
    durationMs: row.duration_ms,
  };
}
