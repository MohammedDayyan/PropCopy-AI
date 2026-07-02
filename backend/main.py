import re
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from routers import property, payments, auth
from config import get_settings

settings = get_settings()

app = FastAPI(
    title="PropCopy AI API",
    description="Backend API for PropCopy AI - Real Estate Marketing Copy Generator",
    version="1.0.0",
)

ALLOWED_ORIGIN_REGEX = re.compile(
    r"^https://prop-copy-[a-zA-Z0-9-]+-mohammeddayyans-projects\.vercel\.app$"
)

allowed_origins = {
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://prop-copy-jsry47yru-mohammeddayyans-projects.vercel.app",
}

if settings.frontend_url:
    allowed_origins.add(settings.frontend_url.rstrip("/"))


def is_allowed_origin(origin: str | None) -> bool:
    if not origin:
        return False
    return origin in allowed_origins or bool(ALLOWED_ORIGIN_REGEX.match(origin))


@app.middleware("http")
async def force_cors_headers(request: Request, call_next):
    origin = request.headers.get("origin")

    if request.method == "OPTIONS" and is_allowed_origin(origin):
        response = Response(status_code=204)
    else:
        response = await call_next(request)

    if is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization,Content-Type"

    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=list(allowed_origins),
    allow_origin_regex=r"^https://prop-copy-[a-zA-Z0-9-]+-mohammeddayyans-projects\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api", tags=["Auth & Credits"])
app.include_router(property.router, prefix="/api", tags=["Property Pipeline"])
app.include_router(payments.router, prefix="/api", tags=["Payments"])


@app.get("/", tags=["Root"])
async def root():
    return {"message": "PropCopy AI API is running", "docs": "/docs", "health": "/health"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "PropCopy AI API"}

# CORS — allow Next.js frontend
# CORS - allow local frontend + deployed Vercel frontends
allowed_origins = [
    "http://localhost:3000",
    "https://prop-copy-94kqmb7wh-mohammeddayyans-projects.vercel.app",
    settings.frontend_url.rstrip("/") if settings.frontend_url else "",
]

allowed_origins = [origin for origin in allowed_origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://prop-copy-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api", tags=["Auth & Credits"])
app.include_router(property.router, prefix="/api", tags=["Property Pipeline"])
app.include_router(payments.router, prefix="/api", tags=["Payments"])


@app.get("/", tags=["Root"])
async def root():
    return {"message": "PropCopy AI API is running 🚀", "docs": "/docs", "health": "/health"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": "PropCopy AI API"}
