# Template Context (Supporting Domain)

**Owner:** Product Team
**Type:** Supporting Domain
**Priority:** High. Primary driver of non-technical adoption.
**Depends on:** ADR-005 (Template-First UX)

## Purpose

The Template Context manages the library of reusable swarm architecture templates, the customization workflow, and the community marketplace. It is the front door of the platform for new users.

## Ubiquitous Language

| Term | Definition |
|------|-----------|
| **Template** | A reusable swarm architecture blueprint with pre-configured agents, relationships, and best practices |
| **Template Library** | The collection of all available templates (built-in + community) |
| **Instantiation** | Creating a new swarm from a template |
| **Customization Point** | A predefined area in a template where users are expected to make changes |
| **Template Diff** | A comparison showing how an instantiated swarm diverges from its base template |
| **Marketplace** | The community space where users publish, discover, and rate templates |
| **Domain** | The business vertical a template targets (e-commerce, customer service, DevOps, etc.) |
| **Template Version** | A specific revision of a template; updates do not affect existing instances |

## Aggregates

### Template (Aggregate Root)

```typescript
interface Template {
  id: TemplateId
  name: string                    // "E-Commerce Operations"
  domain: string                  // "retail"
  description: string
  version: string                 // semver: "1.0.0"
  author: UserId | 'system'
  tags: string[]
  status: 'draft' | 'published' | 'deprecated'
  layers: TemplateLayer[]
  agents: TemplateAgent[]
  relationships: TemplateRelationship[]
  bestPractices: BestPracticeRule[]
  customizationPoints: CustomizationPoint[]
  stats: TemplateStats
  createdAt: DateTime
  publishedAt?: DateTime
}

interface TemplateAgent {
  agentRef: string               // stable reference ID within template
  nickname: string
  formalName: string
  descriptor: string
  layer: string                  // layer reference
  badges: Badge[]
  required: boolean              // cannot be removed during customization
  config: AgentConfig
}

interface TemplateRelationship {
  sourceRef: string
  targetRef: string
  type: RelationshipType
  required: boolean
}

interface CustomizationPoint {
  id: string
  description: string            // "Add specialized payment processing agents"
  location: string               // which layer or area
  suggestedAgents: SuggestedAgent[]
}

interface BestPracticeRule {
  rule: string                   // human-readable description
  severity: 'error' | 'warning' | 'advisory'
  appliesTo: string              // filter expression
  autoFix?: string               // suggested fix action
}
```

### TemplateLibrary (Aggregate Root)

```typescript
interface TemplateLibrary {
  builtInTemplates: Template[]
  communityTemplates: Template[]
  domains: string[]              // available domain filters
  totalCount: number
}
```

## Value Objects

```typescript
interface TemplateStats {
  instantiationCount: number
  averageRating: number          // 1-5
  ratingCount: number
  lastInstantiatedAt?: DateTime
}

interface SuggestedAgent {
  nickname: string
  formalName: string
  descriptor: string
  badges: Badge[]
  reason: string                 // why this agent is suggested
}

interface TemplateDiff {
  templateId: TemplateId
  swarmId: SwarmId
  agentsAdded: AgentId[]
  agentsRemoved: string[]        // template agent refs
  agentsModified: ModifiedAgent[]
  relationshipsAdded: number
  relationshipsRemoved: number
  divergenceScore: number        // 0 = identical, 1 = completely different
}
```

## Domain Events

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `TemplatePublished` | Author publishes a template | Library index rebuild |
| `TemplateInstantiated` | User creates swarm from template | Design (create swarm), Governance (audit) |
| `TemplateRated` | User rates a community template | Library stats update |
| `TemplateDeprecated` | Author or admin deprecates a template | Library (remove from active listings) |
| `TemplateVersionCreated` | Author publishes new version | Notification to users of previous version |

## Built-in Templates (Initial Set)

| ID | Name | Domain | Agents | Layers | Status |
|----|------|--------|--------|--------|--------|
| `ecommerce-standard-v1` | E-Commerce Operations | Retail | 24 | 5 | Published (from prototype) |
| `customer-service-v1` | Customer Service Center | Support | ~18 | 4 | Priority 1 |
| `content-ops-v1` | Content Operations | Media | ~15 | 4 | Priority 1 |
| `devops-sre-v1` | DevOps/SRE Pipeline | Engineering | ~20 | 5 | Priority 2 |
| `supply-chain-v1` | Supply Chain Management | Logistics | ~22 | 5 | Priority 2 |
| `financial-ops-v1` | Financial Services Ops | Finance | ~20 | 5 | Priority 3 |
| `healthcare-ops-v1` | Healthcare Operations | Healthcare | ~18 | 4 | Priority 3 |
| `hr-recruiting-v1` | HR/Recruiting Pipeline | HR | ~14 | 3 | Priority 3 |

## Customization Workflow

```
1. User browses Template Library
2. User selects a template -> Preview mode (read-only canvas view)
3. User clicks "Use This Template" -> Customization Wizard
   a. Name your swarm
   b. Review customization points ("Do you need payment agents? Loyalty?")
   c. Apply/skip each customization point
4. Swarm created in Design Context with template reference
5. User can further edit on the canvas (full design capabilities)
```

## Integration Contracts

### Publishes

```typescript
interface TemplateInstantiatedEvent {
  templateId: TemplateId
  templateVersion: string
  swarmId: SwarmId
  userId: UserId
  customizationsApplied: string[]  // customization point IDs
}
```

### Consumes

```typescript
// From Design Context (for template diff calculation)
interface SwarmChangedEvent {
  swarmId: SwarmId
  snapshot: Swarm
}
```
