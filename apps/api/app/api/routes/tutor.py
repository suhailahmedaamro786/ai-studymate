import logging
from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.core.supabase import get_service_role_client
from app.domain.tutor.recording import create_message, get_chat_messages
from app.domain.tutor.ai_adapter import call_with_fallback
from app.domain.tutor.response_schema import TutorResponse

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
    from app.domain.tutor.retrieval import retrieve_context
    from app.domain.tutor.grounding import check_grounding
    from app.domain.tutor.response_schema import TutorResponse, Citation

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
        f"[Source: {c.get('document_name', 'unknown')}, Page {c.get('page_number', '?')}]\n{c.get('content', '')}"
        for c in chunks
    )
    system_prompt = (
        "You are a study tutor. Answer the student's question using ONLY the provided context. "
        "Cite sources by document name and page number. If the context is insufficient, say so explicitly. "
        "Never fabricate information not present in the context."
    )
    user_prompt = f"Context:\n{context}\n\nQuestion: {content}\n\nAnswer based on the context above."

    try:
        response_data = await call_with_fallback(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            schema=None,
        )
        parsed = TutorResponse(
            answer=response_data.get("content", ""),
            is_grounded=True,
            citations=[
                {
                    "document_id": c.get("document_id", ""),
                    "document_name": c.get("document_name", "unknown"),
                    "chunk_index": c.get("chunk_index", 0),
                    "page_number": c.get("page_number"),
                    "excerpt": c.get("content", "")[:200],
                }
                for c in chunks[:3]
            ],
        )
    except Exception as e:
        logger.error(f"Tutor response generation failed: {e}")
        parsed = TutorResponse(
            answer="I encountered an error processing your question. Please try again.",
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
