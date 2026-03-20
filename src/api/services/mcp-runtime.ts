// MCP execution runtime - actually calls configured MCP servers and external APIs
import { spawn, type ChildProcess } from 'child_process';

export interface McpServerConfig {
  name: string;
  url: string;
  transport: 'stdio' | 'sse' | 'streamable-http';
}

export interface McpToolCall {
  serverName: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface McpToolResult {
  success: boolean;
  output: unknown;
  error?: string;
  durationMs: number;
}

export interface ApiCallConfig {
  name: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  authType: string;
  authToken?: string;
}

export interface ApiCallResult {
  success: boolean;
  status: number;
  data: unknown;
  error?: string;
  durationMs: number;
}

// Active stdio MCP server processes
const activeServers = new Map<string, { process: ChildProcess; pending: Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }> }>();
let requestId = 0;

export async function startMcpServer(config: McpServerConfig): Promise<{ success: boolean; error?: string }> {
  if (config.transport !== 'stdio') {
    return { success: false, error: `Transport "${config.transport}" not yet supported in runtime. Use stdio.` };
  }

  if (activeServers.has(config.name)) {
    return { success: true }; // Already running
  }

  const parts = config.url.split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  try {
    const proc = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    const pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
    let buffer = '';

    proc.stdout?.on('data', (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined && pending.has(msg.id)) {
            const handler = pending.get(msg.id)!;
            pending.delete(msg.id);
            if (msg.error) {
              handler.reject(new Error(msg.error.message || 'MCP error'));
            } else {
              handler.resolve(msg.result);
            }
          }
        } catch {
          // Non-JSON line, ignore
        }
      }
    });

    proc.on('error', (err) => {
      console.error(`MCP server ${config.name} error:`, err.message);
      activeServers.delete(config.name);
    });

    proc.on('exit', () => {
      activeServers.delete(config.name);
    });

    activeServers.set(config.name, { process: proc, pending });

    // Send initialize
    await sendMcpRequest(config.name, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'agent-modus-map', version: '0.1.0' },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function callMcpTool(call: McpToolCall): Promise<McpToolResult> {
  const start = Date.now();
  const server = activeServers.get(call.serverName);

  if (!server) {
    return { success: false, output: null, error: `MCP server "${call.serverName}" is not running. Start it first.`, durationMs: Date.now() - start };
  }

  try {
    const result = await sendMcpRequest(call.serverName, 'tools/call', {
      name: call.toolName,
      arguments: call.arguments,
    });

    return { success: true, output: result, durationMs: Date.now() - start };
  } catch (err: any) {
    return { success: false, output: null, error: err.message, durationMs: Date.now() - start };
  }
}

export async function listMcpTools(serverName: string): Promise<Array<{ name: string; description: string }>> {
  try {
    const result = await sendMcpRequest(serverName, 'tools/list', {});
    return (result?.tools || []).map((t: any) => ({ name: t.name, description: t.description || '' }));
  } catch {
    return [];
  }
}

export function stopMcpServer(serverName: string): void {
  const server = activeServers.get(serverName);
  if (server) {
    server.process.kill();
    activeServers.delete(serverName);
  }
}

export function getRunningServers(): string[] {
  return [...activeServers.keys()];
}

async function sendMcpRequest(serverName: string, method: string, params: any): Promise<any> {
  const server = activeServers.get(serverName);
  if (!server) throw new Error(`Server ${serverName} not found`);

  const id = ++requestId;
  const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.pending.delete(id);
      reject(new Error('MCP request timed out after 30s'));
    }, 30000);

    server.pending.set(id, {
      resolve: (v) => { clearTimeout(timeout); resolve(v); },
      reject: (e) => { clearTimeout(timeout); reject(e); },
    });

    server.process.stdin?.write(msg);
  });
}

// External API call execution
export async function executeApiCall(config: ApiCallConfig, body?: unknown): Promise<ApiCallResult> {
  const start = Date.now();

  try {
    const headers: Record<string, string> = { ...config.headers };

    if (config.authType === 'bearer' && config.authToken) {
      headers['Authorization'] = `Bearer ${config.authToken}`;
    } else if (config.authType === 'api-key' && config.authToken) {
      headers['X-API-Key'] = config.authToken;
    }

    if (body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchOpts: RequestInit = {
      method: config.method,
      headers,
    };

    if (body && config.method !== 'GET') {
      fetchOpts.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const response = await fetch(config.url, fetchOpts);
    let data: unknown;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return {
      success: response.ok,
      status: response.status,
      data,
      durationMs: Date.now() - start,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 0,
      data: null,
      error: err.message,
      durationMs: Date.now() - start,
    };
  }
}
