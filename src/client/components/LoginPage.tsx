import React, { useEffect, useRef, useState } from 'react';
import { activateGoogleApi, getAuthConfig, loginApi, type AuthState } from '../api.js';
import { LogoWithText } from './Logo';

interface LoginPageProps {
  onLogin: (auth: AuthState) => void;
  onSkip: () => void;
}

type View = 'signin' | 'signup' | 'forgot';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

export function LoginPage({ onLogin, onSkip }: LoginPageProps) {
  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAuthConfig()
      .then((config) => {
        if (cancelled) return;
        setGoogleEnabled(config.googleEnabled);
        setGoogleClientId(config.googleClientId);
      })
      .catch(() => {
        if (!cancelled) {
          setGoogleEnabled(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!googleEnabled || !googleClientId || !googleButtonRef.current) {
      return;
    }

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) {
        return;
      }

      const buttonWidth = Math.max(220, Math.round(googleButtonRef.current.getBoundingClientRect().width || 0));
      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) {
            setError('Google sign-in did not return a credential.');
            return;
          }

          setLoading(true);
          setError('');
          try {
            const auth = await activateGoogleApi(credential);
            onLogin(auth);
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Google sign-in failed.');
          } finally {
            setLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: buttonWidth,
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', renderGoogleButton, { once: true });
      renderGoogleButton();
      return () => {
        cancelled = true;
        existing.removeEventListener('load', renderGoogleButton);
      };
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', renderGoogleButton, { once: true });
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener('load', renderGoogleButton);
    };
  }, [googleClientId, googleEnabled, onLogin]);

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    background: 'var(--bg-base)',
    border: '1px solid var(--border-default)',
    borderRadius: 8,
    color: 'var(--text-primary)',
    fontSize: 14,
    fontFamily: 'var(--font-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    marginBottom: 6,
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: 16,
  };

  const primaryButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    background: 'var(--accent-primary)',
    color: '#0f172a',
    border: 'none',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-primary)',
    cursor: loading ? 'wait' : 'pointer',
    opacity: loading ? 0.7 : 1,
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    background: active ? 'var(--bg-elevated)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
    border: 'none',
    borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'var(--font-primary)',
    cursor: 'pointer',
  });

  const handleLocalSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const auth = await loginApi(email.trim(), password);
      onLogin(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  const renderDivider = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>or</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-default)' }} />
    </div>
  );

  const renderGooglePanel = () => (
    <div>
      <div
        ref={googleButtonRef}
        style={{ display: googleEnabled ? 'block' : 'none', minHeight: googleEnabled ? 44 : 0, width: '100%' }}
      />
      {!googleEnabled && (
        <div style={{
          padding: '12px 14px',
          borderRadius: 8,
          background: 'rgba(251, 191, 36, 0.12)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          color: 'var(--text-secondary)',
          fontSize: 13,
          lineHeight: 1.5,
        }}>
          Google sign-in is not configured. Set <code>GOOGLE_CLIENT_ID</code> to enable OAuth activation.
        </div>
      )}
    </div>
  );

  const renderSignIn = () => (
    <div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          placeholder="admin@agentmodus.local"
          style={inputStyle}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          style={inputStyle}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && email.trim() && password) {
              void handleLocalSignIn();
            }
          }}
        />
      </div>
      <div style={{ textAlign: 'right', marginBottom: 20 }}>
        <button
          onClick={() => setView('forgot')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-primary)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--font-primary)',
          }}
        >
          Need help signing in?
        </button>
      </div>
      <button
        style={primaryButtonStyle}
        onClick={() => void handleLocalSignIn()}
        disabled={!email.trim() || !password || loading}
      >
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      {renderDivider()}
      {renderGooglePanel()}
    </div>
  );

  const renderSignUp = () => (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
        New accounts are activated through Google on this device. Once verified, the local backend creates your
        signed license and caches your entitlements for offline use.
      </p>
      {renderGooglePanel()}
      <div style={{ marginTop: 20, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        If you need a local admin account instead, ask your workspace owner to create one from the backend.
      </div>
    </div>
  );

  const renderForgotPassword = () => (
    <div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
        Local password reset is managed by the backend administrator. Google sign-in does not require a separate
        password on this device.
      </p>
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button
          onClick={() => setView('signin')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-primary)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'var(--font-primary)',
          }}
        >
          Back to sign in
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-base)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-primary)',
      zIndex: 1200,
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 16,
          padding: '36px 32px 28px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
            <LogoWithText size={44} />
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: 13,
              marginTop: 10,
              marginBottom: 0,
              textAlign: 'center',
            }}>
              Sign in locally, or activate your signed license with Google.
            </p>
          </div>

          {view !== 'forgot' ? (
            <>
              <div style={{
                display: 'flex',
                borderBottom: '1px solid var(--border-default)',
                marginBottom: 24,
                marginTop: 20,
              }}>
                <button style={tabStyle(view === 'signin')} onClick={() => setView('signin')}>Sign In</button>
                <button style={tabStyle(view === 'signup')} onClick={() => setView('signup')}>Activate</button>
              </div>
              {error && (
                <div style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}>
                  {error}
                </div>
              )}
              {view === 'signin' ? renderSignIn() : renderSignUp()}
            </>
          ) : (
            <>
              <h3 style={{
                color: 'var(--text-primary)',
                fontSize: 18,
                fontWeight: 600,
                textAlign: 'center',
                margin: '20px 0 8px',
              }}>
                Account Recovery
              </h3>
              {renderForgotPassword()}
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'var(--font-primary)',
              textDecoration: 'underline',
              textUnderlineOffset: 3,
            }}
          >
            Continue without account
          </button>
        </div>
      </div>
    </div>
  );
}
