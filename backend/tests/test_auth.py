import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_demo_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/auth/login",
            json={"email": "demo@nimantran.ai", "password": "password123"},
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert "access_token" in data
        assert "refresh_token" in data
