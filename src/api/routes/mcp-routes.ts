import { Router } from 'express';
import {
  startMcpServer, stopMcpServer, callMcpTool, listMcpTools, getRunningServers, executeApiCall,
  type McpServerConfig, type ApiCallConfig,
} from '../services/mcp-runtime.js';

export function createMcpRoutes(): Router {
  const router = Router();

  // GET /api/mcp/servers - list running servers
  router.get('/servers', (_req, res) => {
    res.json({ data: getRunningServers() });
  });

  // POST /api/mcp/servers/start - start an MCP server
  router.post('/servers/start', async (req, res) => {
    const config: McpServerConfig = req.body;
    if (!config.name || !config.url) return res.status(400).json({ error: 'name and url required' });

    const result = await startMcpServer(config);
    if (result.success) {
      res.json({ data: { status: 'running', server: config.name } });
    } else {
      res.status(500).json({ error: result.error });
    }
  });

  // POST /api/mcp/servers/stop - stop an MCP server
  router.post('/servers/stop', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    stopMcpServer(name);
    res.json({ data: { status: 'stopped', server: name } });
  });

  // GET /api/mcp/servers/:name/tools - list tools from a server
  router.get('/servers/:name/tools', async (req, res) => {
    const tools = await listMcpTools(req.params.name);
    res.json({ data: tools });
  });

  // POST /api/mcp/tools/call - call a tool on an MCP server
  router.post('/tools/call', async (req, res) => {
    const { serverName, toolName, arguments: args } = req.body;
    if (!serverName || !toolName) return res.status(400).json({ error: 'serverName and toolName required' });

    const result = await callMcpTool({ serverName, toolName, arguments: args || {} });
    res.json({ data: result });
  });

  // POST /api/mcp/api/call - execute an external API call
  router.post('/api/call', async (req, res) => {
    const { config, body } = req.body as { config: ApiCallConfig; body?: unknown };
    if (!config?.url || !config?.method) return res.status(400).json({ error: 'config with url and method required' });

    const result = await executeApiCall(config, body);
    res.json({ data: result });
  });

  return router;
}
