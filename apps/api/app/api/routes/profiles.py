from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.core.supabase import get_service_role_client
from app.schemas.auth import ProfileUpsert

router = APIRouter()


@router.get("/profiles/me")
async def get_profile(user_id: str = Depends(get_current_user)):
    supabase = get_service_role_client()
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    if rows:
        return {"data": rows[0], "error": None}

    # Auth users can exist before their profile row is created.
    created = (
        supabase.table("profiles")
        .upsert({"user_id": user_id, "subjects": []}, on_conflict="user_id")
        .select("*")
        .execute()
    )
    created_rows = created.data or []
    if not created_rows:
        raise HTTPException(status_code=500, detail="Unable to initialize profile")
    return {"data": created_rows[0], "error": None}


@router.put("/profiles/me")
async def upsert_profile(body: ProfileUpsert, user_id: str = Depends(get_current_user)):
    supabase = get_service_role_client()
    payload = {**body.model_dump(), "user_id": user_id}
    result = (
        supabase.table("profiles")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    rows = result.data or []
    return {"data": rows[0] if rows else None, "error": None}
