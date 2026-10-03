"""
Request/response shapes for the API. These are deliberately loose
(payload: dict) rather than one strict Pydantic model per event type --
the 8 taxonomy shapes already live in event_taxonomy.py as the source of
truth, and duplicating them here as strict schemas would just be a
second copy to keep in sync. The frontend is responsible for sending
payloads shaped correctly; compute.py hands them straight to
guna_metrics.py, which will raise a clear KeyError if a required tag is
missing.
"""

from pydantic import BaseModel
from typing import Optional


class StartSessionRequest(BaseModel):
    scenario: Optional[str] = None  # e.g. 'wallet', 'garbage', 'food' -- informational only


class StartSessionResponse(BaseModel):
    session_id: str
    started_at: str


class EventIn(BaseModel):
    event_type: str  # one of: task_active_window, repeated_attempt, decision,
                      # information_exposure, trigger, goal_selection,
                      # resource_state_change, duty, action
    payload: dict


class EventsBatchRequest(BaseModel):
    events: list[EventIn]


class EventsBatchResponse(BaseModel):
    received: int


class MetricResult(BaseModel):
    s: float
    r: float
    t: float
    n: int


class Profile(BaseModel):
    s: float
    r: float
    t: float


class CompleteSessionResponse(BaseModel):
    session_id: str
    profile: Optional[Profile]
    breakdown: dict  # {"M1": MetricResult-shaped dict | None, ...}
    insufficient_data: bool