import logging
import uuid
from app.domain.quiz.response_schema import QuizGenerationResponse, QuizQuestionInput
from app.domain.tutor.ai_adapter import get_ai_provider
from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)


async def generate_quiz(body: dict, owner_id: str) -> dict:
    provider = get_ai_provider()
    supabase = get_supabase_client()

    topic = body["topic"]
    difficulty = body["difficulty"]
    question_count = body["question_count"]

    # Create quiz record
    quiz_result = (
        supabase.table("quizzes")
        .insert({"topic": topic, "difficulty": difficulty, "question_count": question_count, "owner_id": owner_id})
        .execute()
    )
    quiz = quiz_result.data[0] if quiz_result.data else {}
    quiz_id = quiz["id"]

    system_prompt = (
        f"Generate exactly {question_count} multiple-choice questions about '{topic}' "
        f"at {difficulty} difficulty. Each question must have exactly 4 options labeled A, B, C, D. "
        "Return structured JSON."
    )
    user_prompt = f"Generate {question_count} MCQ questions about: {topic}"

    try:
        response = await provider.complete(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            schema=QuizGenerationResponse,
        )

        questions = []
        for i, q in enumerate(response.get("questions", [])):
            qid = str(uuid.uuid4())
            questions.append({
                "id": qid,
                "quiz_id": quiz_id,
                "owner_id": owner_id,
                "question_text": q["question_text"],
                "options": [opt.model_dump() for opt in q["options"]],
                "correct_option": q["correct_option"],
                "explanation": q.get("explanation", ""),
                "topic_tag": topic,
                "order_index": i,
            })

        # Store questions
        supabase.table("quiz_questions").insert(questions).execute()

        # Update quiz status
        supabase.table("quizzes").update({"status": "ready"}).eq("id", quiz_id).execute()

        return {
            "id": quiz_id,
            "topic": topic,
            "difficulty": difficulty,
            "status": "ready",
            "questions": [
                {
                    "id": q["id"],
                    "question_text": q["question_text"],
                    "options": q["options"],
                    "order_index": q["order_index"],
                }
                for q in questions
            ],
        }

    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        supabase.table("quizzes").update({"status": "failed", "error_message": str(e)[:500]}).eq("id", quiz_id).execute()
        raise
