
from pydantic import BaseModel


class CareerRecommendationResponse(BaseModel):
    id: str
    recommended_roles: list[str]
    skill_gaps: list[str]
    recommended_skills: list[str]
    learning_paths: list[str]
    created_at: str


class CareerAnalysisRequest(BaseModel):
    pass
