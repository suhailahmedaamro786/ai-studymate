from pydantic import BaseModel


class ProfileUpsert(BaseModel):
    display_name: str | None = None
    education_level: str | None = None
    subjects: list[str] = []
    goals: str | None = None
