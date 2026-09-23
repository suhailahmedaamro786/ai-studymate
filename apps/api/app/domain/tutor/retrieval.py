import logging

from app.core.config import settings
from app.core.supabase import get_service_role_client
from app.domain.tutor.ai_adapter import embed_with_fallback

logger = logging.getLogger(__name__)


async def retrieve_context(question: str, user_id: str) -> list[dict]:
    query_embedding = await embed_with_fallback(question, task_type="retrieval_query")

    db = get_service_role_client()
    rpc_args = {
        "p_owner_id": user_id,
        "p_query_embedding": query_embedding,
        "p_match_threshold": settings.grounding_threshold,
        "p_match_count": settings.retrieval_top_k,
    }

    result = db.rpc("match_document_chunks", rpc_args).execute()
    chunks = result.data or []

    # Some documents can have a lower cosine similarity than the normal
    # grounding threshold even when they are clearly relevant. Retry once
    # without a threshold so the Tutor can inspect the nearest chunks instead
    # of incorrectly reporting that the user has no usable study material.
    if not chunks and settings.grounding_threshold > 0:
        logger.info(
            "No chunks at threshold %.2f; retrying nearest-neighbor retrieval for user %s",
            settings.grounding_threshold,
            user_id,
        )
        fallback_args = {**rpc_args, "p_match_threshold": 0.0}
        fallback_result = db.rpc("match_document_chunks", fallback_args).execute()
        chunks = fallback_result.data or []

    if not chunks:
        logger.info("No document chunks available for user %s", user_id)
        return []

    document_ids = list({c["document_id"] for c in chunks if c.get("document_id")})
    document_names: dict[str, str] = {}
    if document_ids:
        docs_result = db.table("documents").select("id, filename").in_("id", document_ids).execute()
        for doc in docs_result.data or []:
            document_names[doc["id"]] = doc.get("filename", "unknown")

    for chunk in chunks:
        chunk["document_name"] = document_names.get(chunk.get("document_id", ""), "unknown")

    logger.info("Retrieved %s chunks for user %s", len(chunks), user_id)
    return chunks
