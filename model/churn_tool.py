"""
Exposed Callable Tool for Churn Prediction.
Used by the AI Agent (Stage 3) and Streamlit Web App (Stage 2).
"""

import os
import joblib
import pandas as pd
from typing import Union, Dict, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "Customer-Churn.csv")
MODEL_PATH = os.path.join(BASE_DIR, "results", "churn_model.pkl")

# Cached variables
_MODEL_ARTIFACT = None
_DATA_DF = None

def get_data() -> pd.DataFrame:
    """Loads and cleans the dataset for customer lookup."""
    global _DATA_DF
    if _DATA_DF is None:
        df = pd.read_csv(DATA_PATH)
        df["TotalCharges"] = pd.to_numeric(df["TotalCharges"].astype(str).str.strip(), errors="coerce").fillna(0.0)
        df["Churn_binary"] = (df["Churn"] == "Yes").astype(int)
        _DATA_DF = df
    return _DATA_DF

def get_model() -> dict:
    """Loads the trained model pipeline."""
    global _MODEL_ARTIFACT
    if _MODEL_ARTIFACT is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}. Please run the notebook first.")
        _MODEL_ARTIFACT = joblib.load(MODEL_PATH)
    return _MODEL_ARTIFACT

def predict_churn_risk(
    customer_input: Union[str, Dict[str, Any]],
    overrides: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Exposed Callable Tool function.
    
    Example usage:
      predict_churn_risk('7590-VHVEG')
      predict_churn_risk('7590-VHVEG', overrides={'Contract': 'Two year'})
    """
    model_data = get_model()
    pipeline = model_data["pipeline"]
    num_cols = model_data["numerical_cols"]
    cat_cols = model_data["categorical_cols"]
    
    # 1. Lookup customer if ID is passed
    if isinstance(customer_input, str):
        df = get_data()
        match = df[df["customerID"].astype(str).str.strip() == customer_input.strip()]
        if match.empty:
            return {"status": "error", "message": f"Customer ID '{customer_input}' not found."}
        row = match.iloc[0].to_dict()
        cid = customer_input.strip()
    else:
        row = customer_input.copy()
        cid = row.get("customerID", "custom_customer")
        
    # Apply what-if overrides if any
    if overrides:
        row.update(overrides)
        
    # Prepare single row DataFrame
    input_df = pd.DataFrame([row])
    input_df["TotalCharges"] = pd.to_numeric(input_df["TotalCharges"].astype(str).str.strip(), errors="coerce").fillna(0.0)
    
    for c in num_cols:
        if c not in input_df: input_df[c] = 0.0
    for c in cat_cols:
        if c not in input_df: input_df[c] = "No"
        
    # 2. Predict Probability
    prob = float(pipeline.predict_proba(input_df[num_cols + cat_cols])[0, 1])
    
    # Determine Risk Level
    if prob >= 0.60:
        risk_level = "High"
    elif prob >= 0.35:
        risk_level = "Medium"
    else:
        risk_level = "Low"
        
    # 3. Extract Top Risk Factors from customer's profile
    top_factors = []
    if row.get("Contract") == "Month-to-month":
        top_factors.append("Month-to-month contract (High churn rate ~42.7%)")
    if row.get("InternetService") == "Fiber optic":
        top_factors.append("Fiber optic internet with high monthly costs")
    if row.get("PaymentMethod") == "Electronic check":
        top_factors.append("Electronic check payment method")
    if float(row.get("tenure", 0)) <= 6:
        top_factors.append("New customer (tenure <= 6 months)")
    if row.get("TechSupport") == "No":
        top_factors.append("No technical support subscription")
    if not top_factors:
        top_factors.append(f"Tenure of {row.get('tenure', 0)} months and Monthly Charges of ${row.get('MonthlyCharges', 0)}")
        
    return {
        "status": "success",
        "customer_id": cid,
        "risk_score": round(prob, 4),
        "risk_percentage": f"{prob * 100:.1f}%",
        "risk_level": risk_level,
        "prediction": "Churn" if prob >= 0.5 else "Retained",
        "top_factors": top_factors,
        "profile": {k: row[k] for k in num_cols + cat_cols if k in row}
    }

if __name__ == "__main__":
    # Quick test
    print(predict_churn_risk("7590-VHVEG"))
