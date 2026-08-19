import React from 'react';
import { Sun, Moon, Sparkles, KeyRound } from 'lucide-react';

export default function Header({ theme, toggleTheme, onOpenApiKeyModal, apiKey }) {
  return (
    <div className="chat-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="model-badge">
          <Sparkles size={16} color="#6366f1" />
          <span>Autonomous Analyst v3.3</span>
          <span style={{ fontSize: '0.7rem', background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '2px 6px', borderRadius: 4 }}>
            Active
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button 
          onClick={onOpenApiKeyModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-main)',
            color: 'var(--text-secondary)',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          <KeyRound size={15} />
          {apiKey ? 'API Key Configured' : 'Configure API Key'}
        </button>

        <button 
          onClick={toggleTheme}
          style={{
            padding: '8px',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            background: 'var(--bg-main)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  );
}
