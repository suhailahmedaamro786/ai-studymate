from pydantic import BaseModel
from typing import Literal


class QuizOption(BaseModel):
    label: str
    text: str


class QuizQuestionInput(BaseModel):
    question_text: str
    options: list[QuizOption]
    correct_option: str
    explanation: str = ""


class QuizGenerationResponse(BaseModel):
    questions: list[QuizQuestionInput]


class QuizEvaluationResponse(BaseModel):
    weak_topics: list[str]
    strong_topics: list[str]
    recommendations: list[str]
