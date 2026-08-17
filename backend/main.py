from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from routes import auth_routes, complaint_routes, events_routes, applications_routes, rules_routes, notifications_routes, websocket_routes, patrol_routes
import os
import logging
from contextlib import asynccontextmanager
from database import client, db, get_db
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from middleware.error_handler import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler,
    starlette_http_exception_handler
)
from middleware.request_validation import request_size_middleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: client is already created in database.py, but we can verify connection
    try:
        await client.admin.command('ping')
        print("Connected to MongoDB")
    except Exception as e:
        print(f"Could not connect to MongoDB: {e}")
    yield
    # Shutdown
    client.close()
    print("Closed MongoDB connection")

app = FastAPI(title="Nexus Noise Complaint Tracking API", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Add global exception handlers
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)
app.add_exception_handler(StarletteHTTPException, starlette_http_exception_handler)

# Add request size validation middleware
app.middleware("http")(request_size_middleware)

# Allow origins are configurable via env (comma-separated); defaults to Vite dev/preview.
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:4173",
)
_origins = [o.strip() for o in ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded videos statically
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(complaint_routes.router, prefix="/api/complaints", tags=["Complaints"])
app.include_router(events_routes.router, prefix="/api/events", tags=["Events"])
app.include_router(applications_routes.router, prefix="/api/applications", tags=["Applications"])
app.include_router(rules_routes.router, prefix="/api/rules", tags=["Rules"])
app.include_router(notifications_routes.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(patrol_routes.router, prefix="/api/readings", tags=["Patrol Readings"])
app.include_router(websocket_routes.router, tags=["WebSockets"])

@app.get("/")
@limiter.limit("10/minute")
async def read_root(request: Request):
    return {"message": "Noise Complaint Tracking API is running.", "docs": "/docs"}

@app.get("/api/health")
async def health_check(db=Depends(get_db)):
    """Readiness probe — verifies the MongoDB connection and reports data present."""
    from motor.motor_asyncio import AsyncIOMotorClient
    try:
        await client.admin.command("ping")
    except Exception as e:
        return {
            "status": "degraded",
            "database": "unreachable",
            "error": str(e),
        }
    collections = {}
    for name in ["users", "events", "applications", "complaints", "notifications", "rules", "approved_officers", "patrol_readings"]:
        try:
            collections[name] = await db[name].count_documents({})
        except Exception:
            collections[name] = -1
    return {"status": "ok", "database": db.name, "collections": collections}

