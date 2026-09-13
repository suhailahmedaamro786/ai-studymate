from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, validator
from app.core.supabase import get_supabase_client
from app.middleware.auth import get_current_user


router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str | None = None

    @validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    access_token: str | None = None
    refresh_token: str | None = None
    user_id: str | None = None
    error: dict | None = None


@router.post("/auth/signup", response_model=AuthResponse)
async def signup(body: SignupRequest):
    supabase = get_supabase_client()
    result = supabase.auth.sign_up({
        "email": body.email,
        "password": body.password,
        "options": {
            "data": {"display_name": body.display_name or ""},
        },
    })

    error = getattr(result, "error", None)
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": error.get("code", "SIGNUP_FAILED"), "message": error.get("message", "Signup failed")},
        )

    session = getattr(result, "session", None)
    user = getattr(result, "user", None)
    if not session or not session.access_token or not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "SIGNUP_INCOMPLETE", "message": "Signup succeeded but no session was returned"},
        )

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token or "",
        user_id=user.id,
        error=None,
    )


@router.post("/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    supabase = get_supabase_client()
    result = supabase.auth.sign_in_with_password({
        "email": body.email,
        "password": body.password,
    })

    error = getattr(result, "error", None)
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": error.get("code", "LOGIN_FAILED"), "message": error.get("message", "Invalid credentials")},
        )

    session = getattr(result, "session", None)
    user = getattr(result, "user", None)
    if not session or not session.access_token or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "LOGIN_INCOMPLETE", "message": "Login failed"},
        )

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token or "",
        user_id=user.id,
        error=None,
    )


@router.post("/auth/refresh", response_model=AuthResponse)
async def refresh(body: RefreshRequest):
    supabase = get_supabase_client()
    result = supabase.auth.refresh_session(body.refresh_token)

    error = getattr(result, "error", None)
    if error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": error.get("code", "REFRESH_FAILED"), "message": error.get("message", "Refresh token invalid")},
        )

    session = getattr(result, "session", None)
    user = getattr(result, "user", None)
    if not session or not session.access_token or not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "REFRESH_INCOMPLETE", "message": "Refresh failed"},
        )

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token or "",
        user_id=user.id,
        error=None,
    )
