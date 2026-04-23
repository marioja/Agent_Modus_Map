import type Database from 'better-sqlite3';

export type LicensePlan = 'free' | 'starter' | 'pro' | 'enterprise';
export type LicenseStatus = 'active' | 'free' | 'unverified' | 'expired';

export interface SubscriptionResolution {
  plan: LicensePlan;
  status: LicenseStatus;
  source: 'paddle' | 'local-override' | 'google-dev' | 'local-role' | 'unverified';
  expiresAt?: string;
  refreshAfter?: string;
}

interface PaddleCustomer {
  id: string;
  email?: string;
}

interface PaddleSubscription {
  status?: string;
  current_billing_period?: { ends_at?: string };
  scheduled_change?: { effective_at?: string };
  items?: Array<{ price?: { id?: string } }>;
}

const PADDLE_API_BASE = process.env.PADDLE_API_BASE || 'https://api.paddle.com';

export function initSubscriptionStore(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_overrides (
      email TEXT PRIMARY KEY,
      plan TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TEXT,
      source TEXT NOT NULL DEFAULT 'local-override',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

export function setSubscriptionOverride(
  db: Database.Database,
  email: string,
  plan: LicensePlan,
  status: LicenseStatus = 'active',
  expiresAt?: string
): void {
  db.prepare(`
    INSERT INTO subscription_overrides (email, plan, status, expires_at, source, updated_at)
    VALUES (?, ?, ?, ?, 'local-override', datetime('now'))
    ON CONFLICT(email) DO UPDATE SET
      plan = excluded.plan,
      status = excluded.status,
      expires_at = excluded.expires_at,
      source = excluded.source,
      updated_at = excluded.updated_at
  `).run(email.toLowerCase(), normalizePlan(plan), status, expiresAt ?? null);
}

export function getSubscriptionOverride(db: Database.Database, email: string): SubscriptionResolution | null {
  const row = db.prepare(
    'SELECT plan, status, expires_at, source FROM subscription_overrides WHERE email = ?'
  ).get(email.toLowerCase()) as {
    plan: string;
    status: LicenseStatus;
    expires_at?: string | null;
    source: SubscriptionResolution['source'];
  } | undefined;
  if (!row) {
    return null;
  }

  return {
    plan: normalizePlan(row.plan),
    status: row.status,
    source: row.source,
    expiresAt: row.expires_at ?? undefined,
    refreshAfter: computeRefreshAfter(row.expires_at ?? undefined),
  };
}

export async function resolveSubscription(
  db: Database.Database,
  identity: { email: string; planHint?: string }
): Promise<SubscriptionResolution> {
  if (identity.planHint) {
    return {
      plan: normalizePlan(identity.planHint),
      status: 'active',
      source: 'google-dev',
      refreshAfter: computeRefreshAfter(),
    };
  }

  const override = getSubscriptionOverride(db, identity.email);
  if (override) {
    return override;
  }

  const paddleApiKey = process.env.PADDLE_API_KEY;
  if (!paddleApiKey) {
    return { plan: 'free', status: 'unverified', source: 'unverified', refreshAfter: computeRefreshAfter() };
  }

  const customer = await fetchPaddleCustomer(identity.email, paddleApiKey);
  if (!customer) {
    return { plan: 'free', status: 'free', source: 'paddle', refreshAfter: computeRefreshAfter() };
  }

  const subscription = await fetchActivePaddleSubscription(customer.id, paddleApiKey);
  if (!subscription) {
    return { plan: 'free', status: 'free', source: 'paddle', refreshAfter: computeRefreshAfter() };
  }

  return {
    plan: mapPaddleSubscriptionToPlan(subscription),
    status: 'active',
    source: 'paddle',
    expiresAt: subscription.current_billing_period?.ends_at || subscription.scheduled_change?.effective_at,
    refreshAfter: computeRefreshAfter(subscription.current_billing_period?.ends_at || subscription.scheduled_change?.effective_at),
  };
}

export function normalizePlan(value: string | undefined | null): LicensePlan {
  switch ((value || '').trim().toLowerCase()) {
    case 'enterprise':
    case 'premium':
      return 'enterprise';
    case 'pro':
      return 'pro';
    case 'starter':
    case 'paid':
      return 'starter';
    default:
      return 'free';
  }
}

function computeRefreshAfter(expiresAt?: string): string {
  const now = Date.now();
  if (expiresAt) {
    const expires = new Date(expiresAt).getTime();
    if (Number.isFinite(expires)) {
      const refreshAt = Math.max(now + 6 * 60 * 60 * 1000, expires - 24 * 60 * 60 * 1000);
      return new Date(refreshAt).toISOString();
    }
  }
  return new Date(now + 24 * 60 * 60 * 1000).toISOString();
}

function mapPaddleSubscriptionToPlan(subscription: PaddleSubscription): LicensePlan {
  const configuredMap = parsePlanMap(process.env.PADDLE_PRICE_PLAN_MAP);
  for (const item of subscription.items || []) {
    const priceId = item.price?.id;
    if (priceId && configuredMap[priceId]) {
      return configuredMap[priceId];
    }
  }
  return 'starter';
}

function parsePlanMap(raw: string | undefined): Record<string, LicensePlan> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed).map(([priceId, plan]) => [priceId, normalizePlan(plan)])
    );
  } catch {
    return {};
  }
}

async function fetchPaddleCustomer(email: string, apiKey: string): Promise<PaddleCustomer | null> {
  const url = new URL('/customers', PADDLE_API_BASE);
  url.searchParams.set('email', email);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Paddle customer lookup failed with HTTP ${response.status}`);
  }

  const payload = await response.json() as { data?: PaddleCustomer[] };
  return payload.data?.[0] ?? null;
}

async function fetchActivePaddleSubscription(customerId: string, apiKey: string): Promise<PaddleSubscription | null> {
  const url = new URL('/subscriptions', PADDLE_API_BASE);
  url.searchParams.set('customer_id', customerId);
  url.searchParams.set('status', 'active');

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Paddle subscription lookup failed with HTTP ${response.status}`);
  }

  const payload = await response.json() as { data?: PaddleSubscription[] };
  return payload.data?.find(subscription => subscription.status === 'active') ?? null;
}
