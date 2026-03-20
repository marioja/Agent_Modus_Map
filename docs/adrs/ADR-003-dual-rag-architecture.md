# ADR-003: Dual RAG Architecture (Graph RAG + Documentation RAG)

**Status:** Accepted
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 2.3, 2.4, 5.3

## Context

The platform needs to answer two fundamentally different types of questions:

1. **Swarm-specific queries**: "What happens if Relay goes down?" "Which agents are involved in order processing?" "Show me Catalog's dependencies." These require traversing the actual agent relationship graph for the user's specific swarm.

2. **Best practice queries**: "What is the recommended pattern for human-in-the-loop approval?" "How should I handle agent failover?" "What monitoring should a HUB agent have?" These require retrieving from a curated corpus of design patterns, incident playbooks, and vendor documentation.

These two query types need different retrieval strategies, different data sources, different embedding models, and different update frequencies.

## Decision

Implement **two separate RAG systems** that share a common natural-language query interface:

### Graph RAG (Swarm-Specific)

- **Source**: Property graph database (ADR-001)
- **Retrieval method**: Cypher query generation from natural language, followed by graph traversal to assemble context
- **Traversal strategy**: Start with the entity mentioned in the query, expand 1-2 hops along relevant relationship types, collect agent metadata and operational data along the path
- **Response**: Narrative answer + visual highlight on the swarm map showing affected agents
- **Update frequency**: Real-time (reflects current swarm configuration)
- **Confidence threshold**: If traversal returns fewer than 2 relevant nodes, fall back to Documentation RAG

### Documentation RAG (Best Practices)

- **Source**: Vector store (pgvector or Weaviate) containing embedded chunks from curated documentation
- **Corpus**: Agent design patterns, swarm architecture best practices, incident playbooks, framework documentation (AutoGen, CrewAI, LangGraph), compliance checklists
- **Retrieval method**: Hybrid search (keyword BM25 + semantic cosine similarity)
- **Chunking**: 512-token chunks with 64-token overlap, preserving document section boundaries
- **Response**: Synthesized answer with source citations
- **Update frequency**: On corpus update (manual curation cycle)

### Query Router

A lightweight classifier determines which RAG system handles each query:

- Queries mentioning specific agent names, layers, or relationships -> Graph RAG
- Queries about general patterns, best practices, or "how should I" -> Documentation RAG
- Ambiguous queries -> Both systems, results merged with source attribution

## Consequences

### Positive
- Each RAG system is optimized for its data type and query pattern
- Graph RAG delivers answers that are always current with the swarm configuration
- Documentation RAG provides stable, curated best practice guidance
- The visual highlighting feature (Graph RAG showing affected agents on the map) is a strong differentiator for non-technical users
- Fallback behavior prevents poor-quality answers when one system lacks sufficient data

### Negative
- Two retrieval systems to build, maintain, and monitor
- The query router introduces a classification step that can misroute queries
- Graph RAG quality depends heavily on the Cypher generation step, which is an active research area
- The documentation corpus requires ongoing curation to stay current

### Neutral
- Both systems use the same LLM for answer generation; the difference is in retrieval, not generation
- The query interface is unified from the user's perspective

## Alternatives Considered

**Single RAG with mixed corpus**: Embed both swarm configuration data and documentation into one vector store. Rejected because swarm configuration is structured (graph), not textual, and would produce poor embeddings. Also, update frequencies differ dramatically.

**Graph RAG only**: Encode best practices as nodes/edges in the knowledge graph. Rejected because best practice documentation is narrative text, not graph-structured data. Forcing it into a graph schema would lose nuance and context.

**No RAG, just search**: Provide keyword search over documentation and Cypher queries over the graph. Rejected because the target audience is non-technical. They should not need to learn Cypher or formulate precise search queries.
