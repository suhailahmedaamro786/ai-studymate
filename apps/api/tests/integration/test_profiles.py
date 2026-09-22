import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.auth import ProfileUpsert


@pytest.mark.asyncio
async def test_get_profile_requires_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/profiles/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_upsert_profile_requires_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.put(
            "/api/profiles/me",
            json={"display_name": "Test User"},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_profile_upsert_validation():
    payload = ProfileUpsert(display_name="Test", subjects=["Math", "Science"])
    assert payload.display_name == "Test"
    assert payload.subjects == ["Math", "Science"]
    assert payload.education_level is None
    assert payload.goals is None
