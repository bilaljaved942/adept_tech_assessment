# Customer Churn Prediction & Autonomous Data Analyst Agent

A complete end-to-end machine learning and autonomous agent project built on the Telco Customer Churn dataset. It pairs a trained scikit-learn classification model with an LLM-powered data analyst that writes and executes safe Python code, performs single-customer risk scoring, runs what-if simulations, and mathematically verifies all answers to prevent hallucinations.

---

## 1. Project Overview & Architecture

The project consists of three interconnected layers:

1. **Machine Learning Core (`model/`)**:
   - A balanced Random Forest pipeline trained on 7,043 customer records.
   - Exposes a callable Python tool: `predict_churn_risk(customer_id, overrides)` for individual predictions and counterfactual what-if simulations.

2. **Autonomous Agent (`agent/`)**:
   - **Hybrid Routing**: Direct regex routing for customer IDs (0ms latency, zero chance of lookup error) + Groq LLM code generation for general dataset queries.
   - **Restricted Sandbox (`tools.py`)**: Runs generated pandas code against the dataset in memory with safe mathematical built-ins.
   - **Self-Check Loop**: Catches execution exceptions and retries with validated fallback aggregations.
   - **Critic Verifier (`critic.py`)**: Cross-references every single numeric value in the final report against the sandbox output before presenting it.

3. **Dual User Interfaces**:
   - **Streamlit Application (`app.py`)**: Interactive chat interface with single-customer what-if simulator and dynamic chart rendering (hosted on Streamlit Cloud).
   - **React + Vite Frontend (`frontend/`) & FastAPI Backend (`api.py`)**: Built as an extra bonus for a modern chat UX.

```
                         ┌──────────────────────────────────────────────┐
                         │               User Query                     │
                         └──────────────────────┬───────────────────────┘
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
        [ Contains Customer ID ]                              [ Analytical Question ]
        • Regex extracts ID                                   • LLM generates Pandas code
        • Calls predict_churn_risk()                          • Runs in Python Sandbox
        • Evaluates ML risk score                             • Computes exact numbers
                       │                                                 │
                       └────────────────────────┬────────────────────────┘
                                                │
                                                ▼
                               ┌────────────────────────────────┐
                               │   Business Synthesis (LLM)     │
                               │   Formats tables & insights    │
                               └────────────────┬───────────────┘
                                                │
                                                ▼
                               ┌────────────────────────────────┐
                               │     Critic Fact Checker        │
                               │   Verifies numbers match data  │
                               └────────────────┬───────────────┘
                                                │
                                                ▼
                                       Final Verified Output
```

---

## 2. Data Issues Found & How They Were Handled

During exploratory data analysis in [`notebooks/churn_model.ipynb`](notebooks/churn_model.ipynb), I discovered a key data quality issue:

* **The Issue**: **11 rows** in `TotalCharges` contained blank whitespace strings (`" "`) instead of numbers, causing pandas to treat the entire column as `object` (string).
* **The Root Cause**: Filtering by these 11 rows revealed that every single one had `tenure == 0`. These were brand-new customers who had joined during the current billing cycle and had not yet completed their first month or received a bill.
* **How I Handled It**: 
  - Dropping these rows would introduce survivorship bias against new acquisitions.
  - Imputing mean or median would falsely inflate the lifetime spend of brand-new users.
  - Therefore, I converted the whitespace values to `0.0` and cast `TotalCharges` to `float64`.
* **Feature Cleaning**: Mapped `Churn` (`Yes`/`No`) to `Churn_binary` (`1`/`0`) for consistent aggregations across the agent and benchmark models.

---

## 3. Metric Selection Justification

The dataset exhibits a significant class imbalance:
* **Retained Customers (No)**: 73.46% (5,174 rows)
* **Churned Customers (Yes)**: 26.54% (1,869 rows)

### Why Simple Accuracy is the Wrong Metric:
If a naive model simply predicted that *nobody ever churns*, it would achieve a **73.5% accuracy score** while failing to catch a single customer leaving the business. In churn prediction, accuracy is misleading.

### Why ROC-AUC and Recall Were Chosen:
1. **ROC-AUC (Primary Ranking Metric)**: Measures how well the model separates churners from non-churners across all possible decision thresholds. Our Balanced Random Forest achieved a **0.8455 ROC-AUC** across 5-Fold Stratified Cross-Validation.
2. **Recall (Business Priority)**: In telecom, the cost of a **False Negative** (losing a customer worth hundreds of dollars because we didn't flag them) is much higher than a **False Positive** (giving a small retention discount to someone who wasn't leaving). Our model achieves **80.4% Recall** on the churn class, ensuring the vast majority of at-risk accounts are captured.

