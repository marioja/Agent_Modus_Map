import { Router } from 'express';
import type Database from 'better-sqlite3';
import { SwarmService } from '../services/swarm-service.js';
import { runMockSimulation } from '../services/simulation-service.js';
import { estimateSwarmCost } from '../services/cost-estimation-service.js';
import { runLiveExecution } from '../services/live-execution-service.js';
import { generateSwarmPackage } from '../services/swarm-export-service.js';

export function createSimulationRoutes(db: Database.Database): Router {
  const router = Router();
  const swarmService = new SwarmService(db);

  // POST /api/simulate/:swarmId - run mock simulation
  router.post('/:swarmId', (req, res) => {
    const swarm = swarmService.findById(req.params.swarmId);
    if (!swarm) return res.status(404).json({ error: 'Swarm not found' });

    const sampleInput = req.body.input || 'Sample customer request: I need help with my recent order #12345. The item arrived damaged and I would like a replacement or refund.';
    const result = runMockSimulation(swarm, sampleInput);
    res.json({ data: result });
  });

  // GET /api/simulate/:swarmId/cost - get cost estimation
  router.get('/:swarmId/cost', (req, res) => {
    const swarm = swarmService.findById(req.params.swarmId);
    if (!swarm) return res.status(404).json({ error: 'Swarm not found' });

    const callsPerDay = req.query.callsPerDay ? Number(req.query.callsPerDay) : undefined;
    const result = estimateSwarmCost(swarm, callsPerDay);
    res.json({ data: result });
  });

  // POST /api/simulate/:swarmId/live - run live test with real LLM calls
  router.post('/:swarmId/live', async (req, res) => {
    const swarm = swarmService.findById(req.params.swarmId);
    if (!swarm) return res.status(404).json({ error: 'Swarm not found' });

    const userInput = req.body.input || 'I need help with a customer issue regarding a damaged product delivery.';

    try {
      const result = await runLiveExecution(swarm, userInput);
      res.json({ data: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Live execution failed' });
    }
  });

  // GET /api/simulate/:swarmId/export - export deployable swarm package
  router.get('/:swarmId/export', (req, res) => {
    const swarm = swarmService.findById(req.params.swarmId);
    if (!swarm) return res.status(404).json({ error: 'Swarm not found' });

    const pkg = generateSwarmPackage(swarm);
    res.json({ data: pkg });
  });

  // GET /api/simulate/status - check if LLM is available
  router.get('/status/llm', (_req, res) => {
    res.json({ available: !!process.env.ANTHROPIC_API_KEY });
  });

  return router;
}
