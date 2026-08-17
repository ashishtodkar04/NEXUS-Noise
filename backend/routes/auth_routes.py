from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_db
from models import UserCreate, UserInDB, Token
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user,
)
from datetime import timedelta
import uuid

router = APIRouter()

# ---------------------------------------------------------------------------
# Pydantic schemas for police officer approval
# ---------------------------------------------------------------------------

class ApproveOfficerBody(BaseModel):
    email: EmailStr
    name: str
    badge_id: str
    role: str  # e.g. "police", "police_admin", "police_patrol"

# ---------------------------------------------------------------------------
# Allowed police roles
# ---------------------------------------------------------------------------

POLICE_ROLES = {"police", "police_admin", "police_patrol"}
ADMIN_ROLES  = {"police", "police_admin"}   # roles that can manage approved list

# ---------------------------------------------------------------------------
# Helper: ensure default admin account + approved_officers seed exist
# ---------------------------------------------------------------------------

async def _seed_default_admin(db) -> None:
    """
    Auto-provision admin@police.gov as police_admin if not present.
    Also ensure the account appears in the approved_officers collection.
    """
    users_collection     = db["users"]
    approved_collection  = db["approved_officers"]

    admin_email = "admin@police.gov"

    # Seed user account
    existing = await users_collection.find_one({"email": admin_email})
    if not existing:
        hashed_password = get_password_hash("admin123")
        police_user = UserInDB(
            _id=str(uuid.uuid4()),
            email=admin_email,
            full_name="Chief Police Admin",
            phone="911",
            hashed_password=hashed_password,
            role="police_admin",
        )
        await users_collection.insert_one(police_user.dict(by_alias=True))

    # Seed approved_officers entry
    approved = await approved_collection.find_one({"email": admin_email})
    if not approved:
        await approved_collection.insert_one(
            {
                "_id": str(uuid.uuid4()),
                "email": admin_email,
                "name": "Chief Police Admin",
                "badge_id": "ADMIN-001",
                "role": "police_admin",
            }
        )

# ---------------------------------------------------------------------------
# /me  (active user profile)
# ---------------------------------------------------------------------------

@router.get("/me")
async def get_my_profile(
    user_email: str = Depends(get_current_user),
    db=Depends(get_db),
):
    """Return the current database user without exposing credential fields."""
    user = await db["users"].find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    response = {
        "id": user["_id"],
        "email": user["email"],
        "full_name": user.get("full_name", ""),
        "phone": user.get("phone") or "",
        "role": user.get("role", "citizen"),
    }
    if response["role"] in POLICE_ROLES:
        officer = await db["approved_officers"].find_one({"email": user_email})
        response["badge_id"] = officer.get("badge_id", "") if officer else ""
    return response

# ---------------------------------------------------------------------------
# /register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=Token)
async def register(user: UserCreate, db=Depends(get_db)):
    users_collection = db["users"]
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = get_password_hash(user.password)
    new_user = UserInDB(
        _id=str(uuid.uuid4()),
        email=user.email,
        full_name=user.full_name,
        phone=user.phone,
        hashed_password=hashed_password,
        role="citizen",
    )

    await users_collection.insert_one(new_user.dict(by_alias=True))

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# ---------------------------------------------------------------------------
# /login  (citizen portal)
# ---------------------------------------------------------------------------

@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)
):
    users_collection = db["users"]
    user_dict = await users_collection.find_one({"email": form_data.username})

    if not user_dict or not verify_password(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_dict["email"]}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token": access_token,          # convenience alias expected by frontend
        "token_type": "bearer",
        "role": user_dict.get("role", "citizen"),
        "email": user_dict["email"],
        "full_name": user_dict.get("full_name", ""),
    }

# ---------------------------------------------------------------------------
# /police/login  (police portal)
# ---------------------------------------------------------------------------

@router.post("/police/login")
async def police_login(
    form_data: OAuth2PasswordRequestForm = Depends(), db=Depends(get_db)
):
    # Seed default admin if first run
    await _seed_default_admin(db)

    users_collection    = db["users"]
    approved_collection = db["approved_officers"]

    # 1. Fetch user record
    user_dict = await users_collection.find_one({"email": form_data.username})
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 2. Verify password using bcrypt (no plain-text bypass)
    if not verify_password(form_data.password, user_dict["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Role must be one of the accepted police roles
    if user_dict.get("role") not in POLICE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized as police personnel",
        )

    # 4. Officer must be on the approved list
    approved = await approved_collection.find_one({"email": form_data.username})
    if not approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Officer not on approved list. Contact Police Admin.",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_dict["email"]}, expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token": access_token,
        "token_type": "bearer",
        "role": user_dict.get("role"),
        "email": user_dict["email"],
        "full_name": user_dict.get("full_name", ""),
        "badge_id": approved.get("badge_id", ""),
    }

# ---------------------------------------------------------------------------
# /police/approve  (admin only — add officer to approved list)
# ---------------------------------------------------------------------------

@router.post("/police/approve", status_code=status.HTTP_201_CREATED)
async def approve_officer(
    body: ApproveOfficerBody,
    current_user_email: str = Depends(get_current_user),
    db=Depends(get_db),
):
    users_collection    = db["users"]
    approved_collection = db["approved_officers"]

    # Authorise: must be police or police_admin
    requesting_user = await users_collection.find_one({"email": current_user_email})
    if not requesting_user or requesting_user.get("role") not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only police admins can approve officers.",
        )

    # Validate role value
    if body.role not in POLICE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{body.role}'. Must be one of: {sorted(POLICE_ROLES)}",
        )

    # Upsert into approved_officers
    existing = await approved_collection.find_one({"email": body.email})
    if existing:
        await approved_collection.update_one(
            {"email": body.email},
            {"$set": {"name": body.name, "badge_id": body.badge_id, "role": body.role}},
        )
        return {"message": f"Officer {body.email} updated in approved list."}

    await approved_collection.insert_one(
        {
            "_id": str(uuid.uuid4()),
            "email": body.email,
            "name": body.name,
            "badge_id": body.badge_id,
            "role": body.role,
        }
    )
    return {"message": f"Officer {body.email} added to approved list."}

# ---------------------------------------------------------------------------
# /police/approved  (admin only — list all approved officers)
# ---------------------------------------------------------------------------

@router.get("/police/approved")
async def list_approved_officers(
    current_user_email: str = Depends(get_current_user),
    db=Depends(get_db),
):
    users_collection    = db["users"]
    approved_collection = db["approved_officers"]

    requesting_user = await users_collection.find_one({"email": current_user_email})
    if not requesting_user or requesting_user.get("role") not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only police admins can view the approved officers list.",
        )

    officers = await approved_collection.find({}).to_list(length=500)
    return officers

# ---------------------------------------------------------------------------
# /police/approved/{email}  (admin only — remove officer from approved list)
# ---------------------------------------------------------------------------

@router.delete("/police/approved/{email}")
async def remove_approved_officer(
    email: str,
    current_user_email: str = Depends(get_current_user),
    db=Depends(get_db),
):
    users_collection    = db["users"]
    approved_collection = db["approved_officers"]

    requesting_user = await users_collection.find_one({"email": current_user_email})
    if not requesting_user or requesting_user.get("role") not in ADMIN_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only police admins can remove officers from the approved list.",
        )

    result = await approved_collection.delete_one({"email": email})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Officer with email '{email}' not found in approved list.",
        )

    return {"message": f"Officer {email} removed from approved list."}
