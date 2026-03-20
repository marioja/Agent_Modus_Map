# ADR-005: Template-First User Experience

**Status:** Accepted
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 5.7, 9

## Context

The research document identifies the blank-canvas problem as the primary barrier to non-technical user adoption. When a user opens a design tool and sees an empty canvas, the cognitive load of "where do I even start?" prevents them from engaging with the tool at all.

The 20-year trajectory of design tool democratization follows a pattern: hand-coded -> frameworks -> visual tools -> templates make visual tools instant. Agent swarm design is in the "frameworks" phase (AutoGen, CrewAI, LangGraph). Agent Modus Map aims to reach "templates make visual tools instant."

The existing prototype already contains one validated architecture: the 24-agent e-commerce swarm. This is the first template.

## Decision

Adopt a **template-first** approach where:

1. **New users always start from a template**, never from a blank canvas
2. The **onboarding flow** presents a template browser before showing the design canvas
3. Templates are **customizable, not rigid**: users can add, remove, and modify agents after instantiation
4. The existing e-commerce swarm becomes **Template #1**, the reference implementation
5. Templates include **embedded best practices** as validation rules and advisory notes

### Template Schema

```yaml
template:
  id: "ecommerce-standard-v1"
  name: "E-Commerce Operations"
  domain: "retail"
  description: "24-agent swarm for online retail covering customer journey, product management, order processing, operations, and intelligence."
  version: "1.0"
  author: "Agent Modus Map Team"
  tags: ["e-commerce", "retail", "customer-service", "order-management"]

layers:
  - name: "Customer Journey"
    color: "#00d9ff"
    agents:
      - nickname: "Doorbell"
        formalName: "Interface-FirstContact"
        descriptor: "The Greeter"
        badges: ["ENTRY", "AUTO", "HUMAN"]
        customizable: true
        required: true  # Cannot be removed
        # ... full agent spec

relationships:
  - from: "Doorbell"
    to: "Catalog"
    type: "dependsOn"
    required: true  # Cannot be removed
  # ... full relationship spec

best_practices:
  - rule: "Every CRITICAL agent must have at least one DEPENDS_ON relationship to a monitoring agent"
    severity: "warning"
    applies_to: ["badges contains CRITICAL"]
  - rule: "Every HUB agent should have a backup or fallback defined"
    severity: "advisory"
    applies_to: ["badges contains HUB"]

customization_points:
  - id: "add-payment-agents"
    description: "Add specialized payment processing agents"
    suggested_agents: ["Vault (Payment-Security)", "Ledger (Transaction-Logger)"]
  - id: "add-loyalty-program"
    description: "Add customer loyalty and rewards agents"
    suggested_agents: ["Crown (Loyalty-Manager)", "Gift (Rewards-Distributor)"]
```

### Template Library (Initial Set)

| Template | Domain | Agent Count | Priority |
|----------|--------|-------------|----------|
| E-Commerce Operations | Retail | 24 | P0 (exists) |
| Customer Service Center | Support | ~18 | P1 |
| Content Operations | Media/Marketing | ~15 | P1 |
| DevOps/SRE Pipeline | Engineering | ~20 | P2 |
| Supply Chain Management | Logistics | ~22 | P2 |
| Financial Services Ops | Finance | ~20 | P3 |
| Healthcare Operations | Healthcare | ~18 | P3 |
| HR/Recruiting Pipeline | HR | ~14 | P3 |

## Consequences

### Positive
- Eliminates the blank-canvas problem entirely
- Non-technical users get a working architecture in seconds, then customize
- Best practice rules are baked into templates, so users inherit good patterns by default
- Templates create a shared vocabulary across organizations ("we use the E-Commerce template with custom payment agents")
- The template marketplace enables community contribution and knowledge sharing

### Negative
- Template quality is critical; bad templates propagate bad patterns at scale
- Maintaining 8+ templates across versions requires dedicated curation effort
- Users may over-rely on templates and not develop understanding of underlying principles
- Template schema must be stable; breaking changes affect all instantiated swarms

### Neutral
- Users can still create from blank canvas (it is available but not the default entry point)
- Templates are versioned; updates to templates do not automatically modify existing instances

## Alternatives Considered

**Wizard-based creation**: Walk users through a step-by-step questionnaire to build a swarm. Rejected as primary approach because wizards are slow and frustrating for users who already know what they want. Templates are faster. However, a "customize this template" wizard is included as a secondary flow.

**Blank canvas as default**: Let users start from scratch with an agent palette. Rejected as default because the research is clear: non-technical users need a starting point. Blank canvas remains available for advanced users.

**AI-generated swarms from natural language**: "Describe your business and we will generate a swarm." Deferred to Future Work (Research Document Section 9) because LLM-generated architectures are not yet reliable enough for production use. Templates provide a curated, validated starting point that AI generation cannot yet match.
