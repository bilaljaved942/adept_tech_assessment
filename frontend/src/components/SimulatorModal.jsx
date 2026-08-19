import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function SimulatorModal({ isOpen, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState('7590-VHVEG');
  const [contract, setContract] = useState('Keep Original');
  const [techSupport, setTechSupport] = useState('Keep Original');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch('http://localhost:8000/api/customers?limit=40')
        .then(res => res.json())
        .then(data => {
          if (data.customers) setCustomers(data.customers);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const overrides = {};
      if (contract !== 'Keep Original') overrides.Contract = contract;
      if (techSupport !== 'Keep Original') overrides.TechSupport = techSupport;

      const res = await fetch('http://localhost:8000/api/predict-churn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedId,
          overrides: Object.keys(overrides).length > 0 ? overrides : null
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      alert("Failed to run prediction");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-sidebar)',
        width: '540px',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        padding: '24px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 700 }}>
            <Sparkles size={20} color="#6366f1" />
            <span>Single Customer Churn Simulator</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select Customer ID</label>
          <select 
            value={selectedId} 
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: 4, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
          >
            {customers.map(c => (
              <option key={c.customerID} value={c.customerID}>
                {c.customerID} ({c.Contract}, ${c.MonthlyCharges}/mo, Tenure: {c.tenure}m)
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>What-If Contract</label>
            <select 
              value={contract} 
              onChange={(e) => setContract(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: 4, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
            >
              <option value="Keep Original">Keep Original</option>
              <option value="Month-to-month">Month-to-month</option>
              <option value="One year">One year</option>
              <option value="Two year">Two year</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>What-If Tech Support</label>
            <select 
              value={techSupport} 
              onChange={(e) => setTechSupport(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: 4, borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}
            >
              <option value="Keep Original">Keep Original</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleSimulate}
          disabled={loading}
          style={{
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            padding: '12px',
            borderRadius: 8,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {loading ? 'Calculating Prediction...' : 'Run What-If Simulation'}
        </button>

        {result && (
          <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: 10, padding: 14, marginTop: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Projected Churn Risk</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: result.risk_level === 'High' ? '#dc2626' : '#059669' }}>
                  {result.risk_percentage} ({result.risk_level} Risk)
                </div>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, background: 'var(--bg-input)', padding: '4px 10px', borderRadius: 6 }}>
                Prediction: {result.prediction}
              </span>
            </div>

            <div style={{ marginTop: 10, fontSize: '0.8rem' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Top Contributing Factors:</div>
              {result.top_factors?.map((f, i) => (
                <div key={i} style={{ color: 'var(--text-secondary)' }}>• {f}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
