from pydantic import BaseModel
from typing import Literal


class QuizOption(BaseModel):
    label: str
    text: str


class QuizQuestionResponse(BaseModel):
    id: str
    question_text: str
    options: list[QuizOption]
    order_index: int


class QuizGenerateRequest(BaseModel):
    topic: str
    difficulty: Literal["easy", "medium", "hard"]
    question_count: int


class QuizAttemptRequest(BaseModel):
    answers: dict[str, str]


class AttemptDetail(BaseModel):
    question_id: str
    selected: str
    correct: str
    is_correct: bool
    explanation: str | None = None


class QuizEvaluation(BaseModel):
    weak_topics: list[str]
    strong_topics: list[str]
    recommendations: list[str]


class QuizAttemptResponse(BaseModel):
    attempt_id: str
    score: float
    total_correct: int
    total_questions: int
    evaluation: QuizEvaluation
    details: list[AttemptDetail]
