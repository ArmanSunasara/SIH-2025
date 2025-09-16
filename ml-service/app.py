from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
import os

app = FastAPI(title="Smart Health ML Service", version="1.0")

# Try loading pre-trained model if exists
MODEL_PATH = "model.pkl"
model = None

if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print("✅ Model loaded successfully")
    except Exception as e:
        print("⚠️ Failed to load model:", e)
else:
    print("⚠️ No model.pkl found, using dummy predictions")


# Define input schema
class Features(BaseModel):
    features: dict


@app.get("/")
def root():
    return {"message": "ML Service Running ✅"}


@app.post("/predict")
def predict(data: Features):
    df = pd.DataFrame([data.features])

    if model:
        try:
            prob = model.predict_proba(df)[:, 1][0]
        except Exception as e:
            return {"error": f"Model prediction failed: {str(e)}"}
    else:
        # Dummy output when no model.pkl is present
        prob = 0.75

    return {"probability": float(prob)}
