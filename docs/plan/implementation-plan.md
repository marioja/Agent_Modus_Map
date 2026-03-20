# Agent Modus Map: Implementation Plan

**Version:** 1.0
**Date:** 2026-03-20
**Owner:** Anne Cook
**Total Estimated Effort:** 221 story points across 26 sprints (2-week sprints)
**Timeline:** ~12 months (compressible to 8-9 months with parallelism)

---

## How to Use This Plan

Each sprint has:
- **Goal**: What you are trying to achieve
- **ADRs**: Which architecture decisions guide this sprint
- **DDD Context**: Which bounded context you are working in
- **Deliverables**: Concrete outputs
- **Acceptance Criteria**: How you know the sprint is done
- **Dependencies**: What must be complete before this sprint starts
- **Risks**: What could go wrong

Sprints are grouped into 5 phases matching the GOAP analysis from the research document.

---

## Phase 1: Foundation (Sprints 1-4)

**Objective:** Transform the static prototype into a data-driven application with persistent storage and a property graph for agent relationships.

**Total Points:** 34 (A1: 13 + A4: 21)

### Sprint 1: Project Setup and Data Migration (13 pts)

**Goal:** Set up the monorepo, configure tooling, and extract the hardcoded agent data from the HTML prototype into a structured format.

**ADRs:** ADR-002 (React SPA)
**DDD Context:** Design Context

**Deliverables:**
- [ ] Monorepo initialized (React + Node.js API)
- [ ] TypeScript configured, ESLint, Prettier
- [ ] CI/CD pipeline (GitHub Actions: lint, test, build)
- [ ] Agent data extracted from `agent_swarm_map (1).html` into JSON
- [ ] TypeScript interfaces for Agent, Relationship, Layer, Swarm (from DDD Design Context)
- [ ] Design system tokens file (colors, typography from ADR-002)
- [ ] Basic React app shell with ocean gradient theme rendering

**Acceptance Criteria:**
- `npm run build` succeeds
- `npm test` passes (even if minimal tests)
- All 24 agents + relationships represented in typed JSON
- React app renders the ocean gradient background and a placeholder layout

**Dependencies:** None (starting point)

**Risks:** None significant. This is scaffolding.

---

### Sprint 2: Persistence Layer (13 pts)

**Goal:** Stand up the database backend and API for CRUD operations on swarms, agents, and relationships.

**ADRs:** ADR-001 (Property Graph)
**DDD Context:** Design Context

**Deliverables:**
- [ ] PostgreSQL database provisioned (config, users, sessions)
- [ ] Neo4j (or FalkorDB/Memgraph) provisioned for agent relationship graph
- [ ] REST API: `POST/GET/PUT/DELETE /api/swarms`
- [ ] REST API: `POST/GET/PUT/DELETE /api/swarms/:id/agents`
- [ ] REST API: `POST/GET/DELETE /api/swarms/:id/relationships`
- [ ] Seed script that loads the 24-agent e-commerce swarm into the graph database
- [ ] API integration tests for all CRUD endpoints
- [ ] Swarm export endpoint (`GET /api/swarms/:id/export?format=json`)
- [ ] Swarm import endpoint (`POST /api/swarms/import`)

**Acceptance Criteria:**
- All 24 agents queryable via API
- All relationships traversable via Cypher queries
- Export produces valid JSON matching the TypeScript interfaces
- Import re-creates a swarm from exported JSON
- Integration tests pass

**Dependencies:** Sprint 1 (project setup, data model)

**Risks:** Graph database operational complexity. Mitigate by starting with an embedded option (FalkorDB) if Neo4j setup is too heavy for initial development.

---

### Sprint 3: Knowledge Graph Foundation (13 pts)

**Goal:** Model the agent swarm as a queryable knowledge graph with basic traversal capabilities.

**ADRs:** ADR-001 (Property Graph), ADR-003 (Dual RAG, graph portion only)
**DDD Context:** Intelligence Context

