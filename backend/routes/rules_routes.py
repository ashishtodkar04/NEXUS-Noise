from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models import RuleUpdate
from auth import get_current_user
import uuid

router = APIRouter()

@router.get("/")
async def get_rules(db=Depends(get_db)):
    rules_collection = db["rules"]

    default_rules = {
        "_id": "global_rules",
        "daytime_limit": 65,
        "nighttime_limit": 55,
        "industrial_limit": 75,
        "commercial_limit": 65,
        "residential_limit": 55,
        "silence_zone_limit": 50,
        "warning_threshold": 3,
        "violation_threshold": 5,
        "cutoff_time": "22:00",
        "min_monitoring_duration_sec": 300,
    }

    rule = await rules_collection.find_one({"_id": "global_rules"})
    if not rule:
        await rules_collection.insert_one(default_rules)
        return default_rules

    # Backfill any newly introduced enforcement fields so older seeds stay complete
    if any(key not in rule for key in default_rules):
        updates = {k: v for k, v in default_rules.items() if k not in rule}
        await rules_collection.update_one({"_id": "global_rules"}, {"$set": updates})
        rule = await rules_collection.find_one({"_id": "global_rules"})

    return rule

@router.put("/")
async def update_rules(
    rules_in: RuleUpdate,
    user_email: str = Depends(get_current_user),
    db=Depends(get_db)
):
    users_collection = db["users"]
    user = await users_collection.find_one({"email": user_email})
    # Only police admins / officers may update the global thresholds
    if not user or user.get("role") not in ["police", "police_admin"]:
        raise HTTPException(status_code=403, detail="Only police officers can update rules")

    rules_collection = db["rules"]
    update_data = rules_in.dict()
    await rules_collection.update_one(
        {"_id": "global_rules"},
        {"$set": update_data},
        upsert=True
    )
    return {"message": "Rules updated successfully", "data": update_data}
