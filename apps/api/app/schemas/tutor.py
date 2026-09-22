from typing import Literal

from pydantic import BaseModel


class Citation(BaseModel):
    document_id: str
    document_name: str
    chunk_index: int
    page_number: int | None = None
    excerpt: str


class TutorMessageResponse(BaseModel):
    id: str
    role: Literal["user", "assistant"]
    content: str
    is_grounded: bool
    citations: list[Citation]
    created_at: str


class SendMessageRequest(BaseModel):
    content: str


class ChatCreate(BaseModel):
    title: str = "New Chat"
