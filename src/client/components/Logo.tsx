import React from 'react';

interface Props {
  size?: number;
  color?: string;
}

export function Logo({ size = 36 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle - cyan */}
      <circle cx="50" cy="50" r="46" stroke="var(--gem-cyan-400)" strokeWidth="2.5" opacity="0.7" />

      {/* A shape - amethyst */}
      <path d="M50 12 L22 78 L32 78 L50 30 L68 78 L78 78 Z" stroke="var(--gem-amethyst-400)" strokeWidth="2.2" strokeLinejoin="round" fill="none" />

      {/* A crossbar - sapphire */}
      <line x1="33" y1="60" x2="67" y2="60" stroke="var(--gem-sapphire-400)" strokeWidth="2" />

      {/* M shape - cyan */}
      <path d="M18 80 L34 28 L50 58 L66 28 L82 80" stroke="var(--gem-cyan-400)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" fill="none" />

      {/* Central diamond - emerald */}
      <path d="M50 42 L44 52 L50 62 L56 52 Z" stroke="var(--gem-emerald-400)" strokeWidth="1.5" fill="var(--gem-emerald-400)" fillOpacity="0.2" />
    </svg>
  );
}

export function LogoWithText({ size = 36 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <Logo size={size} />
      <div style={{
        fontSize: size > 30 ? 'var(--text-3xl)' : 'var(--text-xl)',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        <span style={{ color: 'var(--gem-cyan-400)' }}>Agent</span>
        <span style={{ color: 'var(--gem-amethyst-400)' }}>Modus</span>
      </div>
    </div>
  );
}
