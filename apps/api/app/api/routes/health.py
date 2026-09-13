from datetime import datetime, timezone
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "data": {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()},
        "error": None,
    }