**Deliverables:**
- [ ] Knowledge graph schema implemented (nodes: Agent, Layer, Template; edges: DEPENDS_ON, FEEDS_INTO, COLLABORATES_WITH, CAN_OVERRIDE, MEMBER_OF)
- [ ] Sync pipeline: Design Context SwarmChanged -> Intelligence Context graph rebuild
- [ ] Blast radius query: given an agent, return all affected agents within N hops
- [ ] Critical path query: shortest path between two agents via FEEDS_INTO edges
- [ ] Single points of failure query: agents with high in-degree on DEPENDS_ON
- [ ] Hub detection query: agents with highest total edge count
- [ ] REST API: `POST /api/intelligence/query` (accepts Cypher or predefined query types)
- [ ] Unit tests for all query types using the seed data

**Acceptance Criteria:**
- Blast radius for "Catalog" returns correct dependent agents (matches prototype data)
- Critical path "Domino -> Courier" returns the correct 5-agent sequence
- Single point of failure detection identifies Catalog, Scribe, Howler
- All queries complete in under 200ms on the 24-agent dataset

**Dependencies:** Sprint 2 (persistence, graph database running with seed data)

**Risks:** Cypher query complexity for non-obvious traversal patterns. Start with the predefined queries, defer arbitrary Cypher later.

---

### Sprint 4: Knowledge Graph Visualization (8 pts)

**Goal:** Build a visual graph explorer component that renders the knowledge graph interactively.

**ADRs:** ADR-002 (React SPA), ADR-006 (Progressive Disclosure)
**DDD Context:** Intelligence Context, Design Context (shared rendering)

**Deliverables:**
- [ ] Graph explorer React component (using D3-force or Cytoscape.js)
- [ ] Nodes colored by layer (matching design system tokens)
- [ ] Edges styled by relationship type (solid/dashed/dotted/red per prototype)
- [ ] Click-to-select: clicking a node highlights it and its connected edges
- [ ] Blast radius visualization: select an agent, see affected agents highlighted with hop distance
- [ ] Basic mode: visual graph with click interaction
- [ ] Advanced mode (toggle): raw Cypher query input with results table
- [ ] Responsive layout within the React app shell

**Acceptance Criteria:**
- Graph renders all 24 agents with correct layer colors
- Clicking "Catalog" highlights its 6 direct connections
- Blast radius view for "Relay" shows the correct cascade
- Component renders in under 1 second for 24 agents

**Dependencies:** Sprint 3 (knowledge graph queries working)

**Risks:** Graph layout performance with large agent counts. The D3-force layout may need tuning. Start with the 24-agent set, optimize later.

---

## Phase 2: Core Design Engine (Sprints 5-10)

**Objective:** Enable non-technical users to create and modify agent swarms visually. Build the Documentation RAG for immediate best-practice guidance.

**Total Points:** 47 (A2: 34 + A6: 13)

### Sprint 5: Canvas Foundation (8 pts)

**Goal:** Implement the interactive canvas with pan, zoom, and static agent rendering from the database.

**ADRs:** ADR-002 (React SPA)
**DDD Context:** Design Context

**Deliverables:**
- [ ] Canvas component (React Flow or custom SVG-based)
- [ ] Pan, zoom, minimap
- [ ] Snap-to-grid for agent positioning
- [ ] Agents rendered as cards on canvas (nickname, descriptor, badges) from API data
- [ ] Layers rendered as labeled background regions
- [ ] Relationship lines rendered between agents (styled by type)
- [ ] Canvas loads the seeded e-commerce swarm and displays it matching the prototype layout

**Acceptance Criteria:**
- Canvas displays all 24 agents with correct styling
- Pan and zoom work smoothly
- Relationship lines connect correct agents with correct styles
- Layout matches the general structure of the original prototype

**Dependencies:** Sprint 2 (API serving swarm data)

---

### Sprint 6: Agent Palette and Drag-and-Drop (8 pts)

**Goal:** Users can add new agents to the canvas by dragging from a palette.

**DDD Context:** Design Context

**Deliverables:**
- [ ] Agent palette sidebar with categorized agent types
- [ ] Drag-and-drop from palette to canvas
- [ ] New agent gets a default Motus profile (auto-generated nickname, user can edit)
- [ ] Agent placed on canvas is persisted to the database
- [ ] Layer auto-assignment based on drop position (or manual selection)
- [ ] Delete agent (with confirmation if it has dependents)

**Acceptance Criteria:**
- User can drag a new agent onto the canvas and see it appear
- New agent is saved to the database and survives a page refresh
- Deleting an agent removes it and its relationships from the graph

