# ADR-001: Property Graph for Agent Relationships

**Status:** Accepted
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 4.1, 5.3

## Context

Agent Modus Map models 24+ agents with four typed relationship edges (dependsOn, feedsInto, collaboratesWith, canOverride). The core queries the system must support are graph-native:

- "What is the blast radius if Catalog goes down?" (multi-hop dependency traversal)
- "Find all agents within two hops of Relay that have CRITICAL badges" (filtered traversal)
- "What is the critical path through the Order Processing layer?" (path analysis)
- "Which agents are single points of failure?" (centrality/betweenness analysis)

These queries map naturally to graph traversal but require complex recursive joins in SQL.

## Decision

Use a **property graph database** (Neo4j, or a compatible alternative like Memgraph or FalkorDB) as the primary store for agent definitions, relationships, layers, and swarm configurations.

### Data Model

```
(:Agent {id, nickname, formalName, descriptor, badges[], layer})
  -[:DEPENDS_ON {priority, fallback}]->(:Agent)
  -[:FEEDS_INTO {dataType, frequency}]->(:Agent)
  -[:COLLABORATES_WITH {protocol}]->(:Agent)
  -[:CAN_OVERRIDE {conditions, requiresJustification}]->(:Agent)
  -[:MEMBER_OF]->(:Layer {name, colorTheme, order})
  -[:INSTANCE_OF]->(:Template {domain, version})
```

### Query Examples

```cypher
// Blast radius: all agents affected if Catalog fails
MATCH (root:Agent {nickname: 'Catalog'})<-[:DEPENDS_ON*1..3]-(affected)
RETURN affected.nickname, length(path) AS hops

// Single points of failure
MATCH (a:Agent)
WITH a, size((a)<-[:DEPENDS_ON]-()) AS dependents
WHERE dependents > 3
RETURN a.nickname, dependents ORDER BY dependents DESC

// Critical path
MATCH p = shortestPath(
  (start:Agent {nickname: 'Domino'})-[:FEEDS_INTO*]->(end:Agent {nickname: 'Courier'})
)
RETURN [n IN nodes(p) | n.nickname] AS criticalPath
```

## Consequences

### Positive
- Queries that matter most (dependency traversal, blast radius, path analysis) are native and fast
- The graph schema directly mirrors the visual representation users see on the canvas
- Graph RAG (ADR-003) can traverse the same store without translation
- Adding new relationship types requires no schema migration, just new edge labels
- Graph visualization libraries (D3, Cytoscape.js) consume graph data directly

### Negative
- Property graph databases have a smaller talent pool than relational databases
- Transactional guarantees vary across graph databases (Neo4j supports ACID, some alternatives do not)
- Reporting and aggregation queries (e.g., "count of agents by layer") are simpler in SQL
- Adds operational complexity: one more database to run, back up, and monitor

### Neutral
- PostgreSQL with pgvector will still be used for vector embeddings, audit logs, and user management
- The graph database handles the relationship model; PostgreSQL handles everything else
- This is a two-database architecture, not a replacement of relational storage

## Alternatives Considered

**PostgreSQL with recursive CTEs**: Could model relationships as a join table and use `WITH RECURSIVE` for traversal. Rejected because multi-hop traversal with filtered conditions becomes complex and slow at scale. Also requires the application layer to translate between relational results and graph visualizations.

**PostgreSQL with Apache AGE extension**: Adds Cypher query support to PostgreSQL. Considered viable, but the extension is less mature than Neo4j and has limited community support. Could revisit if operational simplicity becomes a higher priority than query capability.

**In-memory graph (application-level)**: Keep the current JavaScript object approach but add persistence via JSON export. Rejected because it does not scale to multi-user, multi-swarm environments and provides no query language.
