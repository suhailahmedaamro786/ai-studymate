from app.core.exceptions import ValidationError


def validate_quiz_config(body: dict):
    topic = body.get("topic", "").strip()
    if not topic:
        raise ValidationError("Topic is required")

    difficulty = body.get("difficulty", "")
    if difficulty not in ("easy", "medium", "hard"):
        raise ValidationError("Difficulty must be easy, medium, or hard")

    count = body.get("question_count", 0)
    if not isinstance(count, int) or count < 1 or count > 20:
        raise ValidationError("Question count must be between 1 and 20")
