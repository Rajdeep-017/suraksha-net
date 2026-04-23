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

### Docker (Self-hosted)
```bash
docker compose up --build
```

## 🛠️ Tech Stack
- **Frontend**: React + TypeScript + Vite + Leaflet.js
- **Backend**: FastAPI + Scikit-Learn / XGBoost
- **Data**: iRAD, Kaggle (India Road Accident Datasets)
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (frontend) + Render (backend)

## 🌐 Deployment Architecture

```
GitHub Push → CI (lint, build, test)
                ├─→ Vercel   (frontend SPA)
                ├─→ Render   (FastAPI backend)
                └─→ GHCR     (Docker image)
```

| Platform | What | Auto-deploy |
|----------|------|-------------|
| **Vercel** | Frontend (React SPA) | ✅ On push to `main` |
| **Render** | Backend API (FastAPI) | ✅ On push to `main` |
| **GHCR** | Docker image (full-stack) | ✅ Via GitHub Actions |

## 🔧 Deployment Setup

### 1. Backend → Render
1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repo (`Rajdeep-017/suraksha-net`)
3. Render will auto-detect `render.yaml` and configure the service
4. Set these **environment variables** in the Render dashboard:
   - `ACCIDENTS_CSV_PATH` — path to your CSV
   - `CORS_ORIGINS` — your Vercel URL (e.g. `https://suraksha-net.vercel.app`)
   - `MAPPLS_API_KEY`, `GROQ_API_KEY`, `OPENWEATHER_API_KEY`, `SECRET_KEY`
5. Copy the Render service URL (e.g. `https://suraksha-net-api.onrender.com`)

### 2. Frontend → Vercel
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import `Rajdeep-017/suraksha-net`
3. Set **Root Directory** to `frontend`
4. Set **Environment Variable**:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://suraksha-net-api.onrender.com`)
5. Deploy!

### 3. Connect them
- In **Render** dashboard, set `CORS_ORIGINS` to your Vercel URL
- In **Vercel** dashboard, set `VITE_API_URL` to your Render URL
