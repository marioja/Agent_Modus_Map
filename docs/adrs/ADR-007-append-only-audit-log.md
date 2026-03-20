# ADR-007: Append-Only Cryptographic Audit Log

**Status:** Accepted
**Date:** 2026-03-20
**Deciders:** Anne Cook
**Relates to:** Research Document Section 5.4

## Context

Enterprise deployments require tamper-evident audit trails for compliance (SOC 2, ISO 27001, industry-specific regulations). Every configuration change, agent decision, human intervention, and system event must be logged immutably.

The research identifies audit logging as a prerequisite for all other governance features: RBAC generates audit events, approval workflows generate audit events, compliance reports consume audit data.

## Decision

Implement an **append-only, cryptographically chained audit log**.

### Schema

```json
{
  "id": "uuid-v7",
  "timestamp": "2026-03-20T14:32:01.442Z",
  "sequence": 148329,
  "actor": {
    "type": "user|agent|system",
    "id": "user-123|agent-gavel|system-scheduler",
    "name": "Anne Cook|Gavel|Clockwork"
  },
  "action": "agent.config.updated|decision.escalated|swarm.deployed",
  "target": {
    "type": "agent|swarm|template|user",
    "id": "agent-catalog",
    "name": "Catalog"
  },
  "details": {
    "before": {},
    "after": {},
    "reason": "Updated monitoring threshold per Q1 review"
  },
  "hash": "sha256(previous_hash + this_entry)",
  "previous_hash": "sha256..."
}
```

### Properties

- **Append-only**: No updates or deletes. Ever. Corrections are new entries referencing the original.
- **Cryptographic chaining**: Each entry includes a SHA-256 hash of the previous entry plus its own content. Tampering with any entry breaks the chain for all subsequent entries.
- **Sequential**: Monotonically increasing sequence numbers. Gaps indicate tampering or data loss.
- **Actor attribution**: Every entry identifies who or what performed the action.
- **Before/after snapshots**: Configuration changes include the state before and after the change.

### Storage

- **Hot storage**: PostgreSQL table with append-only policy (no UPDATE/DELETE grants on the table). 90-day default retention in hot tier.
- **Cold storage**: Export to S3-compatible object storage in batches (daily). Signed with organizational key. 1-year minimum retention, configurable up to 7 years for regulated industries.
- **Integrity verification**: Background job verifies hash chain integrity hourly. Alerts on any chain break.

### Access

- All users can view audit entries for resources they have access to (filtered by RBAC)
- Only Administrators can export full audit logs
- Nobody can modify or delete audit entries (enforced at database level)

## Consequences

### Positive
- Meets SOC 2 Type II requirements for audit trail immutability
- Cryptographic chaining provides tamper evidence without external dependencies
- The before/after snapshot enables "undo" functionality for configuration changes
- Compliance reports can be auto-generated from audit data
- Non-technical users can see a human-readable activity feed ("Anne updated Catalog's monitoring threshold")

### Negative
- Storage grows indefinitely (mitigated by cold storage tiering)
- Hash chain verification has O(n) cost for full verification
- No data can ever be truly deleted, which creates tension with GDPR "right to erasure" (mitigated by not storing PII in audit entries, only actor IDs that reference a separately managed user store)

### Neutral
- This is a standard pattern in enterprise compliance systems
- The audit log is separate from decision traces (ADR-004); decision traces capture agent reasoning, audit logs capture system-wide events

## Alternatives Considered

**Standard database logging**: INSERT-only table without cryptographic chaining. Simpler but provides no tamper evidence. A database administrator could modify entries undetected.

**Blockchain/distributed ledger**: Maximum tamper resistance but massive operational complexity. Rejected as overkill for a single-organization audit trail.

**Third-party audit service** (e.g., AWS CloudTrail, Datadog): Outsources the problem but creates vendor dependency and may not capture application-level events with sufficient detail.
