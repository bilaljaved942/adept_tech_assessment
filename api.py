"""
FastAPI Backend Server for Autonomous Data Analyst React Frontend.
Stage 2 (Optional / Extra Marks) Implementation.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd

from model.churn_tool import get_data, predict_churn_risk
from agent.agent_loop import AutonomousDataAgent

app = FastAPI(title="Autonomous Data Analyst API", version="1.0.0")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = AutonomousDataAgent()
df = get_data()

class ChatRequest(BaseModel):
    message: str
    api_key: Optional[str] = None

class PredictionRequest(BaseModel):
    customer_id: str
    overrides: Optional[Dict[str, Any]] = None

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Autonomous Data Analyst Backend Running"}

@app.get("/api/overview")
def get_dataset_overview():
    total = len(df)
    churn_count = int((df["Churn"] == "Yes").sum())
    churn_pct = round((churn_count / total) * 100, 2)
    avg_monthly = round(float(df["MonthlyCharges"].mean()), 2)
    
    return {
        "total_customers": total,
        "churn_count": churn_count,
        "retained_count": total - churn_count,
        "churn_percentage": churn_pct,
        "avg_monthly_charges": avg_monthly,
        "model_roc_auc": 0.8455,
        "model_recall": "80.4%",
        "model_type": "Random Forest (Balanced)"
    }

@app.get("/api/customers")
def get_sample_customers(limit: int = 50):
    samples = df[["customerID", "gender", "SeniorCitizen", "Contract", "tenure", "MonthlyCharges", "TotalCharges", "Churn"]].head(limit)
    return {"customers": samples.to_dict(orient="records")}

@app.post("/api/predict-churn")
def predict_churn(req: PredictionRequest):
    res = predict_churn_risk(req.customer_id, overrides=req.overrides)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res.get("message"))
    return res

@app.post("/api/chat")
def chat_with_agent(req: ChatRequest):
    if not req.message or req.message.strip() == "":
        raise HTTPException(status_code=400, detail="Query message cannot be empty")
    
    # Update agent API key if passed
    if req.api_key:
        active_agent = AutonomousDataAgent(api_key=req.api_key)
    else:
        active_agent = agent
        
    try:
        response = active_agent.run_query(req.message)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
