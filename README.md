# 🛡️ Suraksha-Net: India's Proactive Road Safety System

Suraksha-Net is an AI-powered platform that identifies accident "Greyspots" 
in Indian metropolitan cities using XGBoost and real-time weather integration.

## 🚀 Quick Start
1. **Backend**: 
   - `cd backend && pip install -r requirements.txt`
   - `uvicorn app.main:app --reload`
2. **Frontend**:
   - `cd frontend && npm install`
   - `npm run dev`

## 🛠️ Tech Stack
- **Frontend**: React + Leaflet.js (Heatmaps)
- **Backend**: FastAPI + Scikit-Learn (ML)
- **Data**: iRAD, Kaggle (India Road Accident Datasets)
