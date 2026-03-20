# ADR-010: GOAP as Runtime Planning System

**Status:** Proposed
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 2.5, 9

## Context

GOAP (Goal-Oriented Action Planning) is used in this project as an analytical framework for planning the implementation roadmap. However, GOAP's properties (dynamic replanning, emergent behavior from action combinations, cost-based optimization) also make it a candidate for runtime use within the platform itself.

Two runtime use cases have been identified:

1. **Swarm optimization**: Given a current swarm configuration and a set of optimization goals (reduce latency, eliminate single points of failure, reduce cost), GOAP could plan a sequence of configuration changes that achieves the goals.

2. **Agent collaboration planning**: When agents need to coordinate on a complex task (e.g., processing a high-value order that requires fraud check, inventory verification, and human approval), GOAP could dynamically plan the agent interaction sequence instead of relying on hardcoded workflows.

## Decision

**Propose** (not yet accept) GOAP as a runtime planning system for swarm optimization recommendations. Defer the agent collaboration planning use case to future work.

### Proposed Architecture

```
User Goal: "Reduce single points of failure in Order Processing"
    |
    v
GOAP Planner
    |-- Current State: {catalog_has_backup: false, relay_has_fallback: false, ...}
    |-- Goal State: {no_single_points_of_failure: true}
    |-- Available Actions:
    |     A1: Add backup agent (cost: 8, effect: adds redundancy)
    |     A2: Add fallback relationship (cost: 3, effect: adds fallback path)
    |     A3: Split hub agent into two (cost: 13, effect: reduces fan-in)
    |     A4: Add monitoring to critical agent (cost: 5, effect: faster detection)
    |
    v
Recommended Plan:
    1. Add fallback relationship: Relay -> Relay-Backup (cost: 3)
    2. Add backup agent: Catalog-Secondary (cost: 8)
    3. Add monitoring: Catalog-Secondary (cost: 5)
    Total cost: 16 story points
```

### Why "Proposed" Not "Accepted"

This ADR is proposed rather than accepted because:

1. The platform must be built before runtime GOAP can be validated
2. The optimization engine (Phase 5, Sprints 23-26) is the natural home for this capability
3. GOAP's effectiveness for swarm optimization is unproven in this domain
4. Simpler rule-based recommendations may suffice for the initial release

### Validation Criteria

Accept this ADR when:
- The design engine and knowledge graph are operational (Phase 1-2 complete)
- At least 3 swarm configurations exist to test optimization against
- A prototype GOAP planner demonstrates measurably better recommendations than static rules
- Non-technical users can understand and evaluate GOAP-generated recommendations

## Consequences (If Accepted)

### Positive
- Dynamic optimization that adapts to any swarm configuration
- Novel recommendations that static rules would not produce
- Connects the project's analytical methodology to its runtime capabilities
- Could extend to cross-swarm optimization (future work)

### Negative
- GOAP planner implementation is non-trivial (A* search over action space)
- Action definitions must be carefully designed to avoid nonsensical plans
- Non-technical users may not trust automated optimization recommendations
- Adds computational cost for plan generation

### Neutral
- The GOAP planner would run on-demand (user requests optimization), not continuously
- Recommendations are advisory; the user decides whether to apply them

## Alternatives Considered

**Rule-based optimization**: Hardcode rules like "if fan-in > 5, recommend backup." Simpler and more predictable. Likely sufficient for v1. GOAP adds value when rules become too numerous to maintain manually.

**Reinforcement learning**: Train a model to optimize swarm configurations. More powerful but requires training data that does not yet exist. Deferred to future work.

**Manual optimization only**: Users identify and fix bottlenecks themselves with guidance from the dashboard. This is the v1 approach; GOAP would supplement it.
