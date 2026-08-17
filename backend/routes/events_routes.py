from fastapi import APIRouter, Depends
from database import get_db

router = APIRouter()

@router.get("/")
async def get_events(db=Depends(get_db)):
    events_collection = db["events"]
    cursor = events_collection.find({})
    events = await cursor.to_list(length=100)
    return events
