from pydantic import BaseModel


class ApiErrorDetail(BaseModel):
    code: str
    message: str
    details: dict = {}


class ApiResponse(BaseModel):
    data: object | None = None
    error: ApiErrorDetail | None = None
