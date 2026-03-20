// Swarm version history and collaboration (Sprint 21-22)
import type Database from 'better-sqlite3';

export interface SwarmVersion {
  id: string;
  swarmId: string;
  version: number;
  snapshot: string; // JSON snapshot of the swarm at this version
  changeDescription: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface SwarmComment {
  id: string;
  swarmId: string;
  agentId?: string;
  userId: string;
  userName: string;
  content: string;
  resolved: boolean;
  timestamp: string;
}

export function initVersionStore(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS swarm_versions (
      id TEXT PRIMARY KEY,
      swarm_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      snapshot TEXT NOT NULL,
      change_description TEXT NOT NULL DEFAULT '',
      user_id TEXT NOT NULL DEFAULT 'system',
      user_name TEXT NOT NULL DEFAULT 'System',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(swarm_id, version)
    );

    CREATE TABLE IF NOT EXISTS swarm_comments (
      id TEXT PRIMARY KEY,
      swarm_id TEXT NOT NULL,
      agent_id TEXT,
      user_id TEXT NOT NULL DEFAULT 'system',
      user_name TEXT NOT NULL DEFAULT 'System',
      content TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_versions_swarm ON swarm_versions(swarm_id);
    CREATE INDEX IF NOT EXISTS idx_comments_swarm ON swarm_comments(swarm_id);
    CREATE INDEX IF NOT EXISTS idx_comments_agent ON swarm_comments(agent_id);
  `);
}

export function saveVersion(db: Database.Database, version: SwarmVersion): void {
  db.prepare(`
    INSERT INTO swarm_versions (id, swarm_id, version, snapshot, change_description, user_id, user_name, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    version.id, version.swarmId, version.version, version.snapshot,
    version.changeDescription, version.userId, version.userName, version.timestamp
  );
}

export function getVersionHistory(db: Database.Database, swarmId: string, limit = 50): SwarmVersion[] {
  const rows = db.prepare(
    'SELECT * FROM swarm_versions WHERE swarm_id = ? ORDER BY version DESC LIMIT ?'
  ).all(swarmId, limit) as any[];

  return rows.map(row => ({
    id: row.id,
    swarmId: row.swarm_id,
    version: row.version,
    snapshot: row.snapshot,
    changeDescription: row.change_description,
    userId: row.user_id,
    userName: row.user_name,
    timestamp: row.timestamp,
  }));
}

export function getVersion(db: Database.Database, swarmId: string, version: number): SwarmVersion | null {
  const row = db.prepare(
    'SELECT * FROM swarm_versions WHERE swarm_id = ? AND version = ?'
  ).get(swarmId, version) as any;

  if (!row) return null;
  return {
    id: row.id,
    swarmId: row.swarm_id,
    version: row.version,
    snapshot: row.snapshot,
    changeDescription: row.change_description,
    userId: row.user_id,
    userName: row.user_name,
    timestamp: row.timestamp,
  };
}

export function diffVersions(db: Database.Database, swarmId: string, v1: number, v2: number): {
  added: { agents: string[]; relationships: string[] };
  removed: { agents: string[]; relationships: string[] };
  modified: string[];
} {
  const ver1 = getVersion(db, swarmId, v1);
  const ver2 = getVersion(db, swarmId, v2);
  if (!ver1 || !ver2) return { added: { agents: [], relationships: [] }, removed: { agents: [], relationships: [] }, modified: [] };

  const snap1 = JSON.parse(ver1.snapshot);
  const snap2 = JSON.parse(ver2.snapshot);

  const agents1 = new Map<string, any>((snap1.agents || []).map((a: any) => [a.id, a]));
  const agents2 = new Map<string, any>((snap2.agents || []).map((a: any) => [a.id, a]));

  const addedAgents: string[] = [...agents2.keys()].filter(id => !agents1.has(id)).map(id => agents2.get(id)?.nickname || id);
  const removedAgents: string[] = [...agents1.keys()].filter(id => !agents2.has(id)).map(id => agents1.get(id)?.nickname || id);
  const modifiedAgents: string[] = [...agents2.keys()]
    .filter(id => agents1.has(id) && JSON.stringify(agents1.get(id)) !== JSON.stringify(agents2.get(id)))
    .map(id => agents2.get(id)?.nickname || id);

  const rels1 = new Set<string>((snap1.relationships || []).map((r: any) => r.id));
  const rels2 = new Set<string>((snap2.relationships || []).map((r: any) => r.id));
  const addedRels: string[] = [...rels2].filter(id => !rels1.has(id));
  const removedRels: string[] = [...rels1].filter(id => !rels2.has(id));

  return {
    added: { agents: addedAgents, relationships: addedRels },
    removed: { agents: removedAgents, relationships: removedRels },
    modified: modifiedAgents,
  };
}

// Comments
export function addComment(db: Database.Database, comment: SwarmComment): void {
  db.prepare(`
    INSERT INTO swarm_comments (id, swarm_id, agent_id, user_id, user_name, content, resolved, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    comment.id, comment.swarmId, comment.agentId || null,
    comment.userId, comment.userName, comment.content,
    comment.resolved ? 1 : 0, comment.timestamp
  );
}

export function getComments(db: Database.Database, swarmId: string, agentId?: string): SwarmComment[] {
  let sql = 'SELECT * FROM swarm_comments WHERE swarm_id = ?';
  const params: unknown[] = [swarmId];

  if (agentId) {
    sql += ' AND agent_id = ?';
    params.push(agentId);
  }

  sql += ' ORDER BY timestamp DESC';

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(row => ({
    id: row.id,
    swarmId: row.swarm_id,
    agentId: row.agent_id,
    userId: row.user_id,
    userName: row.user_name,
    content: row.content,
    resolved: row.resolved === 1,
    timestamp: row.timestamp,
  }));
}

export function resolveComment(db: Database.Database, commentId: string): void {
  db.prepare('UPDATE swarm_comments SET resolved = 1 WHERE id = ?').run(commentId);
}
