import { Router } from 'express';
import type Database from 'better-sqlite3';
import { detectBottlenecks, whatIfRemoveAgent, estimateCost } from '../services/optimization-service.js';
import { SwarmService } from '../services/swarm-service.js';

export function createOptimizationRoutes(db: Database.Database): Router {
  const router = Router();
  const swarmService = new SwarmService(db);

  // GET /api/optimization/:swarmId/bottlenecks
  router.get('/:swarmId/bottlenecks', (req, res) => {
    const swarm = swarmService.findById(req.params.swarmId);
    if (!swarm) return res.status(404).json({ error: 'Swarm not found' });
    const results = detectBottlenecks(swarm);
    res.json({ data: results });
  });

  // GET /api/optimization/:swarmId/what-if?remove=AgentNickname
  router.get('/:swarmId/what-if', (req, res) => {
    const swarm = swarmService.findById(req.params.swarmId);
    if (!swarm) return res.status(404).json({ error: 'Swarm not found' });

    const agentNickname = req.query.remove as string;
    if (!agentNickname) return res.status(400).json({ error: 'remove query param required' });

    const result = whatIfRemoveAgent(swarm, agentNickname);
    res.json({ data: result });
  });

  // GET /api/optimization/:swarmId/cost
  router.get('/:swarmId/cost', (req, res) => {
    const swarm = swarmService.findById(req.params.swarmId);
    if (!swarm) return res.status(404).json({ error: 'Swarm not found' });
    const result = estimateCost(swarm);
    res.json({ data: result });
  });

  return router;
}
