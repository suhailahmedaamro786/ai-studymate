import logging
import uuid
from typing import Tuple

import fitz  # PyMuPDF
from app.core.config import settings
from app.core.supabase import get_service_role_client

logger = logging.getLogger(__name__)


async def process_document(document_id: str, owner_id: str, filename: str):
    """Process a PDF: extract text, chunk, embed, store."""
    from app.domain.tutor.ai_adapter import embed_with_fallback

    db = get_service_role_client()

    storage_path = f"{owner_id}/{filename}"

    # Update status to processing
    db.table("documents").update({"status": "processing"}).eq("id", document_id).execute()

    try:
        # Download file
        file_data = service.storage.from_("documents").download(storage_path)
        if not file_data:
            raise ValueError("Empty file")

        # Extract text with PyMuPDF
        doc = fitz.open(stream=file_data, filetype="pdf")
        pages_text = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            if text.strip():
                pages_text.append((page_num + 1, text.strip()))
        doc.close()

        if not pages_text:
            raise ValueError("No extractable text in PDF")

        page_count = len(pages_text)

        # Chunk text
        chunks = _chunk_text(pages_text, document_id, owner_id)

        # Generate embeddings with fallback
        for chunk in chunks:
            try:
                chunk["embedding"] = await embed_with_fallback(chunk["content"])
            except Exception as e:
                logger.warning(f"Embedding failed for chunk {chunk['chunk_index']}: {e}")
                chunk["embedding"] = None

        # Store chunks
        valid_chunks = [c for c in chunks if c.get("embedding")]
        if valid_chunks:
            service.table("document_chunks").insert(valid_chunks).execute()

        # Update document status
        db.table("documents").update({
            "status": "ready",
            "page_count": page_count,
        }).eq("id", document_id).execute()

        logger.info(f"Document {document_id} processed: {len(valid_chunks)} chunks from {page_count} pages")

    except Exception as e:
        logger.error(f"Document processing failed for {document_id}: {e}")
        db.table("documents").update({
            "status": "failed",
            "error_message": str(e)[:500],
        }).eq("id", document_id).execute()


def _chunk_text(pages_text: list[Tuple[int, str]], document_id: str, owner_id: str) -> list[dict]:
    chunks = []
    chunk_size = settings.max_chunk_size
    overlap = settings.chunk_overlap
    chunk_index = 0

    for page_num, text in pages_text:
        words = text.split()
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk_text = " ".join(words[start:end])
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
            start += chunk_size - overlap
            if start >= len(words):
                break

    return chunks
