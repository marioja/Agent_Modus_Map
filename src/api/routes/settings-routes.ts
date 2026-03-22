import { Router } from 'express';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env');

export function createSettingsRoutes(): Router {
  const router = Router();

  // GET /api/settings/keys - check which keys are configured
  router.get('/keys', (_req, res) => {
    res.json({
      data: {
        anthropic: {
          set: !!process.env.ANTHROPIC_API_KEY,
          length: process.env.ANTHROPIC_API_KEY?.length || 0,
          prefix: process.env.ANTHROPIC_API_KEY?.slice(0, 7) || '',
        },
        tavily: {
          set: !!process.env.TAVILY_API_KEY,
          length: process.env.TAVILY_API_KEY?.length || 0,
          prefix: process.env.TAVILY_API_KEY?.slice(0, 4) || '',
        },
      },
    });
  });

  // POST /api/settings/keys - update API keys
  router.post('/keys', (req, res) => {
    const { anthropicKey, tavilyKey } = req.body;

    // Update in-memory environment
    if (anthropicKey) process.env.ANTHROPIC_API_KEY = anthropicKey;
    if (tavilyKey) process.env.TAVILY_API_KEY = tavilyKey;

    // Persist to .env file
    let envContent = '';
    if (existsSync(ENV_PATH)) {
      envContent = readFileSync(ENV_PATH, 'utf-8');
    }

    if (anthropicKey) {
      envContent = envContent.replace(/^ANTHROPIC_API_KEY=.*$/m, '');
      envContent = envContent.trim() + `\nANTHROPIC_API_KEY=${anthropicKey}\n`;
    }
    if (tavilyKey) {
      envContent = envContent.replace(/^TAVILY_API_KEY=.*$/m, '');
      envContent = envContent.trim() + `\nTAVILY_API_KEY=${tavilyKey}\n`;
    }

    writeFileSync(ENV_PATH, envContent.trim() + '\n');

    res.json({
      data: {
        anthropic: { set: !!process.env.ANTHROPIC_API_KEY },
        tavily: { set: !!process.env.TAVILY_API_KEY },
        message: 'Keys updated. They are active immediately.',
      },
    });
  });

  // POST /api/settings/keys/test - test if keys work
  router.post('/keys/test', async (req, res) => {
    const results: Record<string, { working: boolean; error?: string }> = {};

    // Test Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default;
        const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        await client.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'hi' }],
        });
        results.anthropic = { working: true };
      } catch (err: any) {
        results.anthropic = { working: false, error: err.message?.slice(0, 100) };
      }
    } else {
      results.anthropic = { working: false, error: 'No key set' };
    }

    // Test Tavily
    if (process.env.TAVILY_API_KEY) {
      try {
        const r = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query: 'test', max_results: 1 }),
        });
        if (r.ok) {
          results.tavily = { working: true };
        } else {
          results.tavily = { working: false, error: `HTTP ${r.status}` };
        }
      } catch (err: any) {
        results.tavily = { working: false, error: err.message?.slice(0, 100) };
      }
    } else {
      results.tavily = { working: false, error: 'No key set' };
    }

    res.json({ data: results });
  });

  return router;
}
