from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from middleware.auth_middleware import get_current_user
from services.supabase_service import (
    create_confirmed_auth_user,
    initialize_user_credits,
    get_user_credits,
)
from datetime import datetime, timezone

router = APIRouter()

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


@router.post("/auth/signup")
async def signup(payload: SignupRequest):
    user = await create_confirmed_auth_user(payload.email, payload.password)
    return {"success": True, "user": user}

@router.post("/user/init")
async def init_user(current_user: dict = Depends(get_current_user)):
    """
    Called on first login from the frontend.
    Initializes user_credits row with 5 free credits + 7-day trial.
    Safe to call multiple times (idempotent).
    """
    data = await initialize_user_credits(
    current_user["user_id"],
    current_user.get("email", "")
)
    return {"success": True, "data": data}


@router.get("/user/credits")
async def get_credits(current_user: dict = Depends(get_current_user)):
    """Returns the user's current credit balance, trial status, and days remaining."""
    data = await get_user_credits(current_user["user_id"])

    trial_ends_at = datetime.fromisoformat(data["trial_ends_at"])
    now = datetime.now(timezone.utc)
    in_trial = now < trial_ends_at
    days_remaining = max(0, (trial_ends_at - now).days)

    return {
        "credits_remaining": data["credits_remaining"],
        "in_trial": in_trial,
        "trial_ends_at": data["trial_ends_at"],
        "days_remaining": days_remaining,
        "trial_expired": not in_trial,
    }
