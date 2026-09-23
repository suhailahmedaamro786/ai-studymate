import logging
import math
import re

from app.core.config import settings
from app.core.supabase import get_service_role_client
from app.domain.tutor.ai_adapter import embed_with_fallback

logger = logging.getLogger(__name__)


def _vector_values(value) -> list[float]:
    if isinstance(value, list):
        return [float(v) for v in value]
    if isinstance(value, str):
        numbers = re.findall(r"-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?", value)
        return [float(v) for v in numbers]
    return []


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    if len(a) != len(b) or not a:
        return -1.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if not norm_a or not norm_b:
        return -1.0
    return dot / (norm_a * norm_b)


async def _direct_chunk_fallback(
    db,
    owner_id: str,
    query_embedding: list[float],
    match_count: int,
) -> list[dict]:
    """Fallback for production RPC/schema mismatches.

    This is intentionally limited to the current user's chunks. It keeps Tutor
    functional even when the pgvector RPC has no rows, while the normal indexed
    RPC remains the primary retrieval path.
    """
    result = (
        db.table("document_chunks")
        .select("id, document_id, chunk_index, content, page_number, embedding")
        .eq("owner_id", owner_id)
        .not_.is_("embedding", "null")
        .limit(2000)
        .execute()
    )
    rows = result.data or []
    scored: list[dict] = []
    for row in rows:
        vector = _vector_values(row.get("embedding"))
        score = _cosine_similarity(query_embedding, vector)
        if score >= 0:
            item = {k: row.get(k) for k in (
                "id", "document_id", "chunk_index", "content", "page_number"
            )}
            item["similarity"] = score
            scored.append(item)
    scored.sort(key=lambda item: item["similarity"], reverse=True)
    return scored[:match_count]


async def retrieve_context(question: str, user_id: str) -> list[dict]:
    query_embedding = await embed_with_fallback(question, task_type="retrieval_query")

    db = get_service_role_client()
    rpc_args = {
        "p_owner_id": user_id,
        "p_query_embedding": query_embedding,
        "p_match_threshold": settings.grounding_threshold,
        "p_match_count": settings.retrieval_top_k,
    }

    try:
        result = db.rpc("match_document_chunks", rpc_args).execute()
        chunks = result.data or []
    except Exception as exc:
        logger.exception("Vector RPC retrieval failed for user %s: %s", user_id, exc)
        chunks = []

    if not chunks and settings.grounding_threshold > 0:
        logger.info(
            "No chunks at threshold %.2f; retrying nearest-neighbor retrieval for user %s",
            settings.grounding_threshold,
            user_id,
        )
        try:
            fallback_args = {**rpc_args, "p_match_threshold": 0.0}
            fallback_result = db.rpc("match_document_chunks", fallback_args).execute()
            chunks = fallback_result.data or []
        except Exception as exc:
            logger.exception("Unthresholded vector RPC failed for user %s: %s", user_id, exc)

    # Last-resort retrieval from the stored vectors. This specifically handles
    # deployments where the database function/index is stale but document_chunks
    # contains valid 768-dim embeddings.
    if not chunks:
        chunks = await _direct_chunk_fallback(
            db, user_id, query_embedding, settings.retrieval_top_k
        )
        if chunks:
            logger.warning(
                "Using direct vector fallback: retrieved %s chunks for user %s",
                len(chunks), user_id,
            )

    if not chunks:
        logger.info("No document chunks available for user %s", user_id)
        return []

    document_ids = list({c["document_id"] for c in chunks if c.get("document_id")})
    document_names: dict[str, str] = {}
    if document_ids:
        docs_result = (
            db.table("documents")
            .select("id, filename")
            .in_("id", document_ids)
            .execute()
        )
        for doc in docs_result.data or []:
            document_names[doc["id"]] = doc.get("filename", "unknown")

    for chunk in chunks:
        chunk["document_name"] = document_names.get(
            chunk.get("document_id", ""), "unknown"
        )

    logger.info("Retrieved %s chunks for user %s", len(chunks), user_id)
    return chunks
