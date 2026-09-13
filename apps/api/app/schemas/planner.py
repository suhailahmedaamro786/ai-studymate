from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Optional


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
    description: Optional[str] = None
    scheduled_date: date


class StudyTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_date: Optional[date] = None
    completed: Optional[bool] = None


class StudyTaskResponse(BaseModel):
    id: str
    plan_id: str
    title: str
    description: Optional[str] = None
    scheduled_date: str
    completed: bool
    completed_at: Optional[str] = None
    created_at: str


class StudyPlanWithTasks(BaseModel):
    plan: StudyPlanResponse
    tasks: List[StudyTaskResponse]
