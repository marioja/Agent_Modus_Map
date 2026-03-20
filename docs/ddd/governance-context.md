# Governance Context (Supporting Domain)

**Owner:** Security/Compliance Team
**Type:** Supporting Domain
**Priority:** High for enterprise deployments.
**Depends on:** ADR-007 (Audit Log), ADR-006 (Progressive Disclosure)

## Purpose

The Governance Context enforces access control, captures immutable audit trails, manages human-in-the-loop approval workflows, and generates compliance reports. It is the "trust layer" that makes the platform acceptable to enterprise security and compliance teams.

## Ubiquitous Language

| Term | Definition |
|------|-----------|
| **Audit Entry** | An immutable, cryptographically chained record of a system event |
| **Audit Trail** | The ordered sequence of audit entries for a resource |
| **Role** | A named set of permissions (Viewer, Designer, Operator, Administrator) |
| **Permission** | A specific capability granted to a role (view_swarm, edit_agent, manage_alerts) |
| **Approval Workflow** | A multi-step process requiring human sign-off before a change takes effect |
| **Approval Gate** | A single step in an approval workflow where a designated approver must act |
| **Compliance Report** | An auto-generated document proving governance controls are in place |
| **Sandbox Mode** | A relaxed governance mode for design exploration (no approval gates, simplified audit) |
| **Production Mode** | Full governance with audit trails, RBAC, and approval workflows enforced |

## Aggregates

### AuditLog (Aggregate Root)

```typescript
interface AuditLog {
  swarmId: SwarmId
  entries: AuditEntry[]        // append-only
  lastSequence: number
  lastHash: string
  integrityStatus: 'valid' | 'broken' | 'unchecked'
  lastVerifiedAt: DateTime
}

interface AuditEntry {
  id: string                    // uuid-v7
  sequence: number              // monotonically increasing
  timestamp: DateTime
  actor: {
    type: 'user' | 'agent' | 'system'
    id: string
    name: string
  }
  action: string                // "agent.config.updated"
  target: {
    type: 'agent' | 'swarm' | 'template' | 'user' | 'alert_rule'
    id: string
    name: string
  }
  details: {
    before?: Record<string, unknown>
    after?: Record<string, unknown>
    reason?: string
  }
  hash: string                  // sha256(previousHash + thisEntry)
  previousHash: string
}
```

### AccessControl (Aggregate Root)

```typescript
interface AccessControl {
  swarmId: SwarmId
  roles: Role[]
  assignments: RoleAssignment[]
}

interface Role {
  id: RoleId
  name: string                   // "Designer"
  permissions: Permission[]
  isBuiltIn: boolean             // built-in roles cannot be deleted
}

type Permission =
  | 'view_swarm'
  | 'edit_agents'
  | 'edit_relationships'
  | 'manage_alerts'
  | 'manage_templates'
  | 'manage_users'
  | 'view_audit'
  | 'export_audit'
  | 'manage_approvals'
  | 'deploy_swarm'

interface RoleAssignment {
  userId: UserId
  roleId: RoleId
  scope: 'swarm' | 'layer' | 'agent'
  scopeId: string               // swarmId, layerId, or agentId
}
```

### ApprovalWorkflow (Aggregate Root)

```typescript
interface ApprovalWorkflow {
  id: WorkflowId
  name: string                   // "Production Deployment Approval"
  triggerCondition: string       // "swarm.deploy" action
  gates: ApprovalGate[]
  timeoutHours: number
  onTimeout: 'reject' | 'escalate'
}

interface ApprovalGate {
  order: number
  approverRole: RoleId
  approverUsers?: UserId[]       // specific users, or anyone with role
  requireAll: boolean            // all approvers or any one
  timeoutHours: number
}

interface ApprovalRequest {
  id: RequestId
  workflowId: WorkflowId
  requestedBy: UserId
  requestedAt: DateTime
  currentGate: number
  status: 'pending' | 'approved' | 'rejected' | 'timed_out'
  gateResults: GateResult[]
  payload: Record<string, unknown>  // the change awaiting approval
}
```

## Built-in Roles

| Role | Permissions | Use Case |
|------|------------|----------|
| Viewer | view_swarm, view_audit | Stakeholders, observers |
| Designer | view_swarm, edit_agents, edit_relationships, manage_templates | Swarm designers (primary non-technical users) |
| Operator | view_swarm, manage_alerts, view_audit, deploy_swarm | Ops team running production swarms |
| Administrator | All permissions | Platform administrators |

## Domain Events

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `AuditEntryCreated` | Any auditable action in any context | Internal: hash chain update |
| `RoleAssigned` | Admin assigns role to user | Audit (log the assignment) |
| `ApprovalRequested` | Change triggers an approval workflow | Notification system |
| `ApprovalGranted` | Approver approves a gate | Design (apply the pending change), Audit |
| `ApprovalRejected` | Approver rejects a gate | Design (discard pending change), Audit |
| `IntegrityCheckFailed` | Hash chain verification detects tampering | Alert system (critical) |

## Integration Contracts

### Consumes (from all contexts)

```typescript
// Anti-Corruption Layer: wraps any incoming event
interface AuditableEvent {
  source: string              // "design" | "monitoring" | "intelligence" | ...
  action: string
  actor: { type: string, id: string, name: string }
  target: { type: string, id: string, name: string }
  details: Record<string, unknown>
  timestamp: DateTime
}
```

### Publishes

```typescript
interface ApprovalStatusChangedEvent {
  requestId: RequestId
  newStatus: 'approved' | 'rejected' | 'timed_out'
  decidedBy: UserId
  payload: Record<string, unknown>
}
```

## Compliance Report Templates

| Report | Contents | Regulation |
|--------|----------|-----------|
| Access Control Summary | All roles, assignments, permission matrices | SOC 2, ISO 27001 |
| Decision Audit Trail | All agent decisions with human oversight points | Industry-specific |
| Change History | All configuration changes with before/after and actor | SOC 2 |
| Approval Workflow Log | All approval requests with outcomes and timing | SOC 2, FDA 21 CFR Part 11 |
| Data Handling Summary | What data agents access, how it flows | GDPR, CCPA |
