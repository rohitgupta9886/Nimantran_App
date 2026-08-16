# NIMANTRAN AI — Production Deployment Guide

## 1. Local Development Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Docker & Docker Compose (Optional)

### Step 1: Environment File Setup
```bash
cp .env.example .env
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv
# Activate virtual environment:
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python app/db/init_db.py
uvicorn app.main:app --reload --port 8000
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open browser at `http://localhost:5173`. Demo Login: `demo@nimantran.ai` / `password123`.

## 2. Docker Compose One-Command Deployment
```bash
docker-compose up --build -d
```
Services started:
- PostgreSQL on port `5432`
- Redis on port `6379`
- FastAPI Backend on `http://localhost:8000`
- React Frontend on `http://localhost:80`
