import os
import asyncio
import httpx
from datetime import datetime, timezone
from fastapi import APIRouter, Request, Response, Query, HTTPException
from config import get_settings
from services.supabase_service import (
    get_supabase_admin,
    get_profile_by_whatsapp,
    link_whatsapp_to_email,
    check_and_deduct_credit,
    create_property,
    save_image_analysis,
    save_marketing_assets,
    get_user_credits,
)
from services.groq_service import analyze_all_images, synthesize_creative_assets
from routers.property import build_public_url
from groq import AsyncGroq

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp Webhook"])
settings = get_settings()

# In-memory dictionary to hold active sessions for each phone number
active_sessions = {}
session_locks = {}

class WhatsAppSession:
    @staticmethod
    def get_lock(phone: str) -> asyncio.Lock:
        if phone not in session_locks:
            session_locks[phone] = asyncio.Lock()
        return session_locks[phone]


# 1. Verification Handshake (GET /api/whatsapp/webhook)
@router.get("/webhook")
async def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    expected_token = settings.verify_token or "my_propcopy_secret_token_2026"
    if hub_mode == "subscribe" and hub_verify_token == expected_token:
        return Response(content=hub_challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification token mismatch")


# 2. Receive Webhook Events (POST /api/whatsapp/webhook)
@router.post("/webhook")
async def receive_webhook(request: Request):
    payload = await request.json()

    # Process incoming messaging entry
    entry = payload.get("entry", [])
    if not entry:
        return {"status": "ignored"}

    changes = entry[0].get("changes", [])
    if not changes:
        return {"status": "ignored"}

    value = changes[0].get("value", {})
    messages = value.get("messages", [])

    if not messages:
        return {"status": "read_receipt_or_status_update"}

    message = messages[0]
    sender_phone = message.get("from")
    msg_id = message.get("id")
    msg_type = message.get("type")

    # Step A: Handle Account Linking command (e.g. "link test@example.com")
    if msg_type == "text":
        text_body = message.get("text", {}).get("body", "").strip()
        if text_body.lower().startswith("link "):
            email = text_body[5:].strip()
            linked_profile = await link_whatsapp_to_email(sender_phone, email)
            if linked_profile:
                credits_info = await get_user_credits(linked_profile["id"])
                credits_left = credits_info.get("credits_remaining", 0)
                await send_whatsapp_text(
                    sender_phone,
                    f"🎉 *Success!* Your WhatsApp number has been successfully linked to account: *{email}*.\n\n"
                    f"💰 *Remaining Credits:* {credits_left}\n\n"
                    "Now you can send me 3–5 property photos along with a brief text description or voice note, "
                    "and I will automatically write your MLS description, Instagram caption, and ready-to-forward WhatsApp Broadcast!"
                )
            else:
                await send_whatsapp_text(
                    sender_phone,
                    f"❌ *Account Not Found*\n\nWe couldn't find an active account for email: *{email}*.\n"
                    "Please check the spelling or sign up on our website first."
                )
            return {"status": "processed"}

    # Step B: Lookup user profile
    user_profile = await get_profile_by_whatsapp(sender_phone)
    if not user_profile:
        await send_whatsapp_text(
            sender_phone,
            "Welcome to *PropCopy AI*! 📲\n\nTo link your WhatsApp number to your account, please reply with your registered email in this format:\n\n`link your.email@example.com`"
        )
        return {"status": "linking_prompt_sent"}

    # Step C: Group incoming messages into a single session (debounce)
    async with WhatsAppSession.get_lock(sender_phone):
        if sender_phone in active_sessions:
            session = active_sessions[sender_phone]
            if session["task"]:
                session["task"].cancel()
        else:
            session = {
                "images": [],
                "texts": [],
                "task": None
            }
            active_sessions[sender_phone] = session

        # Add message contents to session
        if msg_type == "image":
            image_info = message.get("image", {})
            session["images"].append(image_info)
        elif msg_type == "text":
            text_body = message.get("text", {}).get("body", "").strip()
            session["texts"].append(text_body)
        elif msg_type == "audio":
            audio_info = message.get("audio", {})
            session["texts"].append({"audio_id": audio_info.get("id"), "mime": audio_info.get("mime_type")})

        # Start a debounce timer (12 seconds)
        session["task"] = asyncio.create_task(debounce_session(sender_phone))

    return {"status": "queued"}


async def debounce_session(phone: str):
    await asyncio.sleep(12)  # Wait for more media/text files
    async with WhatsAppSession.get_lock(phone):
        session = active_sessions.pop(phone, None)
        if not session:
            return
    # Run the background processing pipeline
    asyncio.create_task(process_property_generation_whatsapp(phone, session))


# 3. WhatsApp Media Downloader
async def download_meta_media(media_id: str) -> bytes:
    token = settings.whatsapp_access_token
    headers = {"Authorization": f"Bearer {token}"}
    version = settings.whatsapp_version or "v25.0"
    url_endpoint = f"https://graph.facebook.com/{version}/{media_id}"

    async with httpx.AsyncClient() as client:
        # Step A: Get download URL
        meta_res = await client.get(url_endpoint, headers=headers)
        if meta_res.status_code != 200:
            raise Exception(f"Failed to fetch media metadata: {meta_res.text}")
        
        download_url = meta_res.json().get("url")
        if not download_url:
            raise Exception("No media download URL returned from Graph API")

        # Step B: Download file
        file_res = await client.get(download_url, headers=headers)
        if file_res.status_code != 200:
            # Fallback without headers
            file_res = await client.get(download_url)
            if file_res.status_code != 200:
                raise Exception(f"Failed to download media binary: {file_res.text}")
                
        return file_res.content


# 4. WhatsApp Response Text Sender
async def send_whatsapp_text(to_phone: str, text: str):
    token = settings.whatsapp_access_token
    phone_id = settings.whatsapp_phone_number_id
    version = settings.whatsapp_version or "v25.0"
    url = f"https://graph.facebook.com/{version}/{phone_id}/messages"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "text",
        "text": {"preview_url": False, "body": text},
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, headers=headers, json=payload)
        if r.status_code not in (200, 201):
            print(f"Failed to send WhatsApp message to {to_phone}: {r.text}")


