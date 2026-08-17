"""
Temporary cache service for pending complaints before agent approval.
Complaints are stored here initially and only moved to database after approval.
"""
from datetime import datetime, timedelta
from typing import Dict, Optional
import uuid

class ComplaintCache:
    def __init__(self):
        self.cache: Dict[str, dict] = {}
        self.expiry_hours = 24  # Cache expires after 24 hours
    
    def add_complaint(self, complaint_data: dict) -> str:
        """Add a complaint to temp cache and return cache ID"""
        cache_id = str(uuid.uuid4())
        complaint_data["_cache_id"] = cache_id
        complaint_data["_cached_at"] = datetime.utcnow()
        complaint_data["_status"] = "pending_approval"
        self.cache[cache_id] = complaint_data
        return cache_id
    
    def get_complaint(self, cache_id: str) -> Optional[dict]:
        """Get a complaint from cache by ID"""
        complaint = self.cache.get(cache_id)
        if complaint:
            # Check if expired
            cached_at = complaint.get("_cached_at")
            if cached_at and datetime.utcnow() - cached_at > timedelta(hours=self.expiry_hours):
                del self.cache[cache_id]
                return None
        return complaint
    
    def get_all_pending(self) -> list:
        """Get all pending complaints in cache"""
        now = datetime.utcnow()
        # Remove expired complaints
        expired_ids = [
            cid for cid, comp in self.cache.items()
            if comp.get("_cached_at") and now - comp["_cached_at"] > timedelta(hours=self.expiry_hours)
        ]
        for cid in expired_ids:
            del self.cache[cid]
        
        return list(self.cache.values())
    
    def approve_complaint(self, cache_id: str) -> Optional[dict]:
        """Remove from cache and return the complaint data for database insertion"""
        complaint = self.cache.get(cache_id)
        if complaint:
            del self.cache[cache_id]
            # Remove cache-specific fields
            complaint.pop("_cache_id", None)
            complaint.pop("_cached_at", None)
            complaint.pop("_status", None)
            return complaint
        return None
    
    def reject_complaint(self, cache_id: str) -> bool:
        """Remove complaint from cache (rejected)"""
        if cache_id in self.cache:
            del self.cache[cache_id]
            return True
        return False
    
    def update_complaint(self, cache_id: str, updates: dict) -> bool:
        """Update complaint data in cache"""
        if cache_id in self.cache:
            self.cache[cache_id].update(updates)
            return True
        return False

# Global cache instance
complaint_cache = ComplaintCache()
