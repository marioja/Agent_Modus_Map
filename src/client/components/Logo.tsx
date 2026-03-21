import React from 'react';
import logoDarkSrc from '../assets/logo-dark.png';
import logoLightSrc from '../assets/logo-light.png';

interface Props {
  size?: number;
}

function useIsDark() {
  const [dark, setDark] = React.useState(() => document.documentElement.getAttribute('data-theme') !== 'light');
  React.useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.getAttribute('data-theme') !== 'light');
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

function LogoImage({ src, size }: { src: string; size: number }) {
  return (
    <div style={{
      width: size,
      height: size,
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
    }}>
      <img
        src={src}
        alt="Agent Modus"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          height: size * 2.2,
          width: 'auto',
        }}
      />
    </div>
  );
}

export function Logo({ size = 56 }: Props) {
  const isDark = useIsDark();
  return <LogoImage src={isDark ? logoDarkSrc : logoLightSrc} size={size} />;
}

export function LogoWithText({ size = 56 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <Logo size={size} />
      <div style={{
        fontSize: size > 40 ? 42 : 'var(--text-xl)',
        fontWeight: 800,
        letterSpacing: '-0.03em',
        lineHeight: 1,
      }}>
        <span style={{ color: 'var(--logo-sage)' }}>Agent</span>
        <span style={{ color: 'var(--logo-plum)' }}>Modus</span>
      </div>
    </div>
  );
}
