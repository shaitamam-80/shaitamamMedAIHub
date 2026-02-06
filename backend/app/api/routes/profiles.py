"""
MedAI Hub - Profiles API Routes
Handles user profile operations (get/update).
Uses existing database.py methods: get_profile(), update_profile().
"""

import logging
from fastapi import APIRouter, HTTPException, status, Depends
from app.api.models.schemas import ProfileUpdate
from app.services.database import db_service
from app.core.auth import get_current_user, UserPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me")
async def get_my_profile(
    current_user: UserPayload = Depends(get_current_user),
):
    """Get the current authenticated user's profile."""
    try:
        profile = await db_service.get_profile(current_user.id)

        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found. It may not have been created yet.",
            )

        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error getting profile for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving your profile.",
        )


@router.patch("/me")
async def update_my_profile(
    body: ProfileUpdate,
    current_user: UserPayload = Depends(get_current_user),
):
    """Update the current authenticated user's profile."""
    try:
        update_data = body.model_dump(exclude_unset=True)

        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update",
            )

        updated_profile = await db_service.update_profile(
            current_user.id, update_data
        )

        if not updated_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found",
            )

        return updated_profile
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating profile for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating your profile.",
        )
