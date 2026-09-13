from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.schemas.auth import ProfileUpsert

router = APIRouter()


@router.get("/profiles/me")
async def get_profile(user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = (
        supabase.table("profiles")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"data": result.data, "error": None}


@router.put("/profiles/me")
async def upsert_profile(body: ProfileUpsert, user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    payload = {**body.model_dump(), "user_id": user_id}
    result = (
        supabase.table("profiles")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    return {"data": result.data[0] if result.data else None, "error": None}