**Dependencies:** Sprint 5 (canvas rendering)

---

### Sprint 7: Connection Drawing and Property Editor (8 pts)

**Goal:** Users can draw relationships between agents and edit agent properties.

**DDD Context:** Design Context

**Deliverables:**
- [ ] Connection drawing: click source agent handle, drag to target, release
- [ ] Relationship type selector (dependsOn, feedsInto, collaboratesWith, canOverride)
- [ ] Connection lines appear immediately on canvas
- [ ] Delete relationship (click to select, then delete)
- [ ] Property editor side panel: opens when agent is selected
- [ ] Editable fields: nickname, formal name, descriptor, badges, layer
- [ ] Progressive disclosure: basic fields visible by default, advanced config behind toggle (ADR-006)

**Acceptance Criteria:**
- User can draw a dependsOn relationship between two agents
- Relationship appears with correct styling (solid cyan line)
- Property editor allows renaming an agent, changes persist
- Advanced toggle reveals additional configuration fields

**Dependencies:** Sprint 6 (agents on canvas, persistence)

---

### Sprint 8: Validation Engine (5 pts)

**Goal:** The system checks best-practice rules against the current swarm configuration and surfaces warnings in plain language.

**DDD Context:** Design Context

**Deliverables:**
- [ ] Validation engine that runs rules against the swarm state
- [ ] Initial rule set:
  - Every CRITICAL agent must connect to at least one monitoring agent
  - Every HUB agent should have a fallback or backup
  - Every HUMAN escalation point must have a timeout configured
  - No orphan agents (agents with zero relationships)
  - No circular dependsOn chains
- [ ] Validation results panel with plain-language messages
- [ ] Warning indicators on affected agent cards
- [ ] Validation runs on every change (debounced) and on manual trigger

**Acceptance Criteria:**
- Removing all relationships from Catalog triggers "HUB agent has no connections" warning
- Adding an orphan agent triggers "Agent has no relationships" warning
- All messages are plain language (no technical jargon)

**Dependencies:** Sprint 7 (relationships and properties working)

---

### Sprint 9: Undo/Redo and Import/Export (5 pts)

**Goal:** Full undo/redo support and configuration import/export in JSON and YAML.

**DDD Context:** Design Context

**Deliverables:**
- [ ] Undo/redo stack (command pattern) for all canvas operations
- [ ] Keyboard shortcuts: Ctrl+Z / Ctrl+Shift+Z
- [ ] Export to JSON and YAML (download file)
- [ ] Import from JSON and YAML (file upload or paste)
- [ ] Import validation: schema check before applying
- [ ] Import preview: show what will be created before confirming

**Acceptance Criteria:**
- User can undo 10+ operations in sequence
- Redo restores undone operations
- Exported JSON can be re-imported to recreate the same swarm
- Invalid import files produce clear error messages

**Dependencies:** Sprint 7 (full CRUD on canvas)

---

### Sprint 10: Documentation RAG (13 pts)

**Goal:** Build the best-practices RAG system so users can ask questions about agent design patterns.

**ADRs:** ADR-003 (Dual RAG, documentation portion)
**DDD Context:** Intelligence Context

**Deliverables:**
- [ ] Vector store setup (pgvector or Weaviate)
- [ ] Embedding pipeline: ingest markdown docs, chunk (512 tokens, 64-token overlap), embed
- [ ] Initial corpus: curated content from the research document, ADRs, template descriptions, and general agent design best practices
- [ ] Hybrid search: BM25 keyword + cosine semantic similarity
- [ ] RAG query endpoint: `POST /api/intelligence/ask`
- [ ] Chat UI component: natural-language input, streaming response, source citations
- [ ] Query router stub: all queries go to Documentation RAG for now (Graph RAG integration in Phase 3)

**Acceptance Criteria:**
- "What is the recommended pattern for human-in-the-loop approval?" returns a relevant, cited answer
- "How should I handle agent failover?" returns guidance from the best practices corpus
- Response includes source citations (document name + section)
- Response time under 5 seconds

**Dependencies:** Sprint 3 (Intelligence Context infrastructure)

---

## Phase 3: Operational Intelligence (Sprints 11-16)

**Objective:** Add monitoring, Graph RAG, and decision trace capabilities. Make the system operationally aware.

