import os
import asyncio
import joblib
import numpy as np
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.navigation import get_safer_route
from app.services.chatbot import chat as groq_chat
from app.services.weather import get_weather
from app.services.websocket import manager as ws_manager, build_alert

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
_ROAD_RISK = {
    "Slippery": 4,
    "Potholed": 3,
    "Under Construction": 3,
    "Wet": 2,
    "Dry": 1,
    "Good": 1,
}
_TIME_RISK = {
    "Late Night": 3,
    "Night": 2,
    "Morning Rush": 2,
    "Evening Rush": 2,
    "Afternoon": 1,
    "Midday": 1,
}
_WEATHER_SEVERITY = {
    "Clear": 1,
    "Cloudy": 1,
    "Rainy": 3,
    "Foggy": 2,
    "Stormy": 4,
    "Hail": 4,
    "Snowy": 3,
}


def _safe_encode(encoder_key: str, value: str) -> int:
    try:
        return int(ENCODERS[encoder_key].transform([value])[0])
    except (ValueError, KeyError):
        return 0


def _get_time_bin(hour: int) -> str:
    if 6 <= hour < 10:
        return "Morning Rush"
    if 10 <= hour < 12:
        return "Midday"
    if 12 <= hour < 16:
        return "Afternoon"
    if 16 <= hour < 20:
        return "Evening Rush"
    if 20 <= hour < 23:
        return "Night"
    return "Late Night"


def _get_day_night(hour: int) -> str:
    return "Nighttime" if hour >= 20 or hour < 6 else "Daytime"


def build_feature_vector(
    weather: str = "Clear",
    road_condition: str = "Dry",
    hour: int = 12,
) -> np.ndarray:
    time_bin = _get_time_bin(hour)
    day_night = _get_day_night(hour)

    weather_enc = _safe_encode("Weather", weather)
    road_condition_enc = _safe_encode("Road_Condition", road_condition)
    time_bin_enc = _safe_encode("Time_Bin", time_bin)
    day_night_enc = _safe_encode("Day_Night", day_night)

    weather_severity = _WEATHER_SEVERITY.get(weather, 2)
    traffic_density = 5
    road_risk_num = _ROAD_RISK.get(road_condition, 2)
    time_risk_num = _TIME_RISK.get(time_bin, 1)
    is_night = 1 if day_night == "Nighttime" else 0
    weather_road_risk = weather_severity * road_risk_num

    casualty_severity_idx = 0
    total_casualties = 0
    fatalities = 0
    serious_injuries = 0
    minor_injuries = 0

    return np.array(
        [
            [
                weather_enc,
                road_condition_enc,
                time_bin_enc,
                day_night_enc,
                weather_severity,
                traffic_density,
                road_risk_num,
                time_risk_num,
                is_night,
                weather_road_risk,
                casualty_severity_idx,
                total_casualties,
                fatalities,
                serious_injuries,
                minor_injuries,
            ]
        ]
    )


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


class SOSRequest(BaseModel):
    lat: float
    lon: float
    timestamp: Optional[str] = None
    nearest_hotspot: Optional[str] = None
    driver_name: Optional[str] = "Unknown Driver"


class BroadcastRequest(BaseModel):
    zone: str
    message: str
    severity: str = "warning"  # info | warning | critical


class RouteSummaryRequest(BaseModel):
    start: str
    end: str
    safety_score: int
    risk_level: str
    total_accidents: int
    travel_time: int
    top_hotspots: list[str] = []
    weather: Optional[str] = None


# --------------------------------------------------
# In-memory SOS log
# --------------------------------------------------
_sos_events: list[dict] = []


# --------------------------------------------------
# 3. Endpoints
# --------------------------------------------------


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": MODEL is not None,
        "ws_connections": ws_manager.connected_count,
    }


@router.post("/predict-risk")
async def predict_risk(data: RiskRequest):
    """Predicts accident risk for a single coordinate."""
    if MODEL is None or ENCODERS is None or SEVERITY_LE is None:
        raise HTTPException(
            status_code=503,
            detail="ML models are not loaded. Run train.py first.",
        )
    try:
        now = datetime.now()
        hour = now.hour

        features = build_feature_vector(
            weather=data.weather or "Clear",
            road_condition=data.road_condition or "Dry",
            hour=hour,
        )

        prediction = MODEL.predict(features)[0]
        label = SEVERITY_LE.inverse_transform([prediction])[0]

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
            data.origin_lat,
            data.origin_lon,
            data.dest_lat,
            data.dest_lon,
            data.city,
        )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Navigation Service Error: {str(e)}"
        )


