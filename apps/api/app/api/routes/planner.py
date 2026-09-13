from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.schemas.planner import StudyPlanCreate, StudyPlanWithTasks, StudyTaskCreate, StudyTaskUpdate, StudyTaskResponse
from app.domain.planner.ai_adapter import generate_study_plan, StudyPlanRequest

router = APIRouter()


@router.post("/planner/plans", status_code=201)
async def create_study_plan(body: StudyPlanCreate, user_id: str = Depends(get_current_user)):
    if body.deadline < date.today():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Deadline must be in the future")

    supabase = get_supabase_client()

    # Fetch user profile for personalization
    profile_result = supabase.table("profiles").select("*").eq("user_id", user_id).maybe_single().execute()
    profile = profile_result.data if profile_result.data else {}

    request = StudyPlanRequest(
        goal=body.goal,
        available_hours_per_day=body.available_hours_per_day,
        deadline=body.deadline,
        profile=profile,
    )

    try:
        plan_response = await generate_study_plan(request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail={"code": "AI_PROVIDER_ERROR", "message": str(e)[:200]})

    plan_insert = supabase.table("study_plans").insert({
        "owner_id": user_id,
        "goal": body.goal,
        "available_hours_per_day": body.available_hours_per_day,
        "deadline": body.deadline.isoformat(),
    }).execute()

    plan = plan_insert.data[0] if plan_insert.data else {}
    plan_id = plan.get("id")

    tasks = []
    for task in plan_response.tasks:
        task_insert = supabase.table("study_tasks").insert({
            "plan_id": plan_id,
            "owner_id": user_id,
            "title": task["title"],
            "description": task.get("description", ""),
            "scheduled_date": task["scheduled_date"],
        }).execute()
        if task_insert.data:
            tasks.append(StudyTaskResponse(**task_insert.data[0]))

    return StudyPlanWithTasks(plan=plan, tasks=tasks)


@router.get("/planner/plans")
async def list_study_plans(user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    plans_result = supabase.table("study_plans").select("*").eq("owner_id", user_id).order("created_at", desc=True).execute()
    plans = plans_result.data or []
    return {"data": plans, "error": None}


@router.get("/planner/plans/{plan_id}")
async def get_study_plan(plan_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    plan_result = supabase.table("study_plans").select("*").eq("id", plan_id).eq("owner_id", user_id).maybe_single().execute()
    if not plan_result.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    tasks_result = supabase.table("study_tasks").select("*").eq("plan_id", plan_id).order("scheduled_date").execute()
    tasks = [StudyTaskResponse(**t) for t in (tasks_result.data or [])]
    return StudyPlanWithTasks(plan=plan_result.data, tasks=tasks)


@router.post("/planner/tasks", status_code=201)
async def create_study_task(body: StudyTaskCreate, user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    plan = supabase.table("study_plans").select("id").eq("id", body.plan_id).eq("owner_id", user_id).maybe_single().execute()
    if not plan.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")

    result = supabase.table("study_tasks").insert({
        "plan_id": body.plan_id,
        "owner_id": user_id,
        "title": body.title,
        "description": body.description or "",
        "scheduled_date": body.scheduled_date.isoformat(),
    }).execute()
    task = result.data[0] if result.data else {}
    return StudyTaskResponse(**task)


@router.patch("/planner/tasks/{task_id}")
async def update_study_task(task_id: str, body: StudyTaskUpdate, user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    task = supabase.table("study_tasks").select("*").eq("id", task_id).eq("owner_id", user_id).maybe_single().execute()
    if not task.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    updates = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.description is not None:
        updates["description"] = body.description
    if body.scheduled_date is not None:
        updates["scheduled_date"] = body.scheduled_date.isoformat()
    if body.completed is not None:
        updates["completed"] = body.completed
        updates["completed_at"] = date.today().isoformat() if body.completed else None

    result = supabase.table("study_tasks").update(updates).eq("id", task_id).execute()
    updated = result.data[0] if result.data else {}
    return StudyTaskResponse(**updated)


@router.get("/planner/tasks")
async def list_study_tasks(user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("study_tasks").select("*").eq("owner_id", user_id).order("scheduled_date").execute()
    return {"data": result.data or [], "error": None}


@router.delete("/planner/tasks/{task_id}")
async def delete_study_task(task_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    task = supabase.table("study_tasks").select("id").eq("id", task_id).eq("owner_id", user_id).maybe_single().execute()
    if not task.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    supabase.table("study_tasks").delete().eq("id", task_id).execute()
    return {"data": {"deleted": True}, "error": None}
