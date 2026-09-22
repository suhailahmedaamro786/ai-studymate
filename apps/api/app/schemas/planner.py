from datetime import date

from pydantic import BaseModel


class StudyPlanCreate(BaseModel):
    goal: str
    available_hours_per_day: float
    deadline: date


class StudyPlanResponse(BaseModel):
    id: str
    goal: str
    available_hours_per_day: float
    deadline: str
    created_at: str
    updated_at: str


class StudyTaskCreate(BaseModel):
    plan_id: str
    title: str
    description: str | None = None
    scheduled_date: date


class StudyTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    scheduled_date: date | None = None
    completed: bool | None = None


class StudyTaskResponse(BaseModel):
    id: str
    plan_id: str
    title: str
    description: str | None = None
    scheduled_date: str
    completed: bool
    completed_at: str | None = None
    created_at: str


class StudyPlanWithTasks(BaseModel):
    plan: StudyPlanResponse
    tasks: list[StudyTaskResponse]
