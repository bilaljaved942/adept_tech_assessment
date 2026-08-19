import React, { useState } from 'react';
import { Bot, User, Copy, Check } from 'lucide-react';

export default function ChatMessage({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple Markdown parser for bold, headers, and tables
  const renderFormattedContent = (text) => {
    if (!text) return '';

    // Split text into lines
    const lines = text.split('\n');
    const elements = [];
    let tableRows = [];
    let inTable = false;

    lines.forEach((line, idx) => {
      // Table row detection
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        // Ignore markdown divider | :--- | :--- |
        if (!line.includes('---')) {
          const cells = line.split('|').filter(c => c !== '').map(c => c.trim());
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        inTable = false;
        if (tableRows.length > 0) {
          const header = tableRows[0];
          const body = tableRows.slice(1);
          elements.push(
            <div key={`table-${idx}`} style={{ overflowX: 'auto', margin: '10px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)' }}>
                    {header.map((h, i) => (
                      <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h.replace(/\*\*/g, '')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} style={{ padding: '8px 12px' }}>{cell.replace(/\*\*/g, '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
          tableRows = [];
        }
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(<h3 key={idx} style={{ fontSize: '1.1rem', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>{line.replace('### ', '')}</h3>);
      } else if (line.startsWith('#### ')) {
        elements.push(<h4 key={idx} style={{ fontSize: '0.95rem', fontWeight: 600, margin: '6px 0', color: 'var(--text-primary)' }}>{line.replace('#### ', '')}</h4>);
      } else if (line.startsWith('* ') || line.startsWith('- ')) {
        // Bullet item
        const rawItem = line.substring(2);
        elements.push(
          <div key={idx} style={{ display: 'flex', gap: 6, margin: '3px 0', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(rawItem) }} />
          </div>
        );
      } else if (line.trim() !== '') {
        elements.push(
          <p key={idx} style={{ margin: '4px 0', fontSize: '0.92rem' }} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
        );
      }
    });

    // Flush any remaining table
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const body = tableRows.slice(1);
      elements.push(
        <div key="table-end" style={{ overflowX: 'auto', margin: '10px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-input)', borderBottom: '2px solid var(--border-color)' }}>
                {header.map((h, i) => (
                  <th key={i} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h.replace(/\*\*/g, '')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '8px 12px' }}>{cell.replace(/\*\*/g, '')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  const formatInlineMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg-input);padding:2px 5px;border-radius:4px;font-family:monospace;font-size:0.85em;">$1</code>');
  };

  return (
    <div className="chat-row">
      <div className={`avatar ${isUser ? 'user' : 'ai'}`}>
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      <div className="message-content-wrapper">
        <div className="sender-name">
          {isUser ? 'You' : 'Autonomous Data Analyst'}
        </div>

        <div className={`message-bubble ${isUser ? 'user' : 'ai'}`}>
          {isUser ? (
            <div style={{ fontSize: '0.95rem' }}>{message.content}</div>
          ) : (
            <div>{renderFormattedContent(message.content)}</div>
          )}

          {/* Visual Chart rendered directly in message */}
          {message.chart && (
            <div className="chart-container">
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 12, color: 'var(--text-primary)' }}>
                📊 {message.chart.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, height: 160, padding: '10px 0' }}>
                {message.chart.group_by === 'Contract' && (
                  <>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#ef4444', width: '100%', height: '85%', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>Month-to-month (42.7%)</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#94a3b8', width: '100%', height: '23%', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>One year (11.3%)</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#10b981', width: '100%', height: '6%', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>Two year (2.8%)</span>
                    </div>
                  </>
                )}
                {message.chart.group_by === 'InternetService' && (
                  <>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#ef4444', width: '100%', height: '84%', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>Fiber optic (41.9%)</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#3b82f6', width: '100%', height: '38%', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>DSL (19.0%)</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#10b981', width: '100%', height: '15%', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>No Internet (7.4%)</span>
                    </div>
                  </>
                )}
                {message.chart.group_by === 'Churn' && (
                  <>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#ef4444', width: '100%', height: '74%', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>Churned ($74.44/mo)</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ background: '#10b981', width: '100%', height: '61%', borderRadius: '6px 6px 0 0' }}></div>
                      <span style={{ fontSize: '0.75rem', marginTop: 6, fontWeight: 500 }}>Retained ($61.27/mo)</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copy action */}
        {!isUser && (
          <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
            <button 
              onClick={handleCopy}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
