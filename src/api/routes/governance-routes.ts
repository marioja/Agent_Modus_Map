import { Router } from 'express';
import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { getAuditLog, verifyAuditChain, appendAuditEntry } from '../db/audit-store.js';

export function createGovernanceRoutes(db: Database.Database): Router {
  const router = Router();

  // GET /api/governance/:swarmId/audit
  router.get('/:swarmId/audit', (req, res) => {
    const { action, userId, limit, offset, since } = req.query;
    const entries = getAuditLog(db, req.params.swarmId, {
      action: action as string,
      userId: userId as string,
      limit: limit ? Number(limit) : 100,
      offset: offset ? Number(offset) : 0,
      since: since as string,
    });
    res.json({ data: entries });
  });

  // GET /api/governance/:swarmId/audit/verify
  router.get('/:swarmId/audit/verify', (req, res) => {
    const result = verifyAuditChain(db, req.params.swarmId);
    res.json({ data: result });
  });

  // GET /api/governance/:swarmId/compliance
  router.get('/:swarmId/compliance', (req, res) => {
    const entries = getAuditLog(db, req.params.swarmId, { limit: 1000 });
    const chainResult = verifyAuditChain(db, req.params.swarmId);

    // Compliance checks
    const checks = [
      {
        name: 'Audit Chain Integrity',
        status: chainResult.valid ? 'pass' : 'fail',
        description: chainResult.valid ? 'All audit entries have valid checksums' : `Chain broken at entry ${chainResult.brokenAt}`,
      },
      {
        name: 'Change Tracking',
        status: entries.length > 0 ? 'pass' : 'warning',
        description: entries.length > 0 ? `${entries.length} actions tracked` : 'No audit trail found',
      },
      {
        name: 'User Attribution',
        status: entries.every(e => e.userId && e.userId !== 'anonymous') ? 'pass' : 'warning',
        description: 'All changes attributed to identified users',
      },
    ];

    const overallStatus = checks.some(c => c.status === 'fail') ? 'non-compliant' :
      checks.some(c => c.status === 'warning') ? 'partial' : 'compliant';

    res.json({ data: { status: overallStatus, checks, auditEntryCount: entries.length } });
  });

  // POST /api/governance/:swarmId/audit (manual entry)
  router.post('/:swarmId/audit', (req, res) => {
    const { action, userId, userName, details } = req.body;
    if (!action) return res.status(400).json({ error: 'action is required' });

    const entry = {
      id: randomUUID(),
      swarmId: req.params.swarmId,
      action,
      userId: userId || 'system',
      userName: userName || 'System',
      details: details || {},
      timestamp: new Date().toISOString(),
    };

    appendAuditEntry(db, entry);
    res.status(201).json({ data: entry });
  });

  return router;
}
