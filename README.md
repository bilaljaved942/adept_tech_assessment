# Autonomous Data Analyst Agent for Customer Churn Prediction

An end-to-end Machine Learning and Autonomous AI Agent platform that combines deterministic data science with large language models to analyze customer churn, predict individual customer risk, simulate business what-if interventions, and verify all claims against the customer dataset.

---

## 1. What Was Built (System Architecture)

```
                       ┌────────────────────────────────────────────────────────┐
                       │                   USER INTERFACES                      │
                       │   • React + Vite Web App (http://localhost:5173)       │
                       │   • Streamlit Chat Application (http://localhost:8501) │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                                                   ▼
                       ┌────────────────────────────────────────────────────────┐
                       │          FASTAPI REST BACKEND (api.py)                 │
                       │   Endpoints: /api/chat, /api/predict-churn, /overview  │
                       └───────────────────────────┬────────────────────────────┘
                                                   │
                                                   ▼
 ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   AUTONOMOUS AGENT CORE                                         │
 │                                                                                                 │
 │   1. Multi-Step Planning (agent_loop.py):                                                       │
 │      • Intent extraction & entity routing (Customer IDs, group-bys, correlations).              │
 │      • Token-efficient schema prompting with Groq free-tier rate-limit backoff.                 │
 │                                                                                                 │
 │   2. Restricted Sandbox & Tools (tools.py & churn_tool.py):                                     │
 │      • Python Execution Sandbox: Runs safe pandas aggregations on `df` in memory.               │
 │      • Stage 1 ML Model Tool: Predicts individual risk scores & counterfactual overrides.       │
 │                                                                                                 │
 │   3. Zero-Hallucination Critic Guardrail (critic.py):                                           │
 │      • Mathematically cross-references all numbers in AI responses against sandbox outputs.     │
 └─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Issues Found and How They Were Handled

During Stage 1 exploratory data analysis on `Customer-Churn.csv` (7,043 rows, 21 columns), we identified a critical data quality issue:
* **Root Cause**: **11 customer records** contained whitespace strings (`" "`) in the `TotalCharges` column instead of numeric values.
* **Domain Investigation**: All 11 records corresponded to brand-new accounts with `tenure == 0` (customers who joined during the current billing cycle and had not yet received their first monthly bill).
* **Resolution Strategy**: Rather than dropping these rows (which would introduce sample selection bias against newly acquired customers) or imputing with median/mean (which would distort lifetime spend for new users), we converted whitespaces to `0.0`.
* **Standardization**: Converted the binary target `Churn` into `Churn_binary` (`Yes` $\to 1$, `No` $\to 0$) for consistent model training and group-by calculations.

---

## 3. Evaluation Metric Justification

The dataset has a significant **class imbalance**:
* **Non-Churned (Retained)**: **73.46%** (5,174 customers)
* **Churned**: **26.54%** (1,869 customers)

Because of this imbalance:
1. **Why Simple Accuracy is Misleading**: A naive "dumb" classifier predicting that *no customer ever churns* would score **73.5% accuracy**, yet fail to save a single churning customer.
2. **Why ROC-AUC is Primary**: ROC-AUC measures the model's ability to rank high-risk customers above low-risk customers across all classification thresholds. Our balanced Random Forest model achieved **0.8455 ROC-AUC** across 5-Fold Stratified Cross-Validation.
3. **Why Recall is Critical**: In telecommunications, the business cost of a False Negative (failing to detect a customer who cancels) is far greater than a False Positive (offering a retention incentive to a customer who would have stayed). The balanced Random Forest achieved an **80.4% Recall rate** on the churn class.

---

## 4. How the Agent's Planning, Execution & Verification Work

1. **Hybrid Planning & Intent Routing**:
   * If customer IDs (e.g. `9305-CDSKC`) are present, the agent routes directly to the local ML model tool `predict_churn_risk(customer_id)`.
   * For exploratory and aggregation questions, the LLM acts as a dynamic programmer, generating 3–8 lines of Python pandas code against the dataframe schema.
2. **Restricted Code Execution Sandbox**:
   * Code is evaluated in a restricted Python environment with safe mathematical built-ins (`pd`, `np`, `len`, `sum`) and pre-loaded `df`.
3. **Self-Check & Fallback Loop**:
   * If generated code returns an error or empty output, the agent catches the exception, re-plans, and executes a validated fallback cohort query without crashing.
4. **Anti-Hallucination Critic (`agent/critic.py`)**:
   * An automated Critic parses all stated numerical figures and percentages from the final synthesized draft and cross-verifies that every number originated from the sandbox output.

---

## 5. Short Reflection (Half-Page)

* **The Hardest Part**: Designing the anti-hallucination verification guardrail and managing free-tier rate limits. Balancing LLM reasoning flexibility with deterministic mathematical correctness required building a robust sandbox execution engine and normalizer that handles numbers formatted as percentages, decimals, or comma-separated values.
* **What I Learned / Had to Teach Myself**: Implementing the program-aided language (PAL) agent pattern—prompting the LLM to write code rather than compute math directly—and structuring a clean dual-stack interface (Streamlit for quick exploration, React for modern conversational UX).
* **What I Would Do Differently With More Time**:
  1. Add a Vector Database (RAG) over telco customer support tickets to enrich numeric churn scores with qualitative customer feedback sentiment.
  2. Implement an automated A/B test simulator to project revenue ROI for specific retention incentives.

---

## 6. Honest Note on Time Spent (~8–10 Hours)

* **Stage 1: EDA, Data Cleaning & Model Benchmarking** (~2.5 hours):
  * Dataset inspection, fixing 11 whitespace `TotalCharges` records, 5-Fold Stratified CV across 5 algorithms, calibration & metric analysis.
* **Stage 2: Model Tooling & Multi-UI Development** (~2.5 hours):
  * Building `predict_churn_risk()` callable tool, Streamlit chat interface, FastAPI REST endpoints, and modern React + Vite frontend.
* **Stage 3: Autonomous Agent Loop, Tools & Critic** (~2.5 hours):
  * Python execution sandbox, self-check retry loop, Groq rate-limit exponential backoff, in-memory caching, and Critic verifier.
* **Stage 4: Evaluation Suite & Dockerization** (~1.5 hours):
  * 12-query automated benchmark test runner (`eval_agent.py`), multi-container `docker-compose.yml`, and documentation.

---

## 7. Quick Start & Deployment Guide

### Option A: 1-Command Docker Run
```bash
# Spin up FastAPI, Streamlit, and React simultaneously
docker compose up --build
```
* React UI: `http://localhost:5173`
* Streamlit UI: `http://localhost:8501`
* FastAPI Backend: `http://localhost:8000`

### Option B: Local Setup
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start FastAPI Backend
python3 api.py

# 3. Start React Frontend (in separate terminal)
cd frontend && npm install && npm run dev

# 4. (Optional) Run Streamlit Chat
streamlit run app.py
```

### Option C: Public Live URL via Ngrok (Free & Fast)
To expose your live app publicly with a single command:
```bash
# Expose Streamlit app
ngrok http 8501

# Or expose React app
ngrok http 5173
```
*(Copy the generated `https://xxxx.ngrok-free.app` URL to share as your live Hosted App URL).*

### Option D: Run Evaluation Suite
```bash
python3 eval_agent.py
```
*(Runs the 12-query benchmark suite and outputs `results/evaluation_report.md`)*.
