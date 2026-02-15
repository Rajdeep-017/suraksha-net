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

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# 1. Cleaned Import: Only one way to import routes
# We use 'from app.api import routes' if running from the /backend directory
try:
    from app.api import routes 
except ImportError:
    from .api import routes

load_dotenv()

app = FastAPI(
    title="Suraksha-Net AI",
    description="AI-powered Road Safety & Navigation System for India",
    version="1.0.0"
)

# --------------------------------------------------
# 1. CORS Configuration
# --------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# 2. Include Routing
# --------------------------------------------------
app.include_router(routes.router, prefix="/api")

@app.get("/")
async def health_check():
    # Adding model check to health status
    model_exists = os.path.exists(os.path.join("app", "models", "severity_model.pkl"))
    return {
        "status": "online",
        "service": "Suraksha-Net Backend",
        "model_loaded": model_exists,
        "model_version": "v1_XGBoost"
    }

# --------------------------------------------------
# 3. Execution Logic
# --------------------------------------------------
if __name__ == "__main__":
    # Note: When using uvicorn.run("main:app"), 
    # it expects main.py to be in the folder you are running from.
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)