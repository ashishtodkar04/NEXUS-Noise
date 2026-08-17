import os
from motor.motor_asyncio import AsyncIOMotorClient

# Load env vars from a local .env file if present (MONGO_URL, MONGO_DB, SECRET_KEY...)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

# Default to a local MongoDB instance if no env var is provided
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "Nexus-Noise")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

def get_db():
    return db
