import React, { useState } from 'react';
import { Shield, Lock, User, Key, ArrowRight, ShieldAlert } from 'lucide-react';
import { api } from '../api';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
  lang: 'en' | 'hi';
}

const DEMO_ACCOUNTS = [
  {
    username: 'chairman',
    password: 'aicte@2026',
    name: 'Prof. T. G. Sitharam',
    role: 'Chairman / Competent Authority',
    bureau: 'MGMT',
    bureauName: 'Senior Management',
    scope: 'All Bureaus, Escalation Approval, Full Access'
  },
  {
    username: 'arvind.sharma',
    password: 'aicte@2026',
    name: 'Shri Arvind Sharma',
    role: 'Director (Regulation)',
    bureau: 'RB',
    bureauName: 'Regulation Bureau',
    scope: 'Statutory Compliance, Norms, Overlap Coordination'
  },
  {
    username: 'sunita.verma',
    password: 'aicte@2026',
    name: 'Dr. Sunita Verma',
    role: 'Deputy Director (PGRC)',
    bureau: 'PGRC',
    bureauName: 'Public Grievance Redressal Cell',
    scope: 'Faculty & Student Grievances, Capitation Fees'
  },
  {
    username: 'm.sundaram',
    password: 'aicte@2026',
    name: 'Shri M. Sundaram',
    role: 'Regional Officer (Southern)',
    bureau: 'RO',
    bureauName: 'Regional Office (South)',
    scope: 'Restricted to Southern Region Jurisdictional Cases'
  }
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, lang: _lang }) => {
  const [username, setUsername] = useState('chairman');
  const [password, setPassword] = useState('aicte@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setError('');
    setLoading(true);
    try {
      const data = await api.login(acc.username, acc.password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '85vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '920px', 
        width: '100%', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
        gap: '24px' 
      }}>
        {/* Left: Login Form Card */}
        <div className="surface-card" style={{ padding: '32px', boxShadow: 'var(--shadow-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div className="brand-emblem" style={{ width: '42px', height: '42px' }}>
              <Shield size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>AICTE CaseSync</h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                PS 26264 Official Officer Portal
              </p>
            </div>
          </div>

          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
            Sign in with your AICTE Government credentials to access the Integrated Complaint & Overlap Tracking Ledger.
          </p>

          {error && (
            <div style={{ 
              padding: '10px 14px', 
              background: 'rgba(220, 38, 38, 0.1)', 
              border: '1px solid var(--status-red)', 
              borderRadius: 'var(--radius-sm)',
              color: 'var(--status-red)',
              fontSize: '0.82rem',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Officer Username / AICTE ID
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ width: '100%', height: '40px', paddingLeft: '38px', paddingRight: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', fontSize: '0.86rem' }}
                  placeholder="Enter official username"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', height: '40px', paddingLeft: '38px', paddingRight: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)', fontSize: '0.86rem' }}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ width: '100%', height: '42px', justifyContent: 'center', marginTop: '6px' }}
            >
              {loading ? 'Authenticating...' : 'Sign In with JWT Access Token'} <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            Role-Based Access Control (RBAC) strictly enforced per AICTE Vigilance & Grievance Guidelines.
          </div>
        </div>

        {/* Right: Visible Demo Credentials Hint Card (Feature 7) */}
        <div className="surface-card" style={{ padding: '28px', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-medium)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Lock size={18} color="var(--brand-blue)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Demo Personas & Credentials Hint</h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Click <strong>"Quick Sign In"</strong> below to evaluate CaseSync under distinct Bureau roles and test jurisdictional restrictions:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <div 
                key={acc.username}
                style={{ 
                  background: 'var(--bg-surface)', 
                  padding: '12px 14px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '0.86rem' }}>{acc.name}</strong>
                    <span className="brand-tag" style={{ fontSize: '0.68rem' }}>{acc.bureau}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--brand-blue)', fontWeight: 600 }}>
                    {acc.role}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Username: <code style={{ fontFamily: 'var(--font-mono)' }}>{acc.username}</code> &bull; Password: <code style={{ fontFamily: 'var(--font-mono)' }}>{acc.password}</code>
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '2px' }}>
                    Scope: {acc.scope}
                  </div>
                </div>

                <button 
                  className="btn-secondary"
                  onClick={() => handleQuickLogin(acc)}
                  disabled={loading}
                  style={{ fontSize: '0.74rem', padding: '6px 10px', whiteSpace: 'nowrap' }}
                >
                  Quick Sign In
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
