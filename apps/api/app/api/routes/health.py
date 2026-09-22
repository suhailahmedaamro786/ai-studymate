from datetime import UTC, datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "data": {"status": "ok", "timestamp": datetime.now(UTC).isoformat()},
        "error": None,
    }
