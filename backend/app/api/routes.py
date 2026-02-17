# import os
# import joblib
# import pandas as pd
# import datetime
# from fastapi import APIRouter, HTTPException
# from pydantic import BaseModel, Field, ConfigDict

# router = APIRouter()

# # --- PATH RESOLUTION ---
# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# MODEL_DIR = os.path.join(BASE_DIR, "models")

# def load_artifact(filename):
#     path = os.path.join(MODEL_DIR, filename)
#     if not os.path.exists(path):
#         raise FileNotFoundError(f"Missing ML artifact: {path}")
#     return joblib.load(path)

# # Load artifacts
# try:
#     LE_CITY = load_artifact("le_city.pkl")
#     LE_WEATHER = load_artifact("le_weather.pkl")
#     LE_ROAD = load_artifact("le_road.pkl")
#     MODEL = load_artifact("risk_model.pkl")
# except Exception as e:
#     print(f"ERROR: Model loading failed. {e}")

# class RiskRequest(BaseModel):
#     # Field aliases solve the '422 Unprocessable Entity' by accepting both cases
#     latitude: float = Field(..., validation_alias="Latitude", serialization_alias="latitude")
#     longitude: float = Field(..., validation_alias="Longitude", serialization_alias="longitude")
#     city: str = Field(..., validation_alias="City", serialization_alias="city")
#     weather: str = Field(..., validation_alias="Weather", serialization_alias="weather")
#     road_condition: str = Field(..., validation_alias="Road_Condition", serialization_alias="road_condition")

#     # Pydantic V2 config to allow both alias and field name
#     model_config = ConfigDict(populate_by_name=True)

# @router.post("/predict-risk")
# async def predict_risk(data: RiskRequest):
#     try:
#         # 1. Feature Extraction
#         now = datetime.datetime.now()
#         hour = now.hour
#         month = now.month
#         day_of_week = now.weekday()

#         # 2. Categorical Encoding
#         try:
#             city_enc = LE_CITY.transform([data.city])[0]
#             weather_enc = LE_WEATHER.transform([data.weather])[0]
#             road_enc = LE_ROAD.transform([data.road_condition])[0]
#         except ValueError as e:
#             raise HTTPException(status_code=400, detail=f"Data Mismatch: {str(e)}. Check your CSV categories.")

#         # 3. Model Inference
#         features = pd.DataFrame([[
#             data.latitude, data.longitude, city_enc, 
#             weather_enc, road_enc, hour, month, day_of_week
#         ]], columns=['Latitude', 'Longitude', 'City_Encoded', 
#                      'Weather_Encoded', 'Road_Condition_Encoded', 
#                      'Hour', 'Month', 'DayOfWeek'])

#         ml_prediction = MODEL.predict(features)[0]
        
#         # 4. Proactive Risk Intelligence (Hybrid Logic)
#         # We manually boost scores for high-danger Indian road scenarios
#         risk_score = float(ml_prediction)
        
#         if data.weather in ["Foggy", "Rainy"]: 
#             risk_score += 2.0
#         if 23 <= hour or hour <= 5: 
#             risk_score += 1.5  # Night-time hazard
#         if "Under Construction" in data.road_condition or "Potholes" in data.road_condition:
#             risk_score += 2.0

#         # Clamp score between 1 and 10
#         final_score = max(1, min(10, round(risk_score, 1)))

#         return {
#             "status": "success",
#             "risk_score": final_score,
#             "risk_level": "High" if final_score > 7 else "Moderate" if final_score > 4 else "Low",
#             "metadata": {
#                 "city": data.city,
#                 "hour": f"{hour}:00",
#                 "is_monsoon_month": month in [6, 7, 8, 9]
#             }
#         }
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

# import joblib
# import pandas as pd
# import numpy as np
# from fastapi import APIRouter
# from pydantic import BaseModel

# router = APIRouter()

# # Load the "Best" artifacts
# MODEL = joblib.load("app/models/risk_model.pkl")
# SCALER = joblib.load("app/models/scaler.pkl")
# CITY_MAP = joblib.load("app/models/city_risk_map.pkl")

