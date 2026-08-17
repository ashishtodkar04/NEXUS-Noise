from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

from database import get_db
from auth import get_current_user

router = APIRouter()


class PatrolReadingCreate(BaseModel):
    decibels: float
    area_limit: Optional[float] = None
    area_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    note: Optional[str] = None


@router.get("/")
async def list_readings(
    user_email: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Police/patrol users see all logged live-decibel readings from the field."""
    users_collection = db["users"]
    user = await users_collection.find_one({"email": user_email})
    if not user or user.get("role") not in ["police", "police_admin", "police_patrol"]:
        raise HTTPException(status_code=403, detail="Not authorized as police personnel.")

    readings = await db["patrol_readings"].find({}).sort("created_at", -1).to_list(length=200)
    return readings


@router.post("/")
async def create_reading(
    reading: PatrolReadingCreate,
    user_email: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Patrol officer logs a live phone-decibel measurement to HQ."""
    users_collection = db["users"]
    user = await users_collection.find_one({"email": user_email})
    if not user or user.get("role") not in ["police", "police_admin", "police_patrol"]:
        raise HTTPException(status_code=403, detail="Not authorized as police personnel.")

    new_reading = {
        "_id": str(uuid.uuid4()),
        "officer_email": user_email,
        "officer_name": user.get("full_name", ""),
        "decibels": reading.decibels,
        "area_limit": reading.area_limit,
        "area_type": reading.area_type,
        "latitude": reading.latitude,
        "longitude": reading.longitude,
        "note": reading.note,
        "violation": bool(reading.area_limit is not None and reading.decibels > reading.area_limit),
        "created_at": datetime.utcnow(),
    }
    await db["patrol_readings"].insert_one(new_reading)
    return new_reading