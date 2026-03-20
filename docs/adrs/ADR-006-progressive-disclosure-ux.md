# ADR-006: Progressive Disclosure UX Pattern

**Status:** Accepted
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 5.1, 5.2, 8.2

## Context

The platform targets non-technical users but must also support advanced configuration for power users and technical teams. The feature set is large: design canvas, monitoring dashboards, knowledge graph explorer, governance controls, optimization analysis, RAG querying, decision trace viewer, template management, and collaboration.

The primary product risk identified in the research is complexity creep: the tool becoming as complex as the systems it simplifies.

## Decision

Apply **progressive disclosure** as a core UX principle across every feature area. Every feature has two modes:

### Basic Mode (Default)
- Covers 80% of use cases
- Uses plain language, no technical jargon
- Shows only essential controls
- Provides sensible defaults for all optional settings
- Uses visual metaphors that map to business concepts (org charts, swimlanes, traffic lights)

### Advanced Mode (Explicit Toggle)
- Accessed via "Show advanced options" or equivalent
- Exposes technical parameters, raw data views, query editors
- Adds configuration options that basic mode hides
- Never changes the basic mode experience when toggled off

### Application by Feature Area

| Feature | Basic Mode | Advanced Mode |
|---------|-----------|---------------|
| Agent Design | Drag-and-drop, property panel with 5-6 fields | Full config editor, JSON/YAML view, custom badge creation |
| Monitoring | Health grid (green/yellow/red), plain-language alerts | Time-series charts, custom metric queries, raw log access |
| RAG Queries | Natural language chat interface | View retrieved chunks, confidence scores, graph traversal paths |
| Governance | Role picker (Viewer/Designer/Operator/Admin) | Custom role creation, per-agent permission overrides |
| Optimization | Plain-language recommendations ("Catalog is a bottleneck") | Centrality scores, graph metrics, what-if simulation parameters |
| Decision Traces | Timeline view with plain-language summaries | Raw JSON view, cross-trace correlation, statistical analysis |
| Version Control | Named versions with one-click restore | Full diff view, branch comparison, merge conflict resolution |

### Implementation Rules

1. Basic mode is **always** the default. No exceptions.
2. Advanced mode state is **per-user, per-feature**. Toggling advanced in monitoring does not affect the design canvas.
3. Advanced mode toggles are **persistent** across sessions for users who prefer them.
4. Error messages and validation warnings **always** use plain language, even in advanced mode.
5. Tooltips on advanced controls explain what the setting does in one sentence.

## Consequences

### Positive
- Non-technical users are never overwhelmed; they see only what they need
- Power users get full access without a separate tool or interface
- Reduces the "developer tool in disguise" risk identified in the research
- Progressive disclosure is a well-understood UX pattern with strong research backing

### Negative
- Every feature requires two UX designs (basic and advanced), increasing design effort
- Some features may be difficult to meaningfully simplify (e.g., RBAC custom roles)
- Users in basic mode may not discover capabilities they need

### Neutral
- The toggle mechanism is a UI pattern, not an architectural decision; it can be implemented incrementally as each feature is built

## Alternatives Considered

**Role-based UI**: Show different interfaces to different user roles (business user vs. technical admin). Rejected because it creates two products to maintain and prevents users from growing into advanced features.

**Single unified interface**: Show everything to everyone, rely on good organization. Rejected because the research is explicit: non-technical users will not adopt a tool that looks complex on first impression.

**Separate "simple" and "pro" products**: Build two apps. Rejected for obvious maintenance and coherence reasons.
