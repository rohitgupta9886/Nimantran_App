from enum import Enum
from typing import Optional, Dict, Any
from fastapi import HTTPException, status


class ErrorCategory(str, Enum):
    AI_ERROR = "AI_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    PROVIDER_ERROR = "PROVIDER_ERROR"
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTH_ERROR = "AUTH_ERROR"
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR"
    NOT_FOUND_ERROR = "NOT_FOUND_ERROR"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"


class NimantranException(HTTPException):
    """
    Standard domain exception for Nimantran AI.
    Separates internal developer diagnostics from sanitized user-facing messages.
    """

    def __init__(
        self,
        category: ErrorCategory,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        message: str = "An error occurred.",
        user_message: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.category = category
        self.internal_message = message
        self.user_message = user_message or message
        self.details = details or {}
        super().__init__(status_code=status_code, detail=self.user_message)

    def to_dict(self, request_id: Optional[str] = None) -> Dict[str, Any]:
        return {
            "error": True,
            "error_code": self.category.value,
            "message": self.user_message,
            "request_id": request_id or "req_system",
            "details": self.details if self.details else None,
        }


class AIServiceException(NimantranException):
    def __init__(self, message: str, user_message: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            category=ErrorCategory.AI_ERROR,
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=message,
            user_message=user_message or "AI generation service is temporarily unavailable. Please retry.",
            details=details,
        )


class ProviderException(NimantranException):
    def __init__(self, provider_name: str, message: str, user_message: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            category=ErrorCategory.PROVIDER_ERROR,
            status_code=status.HTTP_502_BAD_GATEWAY,
            message=f"Provider '{provider_name}' error: {message}",
            user_message=user_message or f"Dispatch via {provider_name} temporarily failed.",
            details=details,
        )


class DatabaseException(NimantranException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            category=ErrorCategory.DATABASE_ERROR,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=message,
            user_message="A database error occurred. Your data is safe; please retry.",
            details=details,
        )


class RateLimitException(NimantranException):
    def __init__(self, message: str = "Rate limit exceeded. Please try again shortly."):
        super().__init__(
            category=ErrorCategory.RATE_LIMIT_ERROR,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            message=message,
            user_message=message,
        )
