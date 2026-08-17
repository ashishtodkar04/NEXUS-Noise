"""
Pydantic schemas for request validation and response serialization.
Provides type safety and validation for all API endpoints.
"""
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    CITIZEN = "citizen"
    POLICE = "police"
    POLICE_ADMIN = "police_admin"
    POLICE_PATROL = "police_patrol"

class ComplaintStatus(str, Enum):
    PENDING_APPROVAL = "pending_approval"
    PROCESSING = "processing"
    UNDER_REVIEW = "under_review"
    EVIDENCE_VERIFIED = "evidence_verified"
    INVESTIGATION = "investigation"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    FAILED_PROCESSING = "failed_processing"

class ApplicationStatus(str, Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    DOCUMENT_VERIFICATION = "document_verification"
    APPROVED = "approved"
    REJECTED = "rejected"

class AreaType(str, Enum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    SILENCE_ZONE = "silence_zone"

# User Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    
    @validator('password')
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    created_at: datetime

# Complaint Schemas
class Location(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None

class ComplaintSubmit(BaseModel):
    description: str = Field(..., min_length=10, max_length=1000)
    location: Location
    area_type: AreaType = AreaType.RESIDENTIAL
    event_name: Optional[str] = Field(None, max_length=200)
    event_location: Optional[Location] = None

class ComplaintUpdate(BaseModel):
    status: ComplaintStatus
    officer_notes: Optional[str] = Field(None, max_length=500)

class ComplaintResponse(BaseModel):
    id: str
    user_id: str
    description: str
    location: Location
    status: ComplaintStatus
    area_type: AreaType
    video_url: Optional[str]
    analysis: Optional[dict]
    created_at: datetime
    updated_at: Optional[datetime]

# Application Schemas
class ApplicationSubmit(BaseModel):
    event_name: str = Field(..., min_length=3, max_length=200)
    venue: str = Field(..., min_length=5, max_length=300)
    event_date: str  # ISO date string
    start_time: str  # ISO time string
    end_time: str    # ISO time string
    expected_attendees: int = Field(..., ge=1, le=100000)
    sound_equipment: str = Field(..., max_length=500)
    applicant_name: str = Field(..., min_length=2, max_length=100)
    applicant_phone: Optional[str] = Field(None, pattern=r'^\+?[1-9]\d{1,14}$')
    
    @validator('end_time')
    def end_time_after_start_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('End time must be after start time')
        return v

class ApplicationUpdate(BaseModel):
    status: ApplicationStatus
    approved_limit_db: Optional[float] = Field(None, ge=30, le=120)
    special_conditions: Optional[str] = Field(None, max_length=1000)

class ApplicationResponse(BaseModel):
    id: str
    event_name: str
    venue: str
    event_date: str
    start_time: str
    end_time: str
    status: ApplicationStatus
    approved_limit_db: Optional[float]
    created_at: datetime

# Event Schemas
class EventCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    location: Location
    start_time: str
    end_time: str
    permitted_db: float = Field(..., ge=30, le=120)
    category: str = Field(..., max_length=50)

class EventResponse(BaseModel):
    id: str
    name: str
    location: Location
    start_time: str
    end_time: str
    permitted_db: float
    category: str
    created_at: datetime

# Rules Schemas
class RulesUpdate(BaseModel):
    daytime_limit: float = Field(None, ge=30, le=120)
    nighttime_limit: float = Field(None, ge=20, le=100)
    industrial_limit: float = Field(None, ge=40, le=130)
    commercial_limit: float = Field(None, ge=35, le=125)
    residential_limit: float = Field(None, ge=30, le=100)
    silence_zone_limit: float = Field(None, ge=20, le=80)
    warning_threshold: int = Field(None, ge=1, le=10)
    violation_threshold: int = Field(None, ge=1, le=20)
    cutoff_time: str = Field(None, pattern=r'^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
    min_monitoring_duration_sec: int = Field(None, ge=60, le=3600)

# Patrol Reading Schemas
class PatrolReadingCreate(BaseModel):
    decibels: float = Field(..., ge=0, le=150)
    area_limit: Optional[float] = Field(None, ge=0, le=150)
    area_type: Optional[AreaType] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    note: Optional[str] = Field(None, max_length=200)

class PatrolReadingResponse(BaseModel):
    id: str
    officer_email: str
    officer_name: str
    decibels: float
    area_limit: Optional[float]
    area_type: Optional[AreaType]
    latitude: Optional[float]
    longitude: Optional[float]
    note: Optional[str]
    violation: bool
    created_at: datetime

# Notification Schemas
class NotificationCreate(BaseModel):
    recipient: str
    title: str = Field(..., min_length=3, max_length=200)
    message: str = Field(..., min_length=5, max_length=1000)
    type: str = Field(..., max_length=50)

class NotificationResponse(BaseModel):
    id: str
    recipient: str
    title: str
    message: str
    type: str
    read: bool
    created_at: datetime
