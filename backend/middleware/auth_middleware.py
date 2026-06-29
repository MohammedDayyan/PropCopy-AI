import jwt
from jwt import PyJWKClient
from fastapi import HTTPException, Header
from config import get_settings

settings = get_settings()

# Initialize a JWKS client pointing at Supabase's public key endpoint.
# PyJWKClient automatically fetches, caches and rotates signing keys.
# No need to store SUPABASE_JWT_SECRET at all.
JWKS_URL = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
jwks_client = PyJWKClient(JWKS_URL, cache_keys=True)


async def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Validates Supabase-issued JWT using the project's JWKS endpoint.
    This approach:
      - Requires no stored secret key
      - Automatically handles key rotation
      - Works with both RS256 and HS256 Supabase configurations
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

    token = authorization.split(" ", 1)[1]

    try:
        # Fetch the matching signing key from Supabase JWKS
        signing_key = jwks_client.get_signing_key_from_jwt(token)

        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256", "HS256"],  # Supabase uses ES256 (Elliptic Curve)
            options={"verify_aud": False},  # Supabase audience is project-specific
        )

        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token missing user ID")

        return {"user_id": user_id, "email": payload.get("email", "")}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please sign in again.")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")
