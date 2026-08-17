"""
Nimantran AI — Dedicated Asynchronous Campaign Worker Service Entrypoint.

This process runs independently of the FastAPI web server.
It handles asynchronous multi-channel message dispatching (WhatsApp, SMS, Email),
rate limiting, automatic retries with exponential backoff, and state persistence.
"""

import asyncio
import logging
import signal
import sys

from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.init_db import init_db
from app.services.campaign_worker import multi_channel_worker


async def run_worker():
    setup_logging()
    logger.info("=" * 70)
    logger.info("🚀 Starting Nimantran AI Dedicated Campaign Worker...")
    logger.info(f"Environment: {settings.APP_ENV}")
    logger.info(f"Database URL: {settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}")
    logger.info(f"Redis URL: {settings.REDIS_URL.split('@')[-1] if '@' in settings.REDIS_URL else settings.REDIS_URL}")
    logger.info("=" * 70)

    # Ensure DB schema and initial tables are verified
    await init_db()

    # Start the multi-channel background queue worker
    multi_channel_worker.start()

    stop_event = asyncio.Event()

    def signal_handler():
        logger.info("Termination signal received. Gracefully stopping campaign worker...")
        stop_event.set()

    # Register OS signal handlers for graceful container termination
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, signal_handler)
        except (NotImplementedError, RuntimeError):
            # Windows or non-main thread fallback
            pass

    try:
        while not stop_event.is_set():
            await asyncio.sleep(1)
    except (asyncio.CancelledError, KeyboardInterrupt):
        logger.info("Keyboard interrupt received.")
    finally:
        logger.info("Shutting down campaign worker...")
        multi_channel_worker.stop()
        logger.info("Dedicated Campaign Worker stopped cleanly.")


if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        sys.exit(0)
