# Customer Churn Analysis & Autonomous AI Analyst

## 1. Project Overview
This repository contains the complete implementation for the **AI Engineer Assessment (Autonomous Data Analyst)**. It includes:
* **Exploratory Data Analysis (EDA)** & Data Cleaning.
* **ML Model Training & Benchmarking** (Random Forest vs Logistic Regression vs Gradient Boosting).
* **Evaluation Metric Selection & Business Justification**.
* **Callable Model Tool (`predict_churn_risk`)** ready for the AI Agent and Streamlit interface.

---

## 2. Data Cleaning & Integrity Audit

During comprehensive EDA of `Customer-Churn.csv` (7,043 rows, 21 columns), the following issues and characteristics were identified:

| Issue / Feature | Finding | Root Cause | Resolution |
| :--- | :--- | :--- | :--- |
| **`TotalCharges` Data Type** | Stored as `object`/`string` instead of `float`. | **11 rows contained blank whitespace strings (`' '`)**. | Converted column to numeric; imputed with `0.0`. |
| **`TotalCharges` Whitespace Cause** | All 11 records with `' '` had **`tenure == 0`**. | Brand-new customers who signed up in the current month and haven't had their first billing cycle. | Setting to `0.0` reflects true historical billing amount rather than using mean/median imputation. |
| **Target Imbalance (`Churn`)** | 1,869 Churned (26.5%) vs 5,174 Retained (73.5%). | Natural business churn skew. | Stratified 80/20 train/test split and class-weight balancing applied in modeling. |
| **Duplicate Records** | 0 duplicate rows, 7,043 unique `customerID` values. | Clean primary key integrity. | No row deduplication needed. |

---

## 3. Model Benchmarks & Comparison

We evaluated candidate classification models using **5-Fold Stratified Cross-Validation**:

| Model | ROC-AUC | PR-AUC | Recall (Sensitivity) | Precision | F1-Score |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Random Forest (Balanced)** ⭐ | **0.8455** | **0.6584** | **80.4%** | 52.4% | **0.6346** |
| **Logistic Regression (Balanced)** | 0.8450 | 0.6559 | **80.1%** | 51.2% | 0.6250 |
| **Gradient Boosting Classifier** | **0.8474** | **0.6619** | 52.7% | **66.9%** | 0.5893 |
| **Logistic Regression (Standard)** | 0.8450 | 0.6567 | 55.3% | 65.9% | 0.6010 |
| **Random Forest (Standard)** | 0.8412 | 0.6501 | 51.8% | 67.2% | 0.5851 |

### Why Random Forest (Balanced) Was Selected
1. **High Risk-Ranking Power (ROC-AUC 0.8455, PR-AUC 0.6584)**: Accurately distinguishes churners from non-churners across all threshold cutoffs.
2. **Superior Recall on Churners (80.4%)**: Captures 8 out of every 10 churning customers.
3. **Non-Linear Interactions**: Tree ensembles naturally model joint churn factors (e.g. `Month-to-month Contract` + `Fiber Optic` + `No TechSupport`) without requiring manual interaction engineering.
4. **Why not unweighted Gradient Boosting / Standard Models?**: Standard models maximize raw accuracy and yield low recall (~52%), allowing nearly half of churning customers to slip by undetected.
5. **Why not Logistic Regression?**: Linear boundaries struggle with subtle segment interactions and outlier sensitivities compared to tree ensembles.

---

## 4. Evaluation Metric Selection & Justification

### 1. Why ROC-AUC and PR-AUC (Not Standard Accuracy)?
* **Accuracy is Deceptive on Imbalanced Data**: With 73.5% non-churners, a dummy model predicting "No" for all customers achieves 73.5% accuracy but catches zero churners.
* **Continuous Risk Scoring**: In real-world customer retention, teams do not take action based on a static 0/1 label. They require continuous risk probabilities ($0.0$ to $1.0$) to segment customers into **Low, Medium, and High Risk** tiers. ROC-AUC and PR-AUC evaluate ranking performance across all decision thresholds.

### 2. Why Prioritize Recall (Sensitivity) Over Precision?
* **Customer Retention Economics**:
  * **Cost of a False Negative (Missed Churner)**: The business permanently loses the customer's lifetime value ($1,000+).
  * **Cost of a False Positive (False Alarm)**: The business sends an email or offers a small retention discount ($10 - $20).
* Because a False Negative is significantly more costly than a False Positive, high **Recall (~80%)** is the primary operational objective.

---

## 5. How to Run & Verify

### Step 1: Run the Google Colab / Jupyter Notebook
Open and run all cells in:
```bash
# Path to notebook
notebooks/churn_model.ipynb
```
Running the notebook executes EDA, benchmarks all models, generates ROC/PR curves, and saves the final trained pipeline to `results/churn_model.pkl`.

### Step 2: Test the Callable Model Tool
Run the callable tool from the terminal:
```bash
PYTHONPATH=. .venv/bin/python3 -c "
from model.churn_tool import predict_churn_risk

# 1. Existing customer query
res = predict_churn_risk('7590-VHVEG')
print('Prediction:', res)

# 2. What-if projection (e.g. customer switches to 2-year contract + TechSupport)
res_what_if = predict_churn_risk('7590-VHVEG', overrides={'Contract': 'Two year', 'TechSupport': 'Yes'})
print('Projected Risk with 2-yr contract:', res_what_if['risk_percentage'])
"
```
