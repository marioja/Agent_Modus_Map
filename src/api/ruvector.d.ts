declare module 'ruvector' {
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

  export class VectorDB {
    constructor(options: VectorDBOptions);
    insert(options: InsertOptions): Promise<string>;
    get(id: string): Promise<GetResult | null>;
    delete(id: string): Promise<void>;
    search(options: SearchOptions): Promise<SearchResult[]>;
    len(): Promise<number>;
  }
}
