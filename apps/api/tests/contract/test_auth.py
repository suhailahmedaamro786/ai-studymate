import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_protected_endpoint_requires_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/profiles/me")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_documents_endpoint_requires_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/documents")
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_admin_health_requires_auth():
    """Admin endpoint must require authentication."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/admin/health")
        assert response.status_code == 401