| Model | 5-Fold ROC-AUC | Churn Recall | Precision | F1-Score |
| :--- | :--- | :--- | :--- | :--- |
| **Random Forest (Balanced)** | **0.8455** | **80.4%** | **52.3%** | **0.634** |
| Logistic Regression (Balanced) | 0.8412 | 79.8% | 51.1% | 0.623 |
| Gradient Boosting | 0.8441 | 52.6% | 65.8% | 0.585 |
| Standard Random Forest | 0.8228 | 48.9% | 62.1% | 0.547 |

---

## 4. How Agent Planning & Zero-Hallucination Verification Work

### 1. Planning & Intent Routing:
* **Customer Lookups**: If a user asks about a specific ID (`7590-VHVEG`), regex extracts the ID and immediately triggers the Stage 1 model tool (`predict_churn_risk`), parsing any counterfactual overrides (e.g., switching from Month-to-month to Two-year).
* **Dataset Queries**: For open-ended questions (*"Show churn rate by internet service"*), the LLM receives only the compact dataframe column schema (saving ~99.9% prompt tokens) and generates clean pandas code.

### 2. Sandbox Execution & Self-Check:
* The generated Python code runs in a restricted sandbox with safe mathematical built-ins (`pd`, `np`, `len`, `sum`).
* If the script fails or produces empty output, the self-check mechanism catches the error and runs a validated fallback cohort query instead of exposing a stack trace to the user.

### 3. Anti-Hallucination Critic (`agent/critic.py`):
* Language models often hallucinate numbers when summarizing data.
* To guarantee mathematical truth, our Critic extracts all numbers, percentages, and dollar amounts from the LLM's draft answer and compares them against the raw sandbox output.
* If any figure doesn't trace back to computed data, it flags a warning. In our 12-question evaluation suite, the agent achieved a **100% query accuracy rate** and **< 10% unverified rate**.

---

## 5. Reflection

### What was the hardest part?
The hardest part was striking the right balance between LLM reasoning flexibility and strict mathematical grounding. Initially, the LLM would try to write long scripts (even trying to train logistic regression models on the fly during chat), which would hit token limits or fail to print output. Refining the prompt to enforce concise 3–8 line pandas queries and building the numerical Critic verification engine took the most iteration.

### What did I learn or have to teach myself?
I deepened my understanding of the **Program-Aided Language (PAL)** agent design pattern. Rather than treating an LLM as a calculator (which it is terrible at), using the LLM strictly as a code writer and synthesizer while letting Python do the deterministic math provides both high intelligence and 100% mathematical precision.

### What would I do differently with more time?
1. **Support Ticket RAG Integration**: Connect a vector database over customer service chat transcripts to combine qualitative sentiment with quantitative churn scores.
2. **Automated Retention ROI Calculator**: Add a business simulation tool that calculates the net revenue saved vs cost of retention discounts for high-risk cohorts.

---

## 6. Honest Note on Time Spent (~8–10 Hours)

Here is an honest breakdown of where the time was spent across the assessment:

* **Stage 1 — EDA, Data Cleaning & Model Benchmarking (~2.5 hours)**:
  * Investigating the dataset, diagnosing the 11 blank `TotalCharges` records, setting up 5-fold Stratified Cross-Validation across 5 models, generating ROC/PR curves, and exporting the trained pipeline.
* **Stage 2 — UI & Tool Integration (~2.5 hours)**:
  * Creating the `predict_churn_risk()` callable tool, building the Streamlit dashboard with KPI cards and charts, and building the optional React + Vite frontend with FastAPI endpoints.
* **Stage 3 — Autonomous Agent & Critic Engine (~3 hours)**:
  * Implementing the planning loop, restricted Python code execution sandbox, prompt engineering, rate-limit backoff, and the anti-hallucination Critic verifier.
* **Stage 4 — Evaluation Suite, Deployment, Docker & Documentation (~1 hour)**:
  * Building the 12-test automated eval benchmark (`eval_agent.py`), resolving container build dependencies in `docker-compose.yml`, and writing this documentation.

---

## 7. How to Run Locally or With Docker

### Option 1: Docker Compose (Runs Full Stack)
```bash
docker compose up --build
```
* **React Frontend**: `http://localhost:5173`
* **Streamlit App**: `http://localhost:8501`
* **FastAPI Backend**: `http://localhost:8000`

### Option 2: Local Python Run
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run Streamlit app
streamlit run app.py

# 3. Or run FastAPI Backend + React Frontend
python3 api.py
cd frontend && npm install && npm run dev
```

### Option 3: Run Evaluation Benchmark
```bash
python3 eval_agent.py
```
*(Runs all 12 benchmark test cases and outputs results to `results/evaluation_report.md`)*
