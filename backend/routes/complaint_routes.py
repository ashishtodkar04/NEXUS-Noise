import os
import uuid
import aiofiles
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from pydantic import BaseModel
from database import get_db
from auth import get_current_user
from services.video_agents import process_video_complaint, inspect_video_evidence
from services.cache_service import complaint_cache
from models import Complaint
from routes.websocket_routes import manager
from middleware.request_validation import validate_file_upload

router = APIRouter()

class ComplaintStatusUpdate(BaseModel):
    status: str
    officer_notes: Optional[str] = None

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)


def serialize_complaint(complaint: dict) -> dict:
    """Expose one consistent complaint shape to every React screen."""
    data = dict(complaint)
    location = data.get("complaint_giver_location") or data.get("location") or {}
    latitude = location.get("latitude", data.get("lat"))
    longitude = location.get("longitude", data.get("lng"))
    address = location.get("address") or data.get("shop_name") or "Location not provided"
    analysis = data.get("analysis") or {}

    data.update({
        "id": data.get("_id"),
        "location": {"latitude": latitude, "longitude": longitude, "lat": latitude, "lng": longitude, "address": address},
        "lat": latitude,
        "lng": longitude,
        "locationName": address,
        "eventName": data.get("shop_name") or data.get("event_name") or "Unspecified disturbance",
        "measuredMaxNoise": analysis.get("predicted_source_db"),
        "permittedNoise": analysis.get("area_limit_applied") or data.get("permitted_db") or 65,
        "assignedAuthority": data.get("assigned_authority") or "Local Police Division",
    })
    return data

async def process_video_background(
    complaint_id: str, 
    video_path: str, 
    latitude: float, 
    longitude: float, 
    shop_name: str,
    event_lat: float = None,
    event_lon: float = None,
    area_type: str = "residential"
):
    db = get_db()
    complaints_collection = db["complaints"]

    # Pull the live, admin-editable area limits so Agent 4 uses real values (G4).
    area_limits = None
    try:
        rule = await db["rules"].find_one({"_id": "global_rules"})
        if rule:
            area_limits = {
                "residential": rule.get("residential_limit"),
                "commercial": rule.get("commercial_limit"),
                "industrial": rule.get("industrial_limit"),
                "silence": rule.get("silence_zone_limit"),
                "nighttime": rule.get("nighttime_limit"),
            }
    except Exception as e:
        print("Could not load rules for area analysis:", e)

    try:
        analysis_result = await process_video_complaint(
            video_path,
            latitude,
            longitude,
            shop_name,
            user_selected_event_lat=event_lat,
            user_selected_event_lon=event_lon,
            area_type=area_type,
            area_limits=area_limits,
        )

        # Update complaint with results + persisted area info (D3)
        await complaints_collection.update_one(
            {"_id": complaint_id},
            {"$set": {"status": "completed", "analysis": analysis_result, "area_type": area_type}}
        )
        
        # In dict form since analysis_result is usually a dict returned by process_video_complaint
        is_valid = analysis_result.get("is_valid", False) if isinstance(analysis_result, dict) else getattr(analysis_result, "is_valid", False)
        
        if is_valid:
            await manager.broadcast({
                "type": "new_valid_complaint",
                "complaint_id": complaint_id,
                "message": "New valid noise complaint detected!"
            })
            
    except Exception as e:
        await complaints_collection.update_one(
            {"_id": complaint_id},
            {"$set": {"status": "failed_processing"}}
        )
        print(f"Error processing complaint in background: {e}")

@router.post("/")
async def submit_complaint(
    background_tasks: BackgroundTasks,
    description: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    video: UploadFile = File(...),
    shop_name: str = Form(None), # Optional mock shop name for testing
    event_lat: float = Form(None),
    event_lon: float = Form(None),
    area_type: str = Form("residential"),
    user_email: str = Depends(get_current_user),
    db=Depends(get_db)
):
    users_collection = db["users"]
    
    user = await users_collection.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    content = await video.read()
    # Validate file upload using the actual byte count, then verify that the
    # claimed video is decodable rather than merely trusting its extension/MIME.
    is_valid, error_msg = validate_file_upload(video.filename, len(content), video.content_type or "")
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)
    if not (video.content_type or "").startswith("video/"):
        raise HTTPException(status_code=400, detail="A video recording is required; audio-only evidence is not accepted")
        
    # Save the video asynchronously
    file_id = str(uuid.uuid4())
    ext = video.filename.split('.')[-1]
    video_path = os.path.join(UPLOAD_DIR, f"{file_id}.{ext}")
    
    async with aiofiles.open(video_path, 'wb') as out_file:
        await out_file.write(content)

    try:
        video_evidence = inspect_video_evidence(video_path, content)
    except Exception as error:
        try:
            os.remove(video_path)
        except OSError:
            pass
        message = str(error) or "The uploaded file could not be inspected as video evidence"
        raise HTTPException(status_code=400, detail=message)
        
    # Create complaint record and store in TEMP CACHE (not database yet)
    complaint_data = {
        "_id": str(uuid.uuid4()),  # Will be used when moved to database
        "user_id": user["_id"],
        "user_email": user_email,
        "description": description,
        "complaint_giver_location": {"latitude": latitude, "longitude": longitude, "address": shop_name or ""},
        "event_location": {
            "latitude": event_lat,
            "longitude": event_lon,
            "address": (shop_name or description) if event_lat else None,
        } if event_lat else None,
        "area_type": area_type,
        "video_url": f"/uploads/{file_id}.{ext}",
        "video_evidence": video_evidence,
        "video_path": video_path,
        "shop_name": shop_name,
        "status": "pending_approval",
        "created_at": datetime.utcnow()
    }
    
    # Store in temp cache instead of database
    cache_id = complaint_cache.add_complaint(complaint_data)
    
    return {
        "message": "Complaint submitted and pending agent approval",
        "cache_id": cache_id,
        "complaint_id": complaint_data["_id"],
        "status": "pending_approval"
    }

