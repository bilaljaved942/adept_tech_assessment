import React from 'react';
import { 
  Bot, 
  MessageSquarePlus, 
  Sparkles, 
  BarChart3, 
  Users, 
  Settings, 
  HelpCircle,
  Database
} from 'lucide-react';

export default function Sidebar({ 
  onNewChat, 
  onOpenSimulator, 
  activeTab, 
  setActiveTab,
  overviewData 
}) {
  return (
    <>
      {/* Left Mini Navigation */}
      <div className="mini-navbar">
        <button 
          className={`nav-icon-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
          title="Chat Analyst"
        >
          <Bot size={22} />
        </button>
        <button 
          className={`nav-icon-btn ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={onOpenSimulator}
          title="Churn Simulator"
        >
          <Sparkles size={22} />
        </button>
        <button 
          className="nav-icon-btn" 
          onClick={() => alert(`Dataset Stats: ${overviewData?.total_customers || 7043} Total Customers | Churn Rate: ${overviewData?.churn_percentage || 26.54}%`)}
          title="Dataset Overview"
        >
          <Database size={22} />
        </button>
        
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="nav-icon-btn" title="Settings">
            <Settings size={20} />
          </button>
          <div className="avatar user" style={{ width: 34, height: 34, fontSize: '0.75rem' }}>
            AI
          </div>
        </div>
      </div>

      {/* Expandable History Drawer */}
      <div className="sidebar-drawer">
        <div className="brand-header">
          <div className="brand-title">
            <Bot size={22} />
            <span>Analyst Agent</span>
          </div>
          <button className="new-chat-btn" onClick={onNewChat} title="New Conversation">
            <MessageSquarePlus size={18} />
          </button>
        </div>

        <div className="sidebar-section-title">Quick Actions</div>
        <div className="history-item" onClick={onOpenSimulator} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} /> Single Customer Simulator
        </div>

        <div className="sidebar-section-title">Recent Topics</div>
        <div className="history-item" onClick={() => onNewChat("Which customers are most likely to churn?")}>
          High-Risk Customer Segment
        </div>
        <div className="history-item" onClick={() => onNewChat("Does churn risk correlate with contract type?")}>
          Contract Type Correlation
        </div>
        <div className="history-item" onClick={() => onNewChat("Show me revenue trend for high-risk customers")}>
          Revenue & Billing Analysis
        </div>
        <div className="history-item" onClick={() => onNewChat("What is the churn risk for customer 7590-VHVEG?")}>
          Customer 7590-VHVEG Risk Score
        </div>

        <div style={{ marginTop: 'auto', padding: '12px', background: 'var(--bg-input)', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Random Forest (Balanced)
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            ROC-AUC: 0.8455 | Recall: 80.4%
          </div>
        </div>
      </div>
    </>
  );
}
