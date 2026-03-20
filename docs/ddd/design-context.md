# Design Context (Core Domain)

**Owner:** Design Team
**Type:** Core Domain
**Priority:** Highest. This is the primary value-creation context.

## Purpose

The Design Context manages the lifecycle of agents and swarms. It is the "source of truth" for what agents exist, how they are configured, and how they relate to each other. Every other context depends on data that originates here.

## Ubiquitous Language

| Term | Definition |
|------|-----------|
| **Agent** | An autonomous unit within a swarm with a defined role, relationships, and configuration |
| **Swarm** | A collection of agents organized into layers with defined relationships |
| **Layer** | A logical grouping of agents by function (Customer Journey, Order Processing, etc.) |
| **Relationship** | A typed, directed connection between two agents (dependsOn, feedsInto, collaboratesWith, canOverride) |
| **Motus Profile** | The human-readable identity of an agent: nickname, formal name, descriptor, and badges |
| **Canvas** | The visual workspace where users design swarms |
| **Palette** | The sidebar component containing draggable agent types |
| **Validation Rule** | A best-practice constraint that the system checks against the current swarm configuration |
| **Blueprint** | A saved, shareable swarm configuration |

## Aggregates

### Swarm (Aggregate Root)

```typescript
interface Swarm {
  id: SwarmId
  name: string
  description: string
  layers: Layer[]
  agents: Agent[]
  relationships: Relationship[]
  templateSource?: TemplateId  // if instantiated from a template
  version: number
  createdBy: UserId
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Agent (Entity within Swarm)

```typescript
interface Agent {
  id: AgentId
  swarmId: SwarmId
  nickname: string          // "Doorbell"
  formalName: string        // "Interface-FirstContact"
  descriptor: string        // "The Greeter"
  layer: LayerId
  badges: Badge[]           // ["ENTRY", "AUTO", "HUMAN"]
  position: { x: number, y: number }  // canvas position
  config: AgentConfig       // agent-specific settings
  healthEndpoint?: string   // URL for health data collection
}
```

### Relationship (Entity within Swarm)

```typescript
interface Relationship {
  id: RelationshipId
  swarmId: SwarmId
  sourceAgentId: AgentId
  targetAgentId: AgentId
  type: 'dependsOn' | 'feedsInto' | 'collaboratesWith' | 'canOverride'
  metadata: Record<string, unknown>  // type-specific config
}
```

## Value Objects

```typescript
// Immutable, compared by value
type SwarmId = string       // uuid-v7
type AgentId = string       // uuid-v7
type LayerId = string       // uuid-v7
type RelationshipId = string

type Badge = 'HUB' | 'CRITICAL' | 'ENTRY' | 'AUTO' | 'HUMAN'
           | 'APPROVAL' | 'ALWAYS_ON' | 'ADVISORY' | 'CAN_OVERRIDE'

interface LayerDefinition {
  name: string
  colorTheme: string   // hex color
  order: number        // display order top-to-bottom
}

interface ValidationResult {
  rule: string
  severity: 'error' | 'warning' | 'advisory'
  message: string       // plain language, always
  affectedAgents: AgentId[]
}
```

## Domain Events

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `SwarmCreated` | User creates new swarm or instantiates template | Intelligence, Governance |
| `SwarmUpdated` | Any change to swarm structure | Intelligence, Collaboration, Governance |
| `AgentAdded` | Agent placed on canvas | Intelligence, Monitoring |
| `AgentRemoved` | Agent deleted from canvas | Intelligence, Monitoring, Governance |
| `AgentConfigChanged` | Agent properties edited | Intelligence, Monitoring, Governance |
| `RelationshipCreated` | Connection drawn between agents | Intelligence |
| `RelationshipRemoved` | Connection deleted | Intelligence |
| `SwarmValidated` | Validation engine runs | Governance (if errors) |
| `SwarmExported` | User exports swarm config | Governance |
| `SwarmImported` | User imports swarm config | Intelligence, Governance |

## Commands

| Command | Input | Validation |
|---------|-------|-----------|
| `CreateSwarm` | name, description, templateId? | Name must be unique per user |
| `AddAgent` | swarmId, agentData, position | Agent nickname unique within swarm |
| `RemoveAgent` | swarmId, agentId | Warn if agent has dependents |
| `UpdateAgent` | swarmId, agentId, changes | Validate badges and config |
| `CreateRelationship` | swarmId, source, target, type | No self-relationships, no duplicate relationships |
| `RemoveRelationship` | swarmId, relationshipId | Warn if on critical path |
| `MoveAgent` | swarmId, agentId, newPosition | Position within canvas bounds |
| `ValidateSwarm` | swarmId | Run all active validation rules |
| `ExportSwarm` | swarmId, format | Format: json, yaml |
| `ImportSwarm` | configData, format | Schema validation on import |

## Invariants

1. Every agent belongs to exactly one layer
2. Every agent has a unique nickname within its swarm
3. Relationships connect two distinct agents within the same swarm
4. No duplicate relationships (same source, target, and type)
5. Every CRITICAL agent must have at least one monitoring relationship (advisory, not blocking)
6. Every HUB agent must have at least one dependsOn or feedsInto relationship
7. Swarm must have at least one agent to be valid

## Integration Contracts

### Publishes (to other contexts)

```typescript
// Event bus / message queue
interface SwarmChangedEvent {
  swarmId: SwarmId
  changeType: 'created' | 'updated' | 'deleted'
  timestamp: DateTime
  actor: UserId
  snapshot: Swarm  // full swarm state at time of change
}
```

### Consumes (from other contexts)

```typescript
// From Template Context
interface TemplateInstantiatedEvent {
  templateId: TemplateId
  swarmId: SwarmId
  customizations: Record<string, unknown>
}
```

## Repository Interface

```typescript
interface SwarmRepository {
  findById(id: SwarmId): Promise<Swarm | null>
  findByUser(userId: UserId): Promise<Swarm[]>
  save(swarm: Swarm): Promise<void>
  delete(id: SwarmId): Promise<void>
  export(id: SwarmId, format: 'json' | 'yaml'): Promise<string>
  import(data: string, format: 'json' | 'yaml'): Promise<Swarm>
}
```
