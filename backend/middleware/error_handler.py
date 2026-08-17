"""
Global error handling middleware for FastAPI application.
Provides consistent error responses and logging.
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from datetime import datetime
import traceback
import logging

logger = logging.getLogger(__name__)

class ErrorResponse:
    """Standard error response format"""
    def __init__(self, message: str, error_code: str = None, details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details
        self.timestamp = datetime.utcnow().isoformat()

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with consistent format"""
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - Path: {request.url.path}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": ErrorResponse(
                message=exc.detail,
                error_code=f"HTTP_{exc.status_code}"
            ).__dict__
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle request validation errors"""
    logger.warning(f"Validation error: {exc.errors()} - Path: {request.url.path}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": ErrorResponse(
                message="Request validation failed",
                error_code="VALIDATION_ERROR",
                details={"fields": exc.errors()}
            ).__dict__
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected server errors"""
    logger.error(f"Unhandled exception: {str(exc)} - Path: {request.url.path}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": ErrorResponse(
                message="Internal server error",
                error_code="INTERNAL_ERROR"
            ).__dict__
        }
    )

async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle Starlette HTTP exceptions"""
    logger.warning(f"Starlette HTTP {exc.status_code}: {exc.detail} - Path: {request.url.path}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": ErrorResponse(
                message=exc.detail,
                error_code=f"HTTP_{exc.status_code}"
            ).__dict__
        }
    )
