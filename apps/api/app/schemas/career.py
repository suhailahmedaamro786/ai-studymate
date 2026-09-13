from pydantic import BaseModel
from typing import List, Optional


class CareerRecommendationResponse(BaseModel):
    id: str
    recommended_roles: List[str]
    skill_gaps: List[str]
    recommended_skills: List[str]
    learning_paths: List[str]
    created_at: str


class CareerAnalysisRequest(BaseModel):
    pass
