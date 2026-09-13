from typing import Any


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict[str, Any] | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}


class AuthError(AppError):
    def __init__(self, message: str = "Authentication required"):
        super().__init__("AUTH_REQUIRED", message, 401)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Access denied"):
        super().__init__("FORBIDDEN", message, 403)


class NotFoundError(AppError):
    def __init__(self, message: str = "Resource not found"):
        super().__init__("NOT_FOUND", message, 404)


class ValidationError(AppError):
    def __init__(self, message: str = "Validation error", details: dict | None = None):
        super().__init__("VALIDATION_ERROR", message, 422, details)


class AIProviderError(AppError):
    def __init__(self, message: str = "AI provider error"):
        super().__init__("AI_PROVIDER_ERROR", message, 502)
