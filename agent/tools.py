"""
Tool definitions for the Agent and UI: Restricted code execution and Stage 1 model calling.
"""

import io
import sys
import math
import pandas as pd
import numpy as np
from typing import Dict, Any, Optional

from model.churn_tool import predict_churn_risk, get_data

class ToolRegistry:
    def __init__(self):
        self.df = get_data()
        
    def execute_python_code(self, code: str) -> Dict[str, Any]:
        """
        Executes Python code in a restricted sandbox environment against the dataset 'df'.
        """
        code = code.strip()
        if code.startswith("```python"): code = code[9:]
        elif code.startswith("```"): code = code[3:]
        if code.endswith("```"): code = code[:-3]
        code = code.strip()

        safe_globals = {
            "pd": pd,
            "np": np,
            "math": math,
            "df": self.df.copy(),
            "__builtins__": {
                "abs": abs, "all": all, "any": any, "bool": bool, "dict": dict,
                "enumerate": enumerate, "filter": filter, "float": float, "int": int,
                "len": len, "list": list, "map": map, "max": max, "min": min,
                "print": print, "range": range, "round": round, "set": set,
                "sorted": sorted, "str": str, "sum": sum, "tuple": tuple, "zip": zip
            }
        }
        
        local_vars = {}
        stdout_capture = io.StringIO()
        old_stdout = sys.stdout

        try:
            sys.stdout = stdout_capture
            try:
                compiled = compile(code, "<agent_code>", "eval")
                result_val = eval(compiled, safe_globals, local_vars)
                print(result_val)
            except SyntaxError:
                compiled = compile(code, "<agent_code>", "exec")
                exec(compiled, safe_globals, local_vars)
                result_val = local_vars.get("result", None)

            sys.stdout = old_stdout
            output_str = stdout_capture.getvalue().strip()
            
            formatted_data = None
            if isinstance(result_val, pd.DataFrame):
                formatted_data = result_val.to_dict(orient="records")
            elif isinstance(result_val, pd.Series):
                formatted_data = result_val.to_dict()
                
            return {
                "status": "success",
                "output": output_str if output_str else str(result_val),
                "structured_data": formatted_data,
                "code_executed": code
            }
            
        except Exception as e:
            sys.stdout = old_stdout
            return {
                "status": "error",
                "error": f"{type(e).__name__}: {str(e)}",
                "output": None,
                "code_executed": code
            }

    def predict_churn(
        self,
        customer_id: str,
        overrides: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Invokes the Stage 1 trained churn prediction model."""
        return predict_churn_risk(customer_id, overrides=overrides)

TOOL_REGISTRY = ToolRegistry()
