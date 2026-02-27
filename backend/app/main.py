from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import requests
import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env", override=True)

app = FastAPI(title="Suraksha-Net AI", version="1.0.0")

# --------------------------------------------------
# 1. CORS – allow React dev server
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",   # Vite uses 5174 when 5173 is taken
        "http://localhost:5175",   # fallback if needed
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# 2. Include the ML routes router
# --------------------------------------------------
from app.api import routes as api_routes
app.include_router(api_routes.router, prefix="/api")

# --------------------------------------------------
# 3. Load Dataset (path from .env with sensible default)
# --------------------------------------------------
CSV_PATH = os.getenv("ACCIDENTS_CSV_PATH", r"D:\final_merged_accidents.csv")
try:
    df = pd.read_csv(CSV_PATH)
except FileNotFoundError:
    raise RuntimeError(
        f"Accident CSV not found at '{CSV_PATH}'. "
        "Set the ACCIDENTS_CSV_PATH variable in your .env file."
    )

# --------------------------------------------------
# 4. Request Schema
# --------------------------------------------------
class RouteRequest(BaseModel):
    start: str
    end: str


# --------------------------------------------------
# 5. Helper: geocode a place name via Nominatim
# --------------------------------------------------
def get_coords(location_name: str):
    """Converts a place name to (lat, lng) via OpenStreetMap Nominatim."""
    url = (
        f"https://nominatim.openstreetmap.org/search"
        f"?q={location_name}&format=json&limit=1"
    )
    headers = {"User-Agent": "SurakshaNet-App"}
    try:
        response = requests.get(url, headers=headers, timeout=10).json()
        if response:
            return float(response[0]["lat"]), float(response[0]["lon"])
    except Exception:
        pass
    return None


# --------------------------------------------------
# 5b. Helper: reverse geocode lat/lng → place name
#     Uses Nominatim. Results are cached in memory so
#     repeated coords (same hotspot) don't hit the API.
# --------------------------------------------------
_rev_cache: dict[str, str] = {}   # "lat3,lng3" → human name

def reverse_geocode(lat: float, lng: float, fallback: str = "") -> str:
    """
    Returns a human-readable location name for a coordinate.

    Priority:
      1. In-memory cache  → instant return
      2. Mappls reverse geocode → accurate Indian road/locality names
      3. Nominatim (OSM)  → fallback if Mappls fails or key is missing
      4. CSV city name    → last resort

    Coordinates are rounded to 3 d.p. (~111 m) so nearby points share cache.
    """
    key = f"{lat:.3f},{lng:.3f}"
    if key in _rev_cache:
        return _rev_cache[key]

    # Mappls first — better locality/road names for India
    name = _mappls_reverse(lat, lng)

    # Nominatim as fallback
    if not name:
        name = _nominatim_reverse(lat, lng)

    # Final fallback → CSV city name or bare coordinates
    if not name:
        name = fallback or f"{lat:.4f}, {lng:.4f}"

    _rev_cache[key] = name
    return name


def _nominatim_reverse(lat: float, lng: float) -> str:
    """Calls Nominatim reverse endpoint. Returns '' on failure."""
    url = (
        f"https://nominatim.openstreetmap.org/reverse"
        f"?lat={lat}&lon={lng}&format=json&addressdetails=1"
    )
    headers = {"User-Agent": "SurakshaNet-App"}
    try:
        data = requests.get(url, headers=headers, timeout=6).json()
        addr = data.get("address", {})

        # Build a short human-friendly name: Road + locality + district
        parts = []
        road = addr.get("road") or addr.get("highway") or addr.get("path")
        if road:
            parts.append(road)
        locality = (
            addr.get("suburb") or addr.get("neighbourhood") or
            addr.get("village") or addr.get("town") or addr.get("city")
        )
        if locality:
            parts.append(locality)
        district = addr.get("state_district") or addr.get("county")
        if district and district not in parts:
            parts.append(district)

        return ", ".join(parts) if parts else data.get("display_name", "")[:60]
    except Exception:
        return ""


def _mappls_reverse(lat: float, lng: float) -> str:
    """Calls Mappls (MapmyIndia) reverse geocode. Returns '' on failure."""
    api_key = os.getenv("MAPPLS_API_KEY", "")
    if not api_key:
        return ""
    url = (
        f"https://apis.mappls.com/advancedmaps/v1/{api_key}/rev_geocode"
        f"?lat={lat}&lng={lng}"
    )
    try:
        data = requests.get(url, timeout=6).json()
        results = data.get("results", [])
        if results:
            r = results[0]
            parts = filter(None, [
                r.get("locality"), r.get("district"), r.get("state")
            ])
            return ", ".join(parts)
    except Exception:
        pass
    return ""



