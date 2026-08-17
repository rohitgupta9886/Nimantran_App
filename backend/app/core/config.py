import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Nimantran AI"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"
    SECRET_KEY: str = "dev_secret_key_change_in_production_min_32_chars!"

    DATABASE_URL: str = "sqlite+aiosqlite:///./nimantran.db"

    @property
    def async_database_url(self) -> str:
        """
        Normalizes standard PostgreSQL / SQLite URLs to their respective async drivers (asyncpg / aiosqlite).
        Handles Render / Cloud database URLs (postgres:// or postgresql://) automatically.
        """
        url = self.DATABASE_URL.strip()
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql+psycopg2://"):
            return url.replace("postgresql+psycopg2://", "postgresql+asyncpg://", 1)
        elif url.startswith("sqlite://") and not url.startswith("sqlite+aiosqlite://"):
            return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return url

    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "dev_jwt_secret_key_change_in_production_9999"
    JWT_SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 43200  # 30 Days Token Lifetime
    JWT_REFRESH_EXPIRE_DAYS: int = 30

    @property
    def effective_jwt_secret(self) -> str:
        """Returns JWT secret from either JWT_SECRET_KEY or JWT_SECRET."""
        return self.JWT_SECRET_KEY or self.JWT_SECRET

    # CORS Configuration
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parses comma-separated CORS_ORIGINS into a clean sanitized list of allowed origin URLs."""
        if not self.CORS_ORIGINS or self.CORS_ORIGINS.strip() == "*":
            return ["*"] if self.APP_ENV == "development" else ["http://localhost:5173"]
        origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return origins if origins else ["http://localhost:5173"]

    # Background Workers Switch (True in standalone/dev, False in API-only containers)
    ENABLE_BACKGROUND_WORKERS: bool = True

    # External Provider Defaults / Mode
    AI_PROVIDER: str = "MOCK"
    AI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None

    @property
    def effective_gemini_key(self) -> Optional[str]:
        """Returns API key from GEMINI_API_KEY, GOOGLE_API_KEY, or AI_API_KEY."""
        return self.GEMINI_API_KEY or self.GOOGLE_API_KEY or self.AI_API_KEY

    WHATSAPP_PROVIDER: str = "MOCK"
    WHATSAPP_ACCESS_TOKEN: Optional[str] = None
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = None
    WHATSAPP_BUSINESS_ACCOUNT_ID: Optional[str] = None
    WHATSAPP_VERIFY_TOKEN: Optional[str] = None

    SMS_PROVIDER: str = "MOCK"
    EMAIL_PROVIDER: str = "MOCK"
    PAYMENT_PROVIDER: str = "MOCK"
    STORAGE_PROVIDER: str = "LOCAL"
    LOCAL_STORAGE_DIR: str = "./uploads"

    FRONTEND_URL: str = "http://localhost:5173"
    PUBLIC_BASE_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
