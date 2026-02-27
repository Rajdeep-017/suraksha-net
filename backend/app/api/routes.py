import os
import joblib
import numpy as np
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.navigation import get_safer_route
from app.services.chatbot import chat as groq_chat

router = APIRouter()

# --------------------------------------------------
# 1. Load ML Artifacts
# --------------------------------------------------
MODEL = None
ENCODERS = None
SCALER = None
KMEANS = None
SEVERITY_LE = None
FEATURE_CONFIG = None

_MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")

try:
    MODEL = joblib.load(os.path.join(_MODEL_DIR, "severity_model.pkl"))
    ENCODERS = joblib.load(os.path.join(_MODEL_DIR, "encoders.pkl"))
    SCALER = joblib.load(os.path.join(_MODEL_DIR, "coord_scaler.pkl"))
    KMEANS = joblib.load(os.path.join(_MODEL_DIR, "kmeans_hotspots.pkl"))
    SEVERITY_LE = joblib.load(os.path.join(_MODEL_DIR, "severity_encoder.pkl"))
    try:
        FEATURE_CONFIG = joblib.load(os.path.join(_MODEL_DIR, "feature_config.pkl"))
    except Exception:
        FEATURE_CONFIG = None
    print("[OK] ML models loaded successfully.")
except Exception as e:
    print(f"[WARN] ML model files not found. Run train.py first. Error: {e}")


# --------------------------------------------------
# Inference helper: build 15-feature vector
# --------------------------------------------------
# Lookup maps matching train.py
_ROAD_RISK = {"Slippery":4, "Potholed":3, "Under Construction":3, "Wet":2, "Dry":1, "Good":1}
_TIME_RISK = {"Late Night":3, "Night":2, "Morning Rush":2, "Evening Rush":2, "Afternoon":1, "Midday":1}
_WEATHER_SEVERITY = {"Clear":1, "Cloudy":1, "Rainy":3, "Foggy":2, "Stormy":4, "Hail":4, "Snowy":3}

def _safe_encode(encoder_key: str, value: str) -> int:
    """Encode a category with fallback to 0 for unknown labels."""
    try:
        return int(ENCODERS[encoder_key].transform([value])[0])
    except (ValueError, KeyError):
        return 0

def _get_time_bin(hour: int) -> str:
    """Map hour → Time_Bin label matching the training data."""
    if 6 <= hour < 10:   return "Morning Rush"
    if 10 <= hour < 12:  return "Midday"
    if 12 <= hour < 16:  return "Afternoon"
    if 16 <= hour < 20:  return "Evening Rush"
    if 20 <= hour < 23:  return "Night"
    return "Late Night"

def _get_day_night(hour: int) -> str:
    return "Nighttime" if hour >= 20 or hour < 6 else "Daytime"

def build_feature_vector(
    weather: str = "Clear",
    road_condition: str = "Dry",
    hour: int = 12,
) -> np.ndarray:
    """
    Builds the 15-feature vector matching train.py's FEATURES list:
        Weather_enc, Road_Condition_enc, Time_Bin_enc, Day_Night_enc,
        Weather_Severity, Traffic_Density, road_risk_num, time_risk_num,
        is_night, weather_road_risk, casualty_severity_idx, total_casualties,
        Fatalities, Serious_Injuries, Minor_Injuries

    Casualty fields default to 0 (unknown at prediction time).
    """
    time_bin   = _get_time_bin(hour)
    day_night  = _get_day_night(hour)

    weather_enc        = _safe_encode("Weather", weather)
    road_condition_enc = _safe_encode("Road_Condition", road_condition)
    time_bin_enc       = _safe_encode("Time_Bin", time_bin)
    day_night_enc      = _safe_encode("Day_Night", day_night)

    weather_severity = _WEATHER_SEVERITY.get(weather, 2)
    traffic_density  = 5  # default medium (not available at inference)
    road_risk_num    = _ROAD_RISK.get(road_condition, 2)
    time_risk_num    = _TIME_RISK.get(time_bin, 1)
    is_night         = 1 if day_night == "Nighttime" else 0
    weather_road_risk = weather_severity * road_risk_num

    # Casualty features — unknown at prediction time, default to 0
    casualty_severity_idx = 0
    total_casualties      = 0
    fatalities            = 0
    serious_injuries      = 0
    minor_injuries        = 0

    return np.array([[
        weather_enc, road_condition_enc, time_bin_enc, day_night_enc,
        weather_severity, traffic_density, road_risk_num, time_risk_num,
        is_night, weather_road_risk, casualty_severity_idx, total_casualties,
        fatalities, serious_injuries, minor_injuries,
    ]])


# --------------------------------------------------
# 2. Request Schemas
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
# 3. Endpoints
# --------------------------------------------------

@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": MODEL is not None,
    }


@router.post("/predict-risk")
async def predict_risk(data: RiskRequest):
    """Predicts accident risk for a single coordinate (real-time alerts)."""
    if MODEL is None or ENCODERS is None or SEVERITY_LE is None:
        raise HTTPException(
            status_code=503,
            detail="ML models are not loaded. Run train.py first to generate model files.",
        )
    try:
        import datetime

        now  = datetime.datetime.now()
        hour = now.hour

        features = build_feature_vector(
            weather=data.weather or "Clear",
            road_condition=data.road_condition or "Dry",
            hour=hour,
        )

        prediction = MODEL.predict(features)[0]
        label = SEVERITY_LE.inverse_transform([prediction])[0]

        # Also get probability for the "High" class
        proba = MODEL.predict_proba(features)[0]
        try:
            high_idx = list(SEVERITY_LE.classes_).index("High")
            risk_pct = float(proba[high_idx])
        except (ValueError, IndexError):
            risk_pct = 0.5

        return {
            "status": "success",
            "risk_level": label,
            "risk_score": int(prediction),
            "risk_probability": round(risk_pct, 4),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/navigate-safe")
async def navigate_safe(data: NavigationRequest):
    """Calculates and ranks routes by safety score using the Mappls API."""
    try:
        results = get_safer_route(
            data.origin_lat, data.origin_lon,
            data.dest_lat, data.dest_lon,
            data.city,
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Navigation Service Error: {str(e)}")


# --------------------------------------------------
# Chat (Groq AI)
# --------------------------------------------------
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat")
async def chat_endpoint(data: ChatRequest):
    """AI chatbot powered by Groq — road safety questions & route queries."""
    try:
        msgs = [{"role": m.role, "content": m.content} for m in data.messages]
        result = groq_chat(msgs)
        return {
            "status": "success",
            "reply": result["reply"],
            "route": result.get("route"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))