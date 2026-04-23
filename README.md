# 🛡️ Suraksha-Net: India's Proactive Road Safety System

[![CI](https://github.com/Rajdeep-017/suraksha-net/actions/workflows/ci.yml/badge.svg)](https://github.com/Rajdeep-017/suraksha-net/actions/workflows/ci.yml)
[![Deploy](https://github.com/Rajdeep-017/suraksha-net/actions/workflows/deploy.yml/badge.svg)](https://github.com/Rajdeep-017/suraksha-net/actions/workflows/deploy.yml)

Suraksha-Net is an AI-powered platform that identifies accident "Greyspots"
in Indian metropolitan cities using XGBoost and real-time weather integration.

## 🚀 Quick Start

### Local Development
1. **Backend**:
   ```bash
   cd backend && pip install -r requirments.txt
   uvicorn app.main:app --reload
   ```
2. **Frontend**:
   ```bash
   cd frontend && npm install --legacy-peer-deps
   npm run dev
   ```

### Docker
```bash
docker compose up --build
```
The app will be available at `http://localhost:8000`.

## 🛠️ Tech Stack
- **Frontend**: React + TypeScript + Vite + Leaflet.js (Heatmaps)
- **Backend**: FastAPI + Scikit-Learn / XGBoost (ML)
- **Data**: iRAD, Kaggle (India Road Accident Datasets)
- **CI/CD**: GitHub Actions → GHCR (Docker)

## 🔄 CI/CD Pipeline

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| **CI** | Push / PR to `main` | Lint + type-check + build frontend, lint backend with Ruff, validate Docker image |
| **Deploy** | Push to `main` / manual | Build & push Docker image to GitHub Container Registry |

### Pull the latest image
```bash
docker pull ghcr.io/rajdeep-017/suraksha-net:latest
```
