import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "AcadMix API"
    DEBUG_MODE: bool = False  # Must be explicitly enabled via env var in dev
    CORS_ORIGINS: str = ""
    CODE_RUNNER_URL: str = "https://acadmix-code-runner.fly.dev"

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/acadmix?prepared_statement_cache_size=0"
    ADMIN_DATABASE_URL: str = "" # Set in prod for direct PgBouncer bypass migrations

    # External Services
    REDIS_URL: str = "redis://localhost:6379"
    SENTRY_DSN: str = ""
    
    # Security
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    # Admin Defaults
    ADMIN_COLLEGE_ID: str = "A001"
    ADMIN_PASSWORD: str # MUST be set via env var. Pydantic raises if missing.
    COLLEGE_NAME: str = "Guru Nanak Institutions Technical Campus"
    SEED_ON_STARTUP: bool = False # Set True ONLY in dev/staging to seed database on startup
    SEED_DEMO_USERS: bool = False  # Set True ONLY in dev/staging to seed quick-login test accounts

    # External Integrations
    LLM_REVIEW_MODEL: str = "gemini/gemini-3.1-flash-lite-preview"
    INTERVIEW_LLM_MODEL: str = "gemini/gemini-2.5-flash"
    RESUME_LLM_MODEL: str = "gemini/gemini-2.0-flash-lite"   # Cheaper model for ATS scoring & career tools
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    
    # Self-Hosted vLLM (Phase 2 — activate at 10K+ students)
    # Set VLLM_BASE_URL to enable self-hosted inference (e.g. "https://gpu.acadmix.internal/v1")
    # When empty, all routing stays on Groq API (Phase 1 behavior)
    VLLM_BASE_URL: str = ""              # vLLM OpenAI-compatible endpoint
    VLLM_API_KEY: str = "dummy"          # vLLM doesn't require auth, but LiteLLM needs a value
    VLLM_MODEL_SMALL: str = "meta-llama/Llama-3.2-3B-Instruct"    # Tier 1 — concepts
    VLLM_MODEL_LARGE: str = "meta-llama/Llama-3.3-70B-Instruct-AWQ"  # Tier 2 — debugging/code
    VLLM_HEALTH_CHECK_INTERVAL: int = 30  # Seconds between GPU health pings
    
    MOCK_INTERVIEW_MONTHLY_QUOTA: int = 5
    WHATSAPP_APP_SECRET: str = ""  # Must be set via env var in production
    WHATSAPP_VERIFY_TOKEN: str = ""  # Must be set via env var in production
    WHATSAPP_PHONE_NUMBER_ID: str = ""  # Meta Cloud API phone number ID
    WHATSAPP_ACCESS_TOKEN: str = ""  # Meta Cloud API bearer token
    WHATSAPP_MOCK_MODE: bool = True  # True = log to console instead of sending

    # IoT & Transactional Bot
    IOT_WEBHOOK_SECRET: str = ""            # Shared secret for IoT device auth headers
    WALLET_LOW_BALANCE_THRESHOLD: float = 50.0  # ₹ threshold for low-balance alerts
    ATTENDANCE_DIGEST_HOUR: int = 18        # 6 PM — daily attendance digest cron
    FEE_PORTAL_BASE_URL: str = "https://acadmix.org/fees"  # Deep-link base for payment CTAs

    # Transport Management
    TRANSPORT_SPEED_LIMIT_KMH: int = 80     # Speed violation threshold
    TRANSPORT_GEOFENCE_RADIUS_M: int = 100  # Default geofence radius (meters)
    TRANSPORT_DELAY_THRESHOLD_MIN: int = 5  # Delay alert threshold (minutes)
    FIREBASE_CREDENTIALS_PATH: str = ""     # Path to firebase-credentials.json (empty = mock mode)

    # Payments (Razorpay)
    RAZORPAY_KEY_ID: str = ""               # Razorpay key ID (empty = payments disabled)
    RAZORPAY_KEY_SECRET: str = ""           # Razorpay key secret

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "ignore"

# Instantiate global settings object
settings = Settings()
