import logging
import os
from uuid import UUID
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, status
from pydantic import BaseModel, validator

from app.api.deps import get_current_user
from app.core.supabase import get_supabase_client, get_service_role_client
from app.core.config import settings
from app.domain.documents.processing import process_document
from app.schemas.documents import DocumentUploadResponse

logger = logging.getLogger(__name__)

router = APIRouter()


class DocumentDeleteResponse(BaseModel):
    success: bool
    error: dict | None = None


def _is_pdf(content_type: str, filename: str) -> bool:
    if content_type and content_type.lower() == "application/pdf":
        return True
    if filename.lower().endswith(".pdf"):
        return True
    return False


@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user),
):
    if not _is_pdf(file.content_type or "", file.filename or ""):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={"code": "INVALID_FILE_TYPE", "message": "Only PDF files are allowed"},
        )

    contents = await file.read()
    max_size_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(contents) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"File size exceeds {settings.max_file_size_mb}MB limit",
            },
        )

    safe_filename = file.filename or "document.pdf"
    storage_path = f"{user_id}/{safe_filename}"
    document_id = str(__import__("uuid").uuid4())

    supabase = get_supabase_client()
    service = get_service_role_client()

    db_result = (
        supabase.table("documents")
        .insert({
            "id": document_id,
            "owner_id": user_id,
            "filename": safe_filename,
            "storage_path": storage_path,
            "status": "queued",
        })
        .execute()
    )
    if db_result.error:
        logger.error(f"Failed to create document record: {db_result.error}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DB_ERROR", "message": "Failed to create document record"},
        )

    try:
        service.storage.from_("documents").upload(storage_path, contents, {"content-type": "application/pdf"})
    except Exception as e:
        logger.error(f"Failed to upload file to storage: {e}")
        supabase.table("documents").update({
            "status": "failed",
            "error_message": "Storage upload failed",
        }).eq("id", document_id).execute()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "STORAGE_UPLOAD_FAILED", "message": "Failed to upload file to storage"},
        )

    # Trigger background processing after response is sent
    background_tasks.add_task(process_document, document_id, user_id, safe_filename)

    doc = (db_result.data[0] if db_result.data else {})
    return DocumentUploadResponse(
        id=doc.get("id", document_id),
        filename=doc.get("filename", safe_filename),
        status=doc.get("status", "queued"),
        page_count=doc.get("page_count"),
        error_message=doc.get("error_message"),
        created_at=doc.get("created_at"),
    )


@router.get("/documents")
async def list_documents(user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = (
        supabase.table("documents")
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
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"code": "INVALID_ID", "message": "Invalid document ID"})

    supabase = get_supabase_client()
    service = get_service_role_client()

    doc = (
        supabase.table("documents")
        .select("storage_path")
        .eq("id", doc_uuid)
        .eq("owner_id", user_id)
        .single()
        .execute()
    )
    if not doc.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"code": "NOT_FOUND", "message": "Document not found"})

    service.storage.from_("documents").remove(doc.data["storage_path"])

    supabase.table("documents").delete().eq("id", doc_uuid).execute()

    return DocumentDeleteResponse(success=True, error=None)
