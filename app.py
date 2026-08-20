"""
Streamlit Chat Application: Autonomous Data Analyst.
Clean, responsive interface with automated backend integration.
"""

import os
import streamlit as st
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

from model.churn_tool import get_data, predict_churn_risk
from agent.agent_loop import AutonomousDataAgent
from ui.components import render_kpi_cards, render_chart

# Page Configuration
st.set_page_config(
    page_title="Autonomous Data Analyst — Customer Churn",
    page_icon="🤖",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom Responsive Styling
st.markdown("""
<style>
    @media (max-width: 768px) {
        .main-title { font-size: 1.6rem !important; }
        .stMetric { padding: 4px !important; }
    }
    .main-title { font-size: 2.0rem; font-weight: 700; color: #4F46E5; margin-bottom: 2px; }
    .sub-title { font-size: 0.95rem; color: #64748B; margin-bottom: 14px; }
    .verified-badge { background-color: #ECFDF5; color: #059669; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; display: inline-block; }
    div[data-testid="stMetricValue"] { font-size: 1.3rem !important; font-weight: 700; }
</style>
""", unsafe_allow_html=True)

df = get_data()

# Session State for History & Agent
if "messages" not in st.session_state:
    st.session_state.messages = []
if "agent" not in st.session_state:
    st.session_state.agent = AutonomousDataAgent()

# ----------------- SIDEBAR -----------------
with st.sidebar:
    st.title("🤖 Quick Tools")
    
    st.subheader("💡 Sample Questions")
    samples = [
        "Which customers are most likely to churn?",
        "What is the churn risk for customer 7590-VHVEG?",
        "Does churn risk correlate with contract type?",
        "Show me churn rate by internet service.",
        "Show me revenue trend for high risk customers."
    ]
    for q in samples:
        if st.button(q, key=f"btn_{q}"):
            st.session_state.current_prompt = q

    st.markdown("---")
    st.subheader("🔍 Single Customer Simulator")
    selected_customer = st.selectbox(
        "Select Customer ID",
        df["customerID"].head(30).tolist(),
        index=0
    )
    what_if_contract = st.selectbox(
        "What-if Contract Override",
        ["Keep Original", "Month-to-month", "One year", "Two year"],
        index=0
    )
    what_if_tech = st.selectbox(
        "What-if Tech Support Override",
        ["Keep Original", "Yes", "No"],
        index=0
    )
    
    if st.button("Run Simulation", type="primary"):
        overrides = {}
        if what_if_contract != "Keep Original":
            overrides["Contract"] = what_if_contract
        if what_if_tech != "Keep Original":
            overrides["TechSupport"] = what_if_tech
            
        with st.spinner("Calculating Risk Score..."):
            res = predict_churn_risk(selected_customer, overrides=overrides if overrides else None)
            if res.get("status") != "error":
                st.metric("Churn Risk Score", res["risk_percentage"], delta=f"{res['risk_level']} Risk", delta_color="inverse")
                st.write(f"**Prediction**: {res['prediction']}")
                st.write("**Top Risk Drivers**:")
                for f in res["top_factors"]:
                    st.write(f"- {f}")

# ----------------- MAIN VIEW -----------------
st.markdown('<div class="main-title">Autonomous Data Analyst Agent</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">Natural language dataset analytics, single-customer predictions & counterfactual simulations.</div>', unsafe_allow_html=True)

# Compact KPI Cards
render_kpi_cards(df)

st.markdown("---")

# Render Chat History
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if "chart" in msg and msg["chart"]:
            render_chart(df, msg["chart"])

# Handle Inputs
prompt = st.chat_input("Ask a question about churn trends, correlations, or customer IDs...")
if "current_prompt" in st.session_state and st.session_state.current_prompt:
    prompt = st.session_state.current_prompt
    st.session_state.current_prompt = None

if prompt:
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("Planning & executing query against customer dataset..."):
            response = st.session_state.agent.run_query(prompt)
            
            st.markdown(response["answer"])
            
            if response.get("chart"):
                render_chart(df, response["chart"])
                
            st.session_state.messages.append({
                "role": "assistant",
                "content": response["answer"],
                "chart": response.get("chart")
            })
