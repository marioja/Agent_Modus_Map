import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type Database from 'better-sqlite3';
import {
  login, listUsers, createUser, updateUserRole, deleteUser,
  upsertGoogleUser, type Role,
} from '../services/auth-service.js';
import { verifyGoogleIdToken, isGoogleSignInEnabled } from '../services/google-oauth-service.js';
import {
  getRequestAuth,
  issueLicense,
  issueRoleBackedLicense,
  resolveAuthorizationState,
} from '../services/license-service.js';
import { resolveSubscription, setSubscriptionOverride, normalizePlan } from '../services/subscription-service.js';

export function createAuthRoutes(db: Database.Database): Router {
  const router = Router();

  router.get('/config', (_req, res) => {
    res.json({
      data: {
        googleEnabled: isGoogleSignInEnabled(),
        googleClientId: process.env.GOOGLE_CLIENT_ID || null,
        passwordEnabled: true,
      },
    });
  });

  router.get('/state', (req, res) => {
    res.json({ data: getRequestAuth(req) });
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = login(db, email, password);
    if (!result) return res.status(401).json({ error: 'Invalid credentials' });

    const authState = await issueRoleBackedLicense(db, result.user);
    res.json({ data: { ...authState, sessionToken: result.token } });
  });

  router.post('/google/activate', async (req, res) => {
    try {
      const { idToken, picture } = req.body;
      if (!idToken || typeof idToken !== 'string') {
        res.status(400).json({ error: 'Google ID token required' });
        return;
      }

      const verifiedIdentity = await verifyGoogleIdToken(idToken);
      const identity = !verifiedIdentity.picture && typeof picture === 'string' && picture.trim()
        ? { ...verifiedIdentity, picture: picture.trim() }
        : verifiedIdentity;
      const user = upsertGoogleUser(db, identity);
      const subscription = await resolveSubscription(db, identity);
      const authState = await issueLicense(db, user, subscription);
      res.json({ data: authState });
    } catch (error) {
      res.status(401).json({ error: error instanceof Error ? error.message : 'Google activation failed' });
    }
  });

  router.post('/license/refresh', async (req, res) => {
    const auth = getRequestAuth(req);
    if (!auth.authenticated || !auth.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (auth.user.authProvider === 'google') {
      const subscription = await resolveSubscription(db, { email: auth.user.email });
      const refreshed = await issueLicense(db, auth.user, subscription);
      res.json({ data: refreshed });
      return;
    }

    const refreshed = await issueRoleBackedLicense(db, auth.user);
    res.json({ data: refreshed });
  });

  // GET /api/auth/me
  router.get('/me', (req, res) => {
    const auth = getRequestAuth(req);
    if (!auth.authenticated || !auth.user) {
      res.status(401).json({ error: 'No authenticated session' });
      return;
    }
    res.json({ data: auth });
  });

  // GET /api/auth/users (admin only)
  router.get('/users', requireRole(db, 'admin'), (req, res) => {
    const users = listUsers(db);
    res.json({ data: users });
  });

  // POST /api/auth/users (admin only)
  router.post('/users', requireRole(db, 'admin'), (req, res) => {
    const { email, name, password, role } = req.body;
    if (!email || !name || !password) return res.status(400).json({ error: 'Email, name, and password required' });

    try {
      const user = createUser(db, email, name, password, role || 'viewer');
      res.status(201).json({ data: user });
    } catch (err: any) {
      if (err.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
      throw err;
    }
  });

  // PUT /api/auth/users/:userId/role (admin only)
  router.put('/users/:userId/role', requireRole(db, 'admin'), (req, res) => {
    const { role } = req.body;
    if (!role || !['admin', 'designer', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'Valid role required (admin, designer, viewer)' });
    }
    updateUserRole(db, String(req.params.userId), role);
    res.json({ data: { updated: true } });
  });

  // DELETE /api/auth/users/:userId (admin only)
  router.delete('/users/:userId', requireRole(db, 'admin'), (req, res) => {
    deleteUser(db, String(req.params.userId));
    res.json({ data: { deleted: true } });
  });

  router.post('/dev/subscription-override', requireRole(db, 'admin'), async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const { email, plan, status, expiresAt } = req.body;
    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    setSubscriptionOverride(db, email, normalizePlan(plan), status, expiresAt);
    const auth = await resolveAuthorizationState(db, extractToken(req));
    res.json({ data: auth });
  });

  return router;
}

// Middleware to require a specific role
export function requireRole(db: Database.Database, requiredRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = getRequestAuth(req);
    if (!auth.authenticated || !auth.user) return res.status(401).json({ error: 'Authentication required' });

    const roleHierarchy: Record<Role, number> = { admin: 3, designer: 2, viewer: 1 };
    if ((roleHierarchy[auth.user.role] || 0) < (roleHierarchy[requiredRole] || 0)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    (req as any).user = auth.user;
    next();
  };
}

// Optional auth middleware (populates user but doesn't require it)
export function optionalAuth(db: Database.Database) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (token) {
      const auth = await resolveAuthorizationState(db, token);
      if (auth.user) (req as any).user = auth.user;
    }
    next();
  };
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}
