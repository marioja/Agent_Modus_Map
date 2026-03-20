# Collaboration Context (Generic Domain)

**Owner:** Platform Team
**Type:** Generic Domain (uses off-the-shelf CRDT library)
**Priority:** Medium. Important but not differentiated.
**Depends on:** ADR-008 (CRDT Collaboration)

## Purpose

The Collaboration Context enables real-time multi-user editing of swarm designs, presence awareness, commenting, and version control. It wraps Yjs (CRDT library) with application-specific logic.

## Ubiquitous Language

| Term | Definition |
|------|-----------|
| **Session** | A real-time collaborative editing session for a specific swarm |
| **Presence** | The visible state of other users in a session (cursor, selection, idle status) |
| **Comment** | A user annotation attached to an agent, relationship, or canvas position |
| **Thread** | A comment with replies, forming a discussion |
| **Version** | A named snapshot of the swarm configuration at a point in time |
| **Version History** | The ordered list of all saved versions for a swarm |
| **Diff** | A visual comparison between two versions showing what changed |

## Aggregates

### CollaborationSession (Aggregate Root)

```typescript
interface CollaborationSession {
  swarmId: SwarmId
  activeUsers: SessionUser[]
  ydoc: Y.Doc                    // Yjs shared document
  provider: WebSocketProvider    // connection to sync server
  startedAt: DateTime
}

interface SessionUser {
  userId: UserId
  name: string
  color: string                  // assigned color for cursor/selection
  cursor?: { x: number, y: number }
  selectedAgentId?: AgentId
  status: 'active' | 'idle' | 'disconnected'
  lastActiveAt: DateTime
}
```

### CommentStore (Aggregate Root)

```typescript
interface CommentStore {
  swarmId: SwarmId
  threads: CommentThread[]
}

interface CommentThread {
  id: ThreadId
  anchor: {
    type: 'agent' | 'relationship' | 'canvas'
    id?: string                  // agentId or relationshipId
    position?: { x: number, y: number }  // for canvas comments
  }
  comments: Comment[]
  status: 'open' | 'resolved'
  createdAt: DateTime
}

interface Comment {
  id: CommentId
  author: UserId
  authorName: string
  text: string
  createdAt: DateTime
  editedAt?: DateTime
}
```

### VersionHistory (Aggregate Root)

```typescript
interface VersionHistory {
  swarmId: SwarmId
  versions: Version[]
  currentVersion: VersionId
}

interface Version {
  id: VersionId
  name: string                   // user-provided: "Before adding payment agents"
  snapshot: SwarmSnapshot        // full swarm state
  createdBy: UserId
  createdAt: DateTime
  autoSave: boolean              // true for periodic auto-saves, false for user-initiated
}

interface SwarmSnapshot {
  agents: Agent[]
  relationships: Relationship[]
  layers: Layer[]
  config: Record<string, unknown>
}
```

## Domain Events

| Event | Trigger | Consumers |
|-------|---------|-----------|
| `UserJoinedSession` | User opens swarm for editing | Presence broadcast |
| `UserLeftSession` | User closes swarm or goes idle | Presence broadcast |
| `CommentAdded` | User posts a comment | Governance (audit), Notification |
| `ThreadResolved` | User marks thread as resolved | Governance (audit) |
| `VersionCreated` | User or auto-save creates a version | Governance (audit) |
| `VersionRestored` | User restores a previous version | Design (apply snapshot), Governance (audit) |

## Version Control UX

The version control interface avoids Git-like complexity:

```
+------------------------------------------+
|  Version History                          |
|                                           |
|  [Current] v7 - "Added Vault agent"      |
|    by Anne, 10 minutes ago               |
|    [View] [Restore]                       |
|                                           |
|  v6 - Auto-save                           |
|    by System, 25 minutes ago              |
|    [View] [Restore]                       |
|                                           |
|  v5 - "Before payment refactor"           |
|    by Anne, 2 hours ago                   |
|    [View] [Restore] [Compare with Current]|
|                                           |
+------------------------------------------+
```

- **No branches**. One linear history per swarm.
- **No merge conflicts**. CRDT handles concurrent edits (ADR-008).
- **Named versions** are user-initiated; auto-saves happen every 5 minutes.
- **Restore** replaces the current state with the version snapshot. The replaced state becomes a new auto-save version (so restore is always undoable).
- **Compare** shows a visual diff on the canvas: green for added agents, red for removed, yellow for modified.

## Integration Contracts

### Consumes

```typescript
// From Design Context
interface SwarmChangedEvent {
  swarmId: SwarmId
  snapshot: Swarm
}
// Used to trigger auto-save version creation
```

### Publishes

```typescript
interface VersionRestoredEvent {
  swarmId: SwarmId
  versionId: VersionId
  restoredBy: UserId
  snapshot: SwarmSnapshot
}
// Design Context applies the restored snapshot

interface CommentAddedEvent {
  swarmId: SwarmId
  threadId: ThreadId
  commentId: CommentId
  author: UserId
  anchor: { type: string, id?: string }
}
```

## Auto-Save Policy

- Auto-save every 5 minutes if changes have been made
- Auto-save on user disconnect (graceful close)
- Keep last 50 auto-saves; older auto-saves are pruned (named versions are never pruned)
- Auto-saves are labeled "Auto-save" in version history, not user-named