# class PredictRequest(BaseModel):
#     latitude: float
#     longitude: float
#     city: str
#     hour: int

# @router.post("/predict-point")
# async def predict_point(data: PredictRequest):
#     # 1. Feature Engineering (Match the train.py logic)
#     hour_sin = np.sin(2 * np.pi * data.hour / 23.0)
#     hour_cos = np.cos(2 * np.pi * data.hour / 23.0)
#     city_risk = CITY_MAP.get(data.city, 5.0) # Fallback to average
    
#     # 2. Create Feature Array
#     # Must be in the EXACT same order as 'features' list in train.py
#     features = np.array([[
#         data.latitude, data.longitude, 
#         hour_sin, hour_cos, 
#         1 if (data.hour >= 22 or data.hour <= 5) else 0, # Is_Night
#         0, # Is_Highway (Placeholder or logic)
#         0, # Night_Highway interaction
#         city_risk
#     ]])
    
#     # 3. Scale and Predict
#     features_scaled = SCALER.transform(features)
#     prediction = MODEL.predict(features_scaled)[0]
    
#     return {
#         "risk_level": int(prediction), # 0: Low, 1: Med, 2: High
#         "label": "High" if prediction == 2 else "Moderate" if prediction == 1 else "Low"
#     }

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import joblib
import pandas as pd
import numpy as np
from app.services.navigation import get_safer_route

router = APIRouter()

# --------------------------------------------------
# 1. Load ML Artifacts
# --------------------------------------------------
try:
    MODEL = joblib.load("app/models/severity_model.pkl")
    ENCODERS = joblib.load("app/models/encoders.pkl")
    SCALER = joblib.load("app/models/coord_scaler.pkl")
    KMEANS = joblib.load("app/models/kmeans_hotspots.pkl")
    SEVERITY_LE = joblib.load("app/models/severity_encoder.pkl")
except Exception as e:
    print(f"⚠️ Warning: Model files not found. Run train.py first. Error: {e}")

# --------------------------------------------------
# 2. Request/Response Models (Schemas)
# --------------------------------------------------
class NavigationRequest(BaseModel):
    origin_lat: float
    origin_lon: float
    dest_lat: float
    dest_lon: float
    city: str

class RiskRequest(BaseModel):
    lat: float
    lon: float
    city: str
    weather: Optional[str] = "Clear"
    road_condition: Optional[str] = "Dry"

# --------------------------------------------------
# 3. API Endpoints
# --------------------------------------------------

@router.get("/")
async def root():
    return {"message": "Suraksha-Net AI Backend is Online"}

@router.post("/predict-risk")
async def predict_risk(data: RiskRequest):
    """Predicts risk for a single point (used for real-time alerts)."""
    try:
        # Prepare input matching the train.py features
        city_enc = ENCODERS["City"].transform([data.city])[0]
        weather_enc = ENCODERS["Weather"].transform([data.weather])[0]
        road_enc = ENCODERS["Road_Condition"].transform([data.road_condition])[0]
        
        # Scale coordinates
        coords_scaled = SCALER.transform([[data.lat, data.lon]])
        hotspot = KMEANS.predict(coords_scaled)[0]
        
        # Build feature array
        features = np.array([[data.lat, data.lon, city_enc, weather_enc, road_enc, 0, 0, 0, 0, hotspot]]) 
        # Note: Replace 0s with actual hour_sin, hour_cos etc. if used in train.py
        
        prediction = MODEL.predict(features)[0]
        label = SEVERITY_LE.inverse_transform([prediction])[0]
        
        return {
            "status": "success",
            "risk_level": label,
            "risk_score": int(prediction)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/navigate-safe")
async def navigate_safe(data: NavigationRequest):
    """Calculates and ranks routes based on safety and distance."""
    try:
        results = get_safer_route(
            data.origin_lat, data.origin_lon,
            data.dest_lat, data.dest_lon,
            data.city
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Navigation Service Error: {str(e)}")

@router.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": MODEL is not None}