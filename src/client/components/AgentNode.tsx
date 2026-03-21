import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Badge } from '../../shared/types/index.js';

export interface AgentNodeData {
  nickname: string;
  formalName: string;
  descriptor: string;
  badges: Badge[];
  layerColor: string;
  isSelected: boolean;
  isInBlastRadius: boolean;
  blastRadiusHops: number | null;
  emoji?: string;
  healthStatus?: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
}

const badgeColors: Record<string, { bg: string; border: string }> = {
  HUB: { bg: 'rgba(251, 191, 36, 0.25)', border: '#e09050' },
  CRITICAL: { bg: 'rgba(239, 68, 68, 0.25)', border: '#8A2E3B' },
  ENTRY: { bg: 'rgba(34, 197, 94, 0.25)', border: '#5fa878' },
  HUMAN: { bg: 'rgba(168, 85, 247, 0.25)', border: '#b07cc4' },
  AUTO: { bg: 'rgba(212, 114, 42, 0.2)', border: '#d4722a' },
  APPROVAL: { bg: 'rgba(168, 85, 247, 0.2)', border: '#b07cc4' },
  ALWAYS_ON: { bg: 'rgba(212, 114, 42, 0.2)', border: '#d4722a' },
  ADVISORY: { bg: 'rgba(139, 157, 195, 0.2)', border: '#b5adb9' },
  CAN_OVERRIDE: { bg: 'rgba(239, 68, 68, 0.2)', border: '#8A2E3B' },
  HIGH_PRIORITY: { bg: 'rgba(251, 146, 60, 0.2)', border: '#d4722a' },
  MEDIUM: { bg: 'rgba(139, 157, 195, 0.15)', border: '#b5adb9' },
  LOGS_ALL: { bg: 'rgba(251, 191, 36, 0.2)', border: '#e09050' },
};

function getBadgeStyle(badge: Badge) {
  return badgeColors[badge] || { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.3)' };
}

function AgentNodeComponent({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData;
  const isHighlighted = d.isSelected || d.isInBlastRadius;

  return (
    <div style={{
      width: 220,
      background: 'linear-gradient(145deg, #271d2e 0%, #1e1524 100%)',
      borderRadius: 16,
      padding: '16px 14px',
      border: `3px solid ${d.isSelected ? '#ffffff' : d.isInBlastRadius ? '#8A2E3B' : d.layerColor}`,
      boxShadow: isHighlighted
        ? `0 0 ${d.isSelected ? 30 : 20}px ${d.isSelected ? d.layerColor : 'rgba(239, 68, 68, 0.6)'}`
        : '0 4px 20px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      opacity: d.isInBlastRadius || d.isSelected || (!d.isSelected && !d.isInBlastRadius) ? 1 : 0.4,
      position: 'relative',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: d.layerColor, width: 8, height: 8, border: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: d.layerColor, width: 8, height: 8, border: 'none' }} />
      <Handle type="target" position={Position.Left} id="left-target" style={{ background: d.layerColor, width: 8, height: 8, border: 'none' }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ background: d.layerColor, width: 8, height: 8, border: 'none' }} />

      {d.blastRadiusHops !== null && (
        <div style={{
          position: 'absolute',
          top: -10,
          right: -10,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: '#8A2E3B',
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #1e1524',
        }}>
          {d.blastRadiusHops}
        </div>
      )}

      <style>{`@keyframes healthPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>

      {/* Health indicator */}
      {d.healthStatus && d.healthStatus !== 'unknown' && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 12, height: 12, borderRadius: '50%',
          background: d.healthStatus === 'healthy' ? '#5fa878' : d.healthStatus === 'degraded' ? '#e09050' : '#8A2E3B',
          boxShadow: `0 0 8px ${d.healthStatus === 'healthy' ? '#5fa878' : d.healthStatus === 'degraded' ? '#e09050' : '#8A2E3B'}`,
          animation: d.healthStatus !== 'healthy' ? 'healthPulse 2s ease-in-out infinite' : 'none',
        }} />
      )}

      {d.emoji && (
        <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 4 }}>{d.emoji}</div>
      )}

      <div style={{
        fontSize: 20,
        fontWeight: 700,
        textAlign: 'center',
        color: '#fff',
        marginBottom: 4,
      }}>
        {d.nickname}
      </div>

      <div style={{
        fontSize: 11,
        textAlign: 'center',
        color: '#b5adb9',
        marginBottom: 6,
        lineHeight: 1.3,
      }}>
        {d.formalName}
      </div>

      <div style={{
        fontSize: 12,
        textAlign: 'center',
        color: '#968a9c',
        fontStyle: 'italic',
        marginBottom: 10,
      }}>
        "{d.descriptor}"
      </div>

      <div style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {d.badges.map((badge) => {
          const style = getBadgeStyle(badge);
          return (
            <span key={badge} style={{
              fontSize: 9,
              padding: '2px 7px',
              borderRadius: 10,
              background: style.bg,
              color: '#fff',
              border: `1px solid ${style.border}`,
              whiteSpace: 'nowrap',
            }}>
              {badge.replace('_', ' ')}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export const AgentNode = memo(AgentNodeComponent);
