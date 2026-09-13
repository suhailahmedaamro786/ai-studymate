from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user
from app.core.supabase import get_supabase_client
from app.schemas.career import CareerAnalysisRequest, CareerRecommendationResponse
from app.domain.career.ai_adapter import analyze_career, CareerAnalysisRequest as DomainRequest

router = APIRouter()


@router.post("/career/analyze", status_code=201)
async def analyze_career_endpoint(user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    profile_result = supabase.table("profiles").select("*").eq("user_id", user_id).maybe_single().execute()
    profile = profile_result.data if profile_result.data else {}

    subjects = profile.get("subjects", []) or []
    goals = profile.get("goals", "") or ""

    if not subjects and not goals:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Complete your profile first to get career recommendations")

    request = DomainRequest(profile=profile, subjects=subjects, goals=goals)

    try:
        result = await analyze_career(request)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail={"code": "AI_PROVIDER_ERROR", "message": str(e)[:200]})

    insert = supabase.table("career_recommendations").insert({
        "owner_id": user_id,
        "profile_id": profile.get("id"),
        "recommended_roles": result.recommended_roles,
        "skill_gaps": result.skill_gaps,
        "recommended_skills": result.recommended_skills,
        "learning_paths": result.learning_paths,
    }).execute()
    record = insert.data[0] if insert.data else {}
    return CareerRecommendationResponse(
        id=record.get("id", ""),
        recommended_roles=result.recommended_roles,
        skill_gaps=result.skill_gaps,
        recommended_skills=result.recommended_skills,
        learning_paths=result.learning_paths,
        created_at=record.get("created_at", ""),
    )


@router.get("/career/recommendations")
async def list_career_recommendations(user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = supabase.table("career_recommendations").select("*").eq("owner_id", user_id).order("created_at", desc=True).execute()
    return {"data": result.data or [], "error": None}
