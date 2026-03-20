import React, { useState } from 'react';
import type { Badge, LayerDefinition } from '../../shared/types/index.js';

interface Props {
  layers: LayerDefinition[];
  existingNicknames: string[];
  onCreate: (agentData: AgentFormData) => void;
  onCancel: () => void;
}

export interface AgentFormData {
  nickname: string;
  formalName: string;
  descriptor: string;
  layerId: string;
  badges: Badge[];
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const ALL_BADGES: Badge[] = ['HUB','CRITICAL','ENTRY','AUTO','HUMAN','APPROVAL','ALWAYS_ON','ADVISORY','CAN_OVERRIDE','HIGH_PRIORITY','MEDIUM','LOGS_ALL'];

const STEPS: Array<{ num: Step; title: string; subtitle: string }> = [
  { num: 1, title: 'Identity', subtitle: 'Who is this agent?' },
  { num: 2, title: 'Primary Function', subtitle: 'What does it do?' },
  { num: 3, title: 'Inputs & Outputs', subtitle: 'Data in, data out' },
  { num: 4, title: 'Model & Memory', subtitle: 'How does it think?' },
  { num: 5, title: 'Integrations', subtitle: 'What tools does it use?' },
  { num: 6, title: 'Behavior & Safety', subtitle: 'Rules and guardrails' },
  { num: 7, title: 'Performance & Notes', subtitle: 'Metrics and documentation' },
  { num: 8, title: 'Review & Create', subtitle: 'Confirm and build' },
];

function uid() { return Math.random().toString(36).slice(2, 10); }

export function AgentBuilderWizard({ layers, existingNicknames, onCreate, onCancel }: Props) {
  const [step, setStep] = useState<Step>(1);

  // Step 1: Identity
  const [nickname, setNickname] = useState('');
  const [formalName, setFormalName] = useState('');
  const [descriptor, setDescriptor] = useState('');
  const [emoji, setEmoji] = useState('');
  const [layerId, setLayerId] = useState(layers[0]?.id || '');
  const [badges, setBadges] = useState<Badge[]>([]);

  // Step 2: Primary Function
  const [coreTask, setCoreTask] = useState('');
  const [triggerConditions, setTriggerConditions] = useState('');
  const [autonomyLevel, setAutonomyLevel] = useState('');
  const [persona, setPersona] = useState('');
  const [instructions, setInstructions] = useState('');
  const [constraints, setConstraints] = useState('');
  const [outputFormat, setOutputFormat] = useState('');

  // Step 3: Inputs & Outputs
  const [inputs, setInputs] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputs, setOutputs] = useState('');
  const [outputDestination, setOutputDestination] = useState('');

  // Step 4: Model & Memory
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState('claude-sonnet-4-6');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [shortTerm, setShortTerm] = useState(true);
  const [longTerm, setLongTerm] = useState(false);
  const [contextWindow, setContextWindow] = useState(100000);
  const [memoryBackend, setMemoryBackend] = useState('in-memory');

  // Step 5: Integrations
  const [skills, setSkills] = useState<Array<{ id: string; name: string; description: string; enabled: boolean }>>([]);
  const [ragSources, setRagSources] = useState<Array<{ id: string; name: string; type: string; uri: string }>>([]);
  const [mcpServers, setMcpServers] = useState<Array<{ id: string; name: string; url: string; transport: string }>>([]);
  const [apiCalls, setApiCalls] = useState<Array<{ id: string; name: string; method: string; url: string; authType: string }>>([]);
  const [dbConnections, setDbConnections] = useState<Array<{ id: string; name: string; type: string; connectionString: string; readOnly: boolean }>>([]);

