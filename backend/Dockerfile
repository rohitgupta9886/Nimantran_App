# syntax=docker/dockerfile:1
# ------------------------------------------------------------------------------
# Nimantran AI — Production Backend Dockerfile
# Python 3.11 Slim with Multi-Stage Build & Non-Root Security User
# ------------------------------------------------------------------------------

# Stage 1: Build Dependencies
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime Image
FROM python:3.11-slim as runner

WORKDIR /app

# Install curl for container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages and binaries from builder
COPY --from=builder /usr/local /usr/local

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Create upload directory and non-root user
RUN mkdir -p /app/uploads && \
    useradd -u 1000 -U -s /bin/bash appuser && \
    chown -R appuser:appuser /app

# Copy application source code
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

# Health check endpoint
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI application with uvicorn
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
