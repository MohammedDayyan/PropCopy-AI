import hmac
import hashlib
import razorpay
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from middleware.auth_middleware import get_current_user
from services.supabase_service import add_credits, log_payment
from config import get_settings

settings = get_settings()
router = APIRouter()

# Credits pack config
CREDITS_PACK = {
    "amount_paise": 49900,   # ₹499 in paise
    "credits": 20,
    "label": "20 Property Generations",
}


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    credits: int
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(current_user: dict = Depends(get_current_user)):
    """
    Creates a Razorpay order for the ₹499 / 20 credits pack.
    Returns order details needed by the Razorpay checkout widget.
    """
    try:
        client = razorpay.Client(
            auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
        )
        order = client.order.create(
            {
                "amount": CREDITS_PACK["amount_paise"],
                "currency": "INR",
                "notes": {
                    "user_id": current_user["user_id"],
                    "credits": str(CREDITS_PACK["credits"]),
                    "product": "PropCopy AI Credits",
                },
            }
        )
        return CreateOrderResponse(
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"],
            credits=CREDITS_PACK["credits"],
            key_id=settings.razorpay_key_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")


@router.post("/verify-payment")
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Verifies Razorpay payment signature (prevents tampering).
    On success: adds 20 credits to user account and logs payment.
    """
    # Razorpay signature verification
    expected_signature = hmac.new(
        settings.razorpay_key_secret.encode("utf-8"),
        f"{request.razorpay_order_id}|{request.razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, request.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature. Payment verification failed.")

    user_id = current_user["user_id"]

    # Add credits
    updated = await add_credits(user_id, CREDITS_PACK["credits"])

    # Log the payment
    await log_payment(
        user_id=user_id,
        razorpay_order_id=request.razorpay_order_id,
        razorpay_payment_id=request.razorpay_payment_id,
        amount=CREDITS_PACK["amount_paise"],
        credits=CREDITS_PACK["credits"],
    )

    return {
        "success": True,
        "message": f"Payment verified! {CREDITS_PACK['credits']} credits added to your account.",
        "credits_remaining": updated.get("credits_remaining", 0),
    }
