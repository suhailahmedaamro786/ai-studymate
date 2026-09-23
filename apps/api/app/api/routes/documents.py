import logging
import uuid
from pathlib import PurePosixPath
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.supabase import get_service_role_client
from app.domain.documents.processing import process_document
from app.schemas.documents import DocumentUploadResponse

logger = logging.getLogger(__name__)
router = APIRouter()


class DocumentDeleteResponse(BaseModel):
    success: bool
    error: dict | None = None


def _is_pdf(content_type: str, filename: str) -> bool:
    return (content_type or "").lower() == "application/pdf" or filename.lower().endswith(".pdf")


def _safe_filename(filename: str | None) -> str:
    name = PurePosixPath((filename or "document.pdf").replace("\\", "/")).name.strip()
    if not name or name in {".", ".."}:
        name = "document.pdf"
    return name[:180]


@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    filename = _safe_filename(file.filename)
    if not _is_pdf(file.content_type or "", filename):
        raise HTTPException(
            status_code=415,
            detail={"code": "INVALID_FILE_TYPE", "message": "Only PDF files are allowed"},
        )

    contents = await file.read()
    max_size_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(contents) > max_size_bytes:
        raise HTTPException(
            status_code=413,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"File size exceeds {settings.max_file_size_mb}MB limit",
            },
        )
    if not contents:
        raise HTTPException(
            status_code=400, detail={"code": "EMPTY_FILE", "message": "The uploaded PDF is empty"}
        )

    document_id = str(uuid.uuid4())
    storage_path = f"{user_id}/{document_id}/{filename}"
    db = get_service_role_client()

    try:
        db_result = db.table("documents").insert({
            "id": document_id, "owner_id": user_id, "filename": filename,
            "storage_path": storage_path, "status": "queued",
        }).execute()
        db.storage.from_("documents").upload(
            storage_path, contents, {"content-type": "application/pdf", "upsert": "false"}
        )
    except Exception as exc:
        logger.exception("Document upload failed")
        try:
            db.table("documents").delete().eq("id", document_id).eq("owner_id", user_id).execute()
        except Exception:
            logger.exception("Failed to clean up document record")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "UPLOAD_FAILED",
                "message": "Failed to upload the document. Please try again.",
            },
        ) from exc

    # Do not depend on an ephemeral background task for the core RAG pipeline.
    # Railway can recycle a process after the HTTP response; synchronous processing
    # guarantees that extraction, embeddings, and chunk persistence finish before
    # the upload is reported as successful.
    await process_document(document_id, user_id, storage_path)

    processed = (
        db.table("documents")
        .select("id, filename, status, page_count, error_message, created_at")
        .eq("id", document_id)
        .eq("owner_id", user_id)
        .single()
        .execute()
    )
    doc = processed.data or {}
    return DocumentUploadResponse(
        id=doc.get("id", document_id),
        filename=doc.get("filename", filename),
        status=doc.get("status", "failed"),
        page_count=doc.get("page_count"),
        error_message=doc.get("error_message"),
        created_at=doc.get("created_at"),
    )


@router.get("/documents")
async def list_documents(user_id: str = Depends(get_current_user)):
    db = get_service_role_client()
    result = (
        db.table("documents")
        .select("id, filename, status, page_count, error_message, created_at")
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"data": result.data, "error": None}


@router.delete("/documents/{document_id}", response_model=DocumentDeleteResponse)
async def delete_document(document_id: str, user_id: str = Depends(get_current_user)):
    try:
        doc_uuid = str(UUID(document_id))
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_ID", "message": "Invalid document ID"},
        ) from exc

    db = get_service_role_client()
    doc = (
        db.table("documents")
        .select("storage_path")
        .eq("id", doc_uuid)
        .eq("owner_id", user_id)
        .maybe_single()
        .execute()
    )
    if not doc.data:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Document not found"},
        )

    try:
        db.storage.from_("documents").remove([doc.data["storage_path"]])
    except Exception:
        logger.warning("Storage delete failed for document %s", doc_uuid, exc_info=True)
    db.table("documents").delete().eq("id", doc_uuid).eq("owner_id", user_id).execute()
    return DocumentDeleteResponse(success=True, error=None)
