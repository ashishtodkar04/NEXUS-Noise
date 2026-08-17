"""Nexus-Noise MongoDB setup & seed script.

Run from the backend directory (deps installed + MongoDB running):
    python seed_db.py

Creates/ensures every collection and index, then inserts baseline data so the
app works immediately: admin/patrol/citizen accounts, global noise rules, seed
events and welcome notifications. Idempotent — safe to run multiple times.
"""
import asyncio
import sys
import uuid
from datetime import datetime

from database import client, db
from auth import get_password_hash


# ---------------------------------------------------------------------------
# Baseline data
# ---------------------------------------------------------------------------

RULES = {
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

# email, password, full_name, phone, role, badge_id
USERS = [
    ("admin@police.gov",   "admin123",   "Chief Police Admin", "911",         "police_admin", "ADMIN-001"),
    ("officer@police.gov", "officer123", "Officer Deshmukh",   "9822012345",  "police",       "PC-8812"),
    ("patrol@police.gov",  "patrol123",  "Officer Patil",      "9876543210",  "police_patrol","P-9082"),
    ("citizen@demo.gov",   "citizen123", "Demo Citizen",       "9822001122",  "citizen",      None),
]

EVENTS = [
    {"_id": "EVT-2026-101", "name": "Ganesh Utsav Mahotsav - Pimpri Chowk", "category": "Festival",
     "location": {"latitude": 18.6279, "longitude": 73.8009, "address": "Pimpri Chowk, Pimpri, Pune"},
     "date": "2026-08-15", "time": "18:00 - 23:00", "organizer": "Pimpri Public Cultural Samiti",
     "status": "Active", "permitted_db": 65},
    {"_id": "EVT-2026-102", "name": "Sunburn Arena Pre-Party - Wakad", "category": "DJ",
     "location": {"latitude": 18.5987, "longitude": 73.7645, "address": "Dutta Mandir Road, Wakad, Pune"},
     "date": "2026-08-15", "time": "19:30 - 23:30", "organizer": "Pulse Beats Entertainment",
     "status": "Active", "permitted_db": 70},
    {"_id": "EVT-2026-103", "name": "Grand Wedding Symphony - Chinchwad Club", "category": "Wedding",
     "location": {"latitude": 18.6346, "longitude": 73.7915, "address": "Chinchwad Station Road, Chinchwad, Pune"},
     "date": "2026-08-15", "time": "17:00 - 21:30", "organizer": "Kulkarni Family Trust",
     "status": "Active", "permitted_db": 75},
    {"_id": "EVT-2026-104", "name": "Highway Flyover Construction - Nigdi", "category": "Construction",
     "location": {"latitude": 18.6489, "longitude": 73.7667, "address": "Bhakti Shakti Circle, Nigdi, Pune"},
     "date": "2026-08-15", "time": "22:00 - 05:00", "organizer": "Apex Infrastructure Pvt Ltd",
     "status": "Active", "permitted_db": 65},
]

WELCOME_NOTIFICATION = {
    "recipient": "all",
    "title": "Welcome to Nexus Noise",
    "message": "Nexus Noise is live. Citizens can report noise and apply for event permits; police can review, monitor and enforce.",
    "type": "info",
    "read": False,
}


# ---------------------------------------------------------------------------
# Setup helpers
# ---------------------------------------------------------------------------

async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.approved_officers.create_index("email", unique=True)
    await db.events.create_index([("date", 1), ("status", 1)])
    await db.applications.create_index("user_id")
    await db.applications.create_index("status")
    await db.complaints.create_index("user_id")
    await db.complaints.create_index("created_at")
    await db.complaints.create_index([("complaint_giver_location", "2dsphere")])
    await db.complaints.create_index([("event_location", "2dsphere")])
    await db.notifications.create_index([("recipient", 1), ("created_at", -1)])
    await db.patrol_readings.create_index("created_at")
    await db.patrol_readings.create_index("area_type")
    print("  indexes ensured")


async def seed_rules():
    await db.rules.replace_one({"_id": "global_rules"}, RULES, upsert=True)
    print("  rules -> global_rules")


async def seed_users():
    for email, password, full_name, phone, role, _badge in USERS:
        if await db.users.find_one({"email": email}):
            print(f"  user exists: {email}")
            continue
        await db.users.insert_one({
            "_id": str(uuid.uuid4()),
            "email": email,
            "full_name": full_name,
            "phone": phone,
            "hashed_password": get_password_hash(password),
            "role": role,
        })
    print(f"  + created user: {email} ({role})")


async def seed_approved_officers():
    for email, _pw, full_name, _phone, role, badge in USERS:
        if role not in ("police", "police_admin", "police_patrol"):
            continue
        await db.approved_officers.replace_one(
            {"email": email},
            {"_id": email, "email": email, "name": full_name, "badge_id": badge, "role": role},
            upsert=True,
        )
        print(f"  + approved officer: {email} ({badge})")


async def seed_events():
    for e in EVENTS:
        await db.events.replace_one({"_id": e["_id"]}, e, upsert=True)
        print(f"  + event: {e['_id']} - {e['name']}")


async def seed_notifications():
    if await db.notifications.count_documents({}) == 0:
        doc = dict(WELCOME_NOTIFICATION)
        doc["_id"] = str(uuid.uuid4())
        doc["created_at"] = datetime.utcnow()
        await db.notifications.insert_one(doc)
        print("  + welcome notification")
    else:
        print("  notifications already present")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main():
    try:
        await client.admin.command("ping")
        print("MongoDB connection: OK")
    except Exception as e:
        print("ERROR: cannot reach MongoDB:", e)
        print("Start MongoDB (mongod) and check MONGO_URL, then re-run.")
        sys.exit(1)

    print("Ensuring collections + indexes ...")
    await ensure_indexes()

    print("Seeding rules ...")
    await seed_rules()

    print("Seeding users ...")
    await seed_users()

    print("Seeding approved officers ...")
    await seed_approved_officers()

    print("Seeding events ...")
    await seed_events()

    print("Seeding notifications ...")
    await seed_notifications()

    print("\n=== DATABASE SUMMARY ===")
    for name in ["users", "approved_officers", "events", "applications", "complaints", "notifications", "rules", "patrol_readings"]:
        count = await db[name].count_documents({})
        print(f"  {name:<18} {count}")
    print("\nDatabase ready:", db.name)
    client.close()


if __name__ == "__main__":
    asyncio.run(main())