import { Router } from 'express';
import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import {
  getVersionHistory, getVersion, saveVersion, diffVersions,
  addComment, getComments, resolveComment,
} from '../db/version-store.js';

export function createCollaborationRoutes(db: Database.Database): Router {
  const router = Router();

  // --- Version History ---

  // GET /api/collaboration/:swarmId/versions
  router.get('/:swarmId/versions', (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const versions = getVersionHistory(db, req.params.swarmId, limit);
    res.json({ data: versions.map(v => ({ ...v, snapshot: undefined })) });
  });

  // GET /api/collaboration/:swarmId/versions/:version
  router.get('/:swarmId/versions/:version', (req, res) => {
    const version = getVersion(db, req.params.swarmId, Number(req.params.version));
    if (!version) return res.status(404).json({ error: 'Version not found' });
    res.json({ data: version });
  });

  // GET /api/collaboration/:swarmId/diff?v1=1&v2=2
  router.get('/:swarmId/diff', (req, res) => {
    const v1 = Number(req.query.v1);
    const v2 = Number(req.query.v2);
    if (!v1 || !v2) return res.status(400).json({ error: 'v1 and v2 query params required' });
    const diff = diffVersions(db, req.params.swarmId, v1, v2);
    res.json({ data: diff });
  });

  // POST /api/collaboration/:swarmId/versions (save a snapshot)
  router.post('/:swarmId/versions', (req, res) => {
    const { snapshot, changeDescription, userId, userName } = req.body;
    if (!snapshot) return res.status(400).json({ error: 'snapshot is required' });

    // Get next version number
    const history = getVersionHistory(db, req.params.swarmId, 1);
    const nextVersion = history.length > 0 ? history[0].version + 1 : 1;

    const version = {
      id: randomUUID(),
      swarmId: req.params.swarmId,
      version: nextVersion,
      snapshot: typeof snapshot === 'string' ? snapshot : JSON.stringify(snapshot),
      changeDescription: changeDescription || '',
      userId: userId || 'system',
      userName: userName || 'System',
      timestamp: new Date().toISOString(),
    };

    saveVersion(db, version);
    res.status(201).json({ data: { ...version, snapshot: undefined } });
  });

  // --- Comments ---

  // GET /api/collaboration/:swarmId/comments
  router.get('/:swarmId/comments', (req, res) => {
    const agentId = req.query.agentId as string | undefined;
    const comments = getComments(db, req.params.swarmId, agentId);
    res.json({ data: comments });
  });

  // POST /api/collaboration/:swarmId/comments
  router.post('/:swarmId/comments', (req, res) => {
    const { agentId, userId, userName, content } = req.body;
    if (!content) return res.status(400).json({ error: 'content is required' });

    const comment = {
      id: randomUUID(),
      swarmId: req.params.swarmId,
      agentId,
      userId: userId || 'system',
      userName: userName || 'System',
      content,
      resolved: false,
      timestamp: new Date().toISOString(),
    };

    addComment(db, comment);
    res.status(201).json({ data: comment });
  });

  // PUT /api/collaboration/:swarmId/comments/:commentId/resolve
  router.put('/:swarmId/comments/:commentId/resolve', (req, res) => {
    resolveComment(db, req.params.commentId);
    res.json({ data: { resolved: true } });
  });

  return router;
}