**Total Points:** 55 (A3: 21 + A5: 21 + A7: 13)

### Sprint 11: Agent Health Protocol and Connectors (8 pts)

**Goal:** Implement the health data protocol and build the first framework adapter.

**ADRs:** ADR-009 (Agent Health Protocol)
**DDD Context:** Monitoring Context

**Deliverables:**
- [ ] Health data schema (JSON Schema, TypeScript types)
- [ ] Health data ingestion API: `POST /api/monitoring/health`
- [ ] Time-series storage for health metrics (TimescaleDB or InfluxDB)
- [ ] Health data simulator: generates realistic health data for the 24-agent seed swarm
- [ ] Status determination logic (healthy/degraded/unhealthy/unknown)
- [ ] Python SDK stub: `amm-sdk` with `HealthReporter` class
- [ ] One framework adapter: AutoGen or CrewAI (whichever is more common in your environment)

**Acceptance Criteria:**
- Health simulator generates data for all 24 agents
- Status determination correctly classifies agents based on thresholds
- Health data queryable by agent and time range
- SDK can report health from a simple Python script

**Dependencies:** Sprint 2 (API infrastructure)

---

### Sprint 12: Monitoring Dashboard (13 pts)

**Goal:** Build the real-time monitoring dashboard with health grid and sparkline charts.

**ADRs:** ADR-006 (Progressive Disclosure)
**DDD Context:** Monitoring Context

**Deliverables:**
- [ ] Health grid component: all agents displayed as cards with green/yellow/red indicators
- [ ] Agent detail card: click to expand with latency, throughput, error rate, resource usage
- [ ] Sparkline charts: 1-hour trend lines for key metrics on each agent card
- [ ] Dependency health overlay: show health status on the swarm map canvas
- [ ] Basic mode: health grid with status colors and plain-language status text
- [ ] Advanced mode: time-series charts with configurable time ranges
- [ ] WebSocket connection for real-time status updates
- [ ] Swarm-level health summary (overall status, agent counts by status)

**Acceptance Criteria:**
- Dashboard shows all 24 agents with simulated health data
- Status changes (healthy -> degraded) update in real-time
- Clicking an agent shows detailed metrics
- Basic mode shows "Catalog is healthy, processing 842 requests/minute"
- Advanced mode shows p50/p95/p99 latency charts

**Dependencies:** Sprint 11 (health data flowing)

---

### Sprint 13: Alerting Engine (8 pts)

**Goal:** Users can define alert rules through a visual interface and receive notifications.

**DDD Context:** Monitoring Context

**Deliverables:**
- [ ] Alert rule data model (condition, threshold, duration, severity)
- [ ] Visual alert rule builder (no code, dropdown-based condition builder)
- [ ] Alert evaluation engine: checks rules against incoming health data
- [ ] Alert state management: firing, resolved, cooldown
- [ ] Alert timeline view: chronological list of fired/resolved alerts
- [ ] Escalation policy editor: define notification order (email, Slack webhook)
- [ ] At least one notification channel working (Slack webhook or email)

**Acceptance Criteria:**
- User creates rule: "Alert when Catalog latency p95 > 200ms for 5 minutes"
- Simulator drives Catalog latency above threshold
- Alert fires, appears in timeline, notification sent
- Alert resolves when latency drops below threshold

**Dependencies:** Sprint 12 (monitoring dashboard)

---

### Sprint 14: Graph RAG Integration (13 pts)

**Goal:** Connect Graph RAG to the knowledge graph so users can ask swarm-specific questions.

**ADRs:** ADR-003 (Dual RAG, graph portion)
**DDD Context:** Intelligence Context

**Deliverables:**
- [ ] Cypher query generation from natural language (LLM-assisted)
- [ ] Graph RAG traversal: query -> Cypher -> graph results -> context assembly -> LLM response
- [ ] Query router: classify queries as graph/doc/both (upgrade the Sprint 10 stub)
- [ ] Visual highlighting: Graph RAG responses highlight affected agents on the canvas
- [ ] Blast radius as a chat query: "What happens if Relay goes down?" shows affected agents
- [ ] Merged responses: when both RAG systems are queried, results are combined with source labels
- [ ] Confidence threshold: fall back to Documentation RAG if graph traversal returns < 2 nodes

