"""
Real-time weather integration using OpenWeatherMap API.

Provides current weather data and maps OWM conditions to
Suraksha risk model categories.
"""

import os
import time
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env", override=True)

# ── Cache: (lat_rounded, lon_rounded) → (timestamp, data) ──────────────────
_weather_cache: dict[str, tuple[float, dict]] = {}
CACHE_TTL = 600  # 10 minutes

# ── OWM condition code → Suraksha weather category ─────────────────────────
_OWM_TO_SURAKSHA = {
    # Thunderstorm group (2xx)
    range(200, 233): "Stormy",
    # Drizzle (3xx) & Rain (5xx)
    range(300, 322): "Rainy",
    range(500, 532): "Rainy",
    # Snow (6xx)
    range(600, 623): "Snowy",
    # Atmosphere: fog, mist, haze (7xx)
    range(700, 782): "Foggy",
    # Clear (800)
    range(800, 801): "Clear",
    # Clouds (80x)
    range(801, 805): "Cloudy",
}


def _map_condition(owm_code: int) -> str:
    """Map an OpenWeatherMap condition code to a Suraksha category."""
    for code_range, category in _OWM_TO_SURAKSHA.items():
        if owm_code in code_range:
            return category
    return "Clear"


def get_weather(lat: float, lon: float) -> dict | None:
    """
    Fetch current weather for a location from OpenWeatherMap.

    Returns dict with keys:
        temp, feels_like, humidity, wind_speed, visibility,
        condition (Suraksha category), description, icon,
        owm_code, is_severe, alert_text
    """
    api_key = os.getenv("OPENWEATHER_API_KEY", "")
    if not api_key:
        return None

    # Cache lookup (round to ~1 km precision)
    cache_key = f"{lat:.2f},{lon:.2f}"
    if cache_key in _weather_cache:
        ts, cached = _weather_cache[cache_key]
        if time.time() - ts < CACHE_TTL:
            return cached

    try:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": api_key,
            "units": "metric",
        }
        resp = requests.get(url, params=params, timeout=8)
        resp.raise_for_status()
        data = resp.json()

        owm_code = data["weather"][0]["id"]
        condition = _map_condition(owm_code)
        description = data["weather"][0].get("description", "").capitalize()
        icon = data["weather"][0].get("icon", "01d")

        # Determine severity
        is_severe = condition in ("Stormy", "Snowy") or (
            condition == "Rainy" and owm_code in (502, 503, 504, 511, 521, 522)
        )

        alert_text = None
        if is_severe:
            if condition == "Stormy":
                alert_text = "⚡ Storm Warning — Avoid travel if possible"
            elif condition == "Snowy":
                alert_text = "❄️ Snow Alert — Roads may be icy"
            else:
                alert_text = "🌧️ Heavy Rain — Reduced visibility, drive slow"

        result = {
            "temp": round(data["main"]["temp"], 1),
            "feels_like": round(data["main"]["feels_like"], 1),
            "humidity": data["main"]["humidity"],
            "wind_speed": round(data.get("wind", {}).get("speed", 0), 1),
            "visibility": data.get("visibility", 10000),
            "condition": condition,
            "description": description,
            "icon": icon,
            "owm_code": owm_code,
            "is_severe": is_severe,
            "alert_text": alert_text,
        }

        _weather_cache[cache_key] = (time.time(), result)
        return result

    except Exception as e:
        print(f"[WARN] Weather API error: {e}")
        return None


def get_road_condition_from_weather(condition: str) -> str:
    """Map weather condition to likely road condition for the ML model."""
    mapping = {
        "Clear": "Dry",
        "Cloudy": "Dry",
        "Rainy": "Wet",
        "Foggy": "Wet",
        "Stormy": "Slippery",
        "Snowy": "Slippery",
    }
    return mapping.get(condition, "Dry")
