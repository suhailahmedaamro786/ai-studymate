from supabase import create_client as sb_create_client
from app.core.config import settings


def get_supabase_client(user_jwt: str | None = None):
    """User-scoped client with optional JWT forwarding.

    Pass a user JWT to enforce RLS policies via PostgREST.
    When no JWT is provided, the client runs as the ``anon`` role.
    """
    client = sb_create_client(settings.supabase_url, settings.supabase_anon_key)
    if user_jwt:
        client.postgrest.auth(user_jwt)
    return client


def get_service_role_client():
    """Service-role client — bypasses RLS. Server-only, never exposed to frontend.

    Use this for backend DB operations where the application itself
    enforces authorization (e.g. owner_id checks).
    """
    return sb_create_client(settings.supabase_url, settings.supabase_service_role_key)
