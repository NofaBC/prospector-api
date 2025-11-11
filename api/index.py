# prospector-api/api/index.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .prospect import router as prospect_router

app = FastAPI(title="Seekan Prospector API", version="0.1.0")

# IMPORTANT: Configure CORS for development. Lock down before production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for easy testing - CHANGE THIS FOR PROD
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the prospect router under /api
app.include_router(prospect_router, prefix="/api", tags=["prospecting"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "prospector"}

@app.get("/api/")
async def root():
    return {"message": "Welcome to Seekan Prospector API"}
