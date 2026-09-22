from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: str
    filename: str
    status: str
    page_count: int | None = None
    error_message: str | None = None
    created_at: datetime


class DocumentUploadResponse(DocumentResponse):
    pass
