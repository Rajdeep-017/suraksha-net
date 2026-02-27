import os
import requests
import numpy as np
import joblib
from datetime import datetime
import polyline
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

# -------------------------------
# Load Saved ML Artifacts
# -------------------------------
# Using relative paths or absolute paths as per your project structure
BASE_PATH = os.path.dirname(os.path.dirname(__file__)) # Pointing to backend/app
MODEL_DIR = os.path.join(BASE_PATH, "models")

model = joblib.load(os.path.join(MODEL_DIR, "severity_model.pkl"))
encoders = joblib.load(os.path.join(MODEL_DIR, "encoders.pkl"))
severity_encoder = joblib.load(os.path.join(MODEL_DIR, "severity_encoder.pkl"))
coord_scaler = joblib.load(os.path.join(MODEL_DIR, "coord_scaler.pkl"))
kmeans = joblib.load(os.path.join(MODEL_DIR, "kmeans_hotspots.pkl"))

MAPPLS_API_KEY = os.getenv("MAPPLS_API_KEY")
if not MAPPLS_API_KEY:
    raise ValueError(
        "MAPPLS_API_KEY is not set. Add it to your backend/.env file. "
        "Get a free key from https://apis.mappls.com/"
    )

# --------------------------------------------------
# Feature Engineering for ML Prediction
# (must match train.py's 15-feature FEATURES list)
# --------------------------------------------------
_ROAD_RISK = {"Slippery":4, "Potholed":3, "Under Construction":3, "Wet":2, "Dry":1, "Good":1}
_TIME_RISK = {"Late Night":3, "Night":2, "Morning Rush":2, "Evening Rush":2, "Afternoon":1, "Midday":1}
_WEATHER_SEV = {"Clear":1, "Cloudy":1, "Rainy":3, "Foggy":2, "Stormy":4, "Hail":4, "Snowy":3}

def _safe_enc(key, value):
    try:
        return int(encoders[key].transform([value])[0])
    except (ValueError, KeyError):
        return 0

def _time_bin(hour):
    if 6 <= hour < 10:   return "Morning Rush"
    if 10 <= hour < 12:  return "Midday"
    if 12 <= hour < 16:  return "Afternoon"
    if 16 <= hour < 20:  return "Evening Rush"
    if 20 <= hour < 23:  return "Night"
    return "Late Night"

def _day_night(hour):
    return "Nighttime" if hour >= 20 or hour < 6 else "Daytime"

def prepare_features(lat, lon, city, weather="Clear", road_condition="Dry"):
    """Builds a 15-feature vector matching train.py's FEATURES order."""
    now = datetime.now()
    hour = now.hour
    tb = _time_bin(hour)
    dn = _day_night(hour)

    weather_enc   = _safe_enc("Weather", weather)
    road_enc      = _safe_enc("Road_Condition", road_condition)
    time_bin_enc  = _safe_enc("Time_Bin", tb)
    day_night_enc = _safe_enc("Day_Night", dn)

    weather_sev  = _WEATHER_SEV.get(weather, 2)
    traffic_dens = 5   # medium — unknown at prediction time
    road_risk_n  = _ROAD_RISK.get(road_condition, 2)
    time_risk_n  = _TIME_RISK.get(tb, 1)
    is_night     = 1 if dn == "Nighttime" else 0
    w_road_risk  = weather_sev * road_risk_n

    # Casualty fields = 0 at inference (they're outcomes, not inputs)
    return [[
        weather_enc, road_enc, time_bin_enc, day_night_enc,
        weather_sev, traffic_dens, road_risk_n, time_risk_n,
        is_night, w_road_risk,
        0, 0,  # casualty_severity_idx, total_casualties
        0, 0, 0,  # fatalities, serious_injuries, minor_injuries
    ]]

def predict_risk(lat, lon, city):
    features = prepare_features(lat, lon, city)
    proba = model.predict_proba(features)[0]

    try:
        high_index = list(severity_encoder.classes_).index("High")
        return float(proba[high_index])
    except ValueError:
        return 0.5

# --------------------------------------------------
# Route Risk Calculation
# --------------------------------------------------

