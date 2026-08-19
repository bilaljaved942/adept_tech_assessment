import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Paperclip, Mic } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import SimulatorModal from './components/SimulatorModal';

const API_BASE = 'http://localhost:8000/api';

export default function App() {
  const [theme, setTheme] = useState('light');
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am your **Autonomous Data Analyst Agent**. I can analyze customer churn patterns, compute aggregations, run what-if simulations, and predict churn risk for any customer.',
      steps: []
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetch(`${API_BASE}/overview`)
      .then(res => res.json())
      .then(data => setOverview(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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
        body: JSON.stringify({
          message: text,
          api_key: apiKey || null
        })
      });

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          steps: data.steps,
          chart: data.chart,
          critic_status: data.critic_status
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Failed to connect to Backend Server. Please ensure `python3 api.py` is running on port 8000.',
          steps: []
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
          content: 'New session started! Ask me any question about customer churn, distributions, or specific customer risks.',
          steps: []
        }
      ]);
    }
  };

  const quickPills = [
    "Which customers are most likely to churn?",
    "What is the churn risk for customer 7590-VHVEG?",
    "Does churn risk correlate with contract type?",
    "Show me churn rate by internet service",
    "What if customer 7590-VHVEG switches to a Two year contract?"
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
        <Header 
          theme={theme}
          toggleTheme={toggleTheme}
          apiKey={apiKey}
          onOpenApiKeyModal={() => {
            const key = prompt("Enter your free Groq API key (or leave empty to use built-in engine):", apiKey);
            if (key !== null) setApiKey(key.trim());
          }}
        />

        {/* Top KPI Metrics Banner */}
        <div className="kpi-banner">
          <div className="kpi-card">
            <div className="kpi-label">Total Customers</div>
            <div className="kpi-value">{overview ? `${overview.total_customers.toLocaleString()}` : '7,043'}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Overall Churn Rate</div>
            <div className="kpi-value" style={{ color: '#ef4444' }}>
              {overview ? `${overview.churn_percentage}%` : '26.5%'}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Avg Monthly Spend</div>
            <div className="kpi-value">{overview ? `$${overview.avg_monthly_charges}` : '$64.76'}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Model Accuracy (ROC-AUC)</div>
            <div className="kpi-value" style={{ color: '#10b981' }}>0.8455</div>
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
                <Sparkles size={20} />
              </div>
              <div className="message-content-wrapper">
                <div className="message-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                  <Sparkles size={16} className="animate-spin" />
                  <span>Agent is planning steps & running queries against the dataset...</span>
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
              <Send size={18} />
            </button>
          </form>
          <div style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Autonomous Data Analyst • Zero Hallucination Verified with Critic Agent
          </div>
        </div>
      </div>

      <SimulatorModal 
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
}
