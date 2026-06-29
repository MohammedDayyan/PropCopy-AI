from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import property, payments, auth
from config import get_settings

settings = get_settings()

app = FastAPI(
    title="PropCopy AI API",
    description="Backend API for PropCopy AI — Real Estate Marketing Copy Generator",
    version="1.0.0",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
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
