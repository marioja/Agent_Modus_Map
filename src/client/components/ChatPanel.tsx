import React, { useState, useRef, useEffect } from 'react';
import { askCopilot } from '../api.js';
import { Logo } from './Logo.js';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  swarmId: string;
  isOpen: boolean;
  onToggle: () => void;
  onHighlightAgents?: (nicknames: string[]) => void;
}

export function ChatPanel({ swarmId, isOpen, onToggle, onHighlightAgents }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'Hey, I\'m the Agent Modus copilot. I can help you with anything:\n\n- "Help me set up a lead gen swarm"\n- "How do I add my API keys?"\n- "What does each agent do?"\n- "Why isn\'t my deploy returning good results?"\n- "Help me write a better search query"',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      // Build conversation history for the copilot (exclude the welcome message)
      const history = [...messages.slice(1), { role: 'user' as const, content: question }]
        .map(m => ({ role: m.role, content: m.content }));

      const response = await askCopilot(history, swarmId);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I need a Claude API key to work. Go to Settings and add your Anthropic API key.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '2px solid var(--accent-primary)',
          cursor: 'pointer',
          boxShadow: '0 4px 20px var(--border-accent)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
        title="Ask about your swarm"
      >
        <Logo size={36} />
      </button>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 420,
      height: 500,
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-accent)',
      borderRadius: 16,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 30,
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-accent)' }}>Copilot</span>
        <button onClick={onToggle} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 18,
        }}>{'\u00D7'}</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '90%',
              padding: '10px 14px',
              borderRadius: 12,
              background: msg.role === 'user' ? 'var(--accent-primary-muted)' : 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${msg.role === 'user' ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
            }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {msg.content}
              </div>

            </div>
          </div>
        ))}
        {loading && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>Thinking...</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: 8,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask about your swarm..."
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid var(--accent-primary-muted)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            fontSize: 13,
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
            fontSize: 13,
          }}
        >
          Ask
        </button>
      </div>
    </div>
  );
}