# --------------------------------------------------
# Chat (Groq AI)
# --------------------------------------------------
class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@router.post("/chat")
async def chat_endpoint(data: ChatRequest):
    """AI chatbot powered by Groq."""
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


# --------------------------------------------------
# Weather
# --------------------------------------------------
@router.get("/weather")
async def weather_endpoint(lat: float, lon: float):
    """Get current weather for a location via OpenWeatherMap."""
    data = get_weather(lat, lon)
    if data is None:
        return {
            "status": "unavailable",
            "message": "Weather API key not configured. Add OPENWEATHER_API_KEY to .env",
            "weather": None,
        }
    return {"status": "success", "weather": data}


# --------------------------------------------------
# AI Route Summary
# --------------------------------------------------
@router.post("/route-summary")
async def route_summary(data: RouteSummaryRequest):
    """Generate an AI-powered summary of a route using Groq."""
    hotspots_text = (
        ", ".join(data.top_hotspots[:5]) if data.top_hotspots else "none identified"
    )
    weather_text = (
        f"Current weather: {data.weather}"
        if data.weather
        else "Weather data unavailable"
    )

    prompt = f"""Analyze this route and give a concise 3-4 sentence safety summary:

Route: {data.start} → {data.end}
Safety Score: {data.safety_score}/100 ({data.risk_level})
Accident hotspots on route: {data.total_accidents}
Top risk areas: {hotspots_text}
Estimated travel time: {data.travel_time} minutes
{weather_text}

Provide:
1. A brief risk assessment in 1-2 sentences
2. The most important safety tip for this specific route
3. Best time to travel this route (if relevant)

Be concise and actionable. No bullet points — write flowing prose."""

    try:
        result = groq_chat([{"role": "user", "content": prompt}])
        return {
            "status": "success",
            "summary": result["reply"],
        }
    except Exception as e:
        return {
            "status": "error",
            "summary": f"Could not generate summary: {str(e)}",
        }


# --------------------------------------------------
# Emergency SOS
# --------------------------------------------------
@router.post("/sos")
async def emergency_sos(data: SOSRequest):
    """Handle emergency SOS from a driver."""
    sos_event = {
        "id": f"SOS-{len(_sos_events) + 1:04d}",
        "lat": data.lat,
        "lon": data.lon,
        "timestamp": data.timestamp or datetime.now().isoformat(),
        "nearest_hotspot": data.nearest_hotspot,
        "driver_name": data.driver_name,
        "status": "active",
        "created_at": datetime.now().isoformat(),
    }
    _sos_events.append(sos_event)

    # Broadcast SOS to all connected drivers
    alert = build_alert(
        alert_type="sos_nearby",
        message=f"🆘 Emergency SOS from {data.driver_name} near {data.nearest_hotspot or 'unknown location'}",
        severity="critical",
        data={"lat": data.lat, "lon": data.lon, "sos_id": sos_event["id"]},
    )
    asyncio.create_task(ws_manager.broadcast(alert))

    return {
        "status": "success",
        "sos_id": sos_event["id"],
        "message": "Emergency SOS sent. Help is on the way.",
    }


@router.get("/sos/list")
async def list_sos():
    """List all SOS events (for admin dashboard)."""
    return {"events": _sos_events}


# --------------------------------------------------
# Admin Broadcast
# --------------------------------------------------
@router.post("/admin/broadcast")
async def admin_broadcast(data: BroadcastRequest):
    """Admin sends a zone-specific warning to all drivers."""
    alert = build_alert(
        alert_type="admin_broadcast",
        message=data.message,
        severity=data.severity,
        zone=data.zone,
    )
    await ws_manager.broadcast_zone(data.zone, alert)

    return {
        "status": "success",
        "message": "Broadcast sent to all drivers",
        "connected_drivers": ws_manager.connected_count,
    }


@router.get("/admin/alerts")
async def admin_alerts():
    """Get recent alert log for admin dashboard."""
    return {
        "alerts": ws_manager.get_recent_alerts(),
        "connected_drivers": ws_manager.connected_count,
    }
