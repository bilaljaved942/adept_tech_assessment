"""
Streamlit Chat Application: Autonomous Data Analyst.
Stage 2 & Stage 3 Assessment Implementation.
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
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-title { font-size: 2.2rem; font-weight: 700; color: #1E88E5; margin-bottom: 0px; }
    .sub-title { font-size: 1.05rem; color: #555; margin-bottom: 20px; }
    .verified-badge { background-color: #E8F5E9; color: #2E7D32; padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.85rem; display: inline-block; }
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
    st.image("https://img.icons8.com/fluency/96/artificial-intelligence.png", width=64)
    st.title("Settings & Tools")
    
    st.subheader("LLM Configuration")
    provider = st.selectbox("Provider", ["Groq (Free)", "Built-in Autonomous Engine"], index=0)
    api_key_input = st.text_input(
        "API Key (Optional)",
        type="password",
        value=os.getenv("GROQ_API_KEY", ""),
        help="Enter free Groq API key or leave empty to use built-in engine."
    )
    if st.button("Update Agent"):
        st.session_state.agent = AutonomousDataAgent(api_key=api_key_input if api_key_input else None)
        st.success("Agent updated!")

    st.markdown("---")
    st.subheader("💡 Quick Sample Questions")
    samples = [
        "Which customers are most likely to churn?",
        "What is the churn risk for customer 7590-VHVEG?",
        "Does churn risk correlate with contract type?",
        "Show me churn rate by internet service.",
        "What is the revenue trend for high-risk customers?",
        "What if customer 7590-VHVEG switches to a Two year contract with TechSupport?"
    ]
    for q in samples:
        if st.button(q, key=f"btn_{q}"):
            st.session_state.current_prompt = q

    st.markdown("---")
    st.subheader("🔮 Single Customer Simulator")
    cid_input = st.selectbox("Select Customer ID", df["customerID"].head(30).tolist())
    override_contract = st.selectbox("What-if Contract", ["Keep Original", "Month-to-month", "One year", "Two year"])
    override_tech = st.selectbox("What-if Tech Support", ["Keep Original", "Yes", "No"])
    
    if st.button("Run Simulation"):
        overrides = {}
        if override_contract != "Keep Original": overrides["Contract"] = override_contract
        if override_tech != "Keep Original": overrides["TechSupport"] = override_tech
        
        sim_res = predict_churn_risk(cid_input, overrides=overrides if overrides else None)
        if sim_res.get("status") == "success":
            st.metric("Projected Churn Risk", sim_res["risk_percentage"], delta=sim_res["risk_level"])
            st.write(f"**Prediction**: {sim_res['prediction']}")
            st.write("**Top Factors**:")
            for f in sim_res["top_factors"]:
                st.write(f"- {f}")

# ----------------- MAIN UI -----------------
st.markdown('<div class="main-title">🤖 Autonomous Data Analyst Agent</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">AI Agent for Churn Prediction, Multi-Step Analytics & Data Exploration</div>', unsafe_allow_html=True)

# Render KPI metric cards
render_kpi_cards(df)

st.markdown("---")

# Display Messages
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])
        if "chart" in msg and msg["chart"]:
            render_chart(msg["chart"], df)
        if "steps" in msg and msg["steps"]:
            with st.expander("🔍 View Agent Execution Trace & Critic Review"):
                for s in msg["steps"]:
                    st.write(s)
                st.markdown(f'<div class="verified-badge">{msg.get("critic_status", "Verified")}</div>', unsafe_allow_html=True)

# Chat Input
prompt = st.chat_input("Ask a question about customer churn, distributions, or predictions...")

if "current_prompt" in st.session_state and st.session_state.current_prompt:
    prompt = st.session_state.current_prompt
    st.session_state.current_prompt = None

if prompt:
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner("Agent is planning steps and executing queries against the dataset..."):
            try:
                response = st.session_state.agent.run_query(prompt)
                ans = response["answer"]
                steps = response.get("steps", [])
                chart = response.get("chart", None)
                critic = response.get("critic_status", "Verified")
                
                st.markdown(ans)
                if chart:
                    render_chart(chart, df)
                    
                with st.expander("🔍 View Agent Execution Trace & Critic Review"):
                    for s in steps:
                        st.write(s)
                    st.markdown(f'<div class="verified-badge">{critic}</div>', unsafe_allow_html=True)
                    
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": ans,
                    "steps": steps,
                    "chart": chart,
                    "critic_status": critic
                })
            except Exception as e:
                err = f"⚠️ Error: {str(e)}"
                st.error(err)
                st.session_state.messages.append({"role": "assistant", "content": err})
