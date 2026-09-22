import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["status"] == "ok"
        assert "timestamp" in data["data"]
        assert data["error"] is None
