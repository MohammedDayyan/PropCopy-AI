from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from middleware.auth_middleware import get_current_user
from services.supabase_service import (
    create_property,
    save_image_analysis,
    save_marketing_assets,
    check_and_deduct_credit,
    get_user_properties,
    get_property_with_assets,
    update_property_listing,
)
from services.groq_service import analyze_all_images, synthesize_creative_assets
from config import get_settings

settings = get_settings()
router = APIRouter()


class ProcessPropertyRequest(BaseModel):
    image_paths: list[str]
    raw_bullet_points: str
    creative_type: str = "instagram"
    company_name: str | None = None
    logo_path: str | None = None

class ProcessPropertyResponse(BaseModel):
    property_id: str
    creative_type: str
    creative_brief: str = ""
    instagram_reel: dict = {}
    banner_poster: dict = {}
    email_brochure: dict = {}
    image_urls: list[str] = []
    logo_url: str | None = None
    


def build_public_url(storage_path: str, bucket: str = "property-images") -> str:
    base = settings.supabase_url.rstrip("/")
    return f"{base}/storage/v1/object/public/{bucket}/{storage_path}"


@router.post("/process-property", response_model=ProcessPropertyResponse)
async def process_property(
    request: ProcessPropertyRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Main AI pipeline endpoint:
    1. Check + deduct credits
    2. Create property record
    3. Analyze all images via Groq Vision (async, concurrent)
    4. Synthesize marketing copy via Groq text model (JSON mode)
    5. Save everything to Supabase
    6. Return all 4 marketing assets
    """
    user_id = current_user["user_id"]

    # ── Step 1: Credit Check ──────────────────────────────────────────────────
    has_credit = await check_and_deduct_credit(user_id)
    if not has_credit:
        raise HTTPException(
            status_code=402,
            detail="Insufficient credits. Please purchase a credits pack to continue.",
        )

    if not request.image_paths:
        raise HTTPException(status_code=400, detail="At least one image path is required")

    if not request.raw_bullet_points.strip():
        raise HTTPException(status_code=400, detail="Property bullet points cannot be empty")

    # ── Step 2: Create Property Record ────────────────────────────────────────
    property_record = await create_property(
    user_id,
    request.raw_bullet_points,
    current_user.get("email", "")
)
    property_id = property_record["id"]

    # ── Step 3: Vision Analysis (Concurrent) ──────────────────────────────────
    image_urls = [build_public_url(path) for path in request.image_paths]
    image_analyses = await analyze_all_images(image_urls)

    # Save each image analysis to DB
    for path, analysis in zip(request.image_paths, image_analyses):
        await save_image_analysis(property_id, path, analysis)

    # ── Step 4: Synthesize Marketing Copy ────────────────────────────────────
    try:
        assets = await synthesize_creative_assets(
        image_analyses=image_analyses,
        raw_description=request.raw_bullet_points,
        creative_type=request.creative_type,
        company_name=request.company_name,
    )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Creative generation failed: {str(e)}")

    # ── Step 5: Save Marketing Assets ─────────────────────────────────────────
    assets["logo_storage_path"] = request.logo_path
    await save_marketing_assets(property_id, assets)

    # ── Step 6: Return Results ────────────────────────────────────────────────
    return ProcessPropertyResponse(
    property_id=property_id,
    creative_type=assets.get("creative_type", request.creative_type),
    creative_brief=assets.get("creative_brief", ""),
    instagram_reel=assets.get("instagram_reel", {}),
    banner_poster=assets.get("banner_poster", {}),
    email_brochure=assets.get("email_brochure", {}),
    image_urls=image_urls,
    logo_url=build_public_url(request.logo_path, "brand-assets") if request.logo_path else None,
)


@router.get("/properties")
async def list_properties(current_user: dict = Depends(get_current_user)):
    """Returns all past property generations for the logged-in user."""
    properties = await get_user_properties(current_user["user_id"])
    return {"properties": properties}


@router.get("/properties/{property_id}")
async def get_property(
    property_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Returns a single property with all images and marketing assets."""
    data = await get_property_with_assets(property_id, current_user["user_id"])
    return data


class UpdatePropertyRequest(BaseModel):
    raw_bullet_points: str | None = None
    mls_description: str | None = None
    instagram_script: str | None = None
    email_blast: str | None = None
    facebook_ad: str | None = None

 
@router.put("/properties/{property_id}")
async def update_property(
    property_id: str,
    request: UpdatePropertyRequest,
    current_user: dict = Depends(get_current_user),
):
    """Updates property raw notes and/or generated copies."""
    updated = await update_property_listing(
        property_id,
        current_user["user_id"],
        request.model_dump(exclude_unset=True)
    )
    return updated
