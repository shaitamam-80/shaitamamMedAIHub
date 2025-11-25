"""
MedAI Hub - Authentication Module
Handles JWT validation with Supabase
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import httpx
from pydantic import BaseModel

from app.core.config import settings


# Security scheme
security = HTTPBearer(auto_error=False)


class UserPayload(BaseModel):
    """Validated user information from JWT"""
    id: str  # Supabase user UUID
    email: Optional[str] = None
    role: str = "authenticated"


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> UserPayload:
    """
    Validate JWT token with Supabase and return user info.

    This function verifies the token by calling Supabase's /auth/v1/user endpoint,
    which validates the JWT signature and returns user data if valid.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Validate token with Supabase
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": settings.SUPABASE_KEY,
                }
            )

            if response.status_code == 200:
                user_data = response.json()
                return UserPayload(
                    id=user_data["id"],
                    email=user_data.get("email"),
                    role=user_data.get("role", "authenticated"),
                )
            elif response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token validation failed",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Authentication service unavailable: {str(e)}",
            )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[UserPayload]:
    """
    Optional authentication - returns None if no token provided.
    Useful for routes that work with or without authentication.
    """
    if credentials is None:
        return None

    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
