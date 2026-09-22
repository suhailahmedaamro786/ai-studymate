
from pydantic import BaseModel


class Citation(BaseModel):
    document_id: str
    document_name: str
    chunk_index: int
    page_number: int | None = None
    excerpt: str


class TutorResponse(BaseModel):
    answer: str
    is_grounded: bool
    citations: list[Citation]
