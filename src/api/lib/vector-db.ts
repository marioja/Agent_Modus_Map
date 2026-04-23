/**
 * Lightweight VectorDB backed by better-sqlite3.
 * Drop-in replacement for the ruvector package (which ships without its
 * compiled dist/ folder and cannot be used at runtime).
 *
 * API surface matches the subset used by prospect-service.ts:
 *   insert, get, delete, search, len
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export interface VectorDBOptions {
  dimensions: number;
  storagePath: string;
}

export interface InsertOptions {
  vector: number[];
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  vector: number[];
  k: number;
}

export interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface GetResult {
  id?: string;
  metadata?: Record<string, unknown>;
}

interface VectorRow {
  id: string;
  vector: string; // JSON-encoded number[]
  metadata: string; // JSON-encoded object
}

export class VectorDB {
  private db: Database.Database;
  private readonly dimensions: number;

  constructor(options: VectorDBOptions) {
    this.dimensions = options.dimensions;

    // Ensure storage directory exists
    const dir = path.dirname(options.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(options.storagePath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vectors (
        id       TEXT PRIMARY KEY,
        vector   TEXT NOT NULL,
        metadata TEXT NOT NULL DEFAULT '{}'
      )
    `);
  }

  async insert(options: InsertOptions): Promise<string> {
    const id = randomUUID();
    const vector = JSON.stringify(options.vector ?? new Array(this.dimensions).fill(0));
    const metadata = JSON.stringify(options.metadata ?? {});
    this.db
      .prepare('INSERT INTO vectors (id, vector, metadata) VALUES (?, ?, ?)')
      .run(id, vector, metadata);
    return id;
  }

  async get(id: string): Promise<GetResult | null> {
    const row = this.db
      .prepare('SELECT id, metadata FROM vectors WHERE id = ?')
      .get(id) as Pick<VectorRow, 'id' | 'metadata'> | undefined;
    if (!row) return null;
    return { id: row.id, metadata: JSON.parse(row.metadata) as Record<string, unknown> };
  }

  async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM vectors WHERE id = ?').run(id);
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { vector: query, k } = options;
    const rows = this.db.prepare('SELECT id, vector, metadata FROM vectors').all() as VectorRow[];

    const scored = rows.map((row) => {
      const vec = JSON.parse(row.vector) as number[];
      const score = cosineSimilarity(query, vec);
      return {
        id: row.id,
        score,
        metadata: JSON.parse(row.metadata) as Record<string, unknown>,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }

  async len(): Promise<number> {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM vectors').get() as {
      count: number;
    };
    return result.count;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
