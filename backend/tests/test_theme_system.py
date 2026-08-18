import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.theme_catalog_service import ThemeCatalogService


@pytest.mark.asyncio
async def test_theme_catalog_service_all():
    themes = ThemeCatalogService.get_themes()
    assert len(themes) >= 10
    theme_ids = [t["id"] for t in themes]
    assert "wedding-royal-heritage" in theme_ids
    assert "haldi-marigold-celebration" in theme_ids
    assert "sangeet-midnight-bollywood" in theme_ids
    assert "mundan-sacred-beginnings" in theme_ids
    assert "birthday-celebration-burst" in theme_ids
    assert "corporate-business-conference" in theme_ids


@pytest.mark.asyncio
async def test_theme_catalog_filtering_by_occasion():
    wedding_themes = ThemeCatalogService.get_themes("WEDDING")
    assert any(t["id"] == "wedding-royal-heritage" for t in wedding_themes)

    haldi_themes = ThemeCatalogService.get_themes("HALDI")
    assert any(t["id"] == "haldi-marigold-celebration" for t in haldi_themes)

    mundan_themes = ThemeCatalogService.get_themes("MUNDAN")
    assert any(t["id"] == "mundan-sacred-beginnings" for t in mundan_themes)

    birthday_themes = ThemeCatalogService.get_themes("BIRTHDAY")
    assert any(t["id"] == "birthday-celebration-burst" for t in birthday_themes)

    corporate_themes = ThemeCatalogService.get_themes("CORPORATE")
    assert any(t["id"] == "corporate-business-conference" for t in corporate_themes)


@pytest.mark.asyncio
async def test_theme_endpoint_http():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/events/themes")
        assert response.status_code == 200
        payload = response.json()
        assert "data" in payload
        assert len(payload["data"]) >= 10

        # Filter query
        resp_mundan = await ac.get("/api/v1/events/themes?celebration_type=MUNDAN")
        assert resp_mundan.status_code == 200
        data_mundan = resp_mundan.json()["data"]
        assert any("mundan" in t["id"] for t in data_mundan)

        resp_haldi = await ac.get("/api/v1/events/themes?celebration_type=HALDI")
        assert resp_haldi.status_code == 200
        data_haldi = resp_haldi.json()["data"]
        assert any("haldi" in t["id"] for t in data_haldi)
