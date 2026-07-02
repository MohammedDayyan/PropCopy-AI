from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import property, payments, auth
from config import get_settings

settings = get_settings()

app = FastAPI(
    title="PropCopy AI API",
    description="Backend API for PropCopy AI",
    version="1.0.0",
)

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if settings.frontend_url:
    allowed_origins.append(settings.frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://prop-copy-[a-z0-9]+-mohammeddayyans-projects\.vercel\.app$",
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

