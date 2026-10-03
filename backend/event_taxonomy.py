"""
Event Taxonomy — typed schemas
================================

One TypedDict per raw event type in the Triguna Model draft. 

Each TypedDict in the event taxonomy represents a single raw telemetry event instance. 
In practice, each event may be recorded as one dictionary within a session's flat event log. 
The connection between these raw events and the inputs consumed by the metric functions follows one of three patterns.
1. Direct Pass-Through
For the metrics M1, M3, M4, M5, M7, M8, M10, the raw event list is already in the exact structure expected by the metric. The only preprocessing required is filtering the session event log by event_type and passing the resulting list directly to the metric function.
2. Trivial Regrouping
For metric M2, RepeatedAttemptEvent instances are logged as a flat sequence, with one event per challenge attempt. However, m2_strategy_adaptation() expects attempts to be grouped by challenge_id.
This regrouping is a simple data-shaping operation rather than part of the metric computation itself. As such, it belongs in a lightweight session-loading layer rather than inside the metric implementation.
3. Derived Feature Transformation
For the metrics M6 and M9, these metrics require additional preprocessing to derive higher-level features from the raw event stream before metric computation can occur. This preprocessing is performed by the derive_trigger_window_features() function in guna_metrics.py, which takes the raw event list and produces a new list of derived features that can be passed to the metric functions.
"""

from typing import TypedDict, Optional


class TaskActiveWindowEvent(TypedDict):
    task_id: str
    completion_status: str          # 'complete' | 'incomplete'
    disruption_count: int
    time_on_task: float             # seconds
    t_s: float                      # designer-set max disruption rate (per minute)
    task_difficulty: float          # 0.1 - 1.0, designer-set


class RepeatedAttemptEvent(TypedDict):
    challenge_id: str
    attempt_number: int
    performance_score: float        # normalized 0-1


class DecisionEvent(TypedDict):
    decision_id: str
    decision_latency: float
    latency_threshold: float        # designer-set, per complexity tier
    option_switch_count: int
    num_options_available: int      # > 1
    time_stamp: float               # NOT listed in the draft's M3 tag list, but M6
                                     # needs it to know which decisions fall inside a
                                     # post-trigger window -- flagged gap, added here


class InformationExposureEvent(TypedDict):
    engagement_duration: float
    content_length: float           # avg. reading/listening time for the content


class TriggerEvent(TypedDict):
    """
    Corrected from the draft's literal tag list. A trigger fires at the moment of
    the loss/gain/failure/windfall -- the engine cannot know the post-trigger
    window's APM/latency at that instant, so those can't be tags on this event.
    This is the minimal raw record; everything else is derived downstream by
    derive_trigger_window_features() in guna_metrics.py from the raw action
    timeline and the raw DecisionEvent stream.
    """
    trigger_id: str
    trigger_type: str                # 'loss' | 'failure' | 'windfall' | 'gain'
    time_stamp: float


class GoalSelectionEvent(TypedDict):
    goal_id: str
    chosen_is_prosocial: bool
    has_cost: Optional[bool]            # None if no self/other cost dimension applies
    chosen_is_long_term: Optional[bool]  # None if no time-horizon dimension applies


class ResourceStateChangeEvent(TypedDict):
    resource_type: str
    current_level: float            # 0-1 normalized
    threshold_level: float          # designer-set per resource type
    maintenance_action_taken: bool
    time_stamp: float               # seconds; include one closing event per
                                     # resource_type at session end


class DutyEvent(TypedDict):
    duty_id: str
    fulfilled: bool
