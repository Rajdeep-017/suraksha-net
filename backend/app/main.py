# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.routes import router as accident_router
# import pandas as pd

# app = FastAPI(title="Suraksha-Net API")

# # Enable CORS for React Frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], # In production, replace with your frontend URL
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Load data once on startup for the visualization
# ACCIDENT_DATA = pd.read_csv("D:/india_metro_accidents_2000.csv").to_dict(orient="records")

# @app.get("/")
# def read_root():
#     return {"message": "Suraksha-Net Backend is Running"}

# @app.get("/api/accidents")
# def get_accidents():
#     """Returns all historical accident points for the heatmap."""
#     return ACCIDENT_DATA

# # Include the ML Prediction routes we wrote earlier
# app.include_router(accident_router, prefix="/api")

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from app.api import routes # Assuming your routes are in app/api/routes.py
# import uvicorn
# import os
# from dotenv import load_dotenv
# from .api import routes
# # Load environmental variables (API Keys, etc.)
# load_dotenv()

# app = FastAPI(
#     title="Suraksha-Net AI",
#     description="AI-powered Road Safety & Navigation System for India",
#     version="1.0.0"
# )

# # --------------------------------------------------
# # 1. CORS Configuration (Vital for React Integration)
# # --------------------------------------------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], # In production, replace "*" with your React URL
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --------------------------------------------------
# # 2. Include Routing
# # --------------------------------------------------
# # Prefixing with /api helps keep things organized
# app.include_router(routes.router, prefix="/api")

# @app.get("/")
# async def health_check():
#     return {
#         "status": "online",
#         "service": "Suraksha-Net Backend",
#         "model_version": "v1_XGBoost"
#     }

# # --------------------------------------------------
# # 3. Execution Logic
# # --------------------------------------------------
# if __name__ == "__main__":
#     port = int(os.getenv("PORT", 8000))
#     uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)

# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# import uvicorn
# import os
# from dotenv import load_dotenv

# # 1. Cleaned Import: Only one way to import routes
# # We use 'from app.api import routes' if running from the /backend directory
# try:
#     from app.api import routes 
# except ImportError:
#     from .api import routes

# load_dotenv()

# app = FastAPI(
#     title="Suraksha-Net AI",
#     description="AI-powered Road Safety & Navigation System for India",
#     version="1.0.0"
# )

# # --------------------------------------------------
# # 1. CORS Configuration
# # --------------------------------------------------
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"], 
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --------------------------------------------------
# # 2. Include Routing
# # --------------------------------------------------
# app.include_router(routes.router, prefix="/api")

# @app.get("/")
# async def health_check():
#     # Adding model check to health status
#     model_exists = os.path.exists(os.path.join("app", "models", "severity_model.pkl"))
#     return {
#         "status": "online",
#         "service": "Suraksha-Net Backend",
#         "model_loaded": model_exists,
#         "model_version": "v1_XGBoost"
#     }

# # --------------------------------------------------
# # 3. Execution Logic
# # --------------------------------------------------
# if __name__ == "__main__":
#     # Note: When using uvicorn.run("main:app"), 
#     # it expects main.py to be in the folder you are running from.
#     port = int(os.getenv("PORT", 8000))
#     uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import requests
import uvicorn
import os
from dotenv import load_dotenv

app = FastAPI()

# 1. Enable CORS so your React app can talk to Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the dataset you uploaded
df = pd.read_csv(r'D:\final_merged_accidents.csv')

class RouteRequest(BaseModel):
    start: str
    end: str

def get_coords(location_name: str):
    """Converts a name like 'Pune Station' to Lat/Long using OpenStreetMap"""
    url = f"https://nominatim.openstreetmap.org/search?q={location_name}&format=json&limit=1"
    headers = {'User-Agent': 'SurakshaNet-App'}
    response = requests.get(url, headers=headers).json()
    if response:
        return float(response[0]['lat']), float(response[0]['lon'])
    return None
def get_route_details(start_coords, end_coords):
    """Fetches road path and travel time from OSRM"""
    url = f"http://router.project-osrm.org/route/v1/driving/{start_coords[1]},{start_coords[0]};{end_coords[1]},{end_coords[0]}?overview=full&geometries=geojson"
    response = requests.get(url).json()
    
    if response['code'] == 'Ok':
        route = response['routes'][0]
        # OSRM returns [lng, lat], we need [lat, lng] for Leaflet
        geometry = [[p[1], p[0]] for p in route['geometry']['coordinates']]
        duration_mins = round(route['duration'] / 60) # Convert seconds to minutes
        return geometry, duration_mins
    return [], 0
@app.post("/api/analyze-route")
async def analyze_route(request: RouteRequest):
    # 1. Convert names to Coordinates
    start_coords = get_coords(request.start)
    end_coords = get_coords(request.end)

    if not start_coords or not end_coords:
        raise HTTPException(status_code=400, detail="Could not find location coordinates")
    route_geometry, travel_time = get_route_details(start_coords, end_coords)
    # 2. Find real accidents from your CSV near the route
    # (Simple logic: find accidents within the bounding box of the start/end)
    min_lat, max_lat = sorted([start_coords[0], end_coords[0]])
    min_lng, max_lng = sorted([start_coords[1], end_coords[1]])
    
    # Filter dataset for points near this route
    mask = (df['Latitude'] >= min_lat - 0.1) & (df['Latitude'] <= max_lat + 0.1) & \
           (df['Longitude'] >= min_lng - 0.1) & (df['Longitude'] <= max_lng + 0.1)
    nearby_accidents = df[mask].nlargest(10, 'Risk_Score')

    # 3. Format response for your Frontend
    accident_points = []
    high_risk_locs = []
    
    for i, row in nearby_accidents.iterrows():
        accident_points.append({
            "id": str(i),
            "lat": row['Latitude'],
            "lng": row['Longitude'],
            "severity": "high" if row['Risk_Score'] > 15 else "medium",
            "accidents": 1,
            "description": f"Risk Score: {row['Risk_Score']} in {row['City']}"
        })
        
        high_risk_locs.append({
            "id": str(i),
            "name": f"Area near {row['City']}",
            "riskLevel": "high" if row['Risk_Score'] > 15 else "medium",
            "accidents": int(row['Risk_Score']),
            "distance": "Nearby"
        })
        avg_risk = nearby_accidents['Risk_Score'].mean() if not nearby_accidents.empty else 0
    score = max(0, 100 - int(avg_risk))
    level = "High" if len(nearby_accidents) > 5 else "Safe"
    return {
        "safety_score": score,
        "risk_level": level,
        "start_coords": start_coords, # [lat, lng]
        "end_coords": end_coords,     # [lat, lng]
        "route_geometry": route_geometry, # Full list of road points
        "travel_time": travel_time,
        "accident_points": accident_points,
        "high_risk_locations": high_risk_locs,
        "total_accidents": len(nearby_accidents)
    }

    # return {
    #     "safety_score": max(0, 100 - int(nearby_accidents['Risk_Score'].mean() or 0)),
    #     "risk_level": "High" if len(nearby_accidents) > 5 else "Safe",
    #     "total_accidents": len(nearby_accidents),
    #     "accident_points": accident_points,
    #     "high_risk_locations": high_risk_locs
    # }
    # return {
    #     "safety_score": score,
    #     "risk_level": level,
    #     "start_coords": [start_lat, start_lng], # The Map uses this for the start of the path
    #     "end_coords": [end_lat, end_lng],     # The Map uses this for the end of the path
    #     "accident_points": accident_points,   # These are the Red Dots
    #     "total_accidents": len(accident_points)
    # }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)