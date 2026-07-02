import asyncio
import base64
import httpx
from groq import AsyncGroq
from config import get_settings

settings = get_settings()
groq_client = AsyncGroq(api_key=settings.groq_api_key)

VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"
TEXT_MODEL = "llama-3.3-70b-versatile"

# ─── System Prompts ───────────────────────────────────────────────────────────

VISION_SYSTEM_PROMPT = """You are an expert real estate image analyst. Your job is to extract maximum useful information from property images for Indian real estate marketing.

Analyze the provided property image and respond with a detailed analysis following these rules:

1. **If the image contains text** (floor plans with dimensions, developer brochures, specification sheets, document scans):
   - Extract ALL text with 100% precision (OCR mode)
   - Preserve numbers, dimensions, room labels, area measurements exactly
   - Note carpet area, super built-up area, BHK configuration if present

2. **If the image is a property photo** (kitchen, bedroom, bathroom, living room, exterior, balcony, amenities, view):
   - Provide a rich, detailed visual description
   - Note: materials (marble/granite/vitrified tiles), lighting quality, spatial layout, condition
   - Identify: flooring type, ceiling height, window size, storage, fixtures, fittings
   - Note any premium features: modular kitchen, false ceiling, branded fittings, garden, pool, gym
   - Assess overall quality: luxury / premium / mid-range / budget

Return only the extracted information — no preamble or explanations."""


SYNTHESIS_SYSTEM_PROMPT = """You are PropCopy AI, an expert real estate marketing copywriter specializing in the Indian property market.

You will receive:
1. Visual descriptions/OCR extractions from property images
2. Raw bullet points about the property from the agent

Generate compelling, authentic marketing copy optimized for Indian real estate buyers and investors.

**Indian Real Estate Terminology to use:**
- Use "BHK" (2 BHK, 3 BHK) instead of bed/bath counts
- Use "carpet area" and "super built-up area" with sq.ft.
- Mention proximity to metro stations, IT parks, tech corridors, schools, hospitals
- Use terms like: vastu compliant, society amenities, gated community, ready to move, possession in [year]
- Price in ₹ Lakhs or Crores
- Reference relevant metro cities: Mumbai, Bangalore, Delhi-NCR, Hyderabad, Pune, Chennai

**Output Requirements:**
You MUST respond with ONLY a valid JSON object (no markdown, no explanation) with exactly these four keys:

{
  "mls_description": "A professional 150-200 word property listing description suitable for 99acres, MagicBricks, or Housing.com. Include BHK config, key features, location highlights, and a compelling CTA.",
  "instagram_script": "An engaging Instagram caption with emojis, 3-4 hashtags relevant to Indian real estate (#MumbaiRealty #DreamHome etc.), and a story-worthy hook. Max 150 words.",
  "email_blast": "A complete email blast with Subject line, personalized greeting, property highlights in bullet format, urgency CTA, and agent contact placeholder. 200-250 words.",
  "facebook_ad": "A Facebook/Meta ad copy with attention-grabbing headline (max 40 chars), primary text (max 125 chars), description, and CTA button text. Format as: HEADLINE:\\n[text]\\nPRIMARY TEXT:\\n[text]\\nDESCRIPTION:\\n[text]\\nCTA: [button text]"
}"""


# ─── Core Functions ───────────────────────────────────────────────────────────

async def analyze_image_from_url(image_url: str) -> str:
    """
    Sends a property image URL to Groq Vision model.
    Returns AI analysis (OCR text or visual description).
    """
    try:
        response = await groq_client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": VISION_SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url},
                        },
                        {
                            "type": "text",
                            "text": "Analyze this property image and extract all useful information for real estate marketing.",
                        },
                    ],
                },
            ],
            max_tokens=1024,
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"[Image analysis failed: {str(e)}]"


async def analyze_all_images(image_urls: list[str]) -> list[str]:
    """Processes all images concurrently using asyncio.gather."""
    tasks = [analyze_image_from_url(url) for url in image_urls]
    return await asyncio.gather(*tasks)


async def synthesize_marketing_copy(
    image_analyses: list[str],
    raw_bullet_points: str,
) -> dict:
    """
    Combines all image analyses + agent's bullet points and generates
    4 pieces of marketing copy via Groq text model in JSON mode.
    """
    # Build a rich context block
    analyses_text = "\n\n".join(
        [f"--- Image {i+1} Analysis ---\n{analysis}" for i, analysis in enumerate(image_analyses)]
    )

    user_message = f"""Generate Indian real estate marketing copy based on the following property information:

=== AGENT'S PROPERTY NOTES ===
{raw_bullet_points}

=== AI IMAGE ANALYSIS ===
{analyses_text}

Generate all four marketing assets now. Respond with ONLY the JSON object."""

    response = await groq_client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {"role": "system", "content": SYNTHESIS_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        max_tokens=2048,
        temperature=0.7,
        response_format={"type": "json_object"},
    )

    import json
    content = response.choices[0].message.content.strip()
    return json.loads(content)

CREATIVE_SYSTEM_PROMPT = """You are a senior social media and brand design copywriter.

Create render-ready Instagram posts, banners/posters, and email brochure content from uploaded photos and user descriptions.

Rules:
- Put the company logo just above the main text content for Instagram, banner/poster, and email.
- Instagram should feel like a bold editorial post: photo collage, dark gradient, logo/brand row, large uppercase headline, red/white emphasis.
- Banner/poster should be wide, polished, image-led, with logo above headline, CTA, and footer note.
- Email should be brochure-like with hero image, logo above intro, sections, CTA, and signature.
- Keep copy short enough to fit inside real designs.
- Return only valid JSON.

JSON shape:
{
  "creative_brief": "",
  "instagram_post": {
    "brand_handle": "",
    "headline": "",
    "highlight": "",
    "supporting_text": "",
    "caption": ""
  },
  "banner_poster": {
    "headline": "",
    "subheadline": "",
    "cta": "",
    "footer_note": ""
  },
  "email_brochure": {
    "subject": "",
    "preheader": "",
    "intro": "",
    "sections": [
      {"title": "", "body": ""}
    ],
    "cta": "",
    "signature": ""
  }
}"""


async def synthesize_creative_assets(
    image_analyses: list[str],
    raw_description: str,
    creative_type: str,
    company_name: str | None = None,
) -> dict:
    import json

    analyses_text = "\n\n".join(
        f"--- Image {i + 1} Analysis ---\n{analysis}"
        for i, analysis in enumerate(image_analyses)
    )

    brand = company_name.strip() if company_name else "the company"

    user_message = f"""
Requested creative type: {creative_type}
Company name: {brand}

USER DESCRIPTION:
{raw_description}

IMAGE ANALYSIS:
{analyses_text}
"""

    response = await groq_client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {"role": "system", "content": CREATIVE_SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        max_tokens=2048,
        temperature=0.75,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content.strip())