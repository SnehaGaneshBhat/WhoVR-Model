"""
FastAPI app: three endpoints, matching the plan.

  POST /sessions/start              -> {session_id}
  POST /sessions/{id}/events        -> log a batch of raw events
  POST /sessions/{id}/complete      -> compute + store + return (S, R, T)

Run locally with:
    uvicorn main:app --reload

The frontend (React, on a different port during development) needs
CORS enabled to call this -- see the CORSMiddleware block below.
"""

import uuid
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session as DBSession

from database import Base, engine, get_db
from models import GameSession, Event
from schemas import (
    StartSessionRequest,
    StartSessionResponse,
    EventsBatchRequest,
    EventsBatchResponse,
    CompleteSessionResponse,
)
from compute import compute_session_profile

Base.metadata.create_all(bind=engine)  # creates guna.db + tables on first run

app = FastAPI(title="Guna Metrics API")

# Dev-friendly CORS: allow the local React dev server. Tighten this to
# your real frontend's domain before deploying anywhere public.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/sessions/start", response_model=StartSessionResponse)
def start_session(req: StartSessionRequest, db: DBSession = Depends(get_db)):
    session_id = str(uuid.uuid4())
    session = GameSession(id=session_id, scenario=req.scenario)
    db.add(session)
    db.commit()
    return StartSessionResponse(session_id=session_id, started_at=session.started_at.isoformat())


@app.post("/sessions/{session_id}/events", response_model=EventsBatchResponse)
def log_events(session_id: str, req: EventsBatchRequest, db: DBSession = Depends(get_db)):
    session = db.get(GameSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.ended_at is not None:
        raise HTTPException(status_code=400, detail="Session already completed")

    for e in req.events:
        db.add(Event(session_id=session_id, event_type=e.event_type, payload=e.payload))
    db.commit()
    return EventsBatchResponse(received=len(req.events))


@app.post("/sessions/{session_id}/complete", response_model=CompleteSessionResponse)
def complete_session(session_id: str, db: DBSession = Depends(get_db)):
    session = db.get(GameSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    session.ended_at = datetime.utcnow()
    session_length_seconds = (session.ended_at - session.started_at).total_seconds()

    events_by_type: dict = {}
    for e in session.events:
        events_by_type.setdefault(e.event_type, []).append(e.payload)

    profile, breakdown = compute_session_profile(events_by_type, session_length_seconds)

    if profile is None:
        session.profile_s = session.profile_r = session.profile_t = None
    else:
        session.profile_s = profile["s"]
        session.profile_r = profile["r"]
        session.profile_t = profile["t"]
    session.metric_breakdown = breakdown
    db.commit()

    return CompleteSessionResponse(
        session_id=session_id,
        profile=profile,
        breakdown=breakdown,
        insufficient_data=profile is None,
    )