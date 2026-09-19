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
        .maybe_single()
        .execute()
    )
    if result.data:
        return {"data": result.data, "error": None}

    # Auth users can exist before their profile row is created.
    # Create a safe empty profile so the dashboard does not fail with PGRST116.
    created = (
        supabase.table("profiles")
        .upsert({"user_id": user_id, "subjects": []}, on_conflict="user_id")
        .execute()
    )
    if not created.data:
        raise HTTPException(status_code=500, detail="Unable to initialize profile")
    return {"data": created.data[0], "error": None}


@router.put("/profiles/me")
async def upsert_profile(body: ProfileUpsert, user_id: str = Depends(get_current_user)):
    supabase = get_service_role_client()
    payload = {**body.model_dump(), "user_id": user_id}
    result = (
        supabase.table("profiles")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    return {"data": result.data[0] if result.data else None, "error": None}
