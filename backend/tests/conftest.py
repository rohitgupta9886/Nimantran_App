import sys
import os
import pytest
import asyncio

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.db.init_db import init_db

@pytest.fixture(scope="session", autouse=True)
def initialize_test_database():
    """Initialize database tables and seed data before running tests."""
    loop = asyncio.get_event_loop_policy().get_event_loop()
    loop.run_until_complete(init_db())
