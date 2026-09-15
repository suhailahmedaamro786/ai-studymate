from app.core.config import settings
from app.core.supabase import get_service_role_client

VALID_TRANSITIONS = {
    "queued": ["processing"],
    "processing": ["ready", "failed"],
}


def can_transition(current: str, next_: str) -> bool:
    return next_ in VALID_TRANSITIONS.get(current, [])


def update_status(document_id: str, new_status: str, error_message: str | None = None):
    supabase = get_service_role_client()
    payload = {"status": new_status}
    if error_message:
        payload["error_message"] = error_message
    supabase.table("documents").update(payload).eq("id", document_id).execute()
