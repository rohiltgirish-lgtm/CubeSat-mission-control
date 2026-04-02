"""CubeSat Alert – FastAPI backend entry-point."""
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from routers import telemetry, collision, satellites  # noqa: E402

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML models once at startup
    from ml.model_store import load_models
    load_models()
    yield


app = FastAPI(
    title="CubeSat Alert API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(telemetry.router, prefix="/api/telemetry", tags=["Telemetry"])
app.include_router(collision.router, prefix="/api/collision", tags=["Collision"])
app.include_router(satellites.router, prefix="/api/satellites", tags=["Satellites"])


@app.get("/health")
def health():
    return {"status": "ok"}
