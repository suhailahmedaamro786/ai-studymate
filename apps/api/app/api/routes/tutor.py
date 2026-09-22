import logging

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_current_user
from app.core.supabase import get_service_role_client
from app.domain.tutor.ai_adapter import call_with_fallback
from app.domain.tutor.recording import create_message, get_chat_messages

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/tutor/chats", status_code=201)
async def create_chat(body: dict, user_id: str = Depends(get_current_user)):
    supabase = get_service_role_client()
    result = (
        supabase.table("tutor_chats")
        .insert({"title": body.get("title", "New Chat"), "owner_id": user_id})
        .execute()
    )
    return {"data": result.data[0] if result.data else None, "error": None}


@router.get("/tutor/chats")
async def list_chats(user_id: str = Depends(get_current_user)):
    supabase = get_service_role_client()
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
    supabase = get_service_role_client()
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
    from app.domain.tutor.grounding import check_grounding
    from app.domain.tutor.response_schema import TutorResponse
    from app.domain.tutor.retrieval import retrieve_context

    content = body.get("content", "").strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message content is required")

    # Verify chat ownership
    supabase = get_service_role_client()
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

    # Build messages for LLM with fallback
    if not grounded:
        answer_text = (
            "I don't have enough information in your uploaded materials to answer "
            "this question accurately. Try uploading relevant study materials first, "
            "or ask a question about content that is in your documents."
        )
        msg = await create_message(
            chat_id, user_id, "assistant",
            answer_text,
            is_grounded=False,
            citations=[],
        )
        return {"data": msg, "error": None}

    context = "\n\n".join(
        (
            f"[Source: {c.get('document_name', 'unknown')}, "
            f"Page {c.get('page_number', '?')}]\n{c.get('content', '')}"
        )
        for c in chunks
    )
    system_prompt = (
        "You are a study tutor. Answer the student's question using ONLY the provided context. "
        "Cite sources by document name and page number. If the context is insufficient, "
        "say so explicitly. Never fabricate information not present in the context."
    )
    user_prompt = (
        f"Context:\n{context}\n\nQuestion: {content}\n"
        "Answer based on the context above."
    )

    try:
        response_data = await call_with_fallback(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            schema=None,
        )
        answer = str(response_data.get("content", "")).strip()
        if not answer:
            raise RuntimeError("LLM returned an empty tutor response")

        citations = []
        for c in chunks[:3]:
            citations.append({
                "document_id": str(c.get("document_id") or ""),
                "document_name": str(c.get("document_name") or "unknown"),
                "chunk_index": int(c.get("chunk_index") or 0),
                "page_number": c.get("page_number"),
                "excerpt": str(c.get("content") or "")[:200],
            })

        parsed = TutorResponse(
            answer=answer,
            is_grounded=True,
            citations=citations,
        )
    except Exception:
        logger.exception("Tutor response generation failed")
        parsed = TutorResponse(
            answer=(
                "The AI tutor provider is temporarily unavailable. "
                "Please try again in a moment."
            ),
            is_grounded=False,
            citations=[],
        )

    # Save assistant message
    msg = await create_message(
        chat_id, user_id, "assistant",
        parsed.answer,
        is_grounded=parsed.is_grounded,
        citations=[c.model_dump() for c in parsed.citations],
    )

    return {"data": msg, "error": None}
