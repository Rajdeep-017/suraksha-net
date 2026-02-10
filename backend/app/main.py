from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router as accident_router
import pandas as pd

app = FastAPI(title="Suraksha-Net API")

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data once on startup for the visualization
ACCIDENT_DATA = pd.read_csv("D:/india_metro_accidents_2000.csv").to_dict(orient="records")

@app.get("/")
def read_root():
    return {"message": "Suraksha-Net Backend is Running"}

@app.get("/api/accidents")
def get_accidents():
    """Returns all historical accident points for the heatmap."""
    return ACCIDENT_DATA

# Include the ML Prediction routes we wrote earlier
app.include_router(accident_router, prefix="/api")