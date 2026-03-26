# Quality Experience (QX) Analysis v2: Agent Modus Map

**Date:** 2026-03-26
**Previous Review:** 2026-03-26, scored 71/100 (C+)
**Target:** Agent Modus Map (non-technical user audience)
**Method:** Source code analysis of 6 key UI components post-changes
**Framework:** QX 23-Heuristic Model with Oracle Detection and Rule of Three

---

## Executive Summary

Since the v1 review, the team shipped a focused set of improvements that addressed several of the highest-priority recommendations. The native browser dialogs are gone, relationship labels are now in plain English, the "blast radius" button reads "Impact," deploy lives under Ship mode with schedule/budget/results persistence, and the Dashboard surfaces recent results. These are meaningful gains.

However, some of the hardest problems from v1 remain untouched: no onboarding, no wizard simplification, no undo/redo, no autosave. And a few new issues crept in with the deploy feature.

**Updated Overall QX Score: 79/100 (B-)**

| Dimension | v1 Score | v2 Score | Change |
|-----------|----------|----------|--------|
| Overall QX | 71 | 79 | +8 |
| Usability | 68 | 76 | +8 |
| Visual Design | 82 | 83 | +1 |
| Accessibility | 55 | 56 | +1 |
| Trust & Safety | 76 | 82 | +6 |
| Language Clarity | 58 | 72 | +14 |
| Task Completion | 70 | 78 | +8 |

The biggest gain is Language Clarity (+14), driven by the plain language labels in ConnectionTypeModal and the canvas legend. Trust & Safety improved (+6) because deploy now has budget limits, schedule controls, and persistent results.

---

## Section 1: Previous Issue Scorecard

### Issue #1 (Priority 1): Replace prompt()/confirm() with styled modals
**v1 Score:** 65/100
**v2 Score:** 85/100
**Status: MOSTLY FIXED**

The `InputModal` and `ConfirmModal` components in Dashboard.tsx are well-built. They use CSS variables, support keyboard Enter-to-confirm, show styled buttons, and render within the app's visual language. The confirm modal for swarm deletion now shows the swarm name and warns "This will permanently remove this swarm and all its agents. This cannot be undone." That is excellent.

**Remaining gaps:**
- `window.confirm('Delete this relationship?')` still exists in SwarmCanvas.tsx line 234 for edge deletion. This is the last native dialog in the app.
- `alert('Deploy failed: ' + err.message)` in SimulationPanel.tsx line 707 uses a native alert for deploy errors.

Both should be replaced with the same modal pattern already built in Dashboard.tsx. The components exist, they just need to be extracted and reused.

### Issue #2 (Priority 1): Add tooltips to badge names
**v1 Score:** 60/100
**v2 Score:** 68/100
**Status: PARTIALLY FIXED**

The wizard now wraps each badge in a `<Tooltip>` component using `BADGE_TOOLTIPS`. This is a real improvement for users going through agent creation. However, badges displayed on agent cards on the canvas (AgentNode.tsx) still show raw names like `CAN_OVERRIDE` and `LOGS_ALL` without tooltips.

### Issue #3 (Priority 1): Rename "Blast radius" to "Impact zone"
**v1 Score:** N/A (terminology issue)
**v2 Score:** 90/100
**Status: FIXED**

EditorToolbar.tsx line 142 now reads `'Impact: ON' : 'Impact'` instead of "Blast radius." The internal variable names still use `blastRadius` (which is fine for code), but the user-facing label is clean.

### Issue #4 (Priority 1): Rename relationship types to plain language
**v1 Score:** 58/100
**v2 Score:** 92/100
**Status: FIXED**

ConnectionTypeModal.tsx now uses:
- "Needs" (was "dependsOn") with description "This agent needs information or services from the other agent to do its job"
- "Sends data to" (was "feedsInto") with "This agent passes its results to the other agent for further work"
- "Works with" (was "collaboratesWith") with "These agents work together as equals, sharing information back and forth"
- "Can overrule" (was "canOverride") with "This agent has the authority to change or block the other agent's decisions"

