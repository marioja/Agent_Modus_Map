import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import type Database from 'better-sqlite3';
import {
  login, verifyToken, getUserById, listUsers, createUser, updateUserRole, deleteUser,
  hasPermission, getPermissions, type Role,
} from '../services/auth-service.js';

export function createAuthRoutes(db: Database.Database): Router {
  const router = Router();

  // POST /api/auth/login
  router.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = login(db, email, password);
    if (!result) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ data: result });
  });

  // GET /api/auth/me
  router.get('/me', (req, res) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const user = getUserById(db, decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ data: { user, permissions: getPermissions(user.role) } });
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

  return router;
}

// Middleware to require a specific role
export function requireRole(db: Database.Database, requiredRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });

    const roleHierarchy: Record<Role, number> = { admin: 3, designer: 2, viewer: 1 };
    if ((roleHierarchy[decoded.role] || 0) < (roleHierarchy[requiredRole] || 0)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    (req as any).user = decoded;
    next();
  };
}

// Optional auth middleware (populates user but doesn't require it)
export function optionalAuth(db: Database.Database) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = getUserById(db, decoded.userId);
        if (user) (req as any).user = user;
      }
    }
    next();
  };
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}
