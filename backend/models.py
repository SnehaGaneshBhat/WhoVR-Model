"""
Database tables.

Two tables only:

- GameSession: one row per play session. Holds timing and, once the
  session ends, the final (S, R, T) profile.
- Event: one row per raw event logged during a session (a decision, a
  goal choice, a trash-item disposal, etc). event_type says which of the
  8 taxonomy types it is; payload holds the actual tags as JSON, so we
  don't need a separate table per event type.

Storing raw events (not just the final profile) is what makes pilot-data
calibration possible later: you can go back and re-run the metric
functions with different thresholds without needing to re-play sessions.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base

# NOTE: SQLite does not preserve timezone info on DateTime columns -- a
# value written as timezone-aware comes back out as naive. To avoid
# "can't subtract offset-naive and offset-aware datetimes" errors, every
# timestamp in this app is naive UTC (datetime.utcnow()), consistently,
# rather than mixing in timezone.utc anywhere.


class GameSession(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True)  # UUID string
    scenario = Column(String, nullable=True)  # e.g. 'wallet', 'garbage', 'food' -- optional, informational
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    # Final computed profile, filled in when /complete is called.
    # Null until then. Null for all three = "insufficient data" session.
    profile_s = Column(Float, nullable=True)
    profile_r = Column(Float, nullable=True)
    profile_t = Column(Float, nullable=True)

    # Per-metric breakdown, stored as JSON for inspection/debugging/calibration
    # e.g. {"M1": {"s":.., "r":.., "t":.., "n":..}, "M3": null, ...}
    metric_breakdown = Column(JSON, nullable=True)

    events = relationship("Event", back_populates="session", cascade="all, delete-orphan")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)

    # One of: task_active_window, repeated_attempt, decision,
    # information_exposure, trigger, goal_selection,
    # resource_state_change, duty, action
    # ('action' is a lightweight extra: every discrete player action,
    #  timestamp only -- needed as the base action-rate signal for M6.
    #  It is not one of the 8 named types in the taxonomy PDF, but her
    #  M6 code requires a whole-session action timeline as input.)
    event_type = Column(String, nullable=False)

    payload = Column(JSON, nullable=False)  # the event's tags, matching event_taxonomy.py shapes

    logged_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("GameSession", back_populates="events")