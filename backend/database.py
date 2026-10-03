"""
Database setup.

Using SQLite for now: it's a single file on disk (guna.db), needs no
separate server to install or run, and is good enough for pilot data
collection. If session volume grows later, swap DATABASE_URL for a
Postgres connection string -- nothing else in the app needs to change.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./guna.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # needed for SQLite + FastAPI
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: gives each request its own DB session, closes it after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()