from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse
from app.core.exceptions import AppError, AuthError, ForbiddenError, NotFoundError, ValidationError, AIProviderError
from app.core.logging import request_id_var, user_id_var
import logging

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "data": None,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                },
            },
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        logger.exception(f"Unhandled error: {exc}")
        return JSONResponse(
            status_code=500,
            content={
                "data": None,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                },
            },
        )
