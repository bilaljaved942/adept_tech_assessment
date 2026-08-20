import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import SimulatorModal from './components/SimulatorModal';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your **Autonomous Data Analyst Agent**. Ask me anything about customer churn patterns, group comparisons, revenue impact, or single customer risk scores.'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/overview`)
      .then(res => res.json())
      .then(data => setOverview(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputQuery;
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          chart: data.chart
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Failed to connect to Backend Server. Please ensure `python3 api.py` or Docker container is running.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = (customPrompt) => {
    if (customPrompt) {
      handleSendMessage(customPrompt);
    } else {
      setMessages([
        {
          role: 'assistant',
          content: 'New session started! Ask me any question about customer churn, distributions, or specific customer IDs.'
        }
      ]);
    }
  };

  const quickPills = [
    "Which customers are most likely to churn?",
    "What is the churn risk for customer 7590-VHVEG?",
    "Does churn risk correlate with contract type?",
    "Show me churn rate by internet service",
    "Show me revenue trend for high risk customers"
  ];

  return (
    <div className="app-container">
      <Sidebar 
        onNewChat={handleNewChat}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        overviewData={overview}
      />

      <div className="main-chat-area">
        {/* Compact KPI Metrics Banner */}
        <div className="kpi-banner">
          <div className="kpi-card">
            <div className="kpi-label">Customers</div>
            <div className="kpi-value">{overview ? `${overview.total_customers.toLocaleString()}` : '7,043'}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Churn Rate</div>
            <div className="kpi-value" style={{ color: '#ef4444' }}>
              {overview ? `${overview.churn_percentage}%` : '26.5%'}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Avg Monthly</div>
            <div className="kpi-value">{overview ? `$${overview.avg_monthly_charges}` : '$64.76'}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">ROC-AUC</div>
            <div className="kpi-value" style={{ color: '#10b981' }}>
              {overview ? `${overview.model_roc_auc}` : '0.8455'}
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="messages-container">
          {messages.map((msg, idx) => (
            <ChatMessage key={idx} message={msg} />
          ))}

          {loading && (
            <div className="chat-row">
              <div className="avatar ai">
                <Sparkles size={18} />
              </div>
              <div className="message-content-wrapper">
                <div className="message-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <Sparkles size={16} />
                  <span>Agent is analyzing dataset...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="input-container-wrapper">
          <div className="prompt-pills-row">
            {quickPills.map((pill, i) => (
              <button key={i} className="prompt-pill" onClick={() => handleSendMessage(pill)}>
                {pill}
              </button>
            ))}
          </div>

          <form 
            className="input-box-container"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input 
              type="text"
              className="chat-input"
              placeholder="Ask anything about customer churn, distributions, or customer IDs..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
            />
            <button 
              type="submit" 
              className="send-btn" 
              disabled={!inputQuery.trim() || loading}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      <SimulatorModal 
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}
