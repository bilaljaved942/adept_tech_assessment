"""
Streamlit UI Components and Dynamic Visualizations.
Stage 2 Presentation Layer.
"""

import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def render_kpi_cards(df: pd.DataFrame):
    """Renders top-level summary metrics for the dataset."""
    total = len(df)
    churn_count = (df["Churn"] == "Yes").sum()
    churn_pct = (churn_count / total) * 100
    avg_monthly = df["MonthlyCharges"].mean()
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Customers", f"{total:,}")
    with col2:
        st.metric("Overall Churn Rate", f"{churn_pct:.1f}%", delta=f"{churn_count} churners", delta_color="inverse")
    with col3:
        st.metric("Avg Monthly Charges", f"${avg_monthly:.2f}")
    with col4:
        st.metric("Model ROC-AUC", "0.8455", delta="80.4% Recall")

def render_chart(df: pd.DataFrame, chart_info: dict = None):
    """Renders dynamic charts in the chat based on the query."""
    if chart_info is None or not isinstance(chart_info, dict):
        return
        
    c_type = chart_info.get("type")
    title = chart_info.get("title", "Data Visualization")
    
    st.write(f"#### 📊 {title}")
    
    fig, ax = plt.subplots(figsize=(8, 4))
    sns.set_theme(style="whitegrid")
    
    try:
        if c_type == "bar":
            grp = chart_info.get("group_by")
            metric = chart_info.get("metric", "Churn_binary")
            if grp in df.columns:
                plot_df = df.groupby(grp)[metric].mean().reset_index()
                sns.barplot(data=plot_df, x=grp, y=metric, palette="coolwarm", ax=ax)
                ax.set_ylabel("Churn Rate" if "Churn" in metric else metric)
                ax.set_title(title)
                plt.xticks(rotation=15, ha="right")
                st.pyplot(fig)
                plt.close(fig)
                
        elif c_type == "hist":
            col = chart_info.get("column", "tenure")
            if col in df.columns:
                sns.histplot(data=df, x=col, hue="Churn", multiple="stack", palette=["#4CAF50", "#F44336"], ax=ax)
                ax.set_title(title)
                st.pyplot(fig)
                plt.close(fig)
    except Exception as e:
        plt.close(fig)
