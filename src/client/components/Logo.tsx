import React from 'react';

interface Props {
  size?: number;
  color?: string;
}

export function Logo({ size = 36 }: Props) {
  // Theme-adaptive colors: 500s for dark (AAA on dark bg), 700s for light (AA+ on light bg)
  const cyan = 'var(--logo-cyan)';
  const amethyst = 'var(--logo-amethyst)';
  const sapphire = 'var(--logo-sapphire)';
  const emerald = 'var(--logo-emerald)';

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" stroke={cyan} strokeWidth="2.5" opacity="0.9" />
      <path d="M50 12 L22 78 L32 78 L50 30 L68 78 L78 78 Z" stroke={amethyst} strokeWidth="2.5" strokeLinejoin="round" fill="none" />
      <line x1="33" y1="60" x2="67" y2="60" stroke={sapphire} strokeWidth="2.2" />
      <path d="M18 80 L34 28 L50 58 L66 28 L82 80" stroke={cyan} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" fill="none" />
      <path d="M50 42 L44 52 L50 62 L56 52 Z" stroke={emerald} strokeWidth="1.8" fill={emerald} fillOpacity="0.3" />
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
        <span style={{ color: 'var(--logo-cyan)' }}>Agent</span>
        <span style={{ color: 'var(--logo-amethyst)' }}>Modus</span>
      </div>
    </div>
  );
}
