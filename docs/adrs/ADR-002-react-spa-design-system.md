# ADR-002: React SPA with Ocean Gradient Design System

**Status:** Accepted
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 4.1, 4.2

## Context

The existing prototype is a single HTML file with vanilla JavaScript, inline CSS, and an ocean gradient color palette (dark backgrounds, cyan/purple/green/orange/yellow agent themes). The visual language works: the Motus naming, card-based agent display, and layered architecture are effective at communicating swarm structure.

The production platform needs:
- A component-based architecture for maintainability
- Real-time canvas interactions (drag-and-drop, connection drawing, pan/zoom)
- Modal-based interaction patterns (consistent with existing Agent Modus conventions)
- Multi-view layouts (designer, dashboard, graph explorer, docs viewer)

## Decision

Build the presentation layer as a **React single-page application** using:

- **React 18+** with functional components and hooks
- **CSS Modules or styled-components** for component-scoped styling (preserving the inline CSS isolation approach from the prototype, no Tailwind)
- **Ocean gradient design system** carried forward from the prototype
- **React Flow** (or similar) for the canvas/node-graph editor
- **Recharts or Visx** for monitoring dashboard charts
- **Modal-based navigation** for agent detail views, consistent with the current ⓘ interaction

### Design System Tokens

```
// Colors (from prototype)
--color-bg-primary: #0a0e27
--color-bg-secondary: #1a1f3a
--color-bg-card: linear-gradient(145deg, #1e293b, #0f172a)
--color-text-primary: #fff
--color-text-secondary: #8b9dc3
--color-text-muted: #a0aec0

// Layer Colors
--color-customer: #00d9ff (cyan)
--color-product: #a855f7 (purple)
--color-order: #22c55e (green)
--color-operations: #fb923c (orange)
--color-intelligence: #fbbf24 (yellow)

// Relationship Colors
--color-depends-on: #00d9ff (solid)
--color-feeds-into: #7c3aed (dashed)
--color-collaborates: #fbbf24 (dotted)
--color-can-override: #ef4444 (solid, thick)

// Badge Colors
--color-badge-hub: rgba(251, 191, 36, 0.2)
--color-badge-critical: rgba(239, 68, 68, 0.2)
--color-badge-entry: rgba(34, 197, 94, 0.2)
--color-badge-human: rgba(168, 85, 247, 0.2)
--color-badge-auto: rgba(0, 217, 255, 0.2)
```

## Consequences

### Positive
- React's component model maps cleanly to the card-based agent display
- The existing visual language carries over without redesign, reducing user confusion
- React Flow provides a mature canvas with built-in pan, zoom, minimap, and connection handling
- Large ecosystem of accessible component libraries for forms, modals, and data display
- CSS Modules preserve the isolation approach from the prototype (no global style conflicts)

### Negative
- Migrating from vanilla JS to React is a full rewrite, not an incremental change
- React Flow adds a dependency; if it does not meet all canvas requirements, replacing it is costly
- No Tailwind means more manual CSS, slower iteration on layout

### Neutral
- This is a standard, well-understood technology choice with abundant documentation and hiring pool
- Server-side rendering is not needed; the application is interactive, not content-focused

## Alternatives Considered

**Vue.js or Svelte**: Both are viable. React was chosen because the prototype's patterns (event-driven, component-like structure) align with React's model, and the ecosystem for graph/canvas editors is stronger in React.

**Next.js (React with SSR)**: Unnecessary complexity. The application is fully interactive and does not benefit from server-side rendering or static generation. A client-side SPA with API calls is the right architecture.

**Tailwind CSS**: Rejected per project convention. Inline CSS isolation is the established pattern. Tailwind's utility classes also conflict with the goal of a constrained, branded design system.
