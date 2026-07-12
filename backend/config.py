from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    supabase_jwt_secret: str = ""  # No longer required — auth now uses JWKS endpoint

    # Groq
    groq_api_key: str

    # Razorpay
    razorpay_key_id: str
    razorpay_key_secret: str

    # App
    frontend_url: str = "http://localhost:3000"
    environment: str = "development"

    # WhatsApp
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_version: str = "v25.0"
    verify_token: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