The SwarmCanvas legend also uses the same plain labels: "Needs (depends on)," "Sends data to," "Works with," "Can overrule." Each has a color-coded line sample. This is one of the best improvements in this release.

### Issue #5 (Priority 1): Add "What is a swarm?" explainer
**v1 Score:** 65/100
**v2 Score:** 65/100
**Status: NOT ADDRESSED**

The Dashboard hero text still reads "Design your agent swarm" and "Build, connect, and monitor multi-agent AI systems" with no definition of what a swarm or agent is. The recommendation to add a one-liner explanation was not implemented.

### Issue #6 (Priority 1): Fix hardcoded dark-mode colors
**v1 Score:** 82/100
**v2 Score:** 84/100
**Status: PARTIALLY FIXED**

The git log shows commits specifically addressing light mode: "Fix light mode: replace all hardcoded text colors with CSS variables" and "Fix light mode AAA contrast." The button styles in EditorToolbar still use `rgba(255,255,255,0.12)` and `rgba(255,255,255,0.04)` which will look wrong in light mode. The ConnectionTypeModal cancel button also uses `rgba(255,255,255,0.15)`. These are minor compared to v1 but still present.

### Issue #7 (Priority 2): Quick Create wizard path
**v1 Score:** 68/100
**v2 Score:** 68/100
**Status: NOT ADDRESSED**

The wizard is still 8 steps. No "Quick Create" or simplified path was added.

### Issue #8 (Priority 2): First-time onboarding
**v1 Score:** 65/100
**v2 Score:** 65/100
**Status: NOT ADDRESSED**

No canvas tour, no first-run guidance, no contextual help was added.

### Issue #9 (Priority 2): Undo/redo for canvas operations
**v1 Score:** 58/100
**v2 Score:** 58/100
**Status: NOT ADDRESSED**

### Issue #10 (Priority 2): Autosave wizard drafts
**v1 Score:** 65/100
**v2 Score:** 65/100
**Status: NOT ADDRESSED**

### Issue #11 (Priority 2): Cost warning before live tests
**v1 Score:** 70/100
**v2 Score:** 90/100
**Status: FIXED**

The Live Test tab now shows a prominent red warning box: "This makes real API calls and costs real money. Each agent in the swarm will call the configured LLM model. Review the Cost Estimate tab first." This is clear, direct, and placed before the input field so users see it before they type anything.

---

## Section 2: New Features Evaluation

### Deploy Tab (Ship Mode)

**Score: 82/100**

The deploy feature is the biggest addition. It adds a complete deploy-from-the-app workflow with schedule selection, budget limits, start/pause/stop controls, and persistent results via SQLite.

**Strengths:**
1. The form labels are written in plain language: "What should this swarm do?", "How often?", "Budget limit ($)". No jargon.
2. Schedule options are human-readable: "Run once," "Every hour," "Every day," "Every week."
3. Budget limit input defaults to $1.00, which is a safe starting point for new users.
4. Status bar shows run count and total cost vs. budget limit in a single glance.
5. Pause/Resume/Stop controls appear contextually (only when relevant).
6. Results use `<details>` disclosure elements, keeping the panel manageable even with many runs.
7. Each result has Copy All, Copy Leads, and Download buttons.

**Issues found:**
1. **Deploy error uses `alert()`** (line 707): `alert('Deploy failed: ' + err.message)` is a native browser dialog, inconsistent with the styled modals elsewhere.
2. **"Copy Leads" is domain-specific**: The lead sheet extraction (doCopyLeadSheet) searches for Scout/Profile/Qualify agent names and parses markdown-formatted company lists. This only makes sense for the lead generation template. For other swarm types, this button will produce gibberish or empty data. There is no indication to the user that this is template-specific.
3. **Shared `copied` state bug**: The `copied` state in DeployTab is shared across Copy All, Copy Leads, and Download. Clicking any one of them sets `copied = true`, so all three buttons show "Copied!" or "Downloaded!" simultaneously for 2 seconds. Each button should track its own state.
4. **`downloadReport` sets `copied` state**: In DeployTab's `downloadReport` wrapper (line 672-675), a file download triggers `setCopied(true)`, which makes the button say "Copied!" instead of "Downloaded!". The standalone function at the top level does not have this problem.
5. **No confirmation before deploy**: Clicking "Deploy Swarm" immediately fires real API calls with real costs. There should be a confirmation step, especially since the button is large, green, and full-width.

