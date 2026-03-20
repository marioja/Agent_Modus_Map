# Intelligence Context (Supporting Domain)

**Owner:** AI/ML Team
**Type:** Supporting Domain
**Priority:** High. Primary differentiator for non-technical user experience.
**Depends on:** ADR-001 (Property Graph), ADR-003 (Dual RAG), ADR-004 (Decision Traces)

## Purpose

The Intelligence Context manages the knowledge graph, both RAG systems (Graph RAG and Documentation RAG), and decision trace storage/querying. It makes the platform "smart," enabling users to ask questions in natural language and receive accurate, contextual answers.

## Ubiquitous Language

| Term | Definition |
|------|-----------|
| **Knowledge Graph** | The property graph representing all agents, relationships, layers, and operational metadata |
| **Graph RAG** | Retrieval-augmented generation that traverses the knowledge graph to answer swarm-specific queries |
| **Documentation RAG** | RAG over the curated best practices corpus |
| **Decision Trace** | A four-stage log of an agent's decision process (Observation, Analysis, Decision, Action) |
| **Traversal** | A graph walk following relationship edges to collect context |
| **Blast Radius** | The set of agents affected by a failure or change, determined by dependency traversal |
| **Embedding** | A vector representation of a text chunk used for semantic search |
| **Chunk** | A segment of documentation suitable for embedding (512 tokens, 64-token overlap) |
| **Query Router** | The classifier that determines which RAG system handles a user query |

## Aggregates

### KnowledgeGraph (Aggregate Root)

```typescript
interface KnowledgeGraph {
  swarmId: SwarmId
  nodes: GraphNode[]
  edges: GraphEdge[]
  lastSyncedAt: DateTime
  version: number
}

interface GraphNode {
  id: string
  type: 'agent' | 'layer' | 'template' | 'metric'
  properties: Record<string, unknown>
}

interface GraphEdge {
  id: string
  source: string
  target: string
  type: 'DEPENDS_ON' | 'FEEDS_INTO' | 'COLLABORATES_WITH' | 'CAN_OVERRIDE' | 'MEMBER_OF'
  properties: Record<string, unknown>
}
```

### DecisionTraceStore (Aggregate Root)

```typescript
interface DecisionTraceStore {
  swarmId: SwarmId
  traces: DecisionTrace[]
  retentionPolicy: RetentionPolicy
}

interface DecisionTrace {
  id: TraceId
  agentId: AgentId
  agentNickname: string
  timestamp: DateTime
  observation: {
    inputs: Record<string, unknown>
    sourceAgents: AgentId[]
  }
  analysis: {
    rulesEvaluated: RuleResult[]
    confidence: number
    flags: string[]
  }
  decision: {
    actionChosen: string
    reason: string              // plain language
    alternativesConsidered: Alternative[]
    escalationTarget?: string
  }
  action: {
    executed: string
    result: string
    downstreamEffects: Effect[]
    durationMs: number
  }
}
```

### DocumentationCorpus (Aggregate Root)

```typescript
interface DocumentationCorpus {
  id: CorpusId
  name: string                    // "Agent Design Best Practices v2"
  documents: CorpusDocument[]
  embeddingModel: string          // "text-embedding-3-small"
  lastIndexedAt: DateTime
  chunkCount: number
}

interface CorpusDocument {
  id: DocumentId
  title: string
  source: string                  // URL or file path
  chunks: Chunk[]
  metadata: { category: string, lastUpdated: DateTime }
}

interface Chunk {
  id: ChunkId
  text: string
  embedding: number[]             // vector
  documentId: DocumentId
  position: number                // order within document
}
```

## Domain Events

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `KnowledgeGraphSynced` | Design Context publishes SwarmChanged | Internal: graph rebuild |
| `QueryProcessed` | User asks a question via chat | Governance (audit: query logged) |
| `DecisionTraceIngested` | Agent runtime emits trace | Internal: index and store |
| `CorpusUpdated` | Admin adds/modifies documentation | Internal: re-embed changed chunks |
| `BlastRadiusCalculated` | User or system requests impact analysis | Design (highlight on canvas) |

## Query Router Logic

```
function routeQuery(query: string): 'graph_rag' | 'doc_rag' | 'both' {
  // Check for agent names, layer names, relationship terms
  if (containsSwarmEntities(query)):
    return 'graph_rag'

  // Check for pattern/best practice language
  if (containsBestPracticeTerms(query)):
    return 'doc_rag'

  // Ambiguous: run both, merge results
  return 'both'
}
```

## Graph Traversal Patterns

### Blast Radius Query

```cypher
MATCH (root:Agent {nickname: $agentName})<-[:DEPENDS_ON*1..3]-(affected)
RETURN affected.nickname, affected.badges,
       length(path) AS hops
ORDER BY hops
```

### Critical Path Analysis

```cypher
MATCH p = shortestPath(
  (start:Agent {nickname: $from})-[:FEEDS_INTO*]->(end:Agent {nickname: $to})
)
RETURN [n IN nodes(p) | n.nickname] AS path,
       length(p) AS length
```

### Single Points of Failure

```cypher
MATCH (a:Agent)
WITH a, size((a)<-[:DEPENDS_ON]-()) AS dependents
WHERE dependents >= $threshold
RETURN a.nickname, a.badges, dependents
ORDER BY dependents DESC
```

## Integration Contracts

### Consumes

```typescript
// From Design Context
interface SwarmChangedEvent {
  swarmId: SwarmId
  snapshot: Swarm
}

// From Monitoring Context
interface AgentStatusChangedEvent {
  agentId: AgentId
  newStatus: HealthStatus
}

// From Agent Runtimes
interface DecisionTracePayload {
  // ADR-004 schema
}
```

### Publishes

```typescript
interface QueryResponseEvent {
  queryId: string
  query: string
  response: string
  sources: string[]           // citations or graph paths
  highlightedAgents: AgentId[]  // for canvas visual highlighting
  confidence: number
}
```
