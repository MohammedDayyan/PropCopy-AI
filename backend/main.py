import re
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from routers import property, payments, auth, whatsapp
from config import get_settings

settings = get_settings()

app = FastAPI(
    title="PropCopy AI API",
    description="Backend API for PropCopy AI",
    version="1.0.1",
)

VERCEL_PREVIEW_REGEX = re.compile(
    r"^https://prop-copy-[a-z0-9]+-mohammeddayyans-projects\.vercel\.app$"
)

allowed_origins = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
}

if settings.frontend_url:
    allowed_origins.add(settings.frontend_url.rstrip("/"))


def origin_is_allowed(origin: str | None) -> bool:
    if not origin:
        return False
    return origin in allowed_origins or bool(VERCEL_PREVIEW_REGEX.match(origin))


def add_cors_headers(response: JSONResponse, origin: str | None):
    if origin_is_allowed(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"
    return response


@app.middleware("http")
async def cors_and_error_debug_middleware(request: Request, call_next):
    origin = request.headers.get("origin")

    if request.method == "OPTIONS":
        return add_cors_headers(JSONResponse(content={}, status_code=204), origin)

    try:
        response = await call_next(request)
    except Exception as exc:
        print("UNHANDLED BACKEND ERROR:")
        print(traceback.format_exc())

        response = JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "type": exc.__class__.__name__,
            },
        )

    return add_cors_headers(response, origin)


app.include_router(auth.router, prefix="/api", tags=["Auth & Credits"])
app.include_router(property.router, prefix="/api", tags=["Property Pipeline"])
app.include_router(payments.router, prefix="/api", tags=["Payments"])
app.include_router(whatsapp.router, prefix="/api", tags=["WhatsApp Webhook"])


@app.get("/")
async def root():
    return {
        "message": "PropCopy AI API is running",
        "version": "1.0.1",
        "frontend_url": settings.frontend_url,
    }


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "PropCopy AI API", "version": "1.0.1"}


@app.get("/cors-debug")
async def cors_debug(request: Request):
    return {
        "origin": request.headers.get("origin"),
        "allowed_origins": list(allowed_origins),
        "frontend_url": settings.frontend_url,
    }