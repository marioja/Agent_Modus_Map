// Default emojis based on agent nickname
const NICKNAME_EMOJIS: Record<string, string> = {
  // E-Commerce
  Doorbell: '🔔', Compass: '🧭', Vibe: '💜', Courier: '📨', Echo: '👂',
  Handshake: '🤝', Catalog: '📚', Spark: '✨', Polish: '💎', Lens: '🔍',
  Rosetta: '🌍', Domino: '🎯', Gavel: '⚖️', Knot: '🔗', Relay: '🔌',
  Scribe: '📝', Pulse: '💓', Sentinel: '🛡️', Thermometer: '🌡️',
  Howler: '🚨', Mirror: '🪞', Clockwork: '⚙️', Sherlock: '🕵️', Mosaic: '📊',
  Grease: '🔧',
  // Customer Service
  Portal: '🚪', Triage: '🏥', Router: '🔀', Resolver: '✅', Escalator: '📢',
  Analyst: '📈', Feedback: '💬', Score: '⭐', Mood: '🎭', Coach: '🎓',
  Welcome: '👋', Buddy: '🙋', Follow: '📎',
  // Content Ops
  Writer: '✍️', Editor: '📐', Brand: '🏷️', Translate: '🗣️', Pixel: '🎨',
  Clip: '🎬', Quill: '🖋️', Format: '📄', Broadcast: '📡', Trend: '📈',
  Suggest: '💡', Brief: '📋', Summarize: '📑',
  // DevOps
  Builder: '🏗️', Lint: '🧹', Unit: '🧪', Scanner: '🔬', Pipeline: '🚀',
  Canary: '🐤', Release: '📦', Rollback: '⏪', Patch: '🩹', Provision: '☁️',
  Deps: '📦', Cache: '💾',
  // Data Pipeline
  Collector: '🪣', Schema: '🗂️', Transform: '🔄', Validate: '✅',
  Enrich: '🧬', Enricher: '🧬', Lake: '🌊', Stream: '🌊', Warehouse: '🏢',
  Query: '❓', Batch: '📥', Lineage: '🌳', ML: '🧠',
  // Security SOC
  Watcher: '👁️', NetWatch: '🌐', Alarm: '🚨', Alert: '⚡', Forensic: '🔎',
  Quarantine: '🔒', Responder: '🚒', Compliance: '📜', Comply: '📜',
  Endpoint: '💻', PostMortem: '📋', Witness: '👀',
  // Research
  WebSearch: '🌐', DocSearch: '📂', DocScan: '📂', Cite: '📎', FactCheck: '✅',
  Synthesizer: '🧪', GraphSearch: '🕸️', Verify: '🔍', Insight: '💡',
  Report: '📄', Hypothesis: '🔮',
  // Sales
  Prospect: '🎯', Outreach: '📧', Compete: '⚔️', Proposal: '📝',
  Forecast: '🔮', Win: '🏆', Tracker: '📍', Progress: '📊',
  // HR
  Hire: '👥', Schedule: '📅', Scheduler: '📅', Ladder: '🪜', Legal: '⚖️',
  Board: '📌', Dash: '📊', Dashboard: '📊', HRDash: '📊',
  // General
  Solver: '🧩', Integration: '🔌', Metrics: '📊', Auditor: '🔍',
  Security: '🛡️', Scorer: '⭐', Checklist: '✅', Gate: '🚧',
  Anomaly: '⚠️', Boost: '🚀', Captain: '🧑‍✈️', Atlas: '🗺️',
  Assign: '📋', Scribble: '📝',
  // Lead Gen / Consulting
  Scout: '🔭', Profile: '📇', Signal: '📡', Craft: '✉️', Sequence: '📬',
  Social: '💼', Warm: '☕', Qualify: '🎯', Discover: '❓', Propose: '📑',
  Price: '💰', Funnel: '📊', Compete: '⚔️',
};

export function getAgentEmoji(nickname: string, formalName: string, configEmoji?: string): string {
  if (configEmoji) return configEmoji;
  if (NICKNAME_EMOJIS[nickname]) return NICKNAME_EMOJIS[nickname];
  const lower = (nickname + ' ' + formalName).toLowerCase();
  if (lower.includes('security') || lower.includes('guard')) return '🛡️';
  if (lower.includes('monitor') || lower.includes('health')) return '💓';
  if (lower.includes('data') || lower.includes('analytics')) return '📊';
  if (lower.includes('content') || lower.includes('generator')) return '✨';
  if (lower.includes('workflow') || lower.includes('process')) return '⚙️';
  if (lower.includes('api') || lower.includes('integration')) return '🔌';
  if (lower.includes('alert') || lower.includes('notify')) return '🔔';
  if (lower.includes('search') || lower.includes('find')) return '🔍';
  if (lower.includes('user') || lower.includes('customer')) return '👤';
  if (lower.includes('log') || lower.includes('audit')) return '📝';
  return '🤖';
}
