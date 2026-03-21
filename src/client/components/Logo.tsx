import React from 'react';
import logoSrc from '../assets/logo.png';

interface Props {
  size?: number;
}

export function Logo({ size = 36 }: Props) {
  return (
    <img
      src={logoSrc}
      alt="Agent Modus"
      width={size}
      height={size}
      style={{ objectFit: 'contain', borderRadius: '50%' }}
    />
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
