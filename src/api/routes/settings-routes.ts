import { Router } from 'express';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ENV_PATH = join(process.cwd(), '.env');
const PROFILE_PATH = join(process.cwd(), 'data', 'profile.json');

export interface UserProfile {
  name: string;
  company: string;
  title: string;
  website: string;
  linkedin: string;
  email: string;
  phone: string;
  valueProp: string;        // One-liner: what you do and who you help
  proofPoints: string[];    // Case studies, results, credentials
  calendarLink: string;     // Calendly or similar
  tone: 'professional' | 'conversational' | 'direct';
  voiceSample: string;      // Example of how you actually write/talk, used as style guide
}

const DEFAULT_PROFILE: UserProfile = {
  name: '', company: '', title: '', website: '', linkedin: '',
  email: '', phone: '', valueProp: '', proofPoints: [], calendarLink: '', tone: 'professional', voiceSample: '',
};

function loadProfile(): UserProfile {
  try {
    if (existsSync(PROFILE_PATH)) {
      return { ...DEFAULT_PROFILE, ...JSON.parse(readFileSync(PROFILE_PATH, 'utf-8')) };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_PROFILE };
}

function saveProfile(profile: UserProfile): void {
  const dir = join(process.cwd(), 'data');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2));
}

// Exported so other services can read the profile
export function getUserProfile(): UserProfile {
  return loadProfile();
}

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

  // GET /api/settings/profile - get user profile
  router.get('/profile', (_req, res) => {
    res.json({ data: loadProfile() });
  });

  // PUT /api/settings/profile - update user profile
  router.put('/profile', (req, res) => {
    const current = loadProfile();
    const updated: UserProfile = { ...current, ...req.body };
    // Ensure proofPoints is always an array
    if (typeof updated.proofPoints === 'string') {
      updated.proofPoints = (updated.proofPoints as string).split('\n').filter(Boolean);
    }
    saveProfile(updated);
    res.json({ data: updated });
  });

  return router;
}
