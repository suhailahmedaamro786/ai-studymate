from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import admin, auth, career, documents, health, planner, profiles, quiz, tutor
from app.core.config import settings
from app.core.error_handler import register_exception_handlers
from app.core.logging import setup_logging

setup_logging()

app = FastAPI(
    title="AI StudyMate API",
    description="Backend API for AI StudyMate",
    version="0.1.0",
)

cors_origins = {
    origin.strip().rstrip("/")
    for origin in settings.cors_origins.split(",")
    if origin.strip()
}
# Keep production browser access working even if Railway's CORS env var was
# left with an older value.
cors_origins.update({
    "https://ai-studymate-dkel.vercel.app",
    "http://localhost:3000",
})

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(cors_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(health.router, tags=["health"])
app.include_router(profiles.router, prefix="/api", tags=["profiles"])
app.include_router(documents.router, prefix="/api", tags=["documents"])
app.include_router(tutor.router, prefix="/api", tags=["tutor"])
app.include_router(quiz.router, prefix="/api", tags=["quiz"])
app.include_router(planner.router, prefix="/api", tags=["planner"])
app.include_router(career.router, prefix="/api", tags=["career"])
app.include_router(admin.router, prefix="/api", tags=["admin"])

register_exception_handlers(app)
