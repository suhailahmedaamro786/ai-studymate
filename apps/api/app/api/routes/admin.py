from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.core.supabase import get_service_role_client

router = APIRouter()


@router.get("/admin/health")
async def admin_health(user_id: str = Depends(get_current_user)):
    try:
        supabase = get_service_role_client()

        users = supabase.table("profiles").select("id", count="exact").execute()
        docs = supabase.table("documents").select("id", count="exact").execute()
        chats = supabase.table("tutor_chats").select("id", count="exact").execute()
        quizzes = supabase.table("quizzes").select("id", count="exact").execute()

        return {
            "data": {
                "total_users": users.count if hasattr(users, "count") else len(users.data or []),
                "total_documents": docs.count if hasattr(docs, "count") else len(docs.data or []),
                "total_chats": chats.count if hasattr(chats, "count") else len(chats.data or []),
                "total_quizzes": quizzes.count if hasattr(quizzes, "count") else len(quizzes.data or []),
                "system_status": "ok",
            },
            "error": None,
        }
    except Exception as e:
        return {
            "data": {
                "total_users": 0,
                "total_documents": 0,
                "total_chats": 0,
                "total_quizzes": 0,
                "system_status": "unavailable",
            },
            "error": {"code": "DATABASE_UNAVAILABLE", "message": str(e)[:200]},
        }
