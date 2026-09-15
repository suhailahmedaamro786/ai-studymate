import logging
from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


async def get_current_user(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        logger.warning("Auth: Missing Bearer authorization header")
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.removeprefix("Bearer ").strip()

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("Auth: Token payload missing sub claim")
            raise HTTPException(status_code=401, detail="Invalid token: no user id")
        return user_id
    except JWTError as e:
        logger.warning(f"Auth: JWT decode failed: {type(e).__name__}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
