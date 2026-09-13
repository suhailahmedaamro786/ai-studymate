import logging
from app.domain.tutor.ai_adapter import get_ai_provider

logger = logging.getLogger(__name__)


class CareerAnalysisRequest:
    def __init__(self, profile: dict, subjects: list[str], goals: str):
        self.profile = profile
        self.subjects = subjects
        self.goals = goals


class CareerAnalysisResponse:
    def __init__(self, recommended_roles: list[str], skill_gaps: list[str], recommended_skills: list[str], learning_paths: list[str]):
        self.recommended_roles = recommended_roles
        self.skill_gaps = skill_gaps
        self.recommended_skills = recommended_skills
        self.learning_paths = learning_paths


async def analyze_career(request: CareerAnalysisRequest) -> CareerAnalysisResponse:
    provider = get_ai_provider()
    system_prompt = (
        "You are a career advisor for students. Analyze their profile, subjects, and goals. "
        "Return ONLY valid JSON with this exact shape:\n"
        '{"recommended_roles": ["string"], "skill_gaps": ["string"], "recommended_skills": ["string"], "learning_paths": ["string"]}'
    )

    try:
        response = await provider.complete(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Profile: {request.profile}\nSubjects: {request.subjects}\nGoals: {request.goals}"},
            ],
            schema=None,
        )
        return CareerAnalysisResponse(
            recommended_roles=response.get("recommended_roles", [])[:5],
            skill_gaps=response.get("skill_gaps", [])[:5],
            recommended_skills=response.get("recommended_skills", [])[:5],
            learning_paths=response.get("learning_paths", [])[:3],
        )
    except Exception as e:
        logger.error(f"Career analysis failed: {e}")
        raise