# 5. WhatsApp Pipeline Generation
async def process_property_generation_whatsapp(phone: str, session: dict):
    user_profile = await get_profile_by_whatsapp(phone)
    if not user_profile:
        return
    user_id = user_profile["id"]
    email = user_profile["email"]

    # Retrieve images
    images_meta = session["images"]
    if not images_meta:
        await send_whatsapp_text(
            phone,
            "❌ *Generation Failed*\n\nPlease upload at least 1 image of the property to build the listing."
        )
        return

    # Check text / audio inputs
    texts_input = []
    groq_client = AsyncGroq(api_key=settings.groq_api_key)

    for item in session["texts"]:
        if isinstance(item, dict) and "audio_id" in item:
            # Transcribe voice note
            audio_id = item["audio_id"]
            try:
                audio_bytes = await download_meta_media(audio_id)
                # Send to Groq Whisper
                transcription = await groq_client.audio.transcriptions.create(
                    file=("voice.ogg", audio_bytes),
                    model="whisper-large-v3",
                    response_format="json",
                )
                transcribed_text = transcription.text.strip()
                if transcribed_text:
                    texts_input.append(transcribed_text)
            except Exception as audio_err:
                print(f"Voice note transcription error: {audio_err}")
        else:
            texts_input.append(item)

    raw_bullet_points = " ".join(texts_input).strip()
    if not raw_bullet_points:
        await send_whatsapp_text(
            phone,
            "❌ *Generation Failed*\n\nPlease send a text description or a voice note detailing the property specifications (e.g. BHK size, locality, pricing)."
        )
        return

    # Deduct credit
    has_credit = await check_and_deduct_credit(user_id)
    if not has_credit:
        await send_whatsapp_text(
            phone,
            "❌ *Insufficient Credits*\n\nYour PropCopy credits are exhausted. Please purchase a credits pack on our website:\n\n"
            f"🔗 {settings.frontend_url}/billing"
        )
        return

    await send_whatsapp_text(
        phone,
        "⏳ *Analyzing your request...*\n\nOur AI is processing your photos and voice/text description. Please wait a few seconds..."
    )

    try:
        # Create property listing record
        property_record = await create_property(user_id, raw_bullet_points, email)
        property_id = property_record["id"]

        # Download & Upload images to Supabase
        image_paths = []
        image_urls = []
        supabase_client = get_supabase_admin()

        for idx, img in enumerate(images_meta):
            media_id = img["id"]
            img_bytes = await download_meta_media(media_id)
            
            timestamp = int(datetime.now(timezone.utc).timestamp())
            storage_path = f"{user_id}/{timestamp}_{idx}_{media_id}.jpg"

            supabase_client.storage.from_("property-images").upload(
                path=storage_path,
                file=img_bytes,
                file_options={"content-type": "image/jpeg"}
            )
            image_paths.append(storage_path)
            image_urls.append(build_public_url(storage_path))

        # vision analyses
        image_analyses = await analyze_all_images(image_urls)

        # save analysis
        for path, analysis in zip(image_paths, image_analyses):
            await save_image_analysis(property_id, path, analysis)

        # synthesize assets
        assets = await synthesize_creative_assets(
            image_analyses=image_analyses,
            raw_description=raw_bullet_points,
            creative_type="instagram",
            company_name=None,
        )

        assets["logo_storage_path"] = None
        await save_marketing_assets(property_id, assets)

        # Build responses
        mls_desc = assets.get("mls_description", "")
        instagram_reel = assets.get("instagram_reel") or assets.get("instagram_post") or {}
        insta_caption = instagram_reel.get("caption", "")
        whatsapp_broadcast = instagram_reel.get("whatsapp_broadcast", "")

        dashboard_url = f"{settings.frontend_url}/dashboard"

        # Reply with the results split into clean messages
        await send_whatsapp_text(
            phone,
            "🎉 *PropCopy AI Assets Generated!*"
        )

        await send_whatsapp_text(
            phone,
            f"🏡 *MLS Description:*\n\n{mls_desc}"
        )

        await send_whatsapp_text(
            phone,
            f"📸 *Instagram Caption:*\n\n{insta_caption}\n\n"
            f"🔗 *View & Download Carousel Slides:*\n{dashboard_url}"
        )

        if whatsapp_broadcast:
            await send_whatsapp_text(
                phone,
                f"💬 *Ready-to-Forward WhatsApp Broadcast:*\n\n{whatsapp_broadcast}"
            )

    except Exception as e:
        print(f"Error executing WhatsApp property generation pipeline: {e}")
        # refund credit
        try:
            credits_row = await get_user_credits(user_id)
            if credits_row:
                supabase_client.table("user_credits").update(
                    {"credits_remaining": credits_row["credits_remaining"] + 1}
                ).eq("user_id", user_id).execute()
        except Exception as refund_err:
            print(f"Failed to refund credit: {refund_err}")

        await send_whatsapp_text(
            phone,
            "❌ *Generation Failed*\n\nAn unexpected error occurred while generating the property copy. Please check your inputs and try again."
        )
