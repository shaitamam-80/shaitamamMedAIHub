"""
MedAI Hub - Custom Exception Classes
Defines custom exceptions for better error handling and debugging
"""

from fastapi import HTTPException, status


class MedAIHubException(Exception):
    """Base exception for MedAI Hub application"""

    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class TranslationError(MedAIHubException):
    """Raised when Hebrew-to-English translation fails"""

    def __init__(self, message: str = "Failed to translate text to English"):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ValidationError(MedAIHubException):
    """Raised when data validation fails"""

    def __init__(self, message: str = "Data validation failed"):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)


class DatabaseError(MedAIHubException):
    """Raised when database operations fail"""

    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HebrewTranslationError(MedAIHubException):
    """Raised when Hebrew text is detected in query"""

    def __init__(self, message: str = "Hebrew text detected in query"):
        super().__init__(message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY)


class PaginationError(MedAIHubException):
    """Raised when pagination parameters are invalid"""

    def __init__(self, message: str = "Invalid pagination parameters"):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST)


class AIServiceError(MedAIHubException):
    """Raised when AI service encounters an error"""

    def __init__(self, message: str = "AI service error"):
        super().__init__(message, status_code=status.HTTP_503_SERVICE_UNAVAILABLE)


def convert_to_http_exception(exc: MedAIHubException) -> HTTPException:
    """Convert custom exception to FastAPI HTTPException"""
    return HTTPException(status_code=exc.status_code, detail=exc.message)
