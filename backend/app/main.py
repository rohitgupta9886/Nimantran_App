import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.api.v1.api import api_router
from app.db.init_db import init_db


from app.services.whatsapp import campaign_worker
from app.services.campaign_worker import multi_channel_worker


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
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


@app.get("/health")
async def health_check():
    return {"status": "healthy", "env": settings.APP_ENV}
