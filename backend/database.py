import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL resolution: SQLite for local dev; Postgres (Neon, Supabase, etc.) for cloud deployment
DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    # Check if running in a serverless environment like Vercel where only /tmp is writable
    if os.environ.get("VERCEL"):
        db_file = "/tmp/casesync.db"
    else:
        db_file = os.path.abspath(os.path.join(os.path.dirname(__file__), "casesync.db"))
    DATABASE_URL = f"sqlite:///{db_file}"
    connect_args = {"check_same_thread": False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    # Normalize postgres:// to postgresql:// for SQLAlchemy 1.4+ / 2.0+
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Hosted Postgres (Neon, Supabase) connection setup with SSL and pre-ping
    try:
        engine = create_engine(
            DATABASE_URL, 
            pool_pre_ping=True,
            pool_recycle=300
        )
    except Exception:
        # Fallback to pg8000 driver if psycopg2 has binary mismatch on serverless
        if "postgresql://" in DATABASE_URL and "pg8000" not in DATABASE_URL:
            pg8000_url = DATABASE_URL.replace("postgresql://", "postgresql+pg8000://", 1)
            engine = create_engine(
                pg8000_url, 
                pool_pre_ping=True,
                pool_recycle=300
            )
        else:
            raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
