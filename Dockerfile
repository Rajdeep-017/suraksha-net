# ============================================
# Suraksha-Net: Multi-stage Dockerfile
# ============================================

# ── Stage 1: Build Frontend ────────────────────
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Install dependencies first (for layer caching)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python Backend + Serve Frontend ───
FROM python:3.11-slim

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirments.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend into a static directory
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create a .env template (overridden at runtime via docker-compose or -e)
RUN echo "# Suraksha-Net Docker Environment" > ./backend/.env

# Expose backend port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Run the application
CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
