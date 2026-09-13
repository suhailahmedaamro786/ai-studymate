from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.domain.tutor.recording import create_message, get_chat_messages
from app.domain.tutor.ai_adapter import get_ai_provider

router = APIRouter()


@router.post("/tutor/chats", status_code=201)
async def create_chat(body: dict, user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = (
        supabase.table("tutor_chats")
        .insert({"title": body.get("title", "New Chat"), "owner_id": user_id})
        .execute()
    )
    return {"data": result.data[0] if result.data else None, "error": None}


@router.get("/tutor/chats")
async def list_chats(user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = (
        supabase.table("tutor_chats")
        .select("id, title, created_at, updated_at")
        .eq("owner_id", user_id)
        .order("updated_at", desc=True)
        .execute()
    )
    return {"data": result.data, "error": None}


@router.get("/tutor/chats/{chat_id}/messages")
async def get_messages(chat_id: str, user_id: str = Depends(get_current_user)):
    # Verify chat ownership
    supabase = get_supabase_client()
    chat = (
        supabase.table("tutor_chats")
        .select("id")
        .eq("id", chat_id)
        .eq("owner_id", user_id)
        .single()
        .execute()
    )
    if not chat.data:
        raise HTTPException(status_code=404, detail="Chat not found")

    messages = await get_chat_messages(chat_id, user_id)
    return {"data": messages, "error": None}


@router.post("/tutor/chats/{chat_id}/messages")
async def send_message(chat_id: str, body: dict, user_id: str = Depends(get_current_user)):
    from app.domain.tutor.retrieval import retrieve_context
    from app.domain.tutor.grounding import check_grounding
    from app.domain.tutor.response_schema import TutorResponse

    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message content is required")

    # Verify chat ownership
    supabase = get_supabase_client()
    chat = (
        supabase.table("tutor_chats")
        .select("id")
        .eq("id", chat_id)
        .eq("owner_id", user_id)
        .single()
        .execute()
    )
    if not chat.data:
        raise HTTPException(status_code=404, detail="Chat not found")

    # Save user message
    await create_message(chat_id, user_id, "user", content)

    # Retrieve context
    chunks = await retrieve_context(content, user_id)
    grounded, threshold = check_grounding(chunks)

    # Generate response
    provider = get_ai_provider()
    response: TutorResponse = await provider.complete_tutor(content, chunks, grounded)

    # Save assistant message
    msg = await create_message(
        chat_id, user_id, "assistant",
        response.answer,
        is_grounded=response.is_grounded,
        citations=[c.model_dump() for c in response.citations],
    )

    return {"data": msg, "error": None}
