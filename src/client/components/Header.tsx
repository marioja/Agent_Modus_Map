import React from 'react';

interface HeaderProps {
  swarmName: string;
  agentCount: number;
  relationshipCount: number;
  showBlastRadius: boolean;
  onToggleBlastRadius: () => void;
  onOpenTemplates: () => void;
  onExport: () => void;
  onImport: () => void;
  onOpenHealth: () => void;
  onOpenTraces: () => void;
  onOpenGovernance: () => void;
  onOpenOptimization: () => void;
  onOpenCollaboration: () => void;
  onOpenDocs: () => void;
  onExportHTML: () => void;
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 8,
  border: '1px solid rgba(212, 114, 42, 0.3)',
  background: 'rgba(212, 114, 42, 0.08)',
  color: '#d4722a',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  transition: 'all 0.2s',
};

export function Header({
  swarmName, agentCount, relationshipCount,
  showBlastRadius, onToggleBlastRadius,
  onOpenTemplates, onExport, onImport,
  onOpenHealth, onOpenTraces, onOpenGovernance,
  onOpenOptimization, onOpenCollaboration, onOpenDocs, onExportHTML,
  healthStatus,
}: HeaderProps) {
  const healthColors: Record<string, string> = {
    healthy: '#5fa878', degraded: '#e09050', unhealthy: '#8A2E3B', unknown: '#76677e',
  };
  const hColor = healthColors[healthStatus || 'unknown'];
  return (
    <div style={{
      padding: '10px 24px',
      background: 'rgba(10, 14, 39, 0.95)',
      borderBottom: '1px solid rgba(212, 114, 42, 0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{
          fontSize: 20,
          color: '#d4722a',
          letterSpacing: 2,
          textTransform: 'uppercase',
          textShadow: '0 0 15px rgba(212, 114, 42, 0.4)',
          margin: 0,
        }}>
          Agent Modus Map
        </h1>
        <span style={{ color: '#b5adb9', fontSize: 13 }}>
          {swarmName}
        </span>
        <span style={{ color: '#76677e', fontSize: 12 }}>
          {agentCount} agents, {relationshipCount} rel
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={onOpenHealth} style={{
          ...btnStyle,
          border: `1px solid ${hColor}`,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: hColor, boxShadow: `0 0 6px ${hColor}` }} />
          Health
        </button>
        <button onClick={onOpenTraces} style={btnStyle}>Traces</button>
        <button onClick={onOpenGovernance} style={btnStyle}>Governance</button>
        <button onClick={onOpenOptimization} style={btnStyle}>Optimize</button>
        <button onClick={onOpenCollaboration} style={btnStyle}>Collab</button>
        <button onClick={onOpenDocs} style={btnStyle}>Docs</button>
        <button onClick={onOpenTemplates} style={{ ...btnStyle, background: 'rgba(212,114,42,0.15)', fontWeight: 700 }}>+ New / Templates</button>
        <button onClick={onImport} style={btnStyle}>Import</button>
        <button onClick={onExport} style={btnStyle}>Export JSON</button>
        <button onClick={onExportHTML} style={btnStyle}>Export HTML</button>
        <button
          onClick={onToggleBlastRadius}
          style={{
            ...btnStyle,
            border: `2px solid ${showBlastRadius ? '#8A2E3B' : '#d4722a'}`,
            background: showBlastRadius ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212, 114, 42, 0.08)',
            color: showBlastRadius ? '#8A2E3B' : '#d4722a',
          }}
        >
          {showBlastRadius ? 'Blast: ON' : 'Blast Radius'}
        </button>
      </div>
    </div>
  );
}
