import base64
import logging
from functools import lru_cache
from typing import Any

import httpx
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from jose.exceptions import ExpiredSignatureError

from app.core.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

JWKS_URL = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _b64url_decode(value: str) -> bytes:
    """Decode base64url-encoded string to bytes."""
    padding = 4 - len(value) % 4
    value += "=" * padding
    return base64.urlsafe_b64decode(value)


def _jwk_to_pem(key: dict[str, Any]) -> str:
    """Convert a JWK (EC public key) to PEM-encoded public key string."""
    crv = key.get("crv", "P-256")
    x = _b64url_decode(key["x"])
    y = _b64url_decode(key["y"])

    curve_map = {
        "P-256": ec.SECP256R1(),
        "P-384": ec.SECP384R1(),
        "P-521": ec.SECP521R1(),
    }
    curve = curve_map.get(crv)
    if curve is None:
        raise ValueError(f"Unsupported curve: {crv}")

    public_numbers = ec.EllipticCurvePublicNumbers(
        x=int.from_bytes(x, "big"),
        y=int.from_bytes(y, "big"),
        curve=curve,
    )
    public_key = public_numbers.public_key()
    pem = public_key.public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return pem.decode("utf-8")


@lru_cache(maxsize=1)
def _get_jwks() -> dict[str, Any]:
    """Fetch and cache the Supabase JWKS. Only public key material is stored in memory."""
    try:
        with httpx.Client(timeout=10) as client:
            response = client.get(JWKS_URL)
            response.raise_for_status()
            return response.json()
    except Exception as exc:
        logger.error("Auth: Failed to fetch JWKS: %s", type(exc).__name__)
        raise HTTPException(status_code=500, detail="Auth configuration error") from exc


def _get_signing_key(token: str) -> str:
    """Extract kid from token header and return the matching PEM public key from JWKS."""
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Invalid token: missing key id")

    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            try:
                return _jwk_to_pem(key)
            except Exception as exc:
                logger.error("Auth: Failed to convert JWK to PEM: %s", type(exc).__name__)
                raise HTTPException(status_code=500, detail="Auth key error") from exc

    raise HTTPException(status_code=401, detail="Invalid token: signing key not found")


async def get_current_user(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        logger.warning("Auth: Missing Bearer authorization header")
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header.removeprefix("Bearer ").strip()

    try:
        signing_key = _get_signing_key(token)
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["ES256"],
            options={"verify_aud": False},
        )
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("Auth: Token payload missing sub claim")
            raise HTTPException(status_code=401, detail="Invalid token: no user id")
        return user_id
    except ExpiredSignatureError:
        logger.warning("Auth: Token expired")
        raise HTTPException(status_code=401, detail="Token expired")
    except JWTError as exc:
        logger.warning("Auth: JWT decode failed: %s", type(exc).__name__)
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user_token(request: Request) -> str:
    """Return the raw Bearer token from the Authorization header.

    Use this when you need to forward the caller's JWT to another service
    (e.g. PostgREST via supabase.postgrest.auth(token)) so that RLS policies
    can identify the authenticated user.
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    return auth_header.removeprefix("Bearer ").strip()
