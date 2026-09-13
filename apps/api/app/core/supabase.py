from supabase import create_client as sb_create_client
from app.core.config import settings


def get_supabase_client():
    """User-scoped client — enforces RLS via user JWT."""
    return sb_create_client(settings.supabase_url, settings.supabase_anon_key)


def get_service_role_client():
    """Service-role client — bypasses RLS. Server-only, never exposed to frontend."""
    return sb_create_client(settings.supabase_url, settings.supabase_service_role_key)
