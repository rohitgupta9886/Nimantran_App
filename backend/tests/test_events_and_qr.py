import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_get_public_event():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/v1/public/events/rahul-neha")
        assert res.status_code == 200
        json_data = res.json()
        assert json_data["success"] is True
        assert json_data["data"]["event"]["slug"] == "rahul-neha"
        assert "headline" in json_data["data"]


@pytest.mark.asyncio
async def test_scan_qr_checkin():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post(
            "/api/v1/scanner/verify",
            json={"pass_code": "NIM-ENTRY-1001", "location_name": "VIP Entrance"},
        )
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["guest_name"] == "Amit Gupta"
        assert data["already_checked_in"] is False or True