**Acceptance Criteria:**
- "What happens if Catalog goes down?" returns a narrative + highlights 6+ dependent agents
- "What is the critical path for order processing?" returns the 5-agent sequence
- "How should I handle agent failover?" correctly routes to Documentation RAG
- "Is Catalog a bottleneck and what should I do about it?" hits both systems and merges results

**Dependencies:** Sprint 3 (knowledge graph), Sprint 10 (Documentation RAG)

---

### Sprint 15: Decision Trace System (8 pts)

**Goal:** Ingest, store, and display decision traces from agent runtimes.

**ADRs:** ADR-004 (Decision Trace Format)
**DDD Context:** Intelligence Context

**Deliverables:**
- [ ] Decision trace ingestion API: `POST /api/intelligence/traces`
- [ ] Decision trace storage (time-series indexed)
- [ ] Decision trace simulator: generates realistic traces for the seed swarm
- [ ] Timeline viewer component: chronological list of decisions, filterable by agent
- [ ] Decision detail view: four-stage format (Observation, Analysis, Decision, Action)
- [ ] Plain-language summary generation for each trace
- [ ] Link traces to knowledge graph: clicking an agent in a trace navigates to the graph

**Acceptance Criteria:**
- Trace viewer shows simulated decisions from Gavel (order approvals)
- Each trace displays all four stages in a readable format
- Filtering by agent returns only that agent's traces
- "Reason" field is plain language, not code

**Dependencies:** Sprint 11 (monitoring infrastructure for trace ingestion)

---

### Sprint 16: Decision Trace Analysis (5 pts)

**Goal:** Add search, pattern detection, and cross-trace analysis to decision traces.

**DDD Context:** Intelligence Context

**Deliverables:**
- [ ] Full-text search across decision traces
- [ ] Filter by: time range, agent, action type, confidence threshold, escalation status
- [ ] Pattern detection: identify repeated decision patterns (e.g., "Gavel escalates 40% of orders from this region")
- [ ] Cross-trace view: see how a single event cascaded through multiple agents
- [ ] Export traces to CSV/JSON for external analysis
- [ ] Integration with Graph RAG: "Show me all decisions where Sentinel overrode Gavel"

**Acceptance Criteria:**
- Searching "escalate" returns all escalation decisions
- Pattern detection identifies at least one non-obvious pattern in simulated data
- Cross-trace cascade view correctly chains related decisions

**Dependencies:** Sprint 15 (traces ingested and stored)

---

## Phase 4: Governance and Collaboration (Sprints 17-22)

**Objective:** Make the system enterprise-ready with audit trails, RBAC, approval workflows, and real-time collaboration.

**Total Points:** 42 (A8: 21 + A10: 21)

### Sprint 17: Audit Log Infrastructure (8 pts)

**Goal:** Implement the append-only, cryptographically chained audit log.

**ADRs:** ADR-007 (Audit Log)
**DDD Context:** Governance Context

**Deliverables:**
- [ ] Audit log table (PostgreSQL, append-only: no UPDATE/DELETE grants)
- [ ] Cryptographic hash chaining (SHA-256)
- [ ] Audit entry schema matching ADR-007
- [ ] Event listeners on Design, Monitoring, Intelligence contexts to capture auditable events
- [ ] Audit log viewer: chronological, searchable, filterable
- [ ] Integrity verification background job (hourly hash chain check)
- [ ] Export to JSON/CSV

**Acceptance Criteria:**
- Creating an agent generates an audit entry with actor, action, target, and details
- Modifying an agent generates an entry with before/after snapshots
- Hash chain verification passes for all entries
- Manually modifying an entry (via direct DB access) causes verification failure

**Dependencies:** Sprint 7 (Design Context CRUD operations generating events)

---

### Sprint 18: Role-Based Access Control (8 pts)

**Goal:** Implement RBAC with built-in roles and user assignment.

**DDD Context:** Governance Context

**Deliverables:**
- [ ] User authentication (local auth for development, SSO stub for enterprise)
- [ ] Built-in roles: Viewer, Designer, Operator, Administrator (per DDD Governance Context)
- [ ] Permission enforcement on all API endpoints
- [ ] Role assignment UI: admin can assign roles to users per swarm
- [ ] Permission-aware UI: features hidden or disabled based on user's role
- [ ] Layer-level and agent-level permission scoping
- [ ] Audit entries for all role changes

