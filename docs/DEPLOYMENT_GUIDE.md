# 🐳 Nimantran AI — Docker & Kubernetes Deployment Guide

This guide describes how to run and deploy the entire Nimantran AI platform using **Docker Compose** (for local/single-server production) and **Kubernetes** (for cloud multi-node scalable clusters).

---

## 🏗️ Architecture Overview

The platform consists of four primary microservices:
1. **Frontend**: High-performance React SPA served by Nginx with client-side routing, gzip compression, and reverse proxying.
2. **Backend**: FastAPI asynchronous REST API service with Celery/async workers and AI endpoints.
3. **Database**: PostgreSQL 16 relational database with persistent storage.
4. **Cache/Queue**: Redis 7 in-memory cache and background event queue.

---

## 🚀 1. Local & Production Deployment via Docker Compose

### Prerequisites
- Docker (version 24.0+)
- Docker Compose (version 2.20+)

### Start the Entire Platform
```bash
# Build and start all 4 services in the background
docker compose up -d --build
```

### Check Service Health
```bash
docker compose ps
```

### View Live Logs
```bash
# All services
docker compose logs -f

# Backend specifically
docker compose logs -f backend
```

### Stop Services
```bash
docker compose down
```

---

## ☸️ 2. Production Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (v1.26+) (e.g., GKE, EKS, AKS, or Minikube/Kind)
- `kubectl` configured with cluster access
- Ingress controller (e.g., ingress-nginx)

### Step 1: Deploy with 1 Command (Kustomize)
```bash
kubectl apply -k k8s/
```

### Step 2: Verify Resources
```bash
# Check namespace pods
kubectl get pods -n nimantran -o wide

# Check services & endpoints
kubectl get svc -n nimantran

# Check persistent volume claims
kubectl get pvc -n nimantran

# Check Horizontal Pod Autoscalers
kubectl get hpa -n nimantran
```

### Step 3: Accessing via Ingress
The Ingress routes:
- `/api/*` $\to$ `nimantran-backend:8000`
- `/uploads/*` $\to$ `nimantran-backend:8000`
- `/*` $\to$ `nimantran-frontend:80`

### Step 4: Tear Down
```bash
kubectl delete -k k8s/
```