  // Step 6: Behavior & Safety
  const [priorityRanking, setPriorityRanking] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');
  const [learningBehavior, setLearningBehavior] = useState('');
  const [decisionAuthority, setDecisionAuthority] = useState('');
  const [contentFilters, setContentFilters] = useState('');
  const [blockedTopics, setBlockedTopics] = useState('');
  const [outputValidation, setOutputValidation] = useState('');
  const [requireCitation, setRequireCitation] = useState(false);
  const [retryCount, setRetryCount] = useState(3);
  const [timeoutMs, setTimeoutMs] = useState(30000);
  const [fallbackAgent, setFallbackAgent] = useState('');
  const [maxTokensPerReq, setMaxTokensPerReq] = useState(10000);
  const [dailyBudget, setDailyBudget] = useState(50);
  const [monthlyBudget, setMonthlyBudget] = useState(1000);
  const [canRead, setCanRead] = useState('');
  const [canWrite, setCanWrite] = useState('');
  const [canExecute, setCanExecute] = useState('');
  const [canAccessExternal, setCanAccessExternal] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);

  // Step 7: Performance & Notes
  const [successMetrics, setSuccessMetrics] = useState('');
  const [typicalRuntime, setTypicalRuntime] = useState('');
  const [failureModes, setFailureModes] = useState('');
  const [escalationPath, setEscalationPath] = useState('');
  const [knownQuirks, setKnownQuirks] = useState('');
  const [maintenanceNeeds, setMaintenanceNeeds] = useState('');
  const [futureEnhancements, setFutureEnhancements] = useState('');

  function toggleBadge(b: Badge) { setBadges(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]); }

  function canProceed(): boolean {
    if (step === 1) return nickname.trim().length > 0 && formalName.trim().length > 0 && layerId.length > 0;
    return true;
  }

  function handleCreate() {
    const split = (s: string) => s.split(',').map(x => x.trim()).filter(x => x);

    const config: Record<string, unknown> = {
      emoji, coreTask, triggerConditions, autonomyLevel,
      inputs: split(inputs), inputFormat, outputs: split(outputs), outputDestination,
      systemPrompt: { persona, instructions, constraints, outputFormat },
      modelConfig: { provider, model, temperature, maxTokens },
      memoryConfig: { shortTermEnabled: shortTerm, longTermEnabled: longTerm, contextWindowTokens: contextWindow, memoryBackend, ttlMinutes: 60 },
      skills, rag: { enabled: ragSources.length > 0, sources: ragSources },
      mcp: { enabled: mcpServers.length > 0, servers: mcpServers, tools: [] },
      apiCalls, database: { connections: dbConnections },
      priorityRanking, communicationStyle, learningBehavior, decisionAuthority,
      guardrails: { contentFilters: split(contentFilters), blockedTopics: split(blockedTopics), outputValidation: split(outputValidation), maxOutputTokens: 4096, requireCitation },
      errorHandling: { retryCount, retryDelayMs: 1000, timeoutMs, fallbackAgentId: fallbackAgent, circuitBreakerThreshold: 5, circuitBreakerResetMs: 60000 },
      costLimits: { maxTokensPerRequest: maxTokensPerReq, maxRequestsPerMinute: 60, dailyBudgetUsd: dailyBudget, monthlyBudgetUsd: monthlyBudget, alertThresholdPercent: 80 },
      permissions: { canRead: split(canRead), canWrite: split(canWrite), canExecute: split(canExecute), canAccessExternal, requireApproval },
      successMetrics, typicalRuntime, failureModes, escalationPath,
      knownQuirks, maintenanceNeeds, futureEnhancements,
      notes: [],
    };

    onCreate({
      nickname: nickname.trim(),
      formalName: formalName.trim(),
      descriptor: descriptor.trim(),
      layerId, badges,
      position: { x: 200 + Math.random() * 400, y: 200 + Math.random() * 300 },
      config,
    });
  }

  const nicknameError = existingNicknames.includes(nickname.trim()) ? 'This nickname already exists in the swarm' : '';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-accent)',
        borderRadius: 'var(--radius-xl)', width: '95%', maxWidth: 860, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* Progress Header */}
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--border-default)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginBottom: 2 }}>
                Step {step} of 8
              </div>
              <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {STEPS[step - 1].title}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                {STEPS[step - 1].subtitle}
              </div>
            </div>
            <button onClick={onCancel} style={{ width: 32, height: 32, borderRadius: 'var(--radius-full)', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>X</button>
          </div>
          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 3 }}>
            {STEPS.map(s => (
              <div key={s.num} style={{ flex: 1, height: 3, borderRadius: 2, background: s.num <= step ? 'var(--accent-primary)' : 'var(--border-default)', transition: 'background 0.2s' }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: 'var(--space-6)' }}>

          {step === 1 && <>
            <Row>
              <Field label="Nickname *" hint="Short, memorable name">
                <input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. Granite" style={inp} autoFocus />
                {nicknameError && <div style={{ color: 'var(--gem-ruby-400)', fontSize: 'var(--text-xs)', marginTop: 4 }}>{nicknameError}</div>}
              </Field>
              <Field label="Emoji" hint="Visual identity">
                <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="e.g. 🛡️" maxLength={4} style={{ ...inp, textAlign: 'center', fontSize: 24 }} />
              </Field>
            </Row>
            <Field label="Formal Name *" hint="Category-Function-Specificity pattern">
              <input value={formalName} onChange={e => setFormalName(e.target.value)} placeholder="e.g. Content-Moderator-Filter" style={inp} />
            </Field>
            <Field label="Descriptor" hint='Personality in 2-3 words'>
              <input value={descriptor} onChange={e => setDescriptor(e.target.value)} placeholder='e.g. "The Gatekeeper"' style={inp} />
            </Field>
            <Field label="Layer *" hint="Which architectural layer">
              <select value={layerId} onChange={e => setLayerId(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                {layers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </Field>
            <Field label="Badges" hint="Select all that apply">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {ALL_BADGES.map(b => (
                  <button key={b} onClick={() => toggleBadge(b)} style={{
                    fontSize: 'var(--text-xs)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                    border: `1px solid ${badges.includes(b) ? 'var(--accent-primary)' : 'var(--border-default)'}`,
                    background: badges.includes(b) ? 'var(--accent-primary-muted)' : 'transparent',
                    color: badges.includes(b) ? 'var(--accent-primary)' : 'var(--text-tertiary)',
                    fontFamily: 'var(--font-primary)', fontWeight: 500,
                  }}>{b.replace('_', ' ')}</button>
                ))}
              </div>
            </Field>
          </>}

          {step === 2 && <>
            <Field label="Core Task *" hint="The primary thing this agent does">
              <textarea value={coreTask} onChange={e => setCoreTask(e.target.value)} placeholder="Reviews all user-generated content against community guidelines and brand standards before it goes live. Flags problematic content, auto-approves clean content, and queues borderline cases for human review." style={{ ...inp, minHeight: 100 }} autoFocus />
            </Field>
            <Field label="Trigger Conditions" hint="What activates this agent">
              <textarea value={triggerConditions} onChange={e => setTriggerConditions(e.target.value)} placeholder="Activates whenever new content is submitted (posts, comments, uploads, profile updates)" style={{ ...inp, minHeight: 50 }} />
            </Field>
            <Field label="Autonomy Level" hint="How independently does it operate">
              <select value={autonomyLevel} onChange={e => setAutonomyLevel(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value="">Select...</option>
                <option value="Fully Automated">Fully Automated - no human needed</option>
                <option value="Hybrid">Hybrid - auto for obvious cases, human for gray areas</option>
                <option value="Human-in-Loop">Human-in-Loop - suggests, human decides</option>
                <option value="Advisory Only">Advisory Only - provides insights, no action</option>
                <option value="Manual">Manual - human triggers each action</option>
              </select>
            </Field>
            <Divider />
            <SH title="System Prompt" />
            <Field label="Persona" hint="Who is this agent?">
              <textarea value={persona} onChange={e => setPersona(e.target.value)} placeholder="You are a content moderation agent that reviews user-generated content..." style={{ ...inp, minHeight: 60 }} />
            </Field>
            <Field label="Instructions" hint="Step-by-step guidance">
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="When reviewing content, check against the current moderation ruleset. For images, run through the visual content classifier first..." style={{ ...inp, minHeight: 80 }} />
            </Field>
            <Field label="Constraints" hint="What it must NOT do">
              <textarea value={constraints} onChange={e => setConstraints(e.target.value)} placeholder="Never auto-approve content involving minors. Always escalate credible threats immediately..." style={{ ...inp, minHeight: 60 }} />
            </Field>
            <Field label="Output Format" hint="Expected response structure">
              <textarea value={outputFormat} onChange={e => setOutputFormat(e.target.value)} placeholder='{ "decision": "approve|reject|flag", "confidence": 0.92, "reason": "..." }' style={{ ...inp, minHeight: 40, fontFamily: "'SF Mono', monospace", fontSize: 'var(--text-xs)' }} />
            </Field>
          </>}

          {step === 3 && <>
            <Field label="Required Inputs" hint="Comma-separated list of data this agent needs">
              <textarea value={inputs} onChange={e => setInputs(e.target.value)} placeholder="Raw user-generated content (text, images, links), current moderation rule-set, user history/reputation score" style={{ ...inp, minHeight: 60 }} autoFocus />
            </Field>
            <Field label="Input Format" hint="How data is structured coming in">
              <textarea value={inputFormat} onChange={e => setInputFormat(e.target.value)} placeholder="JSON payload with content body, metadata, timestamp, user ID" style={{ ...inp, minHeight: 40 }} />
            </Field>
            <Field label="Primary Output" hint="What this agent produces">
              <textarea value={outputs} onChange={e => setOutputs(e.target.value)} placeholder="Moderation decision (approve/reject/flag) with confidence score and reason code" style={{ ...inp, minHeight: 60 }} />
            </Field>
            <Field label="Output Destination" hint="Where the output goes">
              <textarea value={outputDestination} onChange={e => setOutputDestination(e.target.value)} placeholder="Approved content goes to publish queue, rejected triggers user notification, flagged goes to human moderator dashboard" style={{ ...inp, minHeight: 60 }} />
            </Field>
          </>}

          {step === 4 && <>
            <SH title="LLM Configuration" />
            <Row>
              <Field label="Provider">
                <select value={provider} onChange={e => setProvider(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {['anthropic','openai','google','mistral','meta','local','custom'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Model">
                <input value={model} onChange={e => setModel(e.target.value)} placeholder="claude-sonnet-4-6" style={inp} />
              </Field>
            </Row>
            <Row>
              <Field label="Temperature" hint="0 = deterministic, 2 = creative">
                <input type="number" value={temperature} onChange={e => setTemperature(Number(e.target.value))} min={0} max={2} step={0.1} style={inp} />
              </Field>
              <Field label="Max Tokens" hint="Maximum output length">
                <input type="number" value={maxTokens} onChange={e => setMaxTokens(Number(e.target.value))} step={256} style={inp} />
              </Field>
            </Row>
            <Divider />
            <SH title="Memory" />
            <div style={{ display: 'flex', gap: 'var(--space-6)', marginBottom: 'var(--space-4)' }}>
              <Check label="Short-term memory" checked={shortTerm} onChange={setShortTerm} />
              <Check label="Long-term memory" checked={longTerm} onChange={setLongTerm} />
            </div>
            <Row>
              <Field label="Context Window (tokens)">
                <input type="number" value={contextWindow} onChange={e => setContextWindow(Number(e.target.value))} step={1000} style={inp} />
              </Field>
              <Field label="Memory Backend">
                <select value={memoryBackend} onChange={e => setMemoryBackend(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                  {['in-memory','sqlite','redis','postgres','pinecone','chromadb','qdrant'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
            </Row>
          </>}

          {step === 5 && <>
            <SH title="Skills" />
            <ListBuilder items={skills} onAdd={() => setSkills([...skills, { id: uid(), name: '', description: '', enabled: true }])} onRemove={id => setSkills(skills.filter(s => s.id !== id))}
              renderItem={(s, i) => <input value={s.name} onChange={e => { const n = [...skills]; n[i] = { ...n[i], name: e.target.value }; setSkills(n); }} placeholder="Skill name (e.g. Text Generation)" style={{ ...inp, marginTop: 0 }} />}
            />
            <QuickAdd label="Common Skills" options={['Text Generation','Code Analysis','Data Extraction','Summarization','Classification','Translation','Sentiment Analysis','Image Analysis']}
              onAdd={name => setSkills([...skills, { id: uid(), name, description: '', enabled: true }])} />

            <Divider />
            <SH title="RAG Knowledge Sources" />
            <ListBuilder items={ragSources} onAdd={() => setRagSources([...ragSources, { id: uid(), name: '', type: 'document', uri: '' }])} onRemove={id => setRagSources(ragSources.filter(s => s.id !== id))}
              renderItem={(s, i) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={s.name} onChange={e => { const n = [...ragSources]; n[i] = { ...n[i], name: e.target.value }; setRagSources(n); }} placeholder="Source name" style={{ ...inp, marginTop: 0, flex: 1 }} />
                  <input value={s.uri} onChange={e => { const n = [...ragSources]; n[i] = { ...n[i], uri: e.target.value }; setRagSources(n); }} placeholder="URI / path" style={{ ...inp, marginTop: 0, flex: 2 }} />
                </div>
              )}
            />

            <Divider />
            <SH title="MCP Servers" />
            <ListBuilder items={mcpServers} onAdd={() => setMcpServers([...mcpServers, { id: uid(), name: '', url: '', transport: 'stdio' }])} onRemove={id => setMcpServers(mcpServers.filter(s => s.id !== id))}
              renderItem={(s, i) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={s.name} onChange={e => { const n = [...mcpServers]; n[i] = { ...n[i], name: e.target.value }; setMcpServers(n); }} placeholder="Server name" style={{ ...inp, marginTop: 0, flex: 1 }} />
                  <input value={s.url} onChange={e => { const n = [...mcpServers]; n[i] = { ...n[i], url: e.target.value }; setMcpServers(n); }} placeholder="npx -y @server/name" style={{ ...inp, marginTop: 0, flex: 2 }} />
                </div>
              )}
            />
            <QuickAdd label="Common MCP Servers" options={['filesystem','github','postgres','brave-search','memory','puppeteer']}
              onAdd={name => setMcpServers([...mcpServers, { id: uid(), name, url: `npx -y @modelcontextprotocol/server-${name}`, transport: 'stdio' }])} />

            <Divider />
            <SH title="API Integrations" />
            <ListBuilder items={apiCalls} onAdd={() => setApiCalls([...apiCalls, { id: uid(), name: '', method: 'GET', url: '', authType: 'none' }])} onRemove={id => setApiCalls(apiCalls.filter(a => a.id !== id))}
              renderItem={(a, i) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={a.method} onChange={e => { const n = [...apiCalls]; n[i] = { ...n[i], method: e.target.value }; setApiCalls(n); }} style={{ ...inp, marginTop: 0, width: 80, cursor: 'pointer' }}>
                    {['GET','POST','PUT','DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <input value={a.url} onChange={e => { const n = [...apiCalls]; n[i] = { ...n[i], url: e.target.value }; setApiCalls(n); }} placeholder="https://api.example.com/endpoint" style={{ ...inp, marginTop: 0, flex: 1 }} />
                </div>
              )}
            />

            <Divider />
            <SH title="Database Connections" />
            <ListBuilder items={dbConnections} onAdd={() => setDbConnections([...dbConnections, { id: uid(), name: '', type: 'postgresql', connectionString: '', readOnly: true }])} onRemove={id => setDbConnections(dbConnections.filter(c => c.id !== id))}
              renderItem={(c, i) => (
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={c.type} onChange={e => { const n = [...dbConnections]; n[i] = { ...n[i], type: e.target.value }; setDbConnections(n); }} style={{ ...inp, marginTop: 0, width: 110, cursor: 'pointer' }}>
                    {['postgresql','mysql','sqlite','mongodb','redis'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={c.connectionString} onChange={e => { const n = [...dbConnections]; n[i] = { ...n[i], connectionString: e.target.value }; setDbConnections(n); }} placeholder="Connection string" style={{ ...inp, marginTop: 0, flex: 1 }} />
                </div>
              )}
            />
          </>}

          {step === 6 && <>
            <SH title="Behavior Profile" />
            <Field label="Priority Ranking" hint="How important is this agent relative to others?">
              <textarea value={priorityRanking} onChange={e => setPriorityRanking(e.target.value)} placeholder="High - nothing publishes without passing through this agent, but not critical infrastructure (can queue if overloaded)" style={{ ...inp, minHeight: 50 }} autoFocus />
            </Field>
            <Field label="Communication Style" hint="How does it communicate with other agents and users?">
              <textarea value={communicationStyle} onChange={e => setCommunicationStyle(e.target.value)} placeholder="Terse and rule-based when rejecting content, includes specific violation reason and relevant guideline section" style={{ ...inp, minHeight: 50 }} />
            </Field>
            <Field label="Learning Behavior" hint="Does it improve over time?">
              <textarea value={learningBehavior} onChange={e => setLearningBehavior(e.target.value)} placeholder="Adaptive - improves accuracy based on human moderator corrections, updates internal scoring when guidelines change" style={{ ...inp, minHeight: 50 }} />
            </Field>
            <Field label="Decision Authority" hint="What can it decide on its own?">
              <textarea value={decisionAuthority} onChange={e => setDecisionAuthority(e.target.value)} placeholder="Can auto-approve content with 90%+ confidence, can auto-reject clear violations, must defer gray area decisions" style={{ ...inp, minHeight: 50 }} />
            </Field>

            <Divider />
            <SH title="Guardrails" />
            <Field label="Content Filters" hint="Comma-separated"><input value={contentFilters} onChange={e => setContentFilters(e.target.value)} placeholder="pii-detection, profanity-filter, bias-check" style={inp} /></Field>
            <Field label="Blocked Topics" hint="Comma-separated"><input value={blockedTopics} onChange={e => setBlockedTopics(e.target.value)} placeholder="internal-pricing, competitor-info, legal-advice" style={inp} /></Field>
            <Field label="Output Validation" hint="Comma-separated"><input value={outputValidation} onChange={e => setOutputValidation(e.target.value)} placeholder="json-schema, max-length, no-hallucination" style={inp} /></Field>
            <Check label="Require citations for factual claims" checked={requireCitation} onChange={setRequireCitation} />

            <Divider />
            <SH title="Error Handling" />
            <Row>
              <Field label="Retry Count"><input type="number" value={retryCount} onChange={e => setRetryCount(Number(e.target.value))} min={0} max={10} style={inp} /></Field>
              <Field label="Timeout (ms)"><input type="number" value={timeoutMs} onChange={e => setTimeoutMs(Number(e.target.value))} step={1000} style={inp} /></Field>
              <Field label="Fallback Agent"><input value={fallbackAgent} onChange={e => setFallbackAgent(e.target.value)} placeholder="Nickname" style={inp} /></Field>
            </Row>

            <Divider />
            <SH title="Cost Limits" />
            <Row>
              <Field label="Max Tokens/Request"><input type="number" value={maxTokensPerReq} onChange={e => setMaxTokensPerReq(Number(e.target.value))} step={1000} style={inp} /></Field>
              <Field label="Daily Budget ($)"><input type="number" value={dailyBudget} onChange={e => setDailyBudget(Number(e.target.value))} step={5} style={inp} /></Field>
              <Field label="Monthly Budget ($)"><input type="number" value={monthlyBudget} onChange={e => setMonthlyBudget(Number(e.target.value))} step={50} style={inp} /></Field>
            </Row>

            <Divider />
            <SH title="Permissions" />
            <Field label="Can Read" hint="Comma-separated resources"><input value={canRead} onChange={e => setCanRead(e.target.value)} placeholder="product-catalog, user-profiles" style={inp} /></Field>
            <Field label="Can Write"><input value={canWrite} onChange={e => setCanWrite(e.target.value)} placeholder="audit-log, support-tickets" style={inp} /></Field>
            <Field label="Can Execute"><input value={canExecute} onChange={e => setCanExecute(e.target.value)} placeholder="send-email, create-ticket" style={inp} /></Field>
            <div style={{ display: 'flex', gap: 'var(--space-6)', marginTop: 'var(--space-3)' }}>
              <Check label="Can access external APIs" checked={canAccessExternal} onChange={setCanAccessExternal} />
              <Check label="Require human approval for actions" checked={requireApproval} onChange={setRequireApproval} />
            </div>
          </>}

          {step === 7 && <>
            <SH title="Performance & Reliability" />
            <Field label="Success Metrics" hint="How do you measure if this agent is working?">
              <textarea value={successMetrics} onChange={e => setSuccessMetrics(e.target.value)} placeholder="False positive rate under 5%, false negative rate under 2%, average review time under 500ms" style={{ ...inp, minHeight: 60 }} autoFocus />
            </Field>
            <Field label="Typical Runtime">
              <input value={typicalRuntime} onChange={e => setTypicalRuntime(e.target.value)} placeholder="200-800ms depending on content complexity" style={inp} />
            </Field>
            <Field label="Failure Modes" hint="What can go wrong?">
              <textarea value={failureModes} onChange={e => setFailureModes(e.target.value)} placeholder="API timeout on image processing, ruleset version mismatch, new slang/cultural references it hasn't seen" style={{ ...inp, minHeight: 60 }} />
            </Field>
            <Field label="Escalation Path" hint="What happens when it can't handle something?">
              <textarea value={escalationPath} onChange={e => setEscalationPath(e.target.value)} placeholder="Flags content with confidence below 70% for human review, escalates immediately if content involves potential harm" style={{ ...inp, minHeight: 60 }} />
            </Field>

            <Divider />
            <SH title="Notes" />
            <Field label="Known Quirks">
              <textarea value={knownQuirks} onChange={e => setKnownQuirks(e.target.value)} placeholder="Struggles with regional slang, occasionally over-flags political content during election seasons" style={{ ...inp, minHeight: 60 }} />
            </Field>
            <Field label="Maintenance Needs">
              <textarea value={maintenanceNeeds} onChange={e => setMaintenanceNeeds(e.target.value)} placeholder="Weekly ruleset review, monthly accuracy audit, quarterly retraining" style={{ ...inp, minHeight: 50 }} />
            </Field>
            <Field label="Future Enhancements">
              <textarea value={futureEnhancements} onChange={e => setFutureEnhancements(e.target.value)} placeholder="Community voting integration, improved context awareness for reply chains, multilingual support" style={{ ...inp, minHeight: 50 }} />
            </Field>
          </>}

          {step === 8 && <>
            <SH title="Review Your Agent" />
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <span style={{ fontSize: 36 }}>{emoji || '🤖'}</span>
                <div>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>{nickname || 'Unnamed'}</div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{formalName}</div>
                  {descriptor && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>"{descriptor}"</div>}
                </div>
              </div>

              {badges.length > 0 && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
                {badges.map(b => <span key={b} style={badgeStyle}>{b.replace('_', ' ')}</span>)}
              </div>}

              <ReviewRow label="Layer" value={layers.find(l => l.id === layerId)?.name || ''} />
              <ReviewRow label="Autonomy" value={autonomyLevel} />
              <ReviewRow label="Core Task" value={coreTask} />
              <ReviewRow label="Model" value={`${provider} / ${model}`} />
              {inputs && <ReviewRow label="Inputs" value={inputs} />}
              {outputs && <ReviewRow label="Outputs" value={outputs} />}
              {skills.length > 0 && <ReviewRow label="Skills" value={skills.map(s => s.name).join(', ')} />}
              {ragSources.length > 0 && <ReviewRow label="RAG Sources" value={ragSources.map(s => s.name).join(', ')} />}
              {mcpServers.length > 0 && <ReviewRow label="MCP Servers" value={mcpServers.map(s => s.name).join(', ')} />}
              {apiCalls.length > 0 && <ReviewRow label="API Calls" value={apiCalls.length + ' configured'} />}
              {dbConnections.length > 0 && <ReviewRow label="Databases" value={dbConnections.map(c => c.type).join(', ')} />}
              {successMetrics && <ReviewRow label="Success Metrics" value={successMetrics} />}
            </div>
          </>}
        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <button onClick={step > 1 ? () => setStep((step - 1) as Step) : onCancel} style={btnSecondary}>
            {step > 1 ? 'Back' : 'Cancel'}
          </button>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            {step < 8 && step > 1 && (
              <button onClick={() => setStep(8 as Step)} style={{ ...btnSecondary, color: 'var(--text-tertiary)' }}>Skip to Review</button>
            )}
            {step < 8 ? (
              <button onClick={() => setStep((step + 1) as Step)} disabled={!canProceed()} style={{ ...btnPrimary, opacity: canProceed() ? 1 : 0.4 }}>
                Continue
              </button>
            ) : (
              <button onClick={handleCreate} disabled={!nickname.trim() || !formalName.trim() || !!nicknameError} style={{ ...btnPrimary, opacity: (nickname.trim() && formalName.trim() && !nicknameError) ? 1 : 0.4 }}>
                Create Agent
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper components
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 'var(--space-1)' }}>{label}</label>
      {hint && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>{hint}</div>}
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${React.Children.count(children)}, 1fr)`, gap: 'var(--space-4)' }}>{children}</div>;
}

function SH({ title }: { title: string }) {
  return <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent-primary)', marginTop: 'var(--space-6)', marginBottom: 'var(--space-3)' }}>{title}</div>;
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--border-default)', margin: 'var(--space-6) 0' }} />;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} /> {label}
    </label>
  );
}

function ListBuilder<T extends { id: string }>({ items, onAdd, onRemove, renderItem }: { items: T[]; onAdd: () => void; onRemove: (id: string) => void; renderItem: (item: T, index: number) => React.ReactNode }) {
  return (
    <div>
      {items.map((item, i) => (
        <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <div style={{ flex: 1 }}>{renderItem(item, i)}</div>
          <button onClick={() => onRemove(item.id)} style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--gem-ruby-glow)', color: 'var(--gem-ruby-400)', cursor: 'pointer', fontSize: 11 }}>X</button>
        </div>
      ))}
      <button onClick={onAdd} style={addBtn}>+ Add</button>
    </div>
  );
}

function QuickAdd({ label, options, onAdd }: { label: string; options: string[]; onAdd: (name: string) => void }) {
  return (
    <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--accent-primary-muted)', border: '1px solid var(--border-accent)' }}>
      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: 'var(--space-2)' }}>{label}</div>
      <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
        {options.map(name => (
          <button key={name} onClick={() => onAdd(name)} style={{
            fontSize: 'var(--text-xs)', padding: '3px 8px', borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-default)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-primary)',
          }}>+ {name}</button>
        ))}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
      <div style={{ width: 120, flexShrink: 0, fontWeight: 500, color: 'var(--text-tertiary)' }}>{label}</div>
      <div style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

// Styles
const inp: React.CSSProperties = {
  fontFamily: 'var(--font-primary)', fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)', background: 'var(--bg-elevated)',
  border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)',
  padding: 'var(--space-3) var(--space-4)', width: '100%',
  outline: 'none', boxSizing: 'border-box', resize: 'vertical' as const,
};

const btnPrimary: React.CSSProperties = {
  fontFamily: 'var(--font-primary)', fontSize: 'var(--text-sm)', fontWeight: 600,
  borderRadius: 'var(--radius-md)', cursor: 'pointer', border: 'none',
  background: 'var(--accent-primary)', color: 'var(--bg-base)',
  padding: 'var(--space-3) var(--space-6)',
};

const btnSecondary: React.CSSProperties = {
  fontFamily: 'var(--font-primary)', fontSize: 'var(--text-sm)', fontWeight: 600,
  borderRadius: 'var(--radius-md)', cursor: 'pointer',
  background: 'transparent', color: 'var(--text-primary)',
  border: '1px solid var(--border-default)',
  padding: 'var(--space-3) var(--space-5)',
};

const addBtn: React.CSSProperties = {
  fontFamily: 'var(--font-primary)', fontSize: 'var(--text-xs)', fontWeight: 600,
  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
  border: '1px solid var(--border-accent)', background: 'var(--accent-primary-muted)',
  color: 'var(--accent-primary)', padding: 'var(--space-2) var(--space-3)',
  marginTop: 'var(--space-2)',
};

const badgeStyle: React.CSSProperties = {
  fontSize: 'var(--text-xs)', fontWeight: 500,
  padding: '3px var(--space-2)', borderRadius: 'var(--radius-sm)',
  background: 'var(--accent-primary-muted)', color: 'var(--accent-primary)',
  border: '1px solid var(--border-accent)', fontFamily: 'var(--font-primary)',
};
