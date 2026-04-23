import jwt from 'jsonwebtoken';

export interface GoogleIdentity {
  provider: 'google';
  googleUserId: string;
  email: string;
  name: string;
  picture?: string | null;
  emailVerified: boolean;
  planHint?: string;
}

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs';

let certCache: { certs: Record<string, string>; expiresAt: number } | null = null;

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  if (isDevGoogleToken(idToken)) {
    return parseDevGoogleToken(idToken);
  }

  const decoded = jwt.decode(idToken, { complete: true });
  if (!decoded || typeof decoded === 'string') {
    throw new Error('Malformed Google ID token');
  }

  const kid = decoded.header.kid;
  const alg = decoded.header.alg;
  if (!kid || alg !== 'RS256') {
    throw new Error('Unsupported Google token signature');
  }

  const certs = await getGoogleCerts();
  const cert = certs[kid];
  if (!cert) {
    throw new Error('Google signing key not found');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const payload = jwt.verify(idToken, cert, {
    algorithms: ['RS256'],
    audience: clientId || undefined,
    issuer: ['accounts.google.com', 'https://accounts.google.com'],
  }) as jwt.JwtPayload;

  if (!payload.sub || !payload.email || !payload.name) {
    throw new Error('Google token missing required claims');
  }

  return {
    provider: 'google',
    googleUserId: String(payload.sub),
    email: String(payload.email).toLowerCase(),
    name: String(payload.name),
    picture: typeof payload.picture === 'string' ? payload.picture : null,
    emailVerified: payload.email_verified === true || payload.email_verified === 'true',
  };
}

export function isGoogleSignInEnabled(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID);
}

async function getGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (certCache && certCache.expiresAt > now) {
    return certCache.certs;
  }

  const response = await fetch(GOOGLE_CERTS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch Google certs: HTTP ${response.status}`);
  }

  const cacheControl = response.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeSeconds = maxAgeMatch ? Number(maxAgeMatch[1]) : 300;
  const certs = await response.json() as Record<string, string>;
  certCache = {
    certs,
    expiresAt: now + maxAgeSeconds * 1000,
  };
  return certs;
}

function isDevGoogleToken(idToken: string): boolean {
  return idToken.startsWith('test-google:') || idToken.startsWith('dev-google:');
}

function parseDevGoogleToken(idToken: string): GoogleIdentity {
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_ALLOW_DEV_GOOGLE_TOKENS !== 'true') {
    throw new Error('Development Google tokens are disabled');
  }

  const payload = idToken.split(':', 2)[1];
  const raw = Buffer.from(payload, 'base64url').toString('utf8');
  const parsed = JSON.parse(raw) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    plan?: string;
  };

  if (!parsed.sub || !parsed.email || !parsed.name) {
    throw new Error('Invalid development Google token');
  }

  return {
    provider: 'google',
    googleUserId: parsed.sub,
    email: parsed.email.toLowerCase(),
    name: parsed.name,
    picture: parsed.picture || null,
    emailVerified: true,
    planHint: parsed.plan,
  };
}
