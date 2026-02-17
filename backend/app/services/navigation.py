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

# --------------------------------------------------
# Feature Engineering for ML Prediction
# --------------------------------------------------

def prepare_features(lat, lon, city, weather="Clear", road_condition="Dry"):
    now = datetime.now()
    hour = now.hour
    month = now.month
    day_of_week = now.weekday()

    # Cyclical encoding
    hour_sin = np.sin(2 * np.pi * hour / 23.0)
    hour_cos = np.cos(2 * np.pi * hour / 23.0)

    # Robust Encoding with fallback for unknown categories
    try:
        city_encoded = encoders["City"].transform([city])[0]
    except (ValueError, KeyError):
        city_encoded = 0 # Fallback
        
    try:
        weather_encoded = encoders["Weather"].transform([weather])[0]
    except (ValueError, KeyError):
        weather_encoded = 0

    try:
        road_encoded = encoders["Road_Condition"].transform([road_condition])[0]
    except (ValueError, KeyError):
        road_encoded = 0

    # Geospatial scaling and Hotspot identification
    coords_scaled = coord_scaler.transform([[lat, lon]])
    hotspot = kmeans.predict(coords_scaled)[0]

    return [[
        lat, lon, city_encoded, weather_encoded, road_encoded,
        hour_sin, hour_cos, month, day_of_week, hotspot
    ]]

def predict_risk(lat, lon, city):
    features = prepare_features(lat, lon, city)
    proba = model.predict_proba(features)[0]

    # Dynamically find the index for "High" risk
    try:
        high_index = list(severity_encoder.classes_).index("High")
        return float(proba[high_index])
    except ValueError:
        return 0.5 # Default if label mismatch occurs

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
    url = f"https://apis.mappls.com/advancedmaps/v1/{MAPPLS_API_KEY}/route_adv/driving/{origin_lat},{origin_lon};{dest_lat},{dest_lon}"

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
        polyline_str = route["geometry"]
        avg_risk = calculate_route_risk(polyline_str, city)

        # Basic Info
        dist_km = route["distance"] / 1000
        duration_min = route["duration"] / 60

        route_scores.append({
            "name": f"Via {route.get('summary', 'Major Road')}",
            "average_risk": round(avg_risk, 3),
            "distance": f"{dist_km:.2f} km",
            "duration": f"{int(duration_min)} mins",
            "polyline": polyline_str,
            "risk_percentage": f"{int(avg_risk * 100)}%"
        })

    # Weighted Ranking: 60% Distance vs 40% Safety
    # (Distance is in meters, so we keep scales consistent)
    for r in route_scores:
        dist_val = float(r["distance"].split()[0])
        # Multiplier to ensure Risk weight is felt against Distance
        r["final_score"] = (dist_val * 0.6) + (r["average_risk"] * 50 * 0.4)

    sorted_routes = sorted(route_scores, key=lambda x: x["final_score"])

    return {
        "recommended_safe_path": sorted_routes[0],
        "alternatives": sorted_routes[1:]
    }