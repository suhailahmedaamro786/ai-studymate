import logging
import uuid
from app.domain.quiz.response_schema import QuizEvaluationResponse
from app.domain.tutor.ai_adapter import call_with_fallback
from app.core.supabase import get_service_role_client

logger = logging.getLogger(__name__)


async def evaluate_attempt(quiz_id: str, answers: dict[str, str], user_id: str) -> dict:
    supabase = get_service_role_client()

    # Get quiz questions
    questions_result = (
        supabase.table("quiz_questions")
        .select("*")
        .eq("quiz_id", quiz_id)
        .eq("owner_id", user_id)
        .execute()
    )
    questions = questions_result.data or []

    if not questions:
        raise ValueError("Quiz not found or no questions")

    # Score
    total = len(questions)
    correct = 0
    details = []
    topic_performance: dict[str, list[bool]] = {}

    for q in questions:
        qid = q["id"]
        selected = answers.get(qid, "")
        is_correct = selected == q["correct_option"]
        if is_correct:
            correct += 1
        details.append({
            "question_id": qid,
            "selected": selected,
            "correct": q["correct_option"],
            "is_correct": is_correct,
            "explanation": q.get("explanation"),
        })
        topic = q.get("topic_tag", "general")
        topic_performance.setdefault(topic, []).append(is_correct)

    score = round((correct / total) * 100, 2) if total > 0 else 0.0

    # Create attempt
    attempt_result = (
        supabase.table("quiz_attempts")
        .insert({
            "quiz_id": quiz_id,
            "owner_id": user_id,
            "answers": answers,
            "score": score,
            "total_correct": correct,
            "total_questions": total,
        })
        .execute()
    )
    attempt = attempt_result.data[0] if attempt_result.data else {}
    attempt_id = attempt["id"]

    # AI evaluation
    weak = [t for t, results in topic_performance.items() if sum(results) / len(results) < 0.6]
    strong = [t for t, results in topic_performance.items() if sum(results) == len(results)]

    try:
        eval_response = await call_with_fallback(
            messages=[
                {"role": "system", "content": "Analyze quiz performance and provide study recommendations."},
                {
                    "role": "user",
                    "content": f"Score: {correct}/{total}. Weak topics: {weak}. Strong topics: {strong}. Topic details: {topic_performance}",
                },
            ],
            schema=QuizEvaluationResponse,
        )
        weak_topics = eval_response.get("weak_topics", weak)
        strong_topics = eval_response.get("strong_topics", strong)
        recommendations = eval_response.get("recommendations", [])
    except Exception as e:
        logger.warning(f"AI evaluation failed, using rule-based: {e}")
        weak_topics = weak
        strong_topics = strong
        recommendations = [f"Review topics: {', '.join(weak)}"] if weak else ["Keep studying!"]

    # Store evaluation
    supabase.table("quiz_evaluations").insert({
        "attempt_id": attempt_id,
        "quiz_id": quiz_id,
        "owner_id": user_id,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "recommendations": recommendations,
    }).execute()

    return {
        "attempt_id": attempt_id,
        "score": score,
        "total_correct": correct,
        "total_questions": total,
        "evaluation": {
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
            "recommendations": recommendations,
        },
        "details": details,
    }
