import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
import pytest
from app.domain.quiz.validation import validate_quiz_config
from app.core.exceptions import ValidationError


def test_valid_config():
    validate_quiz_config({"topic": "Biology", "difficulty": "medium", "question_count": 5})


def test_empty_topic():
    with pytest.raises(ValidationError, match="Topic is required"):
        validate_quiz_config({"topic": "", "difficulty": "medium", "question_count": 5})


def test_invalid_difficulty():
    with pytest.raises(ValidationError, match="easy, medium, or hard"):
        validate_quiz_config({"topic": "Biology", "difficulty": "extreme", "question_count": 5})


def test_invalid_count_too_low():
    with pytest.raises(ValidationError, match="1 and 20"):
        validate_quiz_config({"topic": "Biology", "difficulty": "easy", "question_count": 0})


def test_invalid_count_too_high():
    with pytest.raises(ValidationError, match="1 and 20"):
        validate_quiz_config({"topic": "Biology", "difficulty": "easy", "question_count": 25})
