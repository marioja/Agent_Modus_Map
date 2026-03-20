// Authentication and RBAC service
import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'agent-modus-map-dev-secret-change-in-production';
const TOKEN_EXPIRY = '24h';

export type Role = 'admin' | 'designer' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface AuthToken {
  token: string;
  user: User;
  expiresAt: string;
}

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'swarm.read', 'swarm.create', 'swarm.update', 'swarm.delete', 'swarm.export', 'swarm.import',
    'agent.read', 'agent.create', 'agent.update', 'agent.delete',
    'relationship.create', 'relationship.delete',
    'template.read', 'template.instantiate',
    'monitoring.read', 'monitoring.simulate',
    'traces.read', 'traces.create',
    'governance.read', 'governance.audit', 'governance.compliance',
    'collaboration.read', 'collaboration.write', 'collaboration.version',
    'optimization.read',
    'docs.read', 'docs.generate',
    'users.read', 'users.create', 'users.update', 'users.delete',
  ],
  designer: [
    'swarm.read', 'swarm.create', 'swarm.update', 'swarm.export', 'swarm.import',
    'agent.read', 'agent.create', 'agent.update', 'agent.delete',
    'relationship.create', 'relationship.delete',
    'template.read', 'template.instantiate',
    'monitoring.read',
    'traces.read', 'traces.create',
    'governance.read',
    'collaboration.read', 'collaboration.write', 'collaboration.version',
    'optimization.read',
    'docs.read', 'docs.generate',
  ],
  viewer: [
    'swarm.read', 'swarm.export',
    'agent.read',
    'template.read',
    'monitoring.read',
    'traces.read',
    'governance.read',
    'collaboration.read',
    'optimization.read',
    'docs.read',
  ],
};

export function initAuthStore(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default admin if no users exist (use low rounds for fast init)
  const count = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any)?.c || 0;
  if (count === 0) {
    const rounds = process.env.NODE_ENV === 'test' ? 1 : 10;
    const hash = bcrypt.hashSync('admin', rounds);
    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(randomUUID(), 'admin@agentmodus.local', 'Admin', hash, 'admin');

    const designerHash = bcrypt.hashSync('designer', rounds);
    db.prepare(
      'INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)'
    ).run(randomUUID(), 'designer@agentmodus.local', 'Designer', designerHash, 'designer');
  }
}

export function login(db: Database.Database, email: string, password: string): AuthToken | null {
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!row) return null;

  if (!bcrypt.compareSync(password, row.password_hash)) return null;

  const user: User = {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.created_at,
  };

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  return { token, user, expiresAt };
}

export function verifyToken(token: string): { userId: string; role: Role } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: Role };
    return decoded;
  } catch {
    return null;
  }
}

export function getUserById(db: Database.Database, userId: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role, createdAt: row.created_at };
}

export function listUsers(db: Database.Database): User[] {
  const rows = db.prepare('SELECT * FROM users ORDER BY created_at').all() as any[];
  return rows.map(row => ({ id: row.id, email: row.email, name: row.name, role: row.role, createdAt: row.created_at }));
}

export function createUser(db: Database.Database, email: string, name: string, password: string, role: Role): User {
  const id = randomUUID();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare('INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(id, email, name, hash, role);
  return getUserById(db, id)!;
}

export function updateUserRole(db: Database.Database, userId: string, role: Role): void {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
}

export function deleteUser(db: Database.Database, userId: string): void {
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}

export function hasPermission(role: Role, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): string[] {
  return ROLE_PERMISSIONS[role] || [];
}
