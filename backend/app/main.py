import os
import time
from contextlib import asynccontextmanager
from typing import Dict, Any
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import text

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.context import set_request_id, get_request_id, clear_context
from app.core.observability import metrics
from app.core.errors import NimantranException, ErrorCategory
from app.core.database import AsyncSessionLocal
from app.api.v1.api import api_router
from app.db.init_db import init_db

from app.services.whatsapp import campaign_worker
from app.services.campaign_worker import multi_channel_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging(structured=True)
    logger.info("Initializing Nimantran AI Backend Service...")
    os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
    await init_db()

    if settings.ENABLE_BACKGROUND_WORKERS:
        logger.info("Background campaign workers ENABLED in FastAPI process.")
        campaign_worker.start()
        multi_channel_worker.start()
    else:
        logger.info("Background campaign workers DISABLED in FastAPI process (dedicated worker mode active).")

    yield

    logger.info("Shutting down Nimantran AI Backend Service...")
    if settings.ENABLE_BACKGROUND_WORKERS:
        campaign_worker.stop()
        multi_channel_worker.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# =========================================================================
# OBSERVABILITY & CORRELATION ID MIDDLEWARE
# =========================================================================
@app.middleware("http")
async def observability_and_context_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    incoming_req_id = request.headers.get("X-Request-ID")
    req_id = set_request_id(incoming_req_id)

    try:
        response: Response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000.0

        # Record metrics
        metrics.record_api_request(response.status_code, duration_ms)

        # Inject tracing headers
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Response-Time"] = f"{duration_ms:.2f}ms"

        # Structured access log
        if not request.url.path.startswith("/health"):
            logger.info(
                f"{request.method} {request.url.path} returned {response.status_code} in {duration_ms:.2f}ms"
            )

        return response
    except Exception as exc:
        duration_ms = (time.perf_counter() - start_time) * 1000.0
        metrics.record_api_request(500, duration_ms)
        metrics.record_error("INTERNAL_SERVER_ERROR")
        logger.error(
            f"Unhandled exception during {request.method} {request.url.path}: {str(exc)}",
            exc_info=True,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": True,
                "error_code": ErrorCategory.INTERNAL_SERVER_ERROR.value,
                "message": "An unexpected internal error occurred. Please try again or contact support with the request_id.",
                "request_id": req_id,
            },
            headers={"X-Request-ID": req_id, "X-Response-Time": f"{duration_ms:.2f}ms"},
        )
    finally:
        clear_context()


# =========================================================================
# STRUCTURED EXCEPTION HANDLERS (ZERO INTERNAL DATA LEAK)
# =========================================================================
@app.exception_handler(NimantranException)
async def nimantran_exception_handler(request: Request, exc: NimantranException):
    metrics.record_error(exc.category.value)
    req_id = get_request_id()
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(req_id),
        headers={"X-Request-ID": req_id},
    )


@app.exception_handler(HTTPException)
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: Any):
    status_code = getattr(exc, "status_code", 500)
    detail = getattr(exc, "detail", str(exc))
    category = (
        ErrorCategory.AUTH_ERROR.value
        if status_code in [401, 403]
        else ErrorCategory.NOT_FOUND_ERROR.value
        if status_code == 404
        else ErrorCategory.VALIDATION_ERROR.value
        if status_code == 400
        else ErrorCategory.RATE_LIMIT_ERROR.value
        if status_code == 429
        else ErrorCategory.INTERNAL_SERVER_ERROR.value
    )
    metrics.record_error(category)
    req_id = get_request_id()
    return JSONResponse(
        status_code=status_code,
        content={
            "error": True,
            "error_code": category,
            "detail": detail,
            "message": detail,
            "request_id": req_id,
        },
        headers={"X-Request-ID": req_id},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    metrics.record_error(ErrorCategory.VALIDATION_ERROR.value)
    req_id = get_request_id()
    # Format readable validation errors
    errors = [
        {"field": ".".join(str(x) for x in err.get("loc", [])), "message": err.get("msg")}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": True,
            "error_code": ErrorCategory.VALIDATION_ERROR.value,
            "detail": "Input validation failed. Please check the submitted fields.",
            "message": "Input validation failed. Please check the submitted fields.",
            "request_id": req_id,
            "validation_errors": errors,
        },
        headers={"X-Request-ID": req_id},
    )


# Set up CORS with environment-driven allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local storage static route
os.makedirs(settings.LOCAL_STORAGE_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.LOCAL_STORAGE_DIR), name="uploads")

# Include API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "app": settings.PROJECT_NAME,
        "tagline": "One Invitation. One Link. Entire Celebration.",
        "status": "ONLINE",
        "version": "1.0.0",
        "docs": "/docs",
    }


# =========================================================================
# PRODUCTION HEALTH & READINESS PROBES
# =========================================================================
@app.get("/health")
async def health_check():
    """Comprehensive production health check verifying DB, workers, and metrics."""
    db_ok = False
    db_latency_ms = 0.0
    try:
        t0 = time.perf_counter()
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        db_latency_ms = round((time.perf_counter() - t0) * 1000.0, 2)
        db_ok = True
    except Exception as ex:
        logger.error(f"Health probe database check failed: {ex}")

    worker_health = multi_channel_worker.get_health_status()
    is_healthy = db_ok

    return {
        "status": "healthy" if is_healthy else "degraded",
        "env": settings.APP_ENV,
        "database": {
            "status": "connected" if db_ok else "disconnected",
            "latency_ms": db_latency_ms,
        },
        "worker": worker_health,
        "uptime_seconds": metrics.get_metrics_snapshot()["uptime_seconds"],
    }


@app.get("/health/liveness")
async def liveness_probe():
    """Simple 200 OK probe for container orchestrators."""
    return {"status": "alive"}


@app.get("/health/readiness")
async def readiness_probe():
    """Readiness probe verifying database and application availability."""
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as ex:
        logger.error(f"Readiness probe failed: {ex}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "error": "Database connection failed"},
        )


@app.get("/health/metrics")
async def operational_metrics():
    """Returns aggregated real-time operational telemetry and error counters without secrets."""
    return {
        "app": settings.PROJECT_NAME,
        "env": settings.APP_ENV,
        "telemetry": metrics.get_metrics_snapshot(),
    }