# --------------------------------------------------
# 6. Helper: get road route from OSRM
# --------------------------------------------------
def get_route_details(start_coords, end_coords):
    """Fetches the driving path and travel time from the OSRM public API."""
    url = (
        f"http://router.project-osrm.org/route/v1/driving/"
        f"{start_coords[1]},{start_coords[0]};"
        f"{end_coords[1]},{end_coords[0]}"
        f"?overview=full&geometries=geojson"
    )
    try:
        response = requests.get(url, timeout=15).json()
        if response.get("code") == "Ok":
            route = response["routes"][0]
            # OSRM returns [lng, lat] → convert to [lat, lng] for Leaflet
            geometry = [[p[1], p[0]] for p in route["geometry"]["coordinates"]]
            duration_mins = round(route["duration"] / 60)
            return geometry, duration_mins
    except Exception:
        pass
    return [], 0


# --------------------------------------------------
# 6b. Helper: corridor distance filter
# --------------------------------------------------
def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Returns the great-circle distance in km between two lat/lng points."""
    R = 6371.0
    dlat = np.radians(lat2 - lat1)
    dlng = np.radians(lng2 - lng1)
    a = np.sin(dlat / 2) ** 2 + np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * np.sin(dlng / 2) ** 2
    return R * 2 * np.arcsin(np.sqrt(a))


def _point_to_segment_dist_km(
    plat: float, plng: float,
    alat: float, alng: float,
    blat: float, blng: float,
) -> float:
    """
    Minimum great-circle distance (km) from point P to line segment A→B.
    Uses a flat-earth approximation on small scales (< 50 km) which is
    accurate enough for route-corridor filtering.
    """
    # Convert to a simple x/y plane in degrees (good enough for ~50 km range)
    ax, ay = alng, alat
    bx, by = blng, blat
    px, py = plng, plat

    abx, aby = bx - ax, by - ay
    apx, apy = px - ax, py - ay
    ab2 = abx * abx + aby * aby

    if ab2 == 0:
        # Degenerate segment (A == B)
        return _haversine_km(plat, plng, alat, alng)

    t = max(0.0, min(1.0, (apx * abx + apy * aby) / ab2))
    closest_lat = alat + t * (blat - alat)
    closest_lng = alng + t * (blng - alng)
    return _haversine_km(plat, plng, closest_lat, closest_lng)


def filter_accidents_by_corridor(
    accidents_df: pd.DataFrame,
    route_geometry: list,
    corridor_km: float = 0.5,
) -> pd.DataFrame:
    """
    Returns only the rows whose (Latitude, Longitude) lie within
    `corridor_km` kilometres of any segment of `route_geometry`.

    Falls back to a generous bounding-box pre-filter first for speed,
    then does the precise segment check only on candidates.
    """
    if not route_geometry or len(route_geometry) < 2:
        return accidents_df.iloc[0:0]  # empty

    lats = [p[0] for p in route_geometry]
    lngs = [p[1] for p in route_geometry]
    pad = corridor_km / 111.0  # ~1 degree ≈ 111 km

    bbox_mask = (
        (accidents_df["Latitude"] >= min(lats) - pad) &
        (accidents_df["Latitude"] <= max(lats) + pad) &
        (accidents_df["Longitude"] >= min(lngs) - pad) &
        (accidents_df["Longitude"] <= max(lngs) + pad)
    )
    candidates = accidents_df[bbox_mask]

    if candidates.empty:
        return candidates

    def within_corridor(row):
        plat, plng = row["Latitude"], row["Longitude"]
        for i in range(len(route_geometry) - 1):
            a = route_geometry[i]
            b = route_geometry[i + 1]
            dist = _point_to_segment_dist_km(plat, plng, a[0], a[1], b[0], b[1])
            if dist <= corridor_km:
                return True
        return False

    mask = candidates.apply(within_corridor, axis=1)
    return candidates[mask]


# --------------------------------------------------
# 7. Helper: build segmented path with risk colours
# --------------------------------------------------
def build_segmented_path(route_geometry: list, nearby_accidents: pd.DataFrame) -> list:
    """
    Splits the route geometry into segments and assigns a risk score
    to each segment based on nearby accident data.
    """
    if not route_geometry or len(route_geometry) < 2:
        return []

    segments = []
    step = max(1, len(route_geometry) // 20)  # ~20 segments max

    for i in range(0, len(route_geometry) - step, step):
        seg_start = route_geometry[i]
        seg_end = route_geometry[i + step]
        mid_lat = (seg_start[0] + seg_end[0]) / 2
        mid_lng = (seg_start[1] + seg_end[1]) / 2

        # Count accidents within 0.5 km of the midpoint
        mask = (
            (df["Latitude"].between(mid_lat - 0.005, mid_lat + 0.005)) &
            (df["Longitude"].between(mid_lng - 0.005, mid_lng + 0.005))
        )
        local_risk = float(df[mask]["Risk_Score"].mean()) if not df[mask].empty else 0.0

        segments.append({
            "coords": [seg_start, seg_end],
            "risk": round(local_risk, 1),
        })

    return segments


# --------------------------------------------------
# 8. Main Endpoint
# --------------------------------------------------
@app.post("/api/analyze-route")
async def analyze_route(request: RouteRequest):
    # Step 1 – geocode
    start_coords = get_coords(request.start)
    end_coords = get_coords(request.end)

    if not start_coords or not end_coords:
        raise HTTPException(status_code=400, detail="Could not find location coordinates")

    # Step 2 – road path
    route_geometry, travel_time = get_route_details(start_coords, end_coords)

    # Step 3 – filter accidents to the route corridor (≤0.5 km from actual path)
    # Falls back to start/end bounding box if no route geometry was returned.
    if route_geometry and len(route_geometry) >= 2:
        corridor_df = filter_accidents_by_corridor(df, route_geometry, corridor_km=0.5)
    else:
        # No route — graceful fallback to tight bounding box
        min_lat, max_lat = sorted([start_coords[0], end_coords[0]])
        min_lng, max_lng = sorted([start_coords[1], end_coords[1]])
        mask = (
            (df["Latitude"] >= min_lat - 0.05) & (df["Latitude"] <= max_lat + 0.05) &
            (df["Longitude"] >= min_lng - 0.05) & (df["Longitude"] <= max_lng + 0.05)
        )
        corridor_df = df[mask]
    nearby_accidents = corridor_df.nlargest(10, "Risk_Score")

    # Step 4 – format accident points
    accident_points = []
    high_risk_locs = []

    # Reverse-geocode all hotspot coords in PARALLEL so we don't block serially
    from concurrent.futures import ThreadPoolExecutor, as_completed

    rows = list(nearby_accidents.iterrows())

    def enrich_row(item):
        i, row = item
        lat, lng = row["Latitude"], row["Longitude"]
        csv_city = str(row["City"])
        # Real street-level name from Nominatim → Mappls → CSV fallback
        place = reverse_geocode(lat, lng, fallback=csv_city)
        return i, row, place

    # Run up to 5 geocode requests at once (Nominatim rate-limit friendly)
    enriched = {}
    with ThreadPoolExecutor(max_workers=5) as pool:
        futs = {pool.submit(enrich_row, item): item for item in rows}
        for fut in as_completed(futs):
            try:
                idx, row, place = fut.result()
                enriched[idx] = (row, place)
            except Exception:
                pass   # silently keep CSV fallback

    for i, row in nearby_accidents.iterrows():
        row_data, place_name = enriched.get(i, (row, str(row["City"])))
        accident_points.append({
            "id": str(i),
            "lat": row["Latitude"],
            "lng": row["Longitude"],
            "severity": "high" if row["Risk_Score"] > 15 else "medium",
            "accidents": 1,
            "description": f"Risk Score: {row['Risk_Score']} in {row['City']}",
            # Enriched — e.g. "NH-48, Khopoli, Raigad District"
            "place_name": place_name,
            "Risk_Score": float(row["Risk_Score"]),
            "City": str(row["City"]),
            "Road_Condition": str(row.get("Road_Condition", "")),
        })
        high_risk_locs.append({
            "id": str(i),
            "name": place_name,           # real name instead of "Area near Pune"
            "riskLevel": "high" if row["Risk_Score"] > 15 else "medium",
            "accidents": int(row["Risk_Score"]),
            "distance": "Nearby",
        })

    # Step 5 – aggregate risk AFTER the loop
    avg_risk = nearby_accidents["Risk_Score"].mean() if not nearby_accidents.empty else 0
    safety_score = max(0, 100 - int(avg_risk))
    risk_level = (
        "High" if safety_score < 40
        else "Moderate" if safety_score < 70
        else "Safe"
    )

    # Step 6 – build segmented path for map colour-coding
    segmented_path = build_segmented_path(route_geometry, nearby_accidents)

    return {
        "safety_score": safety_score,
        "risk_level": risk_level,
        "start_coords": list(start_coords),
        "end_coords": list(end_coords),
        "route_geometry": route_geometry,
        "travel_time": travel_time,
        "accident_points": accident_points,
        "high_risk_locations": high_risk_locs,
        "total_accidents": len(nearby_accidents),
        "segmented_path": segmented_path,   # ← was missing before
    }


# --------------------------------------------------
# 9. Health check
# --------------------------------------------------
@app.get("/")
async def health_check():
    return {
        "status": "online",
        "service": "Suraksha-Net Backend",
        "csv_loaded": not df.empty,
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)