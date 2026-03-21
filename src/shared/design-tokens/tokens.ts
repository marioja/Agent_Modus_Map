// Design system tokens from ADR-002
// Warm Plum + Toasted Pumpkin + Sage + Oxblood palette

export const colors = {
  bg: {
    primary: '#140e18',
    secondary: '#1e1524',
    card: 'linear-gradient(145deg, #271d2e, #1e1524)',
    cardSolid: '#271d2e',
  },
  text: {
    primary: '#eeebed',
    secondary: '#b5adb9',
    muted: '#968a9c',
  },
  layers: {
    customer: '#5fa878',
    product: '#b07cc4',
    order: '#5fa878',
    operations: '#d4722a',
    intelligence: '#e09050',
  },
  relationships: {
    dependsOn: { color: '#5fa878', style: 'solid', width: 3 },
    feedsInto: { color: '#7a3d8f', style: 'dashed', width: 3 },
    collaboratesWith: { color: '#d4722a', style: 'dotted', width: 2 },
    canOverride: { color: '#8A2E3B', style: 'solid', width: 4 },
  },
  badges: {
    hub: { bg: 'rgba(212, 114, 42, 0.2)', border: '#d4722a' },
    critical: { bg: 'rgba(138, 46, 59, 0.2)', border: '#8A2E3B' },
    entry: { bg: 'rgba(95, 168, 120, 0.2)', border: '#5fa878' },
    human: { bg: 'rgba(176, 124, 196, 0.2)', border: '#b07cc4' },
    auto: { bg: 'rgba(95, 168, 120, 0.2)', border: '#5fa878' },
  },
  health: {
    healthy: '#5fa878',
    degraded: '#d4722a',
    unhealthy: '#8A2E3B',
    unknown: '#76677e',
  },
} as const;

export const typography = {
  fontFamily: "'Outfit', system-ui, sans-serif",
  sizes: {
    xs: '10px',
    sm: '13px',
    base: '14px',
    md: '18px',
    lg: '24px',
    xl: '32px',
  },
} as const;