### Recent Results on Dashboard

**Score: 80/100**

The Dashboard now fetches and displays the 5 most recent results. Each result shows swarm name, timestamp, agent count, and cost.

**Strengths:**
- Clicking a result navigates to the swarm, which is intuitive.
- Green/red status dots give immediate visual feedback.
- Cost display uses dollar formatting.

**Issues:**
- Results for deleted swarms show "Unknown Swarm" with no way to view the data.
- No pagination or "View all" link. The hard limit of 5 is fine for now but will feel limiting.

### Renaming: "Run History" to "Results," "Deploy Package" to "Deploy"

**Score: 88/100**

Both renames improve clarity. "Results" is universally understood. "Deploy" is shorter and more action-oriented. The deploy button in Ship mode now reads just "Deploy" (green, distinct from the purple mode color), which makes it stand out as the primary action.

### Deploy Form Paste Bug Fix

**Score: 95/100**

State was lifted to the parent SimulationPanel and DeployTab is wrapped in React.memo. The query state is now controlled by the parent via `query` and `onQueryChange` props. This fixes the paste/type reset bug. Clean implementation.

---

## Section 3: Updated Heuristic Scores

### Problem Analysis (H1.x)

| Heuristic | v1 | v2 | Change | Notes |
|-----------|----|----|--------|-------|
| H1.1: Understand the Problem | 65 | 68 | +3 | Recent Results adds context about what a swarm produces, but still no explainer |
| H1.2: Identify Who is Affected | 60 | 64 | +4 | Plain language labels help non-technical users; wizard still technical |
| H1.3: Recognize Oracle Problems | 72 | 75 | +3 | Budget limits help define "how much is too much" for deploy |
| H1.4: Apply Rule of Three | 70 | 73 | +3 | Deploy diagnostics cover multiple failure scenarios |

### User Needs (H2.x)

| Heuristic | v1 | v2 | Change | Notes |
|-----------|----|----|--------|-------|
| H2.1: User Goals | 78 | 82 | +4 | Deploy in Ship mode completes the Build/Watch/Test/Ship story |
| H2.2: Pain Points | 62 | 72 | +10 | Relationship labels, Impact rename, cost warnings all reduce friction |
| H2.3: Expectations | 70 | 78 | +8 | Deploy form sets expectations well: schedule, budget, results |
| H2.4: Frustration Points | 65 | 78 | +13 | Styled modals replace most native dialogs; deploy has controls |
| H2.5: Context Awareness | 74 | 80 | +6 | Dashboard results, deploy status bar add persistent context |
| H2.6: Emotional Response | 72 | 74 | +2 | Deploy green button and status bar feel polished |

### Business Needs (H3.x)

| Heuristic | v1 | v2 | Change | Notes |
|-----------|----|----|--------|-------|
| H3.1: Business Value | 75 | 82 | +7 | In-app deploy is a major value-add; results persistence is real utility |
| H3.2: Revenue Impact | 68 | 74 | +6 | Budget limits reduce accidental overspend, building trust |
| H3.3: Compliance | 80 | 84 | +4 | Budget controls and cost tracking support financial accountability |
| H3.4: Retention | 65 | 72 | +7 | SQLite persistence means results survive restarts; real product feel |

### Balance (H4.x)

| Heuristic | v1 | v2 | Change | Notes |
|-----------|----|----|--------|-------|
| H4.1: Visible Impacts | 82 | 84 | +2 | Light mode fixes landed, minor hardcoded colors remain |
| H4.2: Invisible Impacts | 70 | 71 | +1 | No responsive or reduced-motion changes |
| H4.3: Trade-off Analysis | 68 | 72 | +4 | Deploy budget/schedule is a good power-vs-safety balance |

