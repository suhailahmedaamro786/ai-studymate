from app.core.config import settings


def check_grounding(chunks: list[dict]) -> tuple[bool, float]:
    if not chunks:
        return False, 0.0
    best_score = max(c.get("similarity", 0.0) for c in chunks)
    return best_score >= settings.grounding_threshold, best_score
