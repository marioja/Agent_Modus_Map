# ADR-008: CRDT-Based Real-Time Collaboration

**Status:** Accepted
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 5.6, 8.1

## Context

Multiple users need to collaborate on swarm designs simultaneously. This includes:
- Co-editing agent configurations
- Drawing connections between agents
- Adding comments and annotations
- Viewing each other's cursors and selections

The research identifies CRDTs and operational transform as "notoriously difficult to implement correctly" and recommends using an existing library.

## Decision

Use **Yjs** (a CRDT library) for real-time collaborative editing of swarm configurations.

### Architecture

```
Client A (React) <-> Yjs Doc <-> WebSocket Provider <-> Server <-> Yjs Doc <-> Client B (React)
```

### Shared Data Structures

```typescript
// The Yjs document contains shared types for the swarm
const ydoc = new Y.Doc()

// Agent positions and configurations
const yAgents = ydoc.getMap('agents')

// Relationships between agents
const yRelationships = ydoc.getArray('relationships')

// User awareness (cursors, selections, presence)
const awareness = provider.awareness

// Comments and annotations
const yComments = ydoc.getArray('comments')
```

### Conflict Resolution

- **Agent position moves**: Last-writer-wins. If two users drag the same agent simultaneously, the final position is whichever write arrives last. This is acceptable because position is aesthetic, not functional.
- **Agent property edits**: Field-level CRDT merge. If User A edits the nickname while User B edits the descriptor, both changes apply. If both edit the same field, last-writer-wins with undo available.
- **Relationship creation/deletion**: Both are additive operations on an array. Simultaneous additions both succeed. Simultaneous addition and deletion of the same relationship: deletion wins (safer default).
- **Configuration changes**: Version-stamped with before/after snapshots in the audit log (ADR-007). Conflicts surface as warnings in the UI.

### Presence and Awareness

- Each user's cursor position on the canvas is broadcast to all collaborators
- Selected agents are highlighted with the selecting user's color
- User list shows who is currently viewing/editing the swarm
- Idle detection after 5 minutes removes cursor display

### Provider Options

- **Development**: y-websocket (simple WebSocket server)
- **Production**: y-redis or Liveblocks (managed service with persistence)

## Consequences

### Positive
- Real-time collaboration without manual "save and refresh" cycles
- CRDTs handle offline editing and reconnection gracefully
- Yjs is battle-tested (used by Jupyter, Tiptap, BlockSuite)
- Awareness features (cursors, presence) make collaboration tangible
- No custom conflict resolution logic needed for most cases

### Negative
- Yjs adds a dependency and a conceptual layer (CRDT documents) that the team must understand
- WebSocket connections increase server resource requirements
- CRDT merge semantics can produce surprising results in edge cases (two users creating identical agents simultaneously)
- Adds complexity to the persistence layer: Yjs documents must be serialized to and from the database

### Neutral
- Collaboration is a Phase 5 feature (Sprints 17-22). The decision is documented now but implementation is deferred.
- The design canvas, monitoring dashboard, and other views do not all need collaboration at launch. Start with the design canvas, expand later.

## Alternatives Considered

**Operational Transform (OT)**: Used by Google Docs. More mature for text editing but harder to apply to structured data (agent graphs). CRDTs are a better fit for non-text collaborative data.

**Liveblocks (managed service)**: Provides CRDT collaboration as a service. Considered for production to reduce operational burden. Decision deferred; Yjs provides the foundation, and Liveblocks uses Yjs under the hood.

**Pessimistic locking**: Only one user can edit at a time. Rejected because it destroys the collaborative experience and does not scale to teams.

**Turn-based editing with merge**: Users work on copies and merge changes. Rejected because it replicates Git-like complexity, which the research explicitly identifies as inappropriate for non-technical users.