### Impact (H5.x)

| Heuristic | v1 | v2 | Change | Notes |
|-----------|----|----|--------|-------|
| H5.1: Proactive Prevention | 85 | 88 | +3 | Cost warning on live tests, budget limits on deploy |
| H5.2: Recovery Support | 58 | 62 | +4 | Pause/stop on deploy, results persist; still no undo elsewhere |
| H5.3: Cascading Effects | 72 | 75 | +3 | Deploy diagnostics explain downstream failures |
| H5.4: Long-term Impact | 65 | 72 | +7 | Persistent results create a usage history |

### Creativity (H6.x)

| Heuristic | v1 | v2 | Change | Notes |
|-----------|----|----|--------|-------|
| H6.1: End-to-End Flow | 70 | 80 | +10 | Build > Test > Ship > Deploy > See Results is a complete loop now |
| H6.2: Drop-off Risk | 65 | 72 | +7 | Deploy is accessible and well-labeled; results are visible |
| H6.3: Alternative Approaches | 75 | 78 | +3 | Copy All, Copy Leads, Download give multiple output options |

---

## Section 4: Oracle Problems Update

### Oracle Problem 1: Power vs. Simplicity (UNCHANGED, still HIGH)

The wizard is still 8 steps with 40+ fields. Steps 4-6 are still technical. The smart suggestion engine is still the only bridge. This remains the biggest structural UX issue.

### Oracle Problem 2: Jargon as Identity (PARTIALLY RESOLVED)

The relationship labels and "Impact" rename were the two most visible jargon items, and both are fixed. Badge names on the canvas still use developer conventions (CAN_OVERRIDE, LOGS_ALL). The wizard Step 4 still says "Temperature" and "Max Tokens" without plain-language alternatives.

### Oracle Problem 3: Native Dialogs (MOSTLY RESOLVED)

Two native dialogs remain: `window.confirm` for edge deletion in SwarmCanvas and `alert()` for deploy errors in SimulationPanel. Down from the original five instances.

### New Oracle Problem 4 (LOW): Copy Leads Assumes Template Structure

The "Copy Leads" button in both the live test results and deploy results looks for agents named "Scout," "Profile," and "Qualify" and parses markdown-formatted company lists from their output. This is specific to the lead generation template. For any other swarm type, the button produces empty or misleading output.

**Resolution options:**
1. Hide "Copy Leads" unless the swarm uses the lead generation template
2. Make the copy logic generic (detect any structured output with companies/contacts)
3. Add a tooltip: "Extracts lead data from Scout, Profile, and Qualify agents"

---

## Section 5: Top 3 Remaining Issues for Non-Technical Users

### 1. No onboarding or first-run guidance

A non-technical user who opens Agent Modus for the first time sees a hero, three action cards, and nothing else. They do not know what a swarm is, what an agent is, how to connect agents on the canvas, or what the four modes (Build/Watch/Test/Ship) mean in sequence. The entire learning burden is on the user.

This was the #8 recommendation in v1 and remains unaddressed. It is the single highest-impact gap for the stated non-technical audience.

**Concrete fix:** A 4-step tooltip tour on first canvas visit: (1) "This is your canvas. Drag agents here from the palette." (2) "Connect agents by dragging from one handle to another." (3) "Click Validate to check your design for problems." (4) "Switch to Test mode to try it out, then Ship mode to deploy."

### 2. Wizard is still 8 technical steps with no simplified path

Steps 4-7 ask about model providers, temperature, max tokens, memory backends, MCP servers, retry counts, timeout in ms, content filters, and output validation. These are developer-facing configuration options that a non-technical user cannot meaningfully set.

The smart suggestion engine helps, but only if users describe their task well enough to trigger a match. And even then, users still see all the fields.

**Concrete fix:** Add a "Quick Create" toggle on Step 1 that collapses the wizard to 3 steps (Identity, Core Task, Review) with smart defaults applied automatically. The full 8-step path becomes "Advanced."

### 3. Canvas interaction patterns are unexplained