**Acceptance Criteria:**
- Viewer can see swarms but cannot edit
- Designer can edit agents and relationships but cannot manage alerts
- Operator can manage alerts but cannot modify swarm structure
- Administrator can do everything
- Attempting a forbidden action returns 403 with clear message

**Dependencies:** Sprint 17 (audit log captures role changes)

---

### Sprint 19: Approval Workflows (5 pts)

**Goal:** Configurable approval gates for sensitive operations.

**DDD Context:** Governance Context

**Deliverables:**
- [ ] Approval workflow data model (gates, approvers, timeouts)
- [ ] Visual approval workflow editor (swimlane-style)
- [ ] Trigger conditions: swarm deploy, agent delete on critical path, relationship override
- [ ] Approval request flow: requester submits, approver reviews, approve/reject
- [ ] Timeout handling: auto-reject or escalate after configured duration
- [ ] Notification integration (email/Slack) for pending approvals
- [ ] Approval history viewable in audit log

**Acceptance Criteria:**
- Deploying a swarm triggers an approval request to the Operator role
- Approver sees pending request with full change details
- Approving the request completes the deploy
- Rejecting sends the requester a notification with reason
- Timeout (configurable) auto-rejects if no action taken

**Dependencies:** Sprint 18 (RBAC defines who can approve)

---

### Sprint 20: Compliance Reporting (5 pts)

**Goal:** Auto-generated compliance reports from audit data.

**DDD Context:** Governance Context

**Deliverables:**
- [ ] Report templates: Access Control Summary, Change History, Approval Log, Decision Audit Trail
- [ ] Auto-population from audit log and decision trace data
- [ ] Export to PDF and markdown
- [ ] Compliance dashboard: visual summary of governance health metrics
- [ ] Scheduled report generation (weekly/monthly)

**Acceptance Criteria:**
- Access Control Summary lists all roles, users, and permissions accurately
- Change History shows all config changes with before/after
- Reports export to clean PDF
- Dashboard shows "X approval requests processed, Y audit entries, Z% with human oversight"

**Dependencies:** Sprint 17 (audit data), Sprint 15 (decision traces), Sprint 18 (RBAC data)

---

### Sprint 21: Real-Time Collaboration Foundation (8 pts)

**Goal:** Implement CRDT-based collaborative editing of swarm designs.

**ADRs:** ADR-008 (CRDT Collaboration)
**DDD Context:** Collaboration Context

**Deliverables:**
- [ ] Yjs integration: shared document model for swarm state
- [ ] WebSocket sync provider (y-websocket for development)
- [ ] Presence awareness: cursors, selections, user list
- [ ] Concurrent editing: two users can modify agents simultaneously
- [ ] Conflict resolution per ADR-008 rules (position: last-writer-wins, properties: field-level merge)
- [ ] User color assignment for visual distinction

**Acceptance Criteria:**
- Two browser tabs editing the same swarm see each other's cursors
- User A moves an agent, User B sees it move in real-time
- User A edits nickname while User B edits descriptor: both changes apply
- User list shows both connected users

**Dependencies:** Sprint 7 (canvas with full editing), Sprint 18 (user authentication)

---

### Sprint 22: Version History and Comments (8 pts)

**Goal:** Add version control (non-Git style) and commenting.

**DDD Context:** Collaboration Context

**Deliverables:**
- [ ] Manual version save: user names a version
- [ ] Auto-save: every 5 minutes if changes detected
- [ ] Version history panel (linear, no branches)
- [ ] Version restore: one click, creates auto-save of current state first
- [ ] Visual diff: compare two versions, green/red/yellow on canvas
- [ ] Comment threads: attach to agents, relationships, or canvas positions
- [ ] Thread lifecycle: open, resolved
- [ ] Comment notifications

**Acceptance Criteria:**
- User saves version "Before payment refactor"
- User makes changes, then restores the saved version
- Current state is auto-saved before restore (undoable)
- Visual diff shows added agents in green, removed in red
- Comment on Catalog agent visible to all collaborators

**Dependencies:** Sprint 21 (collaboration infrastructure)

