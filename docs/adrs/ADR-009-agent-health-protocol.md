# ADR-009: Standardized Agent Health Data Protocol

**Status:** Accepted
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 5.2, 8.1

## Context

Enterprise organizations use diverse agent frameworks (AutoGen, CrewAI, LangGraph, custom implementations). The monitoring layer must collect health data from all of them through a single, consistent interface.

The research identifies agent runtime diversity as a technical risk: building custom connectors for every framework is unsustainable.

## Decision

Define a **standardized Agent Health Data Protocol**: a JSON schema that all agent runtimes must emit for the platform to monitor them. The platform provides adapters for common frameworks and an SDK for custom implementations.

### Health Data Schema

```json
{
  "$schema": "https://agentmodusmap.io/schemas/health/v1",
  "agent_id": "agent-catalog-prod-01",
  "agent_nickname": "Catalog",
  "timestamp": "2026-03-20T14:32:01Z",
  "status": "healthy|degraded|unhealthy|unknown",
  "metrics": {
    "latency_ms": {
      "p50": 45,
      "p95": 120,
      "p99": 340
    },
    "throughput": {
      "requests_per_minute": 842,
      "requests_per_minute_5m_avg": 790
    },
    "error_rate": {
      "percentage": 0.3,
      "count_last_5m": 12
    },
    "resource_usage": {
      "cpu_percent": 34.2,
      "memory_mb": 512,
      "token_usage_last_hour": 45000
    }
  },
  "last_decision": {
    "timestamp": "2026-03-20T14:31:58Z",
    "action": "product_lookup",
    "outcome": "success",
    "duration_ms": 23
  },
  "dependencies": {
    "Mirror": "healthy",
    "Knot": "degraded"
  },
  "custom": {}
}
```

### Status Determination Rules

| Status | Condition | Health Indicator |
|--------|-----------|-----------------|
| healthy | All metrics within baseline, error rate < 1% | Green |
| degraded | Any metric > 2 standard deviations from baseline, or error rate 1-5% | Yellow |
| unhealthy | Any critical metric > 3 standard deviations, or error rate > 5%, or not responding | Red |
| unknown | No health data received within expected interval | Gray |

### Transport

- **Push (preferred)**: Agent runtime sends health data to the platform via HTTP POST or WebSocket at configurable intervals (default: 30 seconds)
- **Pull (fallback)**: Platform polls a health endpoint exposed by the agent runtime
- **Batch**: For high-volume swarms, agents can batch health data and send at reduced frequency

### Framework Adapters (Built-in)

| Framework | Adapter | Method |
|-----------|---------|--------|
| AutoGen | `amm-adapter-autogen` | Wraps agent execution with health emission |
| CrewAI | `amm-adapter-crewai` | Hook into CrewAI's callback system |
| LangGraph | `amm-adapter-langgraph` | Instrument graph node execution |
| Custom | `amm-sdk` | Python/TypeScript SDK for manual integration |

### SDK Example

```python
from amm_sdk import HealthReporter

reporter = HealthReporter(
    agent_id="agent-catalog-prod-01",
    agent_nickname="Catalog",
    endpoint="https://amm.company.com/api/health",
    interval_seconds=30
)

# Automatic: wraps your agent's process method
@reporter.monitor
def process_request(request):
    # ... agent logic ...
    return response

# Manual: report custom metrics
reporter.report_metric("cache_hit_rate", 0.87)
```

## Consequences

### Positive
- One monitoring dashboard works across all agent frameworks
- The schema is simple enough for any team to implement (5-10 fields minimum)
- Framework adapters reduce integration effort to near-zero for common frameworks
- The SDK provides a clear path for custom agent runtimes
- Status determination rules produce the green/yellow/red indicators that non-technical users understand

### Negative
- Agents must opt in to health reporting; the platform cannot monitor agents that do not emit health data
- The "custom" field is a bag of untyped data that may be misused
- Health data volume can be significant (24 agents x 2 reports/minute = ~70K records/day)

### Neutral
- This is a protocol definition, not a runtime requirement. Agents function without it; they just appear as "unknown" in the dashboard.
- The protocol is versioned (v1); future versions can add fields without breaking existing integrations.

## Alternatives Considered

**OpenTelemetry**: Use OTel metrics and traces for health data. Partially adopted (the protocol can export to OTel collectors), but OTel is too low-level for the dashboard's needs. The platform needs agent-level status, not individual span metrics.

**Framework-specific plugins only**: Build deep integrations for each framework. Rejected because it ties the platform to specific framework versions and does not support custom agents.

**Passive monitoring (log scraping)**: Infer health from agent logs. Rejected because log formats are inconsistent, parsing is fragile, and it provides no real-time status.
