import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Nimantran AI"
    API_V1_STR: str = "/api/v1"
    APP_ENV: str = "development"
    SECRET_KEY: str = "nimantran_super_secret_key_production_grade_32_chars_min!"

    DATABASE_URL: str = "sqlite+aiosqlite:///./nimantran.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET: str = "nimantran_jwt_secret_key_change_in_production_9999"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_EXPIRE_MINUTES: int = 43200  # 30 Days Token Lifetime
    JWT_REFRESH_EXPIRE_DAYS: int = 30

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]

    # External Provider Defaults / Mode
    AI_PROVIDER: str = "MOCK"
    AI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None

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
