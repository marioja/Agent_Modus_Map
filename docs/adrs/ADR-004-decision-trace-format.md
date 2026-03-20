# ADR-004: Four-Stage Decision Trace Format

**Status:** Accepted
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 5.3

## Context

Agent swarms make thousands of decisions per hour. When something goes wrong (or right), operators need to understand what happened, why, and what the agent was "thinking." This is critical for:

- **Debugging**: Why did Gavel reject this order?
- **Auditing**: Can we prove that Sentinel detected the threat before it escalated?
- **Optimization**: Is Lens making good recommendations, or is it sending irrelevant products?
- **Compliance**: Regulators want to see that human oversight exists at decision points

The format must be readable by non-technical business users, not just engineers.

## Decision

Every significant agent decision is logged in a **four-stage format**:

### Stage 1: Observation
What data the agent perceived at decision time.

```json
{
  "stage": "observation",
  "agent": "Gavel",
  "timestamp": "2026-03-20T14:32:01Z",
  "inputs": {
    "order_id": "ORD-8842",
    "order_total": 4250.00,
    "customer_tier": "standard",
    "fraud_score": 0.72,
    "inventory_status": "in_stock"
  },
  "source_agents": ["Domino", "Sentinel", "Catalog"]
}
```

### Stage 2: Analysis
How the agent interpreted the data. What rules or models were applied.

```json
{
  "stage": "analysis",
  "rules_evaluated": [
    {"rule": "fraud_threshold", "threshold": 0.6, "result": "EXCEEDED"},
    {"rule": "order_limit_standard", "limit": 5000, "result": "WITHIN_LIMIT"},
    {"rule": "inventory_check", "result": "PASS"}
  ],
  "confidence": 0.85,
  "flags": ["high_fraud_score"]
}
```

### Stage 3: Decision
What the agent chose to do and why. Includes the reasoning chain.

```json
{
  "stage": "decision",
  "action_chosen": "ESCALATE_TO_HUMAN",
  "reason": "Fraud score (0.72) exceeds threshold (0.6) for standard-tier customer. Order total within limits but flagged for manual review.",
  "alternatives_considered": [
    {"action": "APPROVE", "rejected_because": "fraud score too high"},
    {"action": "REJECT", "rejected_because": "order otherwise valid, human review preferred"}
  ],
  "escalation_target": "fraud_review_team"
}
```

### Stage 4: Action
What actually happened. The outcome.

```json
{
  "stage": "action",
  "executed": "ESCALATE_TO_HUMAN",
  "result": "PENDING_REVIEW",
  "downstream_effects": [
    {"agent": "Courier", "effect": "notification_delayed"},
    {"agent": "Scribe", "effect": "audit_entry_created"}
  ],
  "duration_ms": 142
}
```

### Storage and Querying

- Traces are stored in a time-series-friendly format (one document per decision, four stages embedded)
- Indexed by: agent name, timestamp, action chosen, confidence level, escalation status
- Linked to the knowledge graph: each trace references agent nodes, enabling graph-traversal queries like "Show me all escalations from Gavel to human reviewers in the last 24 hours"
- Retention: 90 days hot storage, 1 year cold storage, configurable per compliance requirements

## Consequences

### Positive
- The four-stage format tells a complete story that non-technical users can follow
- "Reason" and "alternatives_considered" fields make agent logic transparent
- The format supports both automated analysis (confidence thresholds, pattern detection) and human review
- Linking traces to the knowledge graph enables contextual exploration
- The format is framework-agnostic; any agent runtime can emit traces in this schema

### Negative
- Requires every connected agent runtime to implement trace emission
- Storage volume can be significant at scale (thousands of decisions per hour)
- The "reason" field requires agents to articulate their reasoning, which adds LLM cost if using language models

### Neutral
- The format is a logging standard, not a runtime requirement. Agents that cannot emit traces still function; they just have gaps in their audit trail.

## Alternatives Considered

**Unstructured logging**: Let agents log freeform text. Rejected because unstructured logs are not queryable, not visualizable, and not useful for non-technical users.

**OpenTelemetry traces**: Use distributed tracing spans for agent decisions. Considered and partially adopted (the trace format can be exported as OTel spans), but OTel's span model is designed for latency debugging, not decision auditing. The four-stage format adds semantic meaning that OTel lacks.

**Simple input/output logging**: Log only what went in and what came out. Rejected because it omits the reasoning (stages 2 and 3), which is the most valuable part for debugging and compliance.
