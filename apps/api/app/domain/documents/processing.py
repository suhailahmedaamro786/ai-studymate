import logging
import uuid
from typing import Tuple

import fitz  # PyMuPDF
from app.core.config import settings
from app.core.supabase import get_service_role_client

logger = logging.getLogger(__name__)


async def process_document(document_id: str, owner_id: str, filename: str):
    """Process a PDF: extract text, chunk, embed, and store."""
    from app.domain.tutor.ai_adapter import embed_with_fallback

    db = get_service_role_client()
    storage_path = f"{owner_id}/{filename}"

    db.table("documents").update({"status": "processing"}).eq("id", document_id).execute()

    try:
        # Use the service-role client consistently for private storage and DB writes.
        file_data = db.storage.from_("documents").download(storage_path)
        if not file_data:
            raise ValueError("Empty file")

        doc = fitz.open(stream=file_data, filetype="pdf")
        try:
            pages_text: list[Tuple[int, str]] = []
            for page_num in range(len(doc)):
                text = doc[page_num].get_text().strip()
                if text:
                    pages_text.append((page_num + 1, text))
        finally:
            doc.close()

        if not pages_text:
            raise ValueError("No extractable text in PDF")

        chunks = _chunk_text(pages_text, document_id, owner_id)

        for chunk in chunks:
            try:
                chunk["embedding"] = await embed_with_fallback(chunk["content"])
            except Exception as exc:
                logger.warning("Embedding failed for chunk %s: %s", chunk["chunk_index"], exc)
                chunk["embedding"] = None

        valid_chunks = [chunk for chunk in chunks if chunk.get("embedding")]
        if not valid_chunks:
            raise ValueError(
                "No embeddings were generated. Configure a working embedding provider (OPENAI_API_KEY)."
            )

        db.table("document_chunks").insert(valid_chunks).execute()
        db.table("documents").update({
            "status": "ready",
            "page_count": len(pages_text),
            "error_message": None,
        }).eq("id", document_id).execute()

        logger.info(
            "Document %s processed: %s chunks from %s pages",
            document_id,
            len(valid_chunks),
            len(pages_text),
        )

    except Exception as exc:
        logger.exception("Document processing failed for %s", document_id)
        db.table("documents").update({
            "status": "failed",
            "error_message": str(exc)[:500],
        }).eq("id", document_id).execute()


def _chunk_text(pages_text: list[Tuple[int, str]], document_id: str, owner_id: str) -> list[dict]:
    chunks: list[dict] = []
    chunk_size = max(1, settings.max_chunk_size)
    overlap = max(0, min(settings.chunk_overlap, chunk_size - 1))
    step = chunk_size - overlap
    chunk_index = 0

    for page_num, text in pages_text:
        words = text.split()
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk_text = " ".join(words[start:end])
            if chunk_text:
                chunks.append({
                    "id": str(uuid.uuid4()),
                    "document_id": document_id,
                    "owner_id": owner_id,
                    "chunk_index": chunk_index,
                    "content": chunk_text,
                    "embedding": None,
                    "page_number": page_num,
                })
                chunk_index += 1
            if end >= len(words):
                break
            start += step

    return chunks
