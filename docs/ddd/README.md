# Domain-Driven Design: Bounded Contexts

This directory defines the bounded contexts for the Agent Modus Map platform. Each context is a self-contained domain with its own ubiquitous language, aggregates, entities, value objects, domain events, and integration contracts.

## Context Map

```
+------------------+       +------------------+       +------------------+
|                  |       |                  |       |                  |
|  DESIGN CONTEXT  |<----->| TEMPLATE CONTEXT |       | COLLABORATION    |
|  (Core Domain)   |       |                  |       | CONTEXT          |
|                  |       +------------------+       |                  |
+--------+---------+                                  +--------+---------+
         |                                                     |
         | publishes SwarmChanged                    consumes SwarmChanged
         | consumes TemplateInstantiated             publishes CommentAdded
         v                                                     |
+------------------+       +------------------+       +--------+---------+
|                  |       |                  |       |                  |
| INTELLIGENCE     |<------| MONITORING       |       | GOVERNANCE       |
| CONTEXT          |       | CONTEXT          |------>| CONTEXT          |
|                  |       |                  |       |                  |
+------------------+       +------------------+       +------------------+
```

## Bounded Context Index

| Context | Type | Document |
|---------|------|----------|
| [Design](design-context.md) | Core Domain | Agent and swarm lifecycle, canvas operations |
| [Monitoring](monitoring-context.md) | Supporting Domain | Health data, alerting, dashboards |
| [Intelligence](intelligence-context.md) | Supporting Domain | Knowledge graph, RAG, decision traces |
| [Governance](governance-context.md) | Supporting Domain | Audit, RBAC, compliance, approvals |
| [Template](template-context.md) | Supporting Domain | Template library, marketplace, customization |
| [Collaboration](collaboration-context.md) | Generic Domain | Real-time editing, presence, versioning |

## Integration Patterns

- **Design <-> Intelligence**: Published Language. Design publishes `SwarmChanged` events; Intelligence subscribes to rebuild the knowledge graph.
- **Design <-> Template**: Customer-Supplier. Template provides swarm blueprints; Design instantiates them.
- **Monitoring <-> Intelligence**: Shared Kernel. Both contexts share the agent identifier and health status value objects.
- **Monitoring <-> Governance**: Conformist. Monitoring emits events that Governance consumes for audit logging.
- **Collaboration <-> Design**: Partnership. Both contexts share the Yjs document model for real-time sync.
- **Governance <-> All**: Anti-Corruption Layer. Governance wraps all incoming events in its own audit entry format.
