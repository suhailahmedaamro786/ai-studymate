import logging
from app.core.config import settings
from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)


async def retrieve_context(question: str, user_id: str) -> list[dict]:
    provider = get_ai_provider()

    # Embed the question
    query_embedding = await provider.embed(question)

    supabase = get_supabase_client()
    result = (
        supabase.rpc("match_document_chunks", {
            "p_owner_id": user_id,
            "p_query_embedding": query_embedding,
            "p_match_threshold": settings.grounding_threshold,
            "p_match_count": settings.retrieval_top_k,
        })
        .execute()
    )

    chunks = result.data or []

    # Enrich chunks with document metadata so callers can cite sources
    if chunks:
        document_ids = list({c["document_id"] for c in chunks if c.get("document_id")})
        document_names: dict[str, str] = {}
        if document_ids:
            docs_result = (
                supabase.table("documents")
                .select("id, filename")
                .in_("id", document_ids)
                .execute()
            )
            for doc in docs_result.data or []:
                document_names[doc["id"]] = doc.get("filename", "unknown")

        for c in chunks:
            c["document_name"] = document_names.get(c.get("document_id", ""), "unknown")

    logger.info(f"Retrieved {len(chunks)} chunks for user {user_id}")
    return chunks


def get_ai_provider():
    from app.domain.tutor.ai_adapter import get_ai_provider as _get
    return _get()