---

## Phase 5: Optimization, Templates, and Polish (Sprints 23-26)

**Objective:** Add automated optimization recommendations, build the template library, generate documentation, and polish the overall experience.

**Total Points:** 42 (A9: 21 + A11: 13 + A12: 8)

### Sprint 23: Optimization Engine (13 pts)

**Goal:** Automated bottleneck detection and plain-language optimization recommendations.

**DDD Context:** Intelligence Context, Design Context

**Deliverables:**
- [ ] Graph-theoretic analysis: betweenness centrality, in-degree, out-degree, connected components
- [ ] Bottleneck detection: agents with disproportionate fan-in
- [ ] Single-point-of-failure detection: critical agents without redundancy
- [ ] Plain-language recommendation engine: translate metrics into actionable suggestions
- [ ] Bottleneck visualization overlay on the swarm map (heatmap-style)
- [ ] A/B comparison: side-by-side view of two swarm versions with differential highlighting
- [ ] Cost modeling: assign cost weights, calculate total swarm cost
- [ ] What-if simulation: preview adding/removing an agent before committing

**Acceptance Criteria:**
- Optimization identifies Catalog as highest-centrality node
- Recommendation says "Catalog is a bottleneck: 14 agents depend on it. Consider adding a backup."
- What-if simulation shows blast radius reduction after adding a backup agent
- All recommendations use plain language per ADR-006

**Dependencies:** Sprint 3 (knowledge graph), Sprint 12 (monitoring data)

---

### Sprint 24: Template System (8 pts)

**Goal:** Build the template library, browser, and instantiation workflow.

**ADRs:** ADR-005 (Template-First UX)
**DDD Context:** Template Context

**Deliverables:**
- [ ] Template schema implementation (matching DDD Template Context)
- [ ] E-commerce template refactored from seed data into template format
- [ ] 2 additional templates designed and built (Customer Service, Content Ops)
- [ ] Template browser UI: card grid with domain filters, search, preview
- [ ] Template preview: read-only canvas view before instantiation
- [ ] Instantiation: "Use This Template" -> name your swarm -> created
- [ ] Customization points: guided wizard for each template's extension points
- [ ] Template diff: show how an instantiated swarm diverges from its base

**Acceptance Criteria:**
- New user flow starts at template browser, not blank canvas
- Selecting E-Commerce template and clicking "Use This Template" creates a functional 24-agent swarm
- Customer Service template instantiates with ~18 agents
- Template diff accurately shows changes after user customization

**Dependencies:** Sprint 9 (import/export, which template instantiation builds on)

---

### Sprint 25: Documentation Generation (5 pts)

**Goal:** Auto-generate markdown documentation for every agent and swarm.

**DDD Context:** Collaboration Context, Design Context

**Deliverables:**
- [ ] Agent spec template: auto-populated with role, relationships, badges, SLAs, escalation behavior
- [ ] Swarm overview template: architecture diagram (ASCII or image), agent inventory, relationship summary
- [ ] Runbook template: common operational scenarios for the swarm
- [ ] Change log: auto-generated from version history
- [ ] Markdown rendering within the app
- [ ] Export to PDF, HTML, and Confluence-compatible format
- [ ] Docs update automatically when swarm changes

**Acceptance Criteria:**
- Generated agent spec for "Catalog" includes all relationships, badges, and layer info
- Swarm overview accurately lists all agents and the critical path
- Export to PDF produces a clean, readable document
- Docs update within 30 seconds of a swarm change

**Dependencies:** Sprint 22 (version history for change log), Sprint 7 (full swarm data)

---

### Sprint 26: Polish, Performance, and Launch Prep (8 pts)

**Goal:** Performance optimization, UX polish, error handling, and preparation for first users.

**DDD Context:** All contexts

**Deliverables:**
- [ ] Performance audit: canvas rendering with 50+ agents, dashboard with 24 agents streaming
- [ ] Loading states and skeleton screens for all views
- [ ] Error handling: all API errors produce clear, plain-language messages
- [ ] Empty states: helpful guidance when no swarms exist, no alerts configured, etc.
- [ ] Onboarding flow: first-time user tutorial highlighting template browser, canvas, and chat
- [ ] Keyboard shortcuts reference (accessible via ?)
- [ ] Accessibility audit: WCAG 2.1 AA compliance check
- [ ] End-to-end test suite: critical user journeys
- [ ] Production deployment configuration
- [ ] README and getting-started documentation

