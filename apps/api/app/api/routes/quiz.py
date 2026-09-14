from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.core.supabase import get_supabase_client

router = APIRouter()


@router.post("/quiz/generate", status_code=201)
async def generate_quiz(body: dict, user_id: str = Depends(get_current_user)):
    from app.domain.quiz.generation import generate_quiz as gen_quiz
    from app.domain.quiz.validation import validate_quiz_config

    validate_quiz_config(body)
    quiz_data = await gen_quiz(body, user_id)
    return {"data": quiz_data, "error": None}


@router.get("/quiz")
async def list_quizzes(user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = (
        supabase.table("quizzes")
        .select("id")
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"data": [q["id"] for q in (result.data or [])], "error": None}


@router.get("/quiz/{quiz_id}")
async def get_quiz(quiz_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    quiz = (
        supabase.table("quizzes")
        .select("*")
        .eq("id", quiz_id)
        .eq("owner_id", user_id)
        .single()
        .execute()
    )
    if not quiz.data:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = (
        supabase.table("quiz_questions")
        .select("id, question_text, options, order_index")
        .eq("quiz_id", quiz_id)
        .order("order_index")
        .execute()
    )

    return {"data": {**quiz.data, "questions": questions.data}, "error": None}


@router.post("/quiz/{quiz_id}/attempt", status_code=201)
async def submit_attempt(quiz_id: str, body: dict, user_id: str = Depends(get_current_user)):
    from app.domain.quiz.evaluation import evaluate_attempt

    result = await evaluate_attempt(quiz_id, body.get("answers", {}), user_id)
    return {"data": result, "error": None}


@router.get("/quiz/{quiz_id}/attempts")
async def list_attempts(quiz_id: str, user_id: str = Depends(get_current_user)):
    supabase = get_supabase_client()
    result = (
        supabase.table("quiz_attempts")
        .select("id, score, total_correct, total_questions, created_at")
        .eq("quiz_id", quiz_id)
        .eq("owner_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return {"data": result.data, "error": None}
