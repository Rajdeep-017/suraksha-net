import os
import joblib
import pandas as pd
import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, ConfigDict

router = APIRouter()

# --- PATH RESOLUTION ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

def load_artifact(filename):
    path = os.path.join(MODEL_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing ML artifact: {path}")
    return joblib.load(path)

# Load artifacts
try:
    LE_CITY = load_artifact("le_city.pkl")
    LE_WEATHER = load_artifact("le_weather.pkl")
    LE_ROAD = load_artifact("le_road.pkl")
    MODEL = load_artifact("risk_model.pkl")
except Exception as e:
    print(f"ERROR: Model loading failed. {e}")

class RiskRequest(BaseModel):
    # Field aliases solve the '422 Unprocessable Entity' by accepting both cases
    latitude: float = Field(..., validation_alias="Latitude", serialization_alias="latitude")
    longitude: float = Field(..., validation_alias="Longitude", serialization_alias="longitude")
    city: str = Field(..., validation_alias="City", serialization_alias="city")
    weather: str = Field(..., validation_alias="Weather", serialization_alias="weather")
    road_condition: str = Field(..., validation_alias="Road_Condition", serialization_alias="road_condition")

    # Pydantic V2 config to allow both alias and field name
    model_config = ConfigDict(populate_by_name=True)

@router.post("/predict-risk")
async def predict_risk(data: RiskRequest):
    try:
        # 1. Feature Extraction
        now = datetime.datetime.now()
        hour = now.hour
        month = now.month
        day_of_week = now.weekday()

        # 2. Categorical Encoding
        try:
            city_enc = LE_CITY.transform([data.city])[0]
            weather_enc = LE_WEATHER.transform([data.weather])[0]
            road_enc = LE_ROAD.transform([data.road_condition])[0]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Data Mismatch: {str(e)}. Check your CSV categories.")

        # 3. Model Inference
        features = pd.DataFrame([[
            data.latitude, data.longitude, city_enc, 
            weather_enc, road_enc, hour, month, day_of_week
        ]], columns=['Latitude', 'Longitude', 'City_Encoded', 
                     'Weather_Encoded', 'Road_Condition_Encoded', 
                     'Hour', 'Month', 'DayOfWeek'])

        ml_prediction = MODEL.predict(features)[0]
        
        # 4. Proactive Risk Intelligence (Hybrid Logic)
        # We manually boost scores for high-danger Indian road scenarios
        risk_score = float(ml_prediction)
        
        if data.weather in ["Foggy", "Rainy"]: 
            risk_score += 2.0
        if 23 <= hour or hour <= 5: 
            risk_score += 1.5  # Night-time hazard
        if "Under Construction" in data.road_condition or "Potholes" in data.road_condition:
            risk_score += 2.0

        # Clamp score between 1 and 10
        final_score = max(1, min(10, round(risk_score, 1)))

        return {
            "status": "success",
            "risk_score": final_score,
            "risk_level": "High" if final_score > 7 else "Moderate" if final_score > 4 else "Low",
            "metadata": {
                "city": data.city,
                "hour": f"{hour}:00",
                "is_monsoon_month": month in [6, 7, 8, 9]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")