How do you connect two agents? Drag from a handle on one node to a handle on another. How do you know handles exist? You do not, unless you hover over a node and notice the small circles. How do you delete a connection? Click the edge and confirm in a browser dialog. None of this is documented, labeled, or taught.

For a technical user familiar with React Flow or node-based editors, this is obvious. For a non-technical user, it is invisible.

**Concrete fix:** Add a "Connect" button to Build mode that shows a brief animated overlay explaining the drag-to-connect gesture. Or add an explicit "Connect Two Agents" workflow: click first agent, click second agent, choose type.

---

## Section 6: New Recommendations

### Priority 1: Do Now

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| 1 | Replace `window.confirm` in SwarmCanvas edge deletion with styled ConfirmModal | Medium | Low (component exists) |
| 2 | Replace `alert()` in deploy error handling with styled error display | Medium | Low |
| 3 | Fix shared `copied` state in DeployTab (each button needs its own state) | Low | Trivial |
| 4 | Add deploy confirmation step before firing real API calls | Medium | Low |
| 5 | Add "What is a swarm?" one-liner below the dashboard hero | Medium | Trivial |

### Priority 2: Do Next

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| 6 | First-time canvas tour (4-step tooltip overlay) | High | Medium |
| 7 | "Quick Create" 3-step wizard path | High | Medium |
| 8 | Hide "Copy Leads" button for non-lead-gen swarms | Medium | Low |
| 9 | Add badge tooltips on AgentNode cards (not just in wizard) | Medium | Low |
| 10 | Fix remaining hardcoded rgba(255,255,255,...) in EditorToolbar and ConnectionTypeModal | Low | Low |

### Priority 3: Do Later

| # | Recommendation | Impact | Effort |
|---|---------------|--------|--------|
| 11 | Undo/redo for canvas operations | High | High |
| 12 | Autosave wizard drafts to localStorage | Medium | Low |
| 13 | Responsive design for SimulationPanel on smaller screens | Medium | Medium |
| 14 | Reduced-motion media query support | Low | Low |

---

## Section 7: Score Calculation

**Previous score:** 71/100 (C+)

**Changes that improved the score:**
- Styled modals replacing native dialogs: +4
- Plain language relationship labels and descriptions: +3
- "Impact" rename from "Blast radius": +1
- Cost warning on live tests: +1
- Deploy with schedule, budget, persistence, results: +4
- Recent Results on Dashboard: +1
- Deploy form paste bug fix: +1
- Light mode hardcoded color fixes: +1

**Deductions for new issues:**
- Remaining `window.confirm` and `alert()`: -1
- Shared `copied` state bug in DeployTab: -1
- No deploy confirmation step: -1
- "Copy Leads" assumes lead-gen template: -1

**Net change:** +12 raw, adjusted to +8 after accounting for unchanged core issues (onboarding, wizard complexity, canvas learnability) that cap the ceiling.

**Updated score: 79/100 (B-)**

---

## Section 8: Methodology

This analysis compares the current codebase against the v1 QX analysis performed on the same date. Each previous recommendation was evaluated as FIXED, MOSTLY FIXED, PARTIALLY FIXED, or NOT ADDRESSED. New features were evaluated against the same 23-heuristic framework.

**Components analyzed in this review:**
- `Dashboard.tsx` (426 lines) - InputModal, ConfirmModal, Recent Results section
- `SimulationPanel.tsx` (850+ lines) - Deploy tab, copy/download functions, diagnostics
- `EditorToolbar.tsx` (178 lines) - Mode-specific buttons, "Impact" label
- `ConnectionTypeModal.tsx` (95 lines) - Plain language relationship types
- `SwarmCanvas.tsx` (295 lines) - Legend with plain language, remaining confirm()
- `AgentBuilderWizard.tsx` (600+ lines) - Badge tooltips, smart suggestions (unchanged)

**What improved most:** Language clarity and task completion. The plain language labels and deploy workflow closed two of the biggest gaps from v1.

**What still needs work:** Onboarding, wizard simplification, and canvas discoverability. These are the three things standing between the current product and a genuinely non-technical-friendly experience.
