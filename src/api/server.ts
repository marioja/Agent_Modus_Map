import express from 'express';
import cors from 'cors';
import { getDb } from './db/database.js';
import { createSwarmRoutes } from './routes/swarm-routes.js';
import { createIntelligenceRoutes } from './routes/intelligence-routes.js';
import { createTemplateRoutes } from './routes/template-routes.js';
import { createHealthRoutes } from './routes/health-routes.js';
import { createDecisionTraceRoutes } from './routes/decision-trace-routes.js';
import { createGovernanceRoutes } from './routes/governance-routes.js';
import { createCollaborationRoutes } from './routes/collaboration-routes.js';
import { createOptimizationRoutes } from './routes/optimization-routes.js';
import { createDocGenerationRoutes } from './routes/doc-generation-routes.js';
import { initKnowledgeBase, seedKnowledgeBase } from './db/knowledge-base.js';
import { initHealthStore } from './db/health-store.js';
import { initDecisionTraceStore } from './db/decision-trace-store.js';
import { initAuditStore } from './db/audit-store.js';
import { initVersionStore } from './db/version-store.js';

export function createApp(db?: ReturnType<typeof getDb>) {
  const app = express();
  const database = db || getDb();

  initKnowledgeBase(database);
  initHealthStore(database);
  initDecisionTraceStore(database);
  initAuditStore(database);
  initVersionStore(database);

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  app.use('/api/swarms', createSwarmRoutes(database));
  app.use('/api/intelligence', createIntelligenceRoutes(database));
  app.use('/api/templates', createTemplateRoutes(database));
  app.use('/api/monitoring', createHealthRoutes(database));
  app.use('/api/traces', createDecisionTraceRoutes(database));
  app.use('/api/governance', createGovernanceRoutes(database));
  app.use('/api/collaboration', createCollaborationRoutes(database));
  app.use('/api/optimization', createOptimizationRoutes(database));
  app.use('/api/docs', createDocGenerationRoutes(database));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  return app;
}

// Start server if run directly
const isMain = process.argv[1]?.includes('server');
if (isMain) {
  const database = getDb();
  initKnowledgeBase(database);
  seedKnowledgeBase(database);
  initHealthStore(database);
  initDecisionTraceStore(database);
  initAuditStore(database);
  initVersionStore(database);

  // Seed health history if empty
  const count = (database.prepare('SELECT COUNT(*) as c FROM health_reports').get() as any)?.c || 0;
  if (count === 0) {
    import('./services/health-simulator.js').then(({ seedHealthHistory }) => {
      seedHealthHistory(database, 'ecommerce-standard-v1', 30);
    });
  }

  const app = createApp(database);
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Agent Modus Map API running on port ${port}`);
  });
}
