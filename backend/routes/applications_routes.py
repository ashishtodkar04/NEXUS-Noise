import os
import re
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional
from pydantic import BaseModel
from database import get_db
from models import ApplicationCreate, Application
from auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter()

UPLOAD_DIR = "uploads"
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_DOCUMENT_SIZE = 10 * 1024 * 1024

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

class ApplicationStatusUpdate(BaseModel):
    status: str
    approved_limit_db: Optional[int] = None
    special_conditions: Optional[str] = None


@router.post("/documents")
async def upload_application_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    user_email: str = Depends(get_current_user),
):
    """Upload one supporting permit document and return its stored metadata."""
    if document_type not in {"event_permission", "venue_booking", "organizer_id"}:
        raise HTTPException(status_code=400, detail="Invalid document type")
    if not file.filename or file.content_type not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(status_code=400, detail="Upload a PDF, JPG, PNG, or WEBP document")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="The selected document is empty")
    if len(content) > MAX_DOCUMENT_SIZE:
        raise HTTPException(status_code=413, detail="Each supporting document must be 10 MB or smaller")

    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in {".pdf", ".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Invalid document extension")

    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", os.path.basename(file.filename))
    stored_name = f"application-{uuid.uuid4().hex}{extension}"
    async with aiofiles.open(os.path.join(UPLOAD_DIR, stored_name), "wb") as output:
        await output.write(content)

    return {
        "type": document_type,
        "name": safe_name,
        "url": f"/uploads/{stored_name}",
        "content_type": file.content_type,
        "size": len(content),
    }

@router.post("/")
async def create_application(
    app_in: ApplicationCreate, 
    user_email: str = Depends(get_current_user),
    db=Depends(get_db)
):
    users_collection = db["users"]
    apps_collection = db["applications"]
    
    user = await users_collection.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    app_dict = app_in.dict()
    # Applicant identity is always taken from the authenticated database user,
    # not from editable browser form fields.
    app_dict.update({
        "applicant_name": user.get("full_name", ""),
        "applicant_phone": user.get("phone") or "",
        "applicant_email": user.get("email", ""),
    })
    app_dict["_id"] = str(uuid.uuid4())
    app_dict["user_id"] = user["_id"]
    app_dict["status"] = "Pending"
    app_dict["created_at"] = datetime.utcnow()
    
    await apps_collection.insert_one(app_dict)
    return app_dict

@router.get("/")
async def get_applications(user_email: str = Depends(get_current_user), db=Depends(get_db)):
    users_collection = db["users"]
    apps_collection = db["applications"]
    
    user = await users_collection.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # If police, return all. If citizen, return own.
    if user.get("role") in ["police", "police_admin", "police_patrol"]:
        cursor = apps_collection.find({})
    else:
        cursor = apps_collection.find({"user_id": user["_id"]})
        
    apps = await cursor.to_list(length=100)
    return apps

@router.put("/{app_id}/status")
async def update_application_status(
    app_id: str, 
    update: ApplicationStatusUpdate,
    user_email: str = Depends(get_current_user), 
    db=Depends(get_db)
):
    users_collection = db["users"]
    apps_collection = db["applications"]
    events_collection = db["events"]
    
    user = await users_collection.find_one({"email": user_email})
    if not user or user.get("role") not in ["police", "police_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    update_data = {"status": update.status}
    if update.status == "Approved":
        update_data["approved_limit_db"] = update.approved_limit_db or 75
        update_data["approval_ref_no"] = f"NXS-PERMIT-2026-{uuid.uuid4().hex[:4].upper()}"
        
        # Auto-create Event at the applicant's real coordinates (D4)
        app = await apps_collection.find_one({"_id": app_id})
        if app:
            new_event = {
                "_id": f"EVT-2026-{uuid.uuid4().hex[:6].upper()}",
                "name": app.get("event_name"),
                "category": app.get("category"),
                "location": {
                    "latitude": app.get("location_lat") or 18.6279,
                    "longitude": app.get("location_lng") or 73.8009,
                    "address": app.get("location_name"),
                },
                "date": app.get("date"),
                "time": f"{app.get('start_time')} - {app.get('end_time')}",
                "organizer": app.get("applicant_name") or "Approved Organizer",
                "status": "Active",
                "permitted_db": update_data["approved_limit_db"]
            }
            await events_collection.insert_one(new_event)
            
    if update.special_conditions is not None:
        update_data["special_conditions"] = update.special_conditions
        
    result = await apps_collection.update_one(
        {"_id": app_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
        
    return {"message": "Updated successfully"}
