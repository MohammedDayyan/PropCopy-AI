from supabase import create_client, Client
from config import get_settings
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException

settings = get_settings()


def get_supabase_admin() -> Client:
    """Returns a Supabase client with the service role key (admin privileges, bypasses RLS)."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def create_confirmed_auth_user(email: str, password: str) -> dict:
    """
    Creates a Supabase Auth user without sending a confirmation email.
    This avoids Supabase's shared email rate limit during signup.
    """
    client = get_supabase_admin()
    normalized_email = email.strip().lower()

    try:
        result = client.auth.admin.create_user(
            {
                "email": normalized_email,
                "password": password,
                "email_confirm": True,
            }
        )
    except Exception as exc:
        message = str(exc)
        if "already" in message.lower() or "registered" in message.lower():
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        raise HTTPException(status_code=400, detail=message)

    user = getattr(result, "user", None)
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create account")

    user_id = getattr(user, "id", None)
    if not user_id:
        raise HTTPException(status_code=500, detail="Created account is missing a user ID")

    await initialize_user_credits(user_id)
    return {"user_id": user_id, "email": normalized_email}



# ─── User Credits ────────────────────────────────────────────────────────────

async def initialize_user_credits(user_id: str) -> dict:
    """Called on first login. Creates a user_credits row with 5 free credits + 7-day trial."""
    client = get_supabase_admin()
    trial_ends_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    # Use upsert so repeat calls are safe
    result = (
        client.table("user_credits")
        .upsert(
            {
                "user_id": user_id,
                "credits_remaining": 5,
                "trial_ends_at": trial_ends_at,
            },
            on_conflict="user_id",
            ignore_duplicates=True,  # Don't overwrite if already exists
        )
        .execute()
    )
    return result.data[0] if result.data else {}


async def get_user_credits(user_id: str) -> dict:
    """Fetches current credit balance and trial info for a user."""
    client = get_supabase_admin()
    try:
        result = (
            client.table("user_credits")
            .select("*")
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data
    except Exception:
        # Auto-initialize if missing (such as first login or missing record)
        return await initialize_user_credits(user_id)


async def check_and_deduct_credit(user_id: str) -> bool:
    """
    Checks if user has available credits (trial or purchased).
    If yes, deducts 1 credit and returns True. Otherwise returns False.
    """
    client = get_supabase_admin()
    credits_data = await get_user_credits(user_id)

    trial_ends_at = datetime.fromisoformat(credits_data["trial_ends_at"])
    now = datetime.now(timezone.utc)
    in_trial = now < trial_ends_at
    credits_remaining = credits_data["credits_remaining"]

    if credits_remaining <= 0:
        if not in_trial:
            return False
        # In trial but out of credits — still block
        return False

    # Deduct 1 credit
    client.table("user_credits").update(
        {"credits_remaining": credits_remaining - 1}
    ).eq("user_id", user_id).execute()
    return True


async def add_credits(user_id: str, amount: int) -> dict:
    """Adds purchased credits to a user's balance."""
    client = get_supabase_admin()
    current = await get_user_credits(user_id)
    new_balance = current["credits_remaining"] + amount
    result = (
        client.table("user_credits")
        .update({"credits_remaining": new_balance})
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else {}


# ─── Properties ──────────────────────────────────────────────────────────────

async def create_property(user_id: str, raw_bullet_points: str) -> dict:
    client = get_supabase_admin()
    result = (
        client.table("properties")
        .insert({"user_id": user_id, "raw_bullet_points": raw_bullet_points})
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create property record")
    return result.data[0]


async def save_image_analysis(property_id: str, storage_path: str, ai_analysis: str) -> dict:
    client = get_supabase_admin()
    result = (
        client.table("property_images")
        .insert(
            {
                "property_id": property_id,
                "storage_path": storage_path,
                "ai_analysis": ai_analysis,
            }
        )
        .execute()
    )
    return result.data[0] if result.data else {}


async def save_marketing_assets(property_id: str, assets: dict) -> dict:
    client = get_supabase_admin()
    result = (
        client.table("marketing_assets")
        .insert(
            {
                "property_id": property_id,
                "mls_description": assets.get("mls_description", ""),
                "instagram_script": assets.get("instagram_script", ""),
                "email_blast": assets.get("email_blast", ""),
                "facebook_ad": assets.get("facebook_ad", ""),
            }
        )
        .execute()
    )
    return result.data[0] if result.data else {}


async def get_user_properties(user_id: str) -> list:
    client = get_supabase_admin()
    result = (
        client.table("properties")
        .select("*, marketing_assets(*)")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


async def get_property_with_assets(property_id: str, user_id: str) -> dict:
    client = get_supabase_admin()
    try:
        result = (
            client.table("properties")
            .select("*, marketing_assets(*), property_images(*)")
            .eq("id", property_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        return result.data
    except Exception:
        raise HTTPException(status_code=404, detail="Property not found")


# ─── Payments ────────────────────────────────────────────────────────────────

async def log_payment(user_id: str, razorpay_order_id: str, razorpay_payment_id: str, amount: int, credits: int) -> dict:
    client = get_supabase_admin()
    result = (
        client.table("payment_logs")
        .insert(
            {
                "user_id": user_id,
                "razorpay_order_id": razorpay_order_id,
                "razorpay_payment_id": razorpay_payment_id,
                "amount_paise": amount,
                "credits_purchased": credits,
            }
        )
        .execute()
    )
    return result.data[0] if result.data else {}


async def update_property_listing(property_id: str, user_id: str, updates: dict) -> dict:
    """Updates property raw notes and/or generated marketing copy fields."""
    client = get_supabase_admin()
    
    # 1. Verify ownership of property
    property_check = (
        client.table("properties")
        .select("id")
        .eq("id", property_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not property_check.data:
        raise HTTPException(status_code=404, detail="Property listing not found or unauthorized")

    # 2. Update raw bullet points if provided
    if "raw_bullet_points" in updates and updates["raw_bullet_points"] is not None:
        client.table("properties").update(
            {"raw_bullet_points": updates["raw_bullet_points"]}
        ).eq("id", property_id).execute()

    # 3. Update marketing assets if provided
    asset_fields = ["mls_description", "instagram_script", "email_blast", "facebook_ad"]
    has_asset_updates = any(field in updates for field in asset_fields)
    
    if has_asset_updates:
        asset_updates = {
            field: updates[field]
            for field in asset_fields
            if field in updates and updates[field] is not None
        }
        if asset_updates:
            # Check if marketing_assets row already exists
            asset_check = (
                client.table("marketing_assets")
                .select("id")
                .eq("property_id", property_id)
                .execute()
            )
            if asset_check.data:
                client.table("marketing_assets").update(asset_updates).eq("property_id", property_id).execute()
            else:
                asset_updates["property_id"] = property_id
                client.table("marketing_assets").insert(asset_updates).execute()

    return await get_property_with_assets(property_id, user_id)
