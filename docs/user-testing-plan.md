# Agent Modus - User Testing Plan

## Objective
Validate that non-technical users can design, connect, and document multi-agent AI systems using Agent Modus without guidance beyond the tool itself.

## Participants
Recruit 5-8 testers across three experience levels:

| Group | Count | Profile |
|-------|-------|---------|
| Novice | 2-3 | No AI/automation experience. Business analysts, project managers, designers. |
| Intermediate | 2-3 | Some AI/automation exposure. Product managers, tech-adjacent roles. |
| Technical | 1-2 | Developers, architects. Validates the handoff doc makes sense to builders. |

## Setup Checklist
- [ ] Deploy to a shareable URL (ngrok or Railway)
- [ ] Pre-load the E-Commerce template so testers have something to explore
- [ ] Create one empty swarm called "Test Swarm" for the build-from-scratch task
- [ ] Prepare screen recording (Loom, Zoom, or QuickTime)
- [ ] Print/share the task sheet below for each tester
- [ ] Have a note-taking template ready (spreadsheet linked below)

## Test Session Structure (40 min per tester)

### Intro (2 min)
"This is a tool for designing AI agent teams. I'm going to ask you to try a few things. There are no wrong answers. If something is confusing, that's the tool's problem, not yours. Think out loud as you go."

### Task 1: First Impressions (2 min)
**Prompt**: "Look at the home page. Without clicking anything, tell me what you think this tool does and what you'd click first."

**Watch for**:
- Do they understand the value prop from the hero text?
- Which action card draws their eye first?
- Do they notice existing swarms?

### Task 2: Explore a Template (5 min)
**Prompt**: "Click on the E-Commerce swarm. Spend a minute looking around. What do the cards represent? What do the colored lines mean? Can you find the legend?"

**Watch for**:
- Do they understand agents as team members?
- Can they read the legend?
- Do they try to click agents?
- Do they notice the emoji icons?

### Task 3: Agent Details (5 min)
**Prompt**: "Find an agent called 'Sentinel' and open its details. What does this agent do? Can you find its relationships to other agents?"

**Watch for**:
- Do they find the "i" button?
- Can they navigate the modal sections?
- Do they understand the relationship explanations?
- Do they try to edit anything?

### Task 4: Build from Scratch (10 min)
**Prompt**: "Go back to the dashboard. Create a new swarm from scratch. Add 3 agents for a customer support team: a greeter, a problem solver, and an escalation manager. Connect them."

**Watch for**:
- Can they find "+ Agent" in Build mode?
- Do they understand the wizard steps?
- Do they fill in the Core Task? Do suggestions appear?
- Can they figure out how to connect agents?
- Do they use the Relationship Orchestrator?

### Task 5: Settings (3 min)
**Prompt**: "Find where you would add your API keys so the agents can actually run."

**Watch for**:
- Can they find the Settings button on the dashboard?
- Do they understand what API keys are for?
- Can they find the "Test Connections" button?
- Does the status indicator make sense to them?

### Task 6: Run a Test (5 min)
**Prompt**: "Switch to Test mode. Click Run Test. Try the Mock Run tab first, then look at the Cost tab."

**Watch for**:
- Can they find Test mode?
- Do they understand Mock vs Cost vs Live Test vs Deploy tabs?
- Can they read the simulation results?
- Does the cost breakdown make sense?

### Task 7: Export and Deploy (3 min)
**Prompt**: "Switch to Ship mode. Export a Handoff Doc. Then try Deploy Package."

**Watch for**:
- Do they understand Build/Watch/Test/Ship modes?
- Can they find the Handoff Doc and Deploy buttons?
- Does the handoff document make sense?
- Do they understand what the deploy package is for?

### Task 8: Free Exploration (3 min)
**Prompt**: "Spend a couple minutes clicking around anywhere you haven't explored yet. Tell me what you find."

**Watch for**:
- What do they gravitate toward?
- What do they try that doesn't work?
- What surprises them?

## Post-Session Questions

1. What was the hardest part of using this tool?
2. What was the easiest or most intuitive part?
3. If you had to explain this tool to a coworker, what would you say?
4. What's missing that you expected to see?
5. Would you use this for your own work? What for?
6. On a scale of 1-10, how easy was it to use? (1 = impossible, 10 = effortless)
7. On a scale of 1-10, how useful is the concept? (1 = no value, 10 = need this now)
8. Any other thoughts?

## Note-Taking Template

For each tester, track:

| Column | Description |
|--------|-------------|
| Tester ID | T1, T2, etc. |
| Experience Level | Novice / Intermediate / Technical |
| Task # | 1-6 |
| Completed? | Yes / Partial / No |
| Time (seconds) | How long it took |
| Errors | Wrong clicks, dead ends, confusion points |
| Quotes | Exact words they said (gold for product decisions) |
| Severity | Critical / Major / Minor / Cosmetic |

## Success Criteria

| Metric | Target |
|--------|--------|
| Task completion rate (Tasks 1-7) | > 80% |
| Average ease-of-use rating | > 6/10 |
| Average usefulness rating | > 7/10 |
| Critical usability issues found | < 3 |
| Time to create 3 agents + connect (Task 4) | < 8 min |

## Common Issues to Watch For

These are known areas that might trip people up:

- **Mode switching**: Users might not realize Build/Watch/Test/Ship modes show different toolbar buttons
- **Agent wizard**: The 8-step wizard might feel long, users might skip steps
- **Relationship types**: "Depends On" vs "Feeds Into" distinction may not be obvious
- **Blast button**: Non-obvious what "Blast" means (it shows impact if an agent goes down)
- **Chat bot**: Users might not notice the logo widget in the bottom-right is a chat
- **Light/dark mode**: Toggle is small, they might miss it
- **Settings**: Users might not realize they need API keys before running live tests
- **Deploy vs Export**: Users might not understand the difference between exporting JSON and deploying a package
- **Live test duration**: Takes 60+ seconds, users might think it's frozen if progress bar doesn't show

## After Testing

1. Compile all notes into a single spreadsheet
2. Group issues by severity (Critical > Major > Minor > Cosmetic)
3. Identify the top 5 pain points
4. Prioritize fixes based on: frequency (how many testers hit it) x severity
5. Fix critical issues before next round of testing

---

*Generated for Agent Modus user testing - March 2026*
