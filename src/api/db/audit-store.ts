// Append-only audit log (ADR-007)
import type Database from 'better-sqlite3';

export type AuditAction =
  | 'agent.created' | 'agent.updated' | 'agent.deleted'
  | 'relationship.created' | 'relationship.deleted'
  | 'swarm.created' | 'swarm.imported' | 'swarm.exported'
  | 'template.instantiated'
  | 'approval.requested' | 'approval.granted' | 'approval.denied';

export interface AuditEntry {
  id: string;
  swarmId: string;
  action: AuditAction;
  userId: string;
  userName: string;
  details: Record<string, unknown>;
  timestamp: string;
  checksum: string;
}

export function initAuditStore(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      swarm_id TEXT NOT NULL,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL DEFAULT 'system',
      user_name TEXT NOT NULL DEFAULT 'System',
      details TEXT NOT NULL DEFAULT '{}',
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      checksum TEXT NOT NULL DEFAULT '',
      prev_checksum TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_audit_swarm ON audit_log(swarm_id);
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
  `);
}

export function appendAuditEntry(db: Database.Database, entry: Omit<AuditEntry, 'checksum'>): void {
  // Get previous checksum for chain integrity
  const prev = db.prepare('SELECT checksum FROM audit_log ORDER BY rowid DESC LIMIT 1').get() as any;
  const prevChecksum = prev?.checksum || '0000000000000000';

  // Simple hash chain (in production, use crypto.createHash)
  const payload = `${prevChecksum}:${entry.action}:${entry.timestamp}:${JSON.stringify(entry.details)}`;
  const checksum = simpleHash(payload);

  db.prepare(`
    INSERT INTO audit_log (id, swarm_id, action, user_id, user_name, details, timestamp, checksum, prev_checksum)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    entry.id, entry.swarmId, entry.action, entry.userId, entry.userName,
    JSON.stringify(entry.details), entry.timestamp, checksum, prevChecksum
  );
}

export function getAuditLog(
  db: Database.Database,
  swarmId: string,
  opts?: { action?: string; userId?: string; limit?: number; offset?: number; since?: string }
): AuditEntry[] {
  let sql = 'SELECT * FROM audit_log WHERE swarm_id = ?';
  const params: unknown[] = [swarmId];

  if (opts?.action) {
    sql += ' AND action = ?';
    params.push(opts.action);
  }
  if (opts?.userId) {
    sql += ' AND user_id = ?';
    params.push(opts.userId);
  }
  if (opts?.since) {
    sql += ' AND timestamp >= ?';
    params.push(opts.since);
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
  return rows.map(row => ({
    id: row.id,
    swarmId: row.swarm_id,
    action: row.action,
    userId: row.user_id,
    userName: row.user_name,
    details: JSON.parse(row.details),
    timestamp: row.timestamp,
    checksum: row.checksum,
  }));
}

export function verifyAuditChain(db: Database.Database, swarmId: string): { valid: boolean; brokenAt?: string } {
  const entries = db.prepare(
    'SELECT * FROM audit_log WHERE swarm_id = ? ORDER BY rowid ASC'
  ).all(swarmId) as any[];

  let prevChecksum = '0000000000000000';
  for (const entry of entries) {
    const payload = `${prevChecksum}:${entry.action}:${entry.timestamp}:${entry.details}`;
    const expected = simpleHash(payload);
    if (entry.checksum !== expected) {
      return { valid: false, brokenAt: entry.id };
    }
    prevChecksum = entry.checksum;
  }

  return { valid: true };
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
