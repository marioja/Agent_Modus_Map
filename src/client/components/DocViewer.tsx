import React, { useState, useEffect } from 'react';
import { generateSwarmDocs } from '../api.js';

interface Props {
  swarmId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocViewer({ swarmId, isOpen, onClose }: Props) {
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    generateSwarmDocs(swarmId)
      .then(doc => setMarkdown(doc.markdown))
      .catch(() => setMarkdown('Failed to generate documentation.'))
      .finally(() => setLoading(false));
  }, [swarmId, isOpen]);

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'swarm-documentation.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdown).catch(() => {});
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#140e18', border: '1px solid #312639', borderRadius: 12,
        width: '90%', maxWidth: 800, maxHeight: '85vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #312639', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: '#e2e8f0', fontSize: 18 }}>Generated Documentation</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCopy} style={{
              padding: '6px 12px', borderRadius: 6, border: '1px solid #312639',
              background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: 12,
            }}>Copy</button>
            <button onClick={handleDownload} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none',
              background: '#d4722a', color: '#140e18', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>Download .md</button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>X</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {loading ? (
            <p style={{ color: '#76677e' }}>Generating documentation...</p>
          ) : (
            <pre style={{
              color: '#cbd5e1', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap',
              fontFamily: '"SF Mono", "Fira Code", monospace',
            }}>{markdown}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
