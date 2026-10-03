"""
Orchestration layer: turns a session's stored raw events into the final
(S, R, T) profile, by calling guna_metrics.py exactly as it's written.

This file does ONLY the plumbing event_taxonomy.py describes:
  1. Direct pass-through (M1, M3, M4, M5, M7, M8, M10): just grab the
     right list and hand it to the matching function.
  2. Trivial regrouping (M2): group flat attempt events by challenge_id.
  3. Derived feature transformation (M6, M9): call the helper functions
     her guna_metrics.py already provides for this.

None of the metric math lives here -- it all stays in guna_metrics.py,
untouched.

Note on the "action" event type: the M1-M10 taxonomy defines 8 named
event types, but M6 (Post-Trigger Behavioral Consistency) needs a
whole-session stream of every discrete player action to compute a
baseline actions-per-minute rate -- this isn't one of the 8 named types,
it's lower-level engine telemetry. We log it as a 9th, minimal event
type: 'action', payload = {'time_stamp': float}. The frontend should log
one of these on every discrete player interaction, not just the ones
that also happen to be one of the 8 named events.

All event time_stamp fields are assumed to be *seconds elapsed since
session start* (not wall-clock time). This keeps every metric's math on
one shared clock without needing timezone handling anywhere.
"""

from collections import defaultdict

import guna_metrics as gm


def compute_session_profile(events_by_type: dict, session_length_seconds: float):
    """
    events_by_type: {event_type: [payload dict, ...]}
    session_length_seconds: elapsed session duration (for M8, M9).

    Returns (profile, breakdown):
      profile: {"s":..., "r":..., "t":...} or None if every metric was null
      breakdown: {"M1": {"s","r","t","n"} | None, ..., "M10": ...}
    """
    tasks = events_by_type.get("task_active_window", [])
    challenges_raw = events_by_type.get("repeated_attempt", [])
    decisions = events_by_type.get("decision", [])
    exposures = events_by_type.get("information_exposure", [])
    triggers_raw = events_by_type.get("trigger", [])
    goal_events = events_by_type.get("goal_selection", [])
    resource_events = events_by_type.get("resource_state_change", [])
    duties = events_by_type.get("duty", [])
    actions = events_by_type.get("action", [])

    session_length_minutes = session_length_seconds / 60.0

    results = {}

    # --- Direct pass-through metrics ---
    results["M1"] = gm.m1_level_of_focus(tasks)
    results["M3"] = gm.m3_decision_deliberation(decisions)
    results["M4"] = gm.m4_information_engagement(exposures)
    results["M5"] = gm.m5_effort_distribution(tasks)
    results["M7"] = gm.m7_dharmic_orientation(goal_events)
    results["M8"] = gm.m8_activity_patterns(tasks, session_length_minutes=session_length_minutes)
    results["M10"] = gm.m10_duty_fulfillment(duties)

    # --- M2: trivial regrouping (flat attempts -> grouped by challenge_id) ---
    challenges = defaultdict(list)
    for r in challenges_raw:
        challenges[r["challenge_id"]].append((r["attempt_number"], r["performance_score"]))
    results["M2"] = gm.m2_strategy_adaptation(challenges)

    # --- M6: derived feature transformation ---
    trigger_times = sorted(t["time_stamp"] for t in triggers_raw)
    all_action_timestamps = sorted(a["time_stamp"] for a in actions)
    decision_events_raw = [
        {"time_stamp": d["time_stamp"], "decision_latency": d["decision_latency"]}
        for d in decisions
    ]
    trigger_events = gm.derive_trigger_window_features(
        trigger_times, all_action_timestamps, decision_events_raw
    )
    baseline_apm, baseline_latency = gm.compute_session_baselines(
        total_action_count=len(all_action_timestamps),
        session_length_minutes=session_length_minutes,
        all_decision_latencies=[d["decision_latency"] for d in decision_events_raw],
    )
    results["M6"] = gm.m6_post_trigger_consistency(trigger_events, baseline_apm, baseline_latency)

    # --- M9: derived feature transformation (handled inside her function) ---
    results["M9"] = gm.m9_resource_management(resource_events, session_end_time=session_length_seconds)

    # --- Session aggregation ---
    # aggregate_session_profile returns a plain (s, r, t) tuple, or None
    # if every metric was null -- convert to a dict here so the rest of
    # the app (API responses, DB storage) can use named fields.
    profile_tuple = gm.aggregate_session_profile(results)
    profile = None if profile_tuple is None else {
        "s": profile_tuple[0], "r": profile_tuple[1], "t": profile_tuple[2]
    }

    breakdown = {
        name: (None if res[0] is None else {"s": res[0], "r": res[1], "t": res[2], "n": res[3]})
        for name, res in results.items()
    }

    return profile, breakdown