def calculate_route_risk(polyline_str, city):
    # Mappls uses standard polyline encoding
    coordinates = polyline.decode(polyline_str)

    # Performance optimization: sample points to avoid lag
    # Longer routes = sparser sampling
    sample_interval = max(1, len(coordinates) // 20) 
    sampled_coords = coordinates[::sample_interval]

    risks = []
    for lat, lon in sampled_coords:
        risk = predict_risk(lat, lon, city)
        risks.append(risk)

    if not risks:
        return 1.0 # Max risk if no data

    return float(np.mean(risks))

# --------------------------------------------------
# Mappls Directions API Call
# --------------------------------------------------

def get_safer_route(origin_lat, origin_lon, dest_lat, dest_lon, city):
    # Mappls Advanced Routing URL
    url = f"https://apis.mappls.com/advancedmaps/v1/{MAPPLS_API_KEY}/route_adv/driving/{origin_lon},{origin_lat};{dest_lon},{dest_lat}"

    params = {
        "alternatives": "true",
        "overview": "full",
        "geometries": "polyline"
    }

    response = requests.get(url, params=params)
    data = response.json()

    if "routes" not in data or not data["routes"]:
        raise Exception(f"Mappls API Error: {data.get('error_description', 'No routes found')}")

    routes = data["routes"]
    route_scores = []

    for route in routes:
        polyline_str = route.get("geometry", "")
        if not polyline_str:
            continue

        avg_risk = calculate_route_risk(polyline_str, city)

        # ── Distance & Duration ─────────────────────────────────────────────
        legs = route.get("legs", [])
        if legs:
            raw_dist = legs[0].get("distance", 0) or route.get("distance", 0)
            raw_dur  = legs[0].get("duration", 0) or route.get("duration", 0)
        else:
            raw_dist = route.get("distance", 0)
            raw_dur  = route.get("duration", 0)

        # Last-resort: estimate distance from decoded polyline coords
        if raw_dist == 0 and polyline_str:
            coords = polyline.decode(polyline_str)
            raw_dist = sum(
                ((coords[i][0] - coords[i-1][0])**2 + (coords[i][1] - coords[i-1][1])**2)**0.5 * 111_000
                for i in range(1, len(coords))
            )

        dist_km      = raw_dist / 1000
        duration_min = raw_dur / 60

        # Route name: use waypoints summary if available
        legs_summary = legs[0].get("summary", "") if legs else ""
        route_name = (
            f"Via {legs_summary}" if legs_summary
            else f"Via {route.get('summary', 'Major Road')}"
        )

        # ── Turn-by-turn steps ──────────────────────────────────────────────
        # Mappls returns legs[0]['steps'] with maneuvers: turn type, road name,
        # distance, duration. We extract a clean list for the frontend.
        route_steps = []
        for step in (legs[0].get("steps", []) if legs else []):
            maneuver = step.get("maneuver", {})
            step_dist_m = step.get("distance", 0)
            step_dur_s  = step.get("duration", 0)
            instruction  = maneuver.get("instruction") or maneuver.get("type", "")
            modifier     = maneuver.get("modifier", "")
            road_name    = step.get("name") or step.get("ref", "")
            bearings     = maneuver.get("bearing_after", None)

            # Build a human-readable label
            if modifier:
                label = f"{instruction.capitalize()} {modifier}"
            else:
                label = instruction.capitalize()
            if road_name and road_name not in label:
                label = f"{label} onto {road_name}"

            # Tag special maneuvers (flyover / highway / roundabout)
            tags = []
            m_type = maneuver.get("type", "").lower()
            if "roundabout" in m_type:
                tags.append("roundabout")
            if road_name and any(k in road_name.lower() for k in ["nh", "sh", "highway", "expressway", "flyover", "bridge"]):
                tags.append("highway")

            route_steps.append({
                "instruction": label or "Continue",
                "distance": f"{step_dist_m:.0f} m" if step_dist_m < 1000 else f"{step_dist_m/1000:.1f} km",
                "duration": f"{int(step_dur_s / 60)} min" if step_dur_s >= 60 else f"{int(step_dur_s)} s",
                "type": maneuver.get("type", "continue"),
                "modifier": modifier,
                "road": road_name,
                "bearing": bearings,
                "tags": tags,
            })

        # ── Peak-hour traffic info ─────────────────────────────────────────
        hour = datetime.now().hour
        if 7 <= hour < 10:
            traffic_info = "🔴 Heavy traffic · Morning Rush"
            is_peak_hour = True
        elif 17 <= hour < 20:
            traffic_info = "🔴 Heavy traffic · Evening Rush"
            is_peak_hour = True
        elif 11 <= hour < 16:
            traffic_info = "🟡 Moderate traffic"
            is_peak_hour = False
        elif 20 <= hour < 23:
            traffic_info = "🟡 Moderate traffic · Night"
            is_peak_hour = False
        else:
            traffic_info = "🟢 Light traffic"
            is_peak_hour = False

        # Decode polyline to [[lat, lng], ...] for map rendering
        decoded_geometry = [[lat, lng] for lat, lng in polyline.decode(polyline_str)]

        route_scores.append({
            "name": route_name,
            "average_risk": round(avg_risk, 3),
            "distance": f"{dist_km:.2f} km",
            "duration": f"{int(duration_min)} mins",
            "polyline": polyline_str,
            "risk_percentage": f"{int(avg_risk * 100)}%",
            "steps": route_steps,
            "route_geometry": decoded_geometry,
            "traffic_info": traffic_info,
            "is_peak_hour": is_peak_hour,
        })

    # Weighted Ranking: 70% Safety vs 30% Distance — safest route first
    for r in route_scores:
        dist_val = float(r["distance"].split()[0])
        r["final_score"] = (r["average_risk"] * 100 * 0.7) + (dist_val * 0.3)

    sorted_routes = sorted(route_scores, key=lambda x: x["final_score"])

    return {
        "recommended_safe_path": sorted_routes[0],
        "alternatives": sorted_routes[1:]
    }