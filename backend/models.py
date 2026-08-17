from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict
from datetime import datetime
import uuid

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    hashed_password: str
    role: str = "citizen" # "citizen", "police_admin", or "police_patrol"

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class Location(BaseModel):
    latitude: float
    longitude: float
    address: Optional[str] = None

class AIAnalysis(BaseModel):
    extracted_db: float
    event_detected: bool
    event_type: str
    detected_shop_name: Optional[str]
    distance_meters: float
    predicted_source_db: float
    is_valid: bool

class Complaint(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    description: str
    complaint_giver_location: Location
    event_location: Optional[Location] = None
    video_url: Optional[str] = None
    status: str = "pending" # pending, processing, completed, under_investigation, resolved, rejected
    created_at: datetime
    analysis: Optional[AIAnalysis] = None
    officer_notes: Optional[str] = None

class Event(BaseModel):
    id: str = Field(alias="_id")
    name: str
    category: str
    location: Location
    date: str
    time: str
    organizer: str
    status: str = "Active" # Active, Upcoming, Completed
    permitted_db: int

class ApplicationCreate(BaseModel):
    event_name: str
    category: str
    location_name: str
    date: str
    start_time: str
    end_time: str
    expected_attendees: int
    sound_equipment: str
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    applicant_lat: Optional[float] = None
    applicant_lng: Optional[float] = None
    applicant_name: Optional[str] = None
    applicant_phone: Optional[str] = None
    applicant_email: Optional[EmailStr] = None
    organizer_address: Optional[str] = None
    description: Optional[str] = None
    expected_noise: Optional[float] = None
    speaker_count: Optional[int] = None
    has_sound_system: bool = False
    has_dj: bool = False
    documents: List[Dict] = Field(default_factory=list)

class Application(ApplicationCreate):
    id: str = Field(alias="_id")
    user_id: str
    status: str = "Pending" # Pending, Approved, Rejected
    approved_limit_db: Optional[int] = None
    approval_ref_no: Optional[str] = None
    created_at: datetime

class Notification(BaseModel):
    id: str = Field(alias="_id")
    recipient: str # "all_citizens", "all_police", or specific user_id
    title: str
    message: str
    type: str = "info" # info, alert, success
    read: bool = False
    created_at: datetime

class RuleUpdate(BaseModel):
    daytime_limit: int
    nighttime_limit: int
    industrial_limit: int
    commercial_limit: int
    residential_limit: int
    silence_zone_limit: int
    # Automated enforcement algorithm settings (edited from the Rules page)
    warning_threshold: int = 3            # +dB above permitted triggers "Warning"
    violation_threshold: int = 5          # +dB above permitted triggers "Violation"
    cutoff_time: str = "22:00"            # nighttime loudspeaker cutoff schedule
    min_monitoring_duration_sec: int = 300 # minimum continuous monitoring window