@router.get("/")
async def get_complaints(user_email: str = Depends(get_current_user), db=Depends(get_db)):
    # Citizens only see their own complaints; police/patrol users see everything including cached.
    users_collection = db["users"]
    complaints_collection = db["complaints"]

    user = await users_collection.find_one({"email": user_email})
    role = user.get("role", "citizen") if user else "citizen"

    query = {}
    if role not in ["police", "police_admin", "police_patrol"]:
        query["user_id"] = user["_id"] if user else "__none__"

    cursor = complaints_collection.find(query).sort("created_at", -1)
    complaints = await cursor.to_list(length=100)
    
    pending_cached = complaint_cache.get_all_pending()
    if role not in ["police", "police_admin", "police_patrol"]:
        pending_cached = [item for item in pending_cached if item.get("user_id") == user["_id"]]
    for cached in pending_cached:
        cached["_is_cached"] = True

    return [serialize_complaint(item) for item in pending_cached + complaints]

# Specific routes must come BEFORE parameterized routes to avoid conflicts
@router.post("/approve/{cache_id}")
async def approve_complaint(
    cache_id: str,
    background_tasks: BackgroundTasks,
    user_email: str = Depends(get_current_user),
    db=Depends(get_db)
):
    """Approve a complaint from temp cache and move to database with AI processing"""
    users_collection = db["users"]
    complaints_collection = db["complaints"]
    
    user = await users_collection.find_one({"email": user_email})
    if not user or user.get("role") not in ["police", "police_admin", "police_patrol"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get complaint from cache
    complaint_data = complaint_cache.approve_complaint(cache_id)
    if not complaint_data:
        raise HTTPException(status_code=404, detail="Complaint not found in cache or expired")
    
    # Insert into database
    complaint_id = complaint_data["_id"]
    complaint_data["status"] = "processing"
    complaint_data["approved_by"] = user["_id"]
    complaint_data["approved_at"] = datetime.utcnow()
    
    await complaints_collection.insert_one(complaint_data)
    
    # Run AI Agents Pipeline in Background
    background_tasks.add_task(
        process_video_background, 
        complaint_id, 
        complaint_data["video_path"], 
        complaint_data["complaint_giver_location"]["latitude"], 
        complaint_data["complaint_giver_location"]["longitude"], 
        complaint_data["shop_name"],
        complaint_data["event_location"]["latitude"] if complaint_data.get("event_location") else None,
        complaint_data["event_location"]["longitude"] if complaint_data.get("event_location") else None,
        complaint_data["area_type"]
    )
    
    return {"message": "Complaint approved and moved to database", "complaint_id": complaint_id}

@router.post("/reject/{cache_id}")
async def reject_complaint(
    cache_id: str,
    user_email: str = Depends(get_current_user),
    db=Depends(get_db)
):
    """Reject a complaint from temp cache"""
    users_collection = db["users"]
    
    user = await users_collection.find_one({"email": user_email})
    if not user or user.get("role") not in ["police", "police_admin", "police_patrol"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    success = complaint_cache.reject_complaint(cache_id)
    if not success:
        raise HTTPException(status_code=404, detail="Complaint not found in cache")
    
    return {"message": "Complaint rejected and removed from cache"}

@router.get("/{complaint_id}")
async def get_complaint_by_id(
    complaint_id: str,
    user_email: str = Depends(get_current_user),
    db=Depends(get_db),
):
    complaints_collection = db["complaints"]
    complaint = await complaints_collection.find_one({"_id": complaint_id})
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    user = await db["users"].find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user.get("role") not in ["police", "police_admin", "police_patrol"] and complaint.get("user_id") != user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return serialize_complaint(complaint)

@router.put("/{complaint_id}")
async def update_complaint_status(
    complaint_id: str,
    update: ComplaintStatusUpdate,
    user_email: str = Depends(get_current_user),
    db=Depends(get_db)
):
    users_collection = db["users"]
    complaints_collection = db["complaints"]
    
    user = await users_collection.find_one({"email": user_email})
    if not user or user.get("role") not in ["police", "police_admin", "police_patrol"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    update_data = {"status": update.status}
    if update.officer_notes:
        update_data["officer_notes"] = update.officer_notes
        
    result = await complaints_collection.update_one(
        {"_id": complaint_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    return {"message": "Updated successfully"}
