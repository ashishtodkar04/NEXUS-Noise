from fastapi import APIRouter, Depends
from database import get_db
from models import Notification
from auth import get_current_user
from datetime import datetime
import uuid

router = APIRouter()

@router.get("/")
async def get_notifications(user_email: str = Depends(get_current_user), db=Depends(get_db)):
    users_collection = db["users"]
    notifs_collection = db["notifications"]
    
    user = await users_collection.find_one({"email": user_email})
    if not user:
        return []
        
    role = user.get("role", "citizen")
    
    # Get notifications for this specific user, or broadcasted to their role
    query = {
        "$or": [
            {"recipient": user["_id"]},
            {"recipient": f"all_{role}"},
            {"recipient": "all"}
        ]
    }
    
    cursor = notifs_collection.find(query).sort("created_at", -1).limit(50)
    notifs = await cursor.to_list(length=50)
    return notifs

@router.put("/read")
async def mark_read(user_email: str = Depends(get_current_user), db=Depends(get_db)):
    users_collection = db["users"]
    notifs_collection = db["notifications"]
    
    user = await users_collection.find_one({"email": user_email})
    if not user:
        return {"success": False}
        
    role = user.get("role", "citizen")
    query = {
        "$or": [
            {"recipient": user["_id"]},
            {"recipient": f"all_{role}"},
            {"recipient": "all"}
        ]
    }
    
    await notifs_collection.update_many(query, {"$set": {"read": True}})
    return {"success": True}
