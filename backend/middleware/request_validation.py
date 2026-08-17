"""
Request validation middleware for security and performance.
Validates request sizes, content types, and adds rate limiting context.
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

MAX_REQUEST_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_VIDEO_EXTENSIONS = {'.mp4', '.mov', '.avi', '.webm', '.mkv'}
ALLOWED_AUDIO_EXTENSIONS = {'.mp3', '.wav', '.aac', '.ogg', '.flac'}
ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_AUDIO_SIZE = 10 * 1024 * 1024   # 10MB
MAX_IMAGE_SIZE = 5 * 1024 * 1024    # 5MB

async def request_size_middleware(request: Request, call_next):
    """Validate request size before processing"""
    content_length = request.headers.get('content-length')
    
    if content_length:
        try:
            size = int(content_length)
            if size > MAX_REQUEST_SIZE:
                logger.warning(f"Request too large: {size} bytes from {request.client.host}")
                return JSONResponse(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    content={
                        "error": {
                            "message": f"Request too large. Maximum size is {MAX_REQUEST_SIZE / (1024*1024)}MB",
                            "error_code": "REQUEST_TOO_LARGE"
                        }
                    }
                )
        except ValueError:
            pass
    
    return await call_next(request)

def validate_file_upload(filename: str, file_size: int, file_type: str) -> tuple[bool, str]:
    """
    Validate uploaded file based on type and size.
    Returns (is_valid, error_message)
    """
    if not filename:
        return False, "No filename provided"
    
    ext = '.' + filename.split('.')[-1].lower() if '.' in filename else ''
    
    if file_type.startswith('video/'):
        if ext not in ALLOWED_VIDEO_EXTENSIONS:
            return False, f"Invalid video format. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS)}"
        if file_size > MAX_VIDEO_SIZE:
            return False, f"Video too large. Maximum size is {MAX_VIDEO_SIZE / (1024*1024)}MB"
    
    elif file_type.startswith('audio/'):
        if ext not in ALLOWED_AUDIO_EXTENSIONS:
            return False, f"Invalid audio format. Allowed: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}"
        if file_size > MAX_AUDIO_SIZE:
            return False, f"Audio too large. Maximum size is {MAX_AUDIO_SIZE / (1024*1024)}MB"
    
    elif file_type.startswith('image/'):
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            return False, f"Invalid image format. Allowed: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}"
        if file_size > MAX_IMAGE_SIZE:
            return False, f"Image too large. Maximum size is {MAX_IMAGE_SIZE / (1024*1024)}MB"
    
    else:
        return False, f"Unsupported file type: {file_type}"
    
    return True, ""
