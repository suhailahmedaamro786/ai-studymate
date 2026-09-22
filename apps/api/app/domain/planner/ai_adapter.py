import logging
from datetime import date

from app.domain.tutor.ai_adapter import call_with_fallback

logger = logging.getLogger(__name__)


class StudyPlanRequest:
    def __init__(
        self,
        goal: str,
        available_hours_per_day: float,
        deadline: date,
        profile: dict | None = None,
    ):
        self.goal = goal
        self.available_hours_per_day = available_hours_per_day
        self.deadline = deadline
        self.profile = profile or {}


class StudyPlanResponse:
    def __init__(self, plan_text: str, tasks: list[dict]):
        self.plan_text = plan_text
        self.tasks = tasks


async def generate_study_plan(request: StudyPlanRequest) -> StudyPlanResponse:
    today = date.today()
    days_until_deadline = max((request.deadline - today).days, 1)

    system_prompt = (
        "You are a study planner. Generate a concise study plan and daily tasks. "
        "Return ONLY valid JSON with this exact shape:\n"
        '{"plan_text": "2-3 sentence summary", "tasks": [{"title": "string", '
        '"description": "string", "scheduled_date": "YYYY-MM-DD"}]}\n'
        f"Available study days: {days_until_deadline}. "
        f"Daily hours: {request.available_hours_per_day}. "
        f"Goal: {request.goal}"
    )

    try:
        response = await call_with_fallback(
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": (
                        f"Goal: {request.goal}. Deadline: {request.deadline}. "
                        f"Hours/day: {request.available_hours_per_day}"
                    ),
                },
            ],
            schema=None,
        )
        plan_text = response.get("plan_text", "Study plan generated.")
        tasks = response.get("tasks", [])
        validated_tasks = []
        for task in tasks:
            validated_tasks.append({
                "title": str(task.get("title", "Study task"))[:200],
                "description": str(task.get("description", ""))[:500],
                "scheduled_date": str(task.get("scheduled_date", today.isoformat())),
            })
        return StudyPlanResponse(plan_text=plan_text, tasks=validated_tasks)
    except Exception as e:
        logger.error(f"Study plan generation failed: {e}")
        raise
