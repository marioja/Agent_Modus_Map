# Monitoring Context (Supporting Domain)

**Owner:** Platform Team
**Type:** Supporting Domain
**Priority:** High. Required for production operational visibility.
**Depends on:** ADR-009 (Agent Health Protocol)

## Purpose

The Monitoring Context collects, stores, and visualizes health data from running agent swarms. It translates raw metrics into the green/yellow/red health indicators that non-technical users understand, and provides alerting and escalation capabilities.

## Ubiquitous Language

| Term | Definition |
|------|-----------|
| **Health Report** | A single health data payload from an agent runtime (ADR-009 schema) |
| **Health Status** | The derived state of an agent: healthy, degraded, unhealthy, unknown |
| **Baseline** | The statistical norm for an agent's metrics over a rolling window |
| **Anomaly** | A metric value that deviates significantly from the baseline |
| **Alert Rule** | A user-defined condition that triggers a notification when met |
| **Escalation Policy** | The ordered list of people/channels to notify when an alert fires |
| **Dashboard** | A visual display of health data for a swarm or subset of agents |
| **Sparkline** | A small inline chart showing metric trend over time |

## Aggregates

### MonitoredSwarm (Aggregate Root)

```typescript
interface MonitoredSwarm {
  swarmId: SwarmId
  agents: MonitoredAgent[]
  overallStatus: HealthStatus
  alertRules: AlertRule[]
  escalationPolicies: EscalationPolicy[]
  dashboardConfig: DashboardConfig
}
```

### MonitoredAgent (Entity)

```typescript
interface MonitoredAgent {
  agentId: AgentId
  nickname: string
  currentStatus: HealthStatus
  lastReport: HealthReport | null
  lastReportAt: DateTime | null
  baseline: AgentBaseline
  activeAlerts: Alert[]
}
```

### AlertRule (Entity)

```typescript
interface AlertRule {
  id: AlertRuleId
  name: string                    // "Catalog response time too high"
  condition: AlertCondition       // metric > threshold for duration
  severity: 'critical' | 'warning' | 'info'
  escalationPolicyId: EscalationPolicyId
  enabled: boolean
  cooldownMinutes: number         // suppress re-fires for this duration
}

interface AlertCondition {
  metric: string                  // "latency_ms.p95"
  operator: '>' | '<' | '=' | '!='
  threshold: number
  durationMinutes: number         // condition must hold for this long
  agentFilter?: AgentId[]         // specific agents, or all
}
```

## Value Objects

```typescript
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown'

interface HealthReport {
  agentId: AgentId
  timestamp: DateTime
  status: HealthStatus
  metrics: {
    latencyMs: { p50: number, p95: number, p99: number }
    throughput: { requestsPerMinute: number }
    errorRate: { percentage: number }
    resourceUsage: { cpuPercent: number, memoryMb: number }
  }
  dependencies: Record<string, HealthStatus>
}

interface AgentBaseline {
  latencyP95Mean: number
  latencyP95StdDev: number
  throughputMean: number
  errorRateMean: number
  windowHours: number            // rolling window for baseline calculation
}
```

## Domain Events

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `HealthReportReceived` | Agent runtime pushes health data | Internal: status calculation |
| `AgentStatusChanged` | Agent transitions between health states | Governance (audit), Intelligence (graph update) |
| `AlertFired` | Alert rule condition met | Escalation engine, Governance (audit) |
| `AlertResolved` | Alert condition no longer met | Escalation engine, Governance (audit) |
| `BaselineRecalculated` | Scheduled baseline update | Internal: anomaly detection threshold update |

## Status Determination Logic

```
function determineStatus(report: HealthReport, baseline: AgentBaseline): HealthStatus {
  if (report is stale (> 2x expected interval)):
    return 'unknown'

  if (report.metrics.errorRate.percentage > 5):
    return 'unhealthy'

  if (report.metrics.latencyMs.p95 > baseline.mean + 3 * baseline.stdDev):
    return 'unhealthy'

  if (report.metrics.errorRate.percentage > 1):
    return 'degraded'

  if (report.metrics.latencyMs.p95 > baseline.mean + 2 * baseline.stdDev):
    return 'degraded'

  return 'healthy'
}
```

## Integration Contracts

### Consumes

```typescript
// From agent runtimes via ADR-009 protocol
interface IncomingHealthReport {
  // ADR-009 schema
}

// From Design Context
interface AgentAddedEvent {
  agentId: AgentId
  nickname: string
  healthEndpoint?: string
}

interface AgentRemovedEvent {
  agentId: AgentId
}
```

### Publishes

```typescript
interface AgentStatusChangedEvent {
  agentId: AgentId
  previousStatus: HealthStatus
  newStatus: HealthStatus
  timestamp: DateTime
  reason: string  // plain language explanation
}

interface AlertFiredEvent {
  alertRuleId: AlertRuleId
  agentId: AgentId
  metric: string
  currentValue: number
  threshold: number
  severity: string
  message: string  // "Catalog's response time (340ms) exceeds threshold (200ms)"
}
```

## Dashboard Components

| Component | Data Source | Refresh |
|-----------|-----------|---------|
| Health Grid | All agents, current status | Real-time (WebSocket) |
| Agent Detail Card | Single agent, all metrics | Real-time |
| Sparkline Charts | Time-series metrics, 1hr/24hr/7d | 30-second poll |
| Alert Timeline | Fired/resolved alerts | Real-time |
| Dependency Health Map | Agent relationships + status | Real-time overlay on swarm map |
