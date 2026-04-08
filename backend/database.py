import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Supabase Transaction Pooler (port 6543) — optimized connection settings:
# - pool_size=5: maintain 5 warm connections (avoids cold-start penalty)
# - max_overflow=10: allow burst up to 15 total
# - pool_timeout=30: fail fast instead of waiting minutes
# - pool_pre_ping=True: test connections before use (avoids stale-connection errors)
# - pool_recycle=300: recycle connections every 5 min (Supabase drops idle connections after ~10 min)
# - connect_args statement_cache_size=0: required for pgBouncer transaction mode
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=30,
    pool_timeout=10,
    pool_recycle=600,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,
        "timeout": 10,           # asyncpg connection timeout (seconds)
        "command_timeout": 30,   # per-query timeout
        "server_settings": {"jit": "off"} # disable Postgres JIT to avoid memory spikes and unpredictable latency
    }
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

import contextvars
from sqlalchemy import event
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession

tenant_context = contextvars.ContextVar("tenant_context", default=None)

@event.listens_for(AsyncSession.sync_session_class, "do_orm_execute")
def receive_do_orm_execute(orm_execute_state):
    college_id = tenant_context.get()
    
    if orm_execute_state.is_select and not orm_execute_state.is_relationship_load:
        from sqlalchemy.orm import with_loader_criteria
        
        # Soft delete criteria (applies globally)
        orm_execute_state.statement = orm_execute_state.statement.options(
            with_loader_criteria(
                Base,
                lambda cls: cls.is_deleted == False if hasattr(cls, "is_deleted") else True,
                include_aliases=True
            )
        )
        
        # Tenant isolation criteria
        if college_id and college_id not in ["super_admin", "nodal_officer"]:
            orm_execute_state.statement = orm_execute_state.statement.options(
                with_loader_criteria(
                    Base,
                    lambda cls: cls.college_id == college_id if hasattr(cls, "college_id") and cls.__name__ not in ["User", "College", "CodingChallenge"] else True,
                    include_aliases=True
                )
            )

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