**Acceptance Criteria:**
- Canvas renders 50 agents at 60fps
- Dashboard updates 24 agents in real-time without lag
- First-time user can create a swarm from template in under 5 minutes
- No unhandled errors in the critical user journeys
- E2E tests pass for: create swarm from template, add agent, draw relationship, ask RAG question, view monitoring dashboard

**Dependencies:** All previous sprints

---

## Parallelism Opportunities

With a team of 4-5, these sprints can run concurrently:

| Parallel Track | Sprints | Owner |
|---------------|---------|-------|
| **Track A: Design Engine** | 5, 6, 7, 8, 9 | Frontend Engineer |
| **Track B: Intelligence** | 3, 4, 10, 14, 15, 16 | AI/ML Engineer |
| **Track C: Monitoring** | 11, 12, 13 | Backend Engineer |
| **Track D: Governance** | 17, 18, 19, 20 | Backend/Security Engineer |

The critical path remains: Sprint 2 -> Sprint 5 -> Sprint 7 -> Sprint 18 -> Sprint 21.

Parallel execution compresses the timeline from 26 sprints (~12 months) to approximately 16-18 sprints (~8-9 months).

---

## Sprint Summary Table

| Sprint | Phase | Points | Deliverable | ADRs | DDD Context |
|--------|-------|--------|-------------|------|-------------|
| 1 | Foundation | 13 | Project setup, data migration | 002 | Design |
| 2 | Foundation | 13 | Persistence, API, graph DB | 001 | Design |
| 3 | Foundation | 13 | Knowledge graph queries | 001, 003 | Intelligence |
| 4 | Foundation | 8 | Graph visualization | 002, 006 | Intelligence |
| 5 | Design | 8 | Canvas foundation | 002 | Design |
| 6 | Design | 8 | Palette, drag-and-drop | - | Design |
| 7 | Design | 8 | Connections, property editor | 006 | Design |
| 8 | Design | 5 | Validation engine | - | Design |
| 9 | Design | 5 | Undo/redo, import/export | - | Design |
| 10 | Design | 13 | Documentation RAG | 003 | Intelligence |
| 11 | Operations | 8 | Health protocol, connectors | 009 | Monitoring |
| 12 | Operations | 13 | Monitoring dashboard | 006 | Monitoring |
| 13 | Operations | 8 | Alerting engine | - | Monitoring |
| 14 | Operations | 13 | Graph RAG integration | 003 | Intelligence |
| 15 | Operations | 8 | Decision trace system | 004 | Intelligence |
| 16 | Operations | 5 | Decision trace analysis | 004 | Intelligence |
| 17 | Governance | 8 | Audit log infrastructure | 007 | Governance |
| 18 | Governance | 8 | RBAC | - | Governance |
| 19 | Governance | 5 | Approval workflows | - | Governance |
| 20 | Governance | 5 | Compliance reporting | 007 | Governance |
| 21 | Collaboration | 8 | Real-time collaboration | 008 | Collaboration |
| 22 | Collaboration | 8 | Version history, comments | - | Collaboration |
| 23 | Optimization | 13 | Optimization engine | 010 | Intelligence |
| 24 | Templates | 8 | Template system | 005 | Template |
| 25 | Documentation | 5 | Doc generation | - | Collaboration |
| 26 | Polish | 8 | Performance, UX, launch | 006 | All |
| **Total** | | **221** | | | |

---

## Definition of Done (All Sprints)

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing
- [ ] Integration tests for API endpoints
- [ ] No TypeScript errors (`npm run build` succeeds)
- [ ] Lint passes (`npm run lint`)
- [ ] Code reviewed (self-review minimum for solo, peer review for team)
- [ ] No secrets committed
- [ ] Plain-language error messages for user-facing errors
- [ ] Progressive disclosure applied (basic mode default)
- [ ] Audit entries generated for state-changing operations (Sprint 17+)

---

*This plan is a living document. Update sprint scope as you learn more during implementation. The GOAP framework supports replanning: if a sprint reveals new dependencies or risks, adjust subsequent sprints accordingly.*
