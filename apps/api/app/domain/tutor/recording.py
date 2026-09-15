from datetime import datetime, timezone
from app.core.supabase import get_service_role_client


async def create_message(chat_id: str, owner_id: str, role: str, content: str,
                         is_grounded: bool = False, citations: list | None = None) -> dict:
    supabase = get_service_role_client()
    result = (
        supabase.table("tutor_messages")
        .insert({
            "chat_id": chat_id,
            "owner_id": owner_id,
            "role": role,
            "content": content,
            "is_grounded": is_grounded,
            "citations": citations or [],
        })
        .execute()
    )
    return result.data[0] if result.data else {}


async def get_chat_messages(chat_id: str, owner_id: str) -> list[dict]:
    supabase = get_service_role_client()
    result = (
        supabase.table("tutor_messages")
        .select("*")
        .eq("chat_id", chat_id)
        .eq("owner_id", owner_id)
        .order("created_at")
        .execute()
    )
    return result.data or []
