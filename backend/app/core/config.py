import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AcadMix API"
    DEBUG_MODE: bool = True
    CORS_ORIGINS: str = ""
    CODE_RUNNER_URL: str = "https://acadmix-code-runner.fly.dev"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/acadmix?prepared_statement_cache_size=0"

    # External Services
    REDIS_URL: str = "redis://localhost:6379"
    SENTRY_DSN: str = ""
    
    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    # Admin Defaults
    ADMIN_COLLEGE_ID: str = "A001"
    ADMIN_PASSWORD: str = "admin123"
    COLLEGE_NAME: str = "Guru Nanak Institutions Technical Campus"

    # External Integrations
    LLM_REVIEW_MODEL: str = "gemini/gemini-3.1-flash-lite-preview"
    INTERVIEW_LLM_MODEL: str = "gemini/gemini-2.5-flash"
    GEMINI_API_KEY: str = ""
    MOCK_INTERVIEW_MONTHLY_QUOTA: int = 5
    WHATSAPP_APP_SECRET: str = ""  # Must be set via env var in production
    WHATSAPP_VERIFY_TOKEN: str = ""  # Must be set via env var in production

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

# Instantiate global settings object
settings = Settings()
