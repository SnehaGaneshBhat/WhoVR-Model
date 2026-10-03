"""
Behavioral Guna Profiling System
=================================

Implements Level 2 (Abstract Behavioral Metrics, M1-M10) and Level 3
(Guna Inference / Session Aggregation) from the Triguna Model draft.

Each metric function takes the relevant slice of the raw event stream
(already pre-filtered to one session) and designer-set parameters, and
returns a tuple:

    (S, R, T, n)

where S, R, T are floats in [0, 1] that sum to 1 (a soft guna membership
for that metric), and n is the qualifying-instance count used for the
validity-gate / confidence-ceiling logic in `aggregate_session_profile`.

If a metric has zero qualifying instances, it returns (None, None, None, 0).
Session-level null-handling (the n_floor cutoff) happens centrally in
`aggregate_session_profile`, NOT inside each metric function -- this keeps
the per-metric code simple and makes the validity-gate table (which lives
in one place) easy to audit and recalibrate after pilot data.


"""

import math
import statistics as stats
from collections import defaultdict

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def sigmoid(x, k=1.0):
    """Standard logistic sigmoid, steepness k."""
    # Guard against overflow on extreme inputs
    z = -k * x
    if z > 700:
        return 0.0
    if z < -700:
        return 1.0
    return 1.0 / (1.0 + math.exp(z))

def rank_average(values):
    """1-based ranks with ties resolved by averaging (needed for Spearman)."""
    order = sorted(range(len(values)), key=lambda i: values[i])
    ranks = [0.0] * len(values)
    i = 0
    while i < len(order):
        j = i
        while j + 1 < len(order) and values[order[j + 1]] == values[order[i]]:
            j += 1
        avg_rank = (i + j) / 2.0 + 1.0
        for k in range(i, j + 1):
            ranks[order[k]] = avg_rank
        i = j + 1
    return ranks


def pearson_corr(x, y):
    n = len(x)
    if n < 2:
        return 0.0
    mx, my = stats.mean(x), stats.mean(y)
    num = sum((xi - mx) * (yi - my) for xi, yi in zip(x, y))
    den_x = math.sqrt(sum((xi - mx) ** 2 for xi in x))
    den_y = math.sqrt(sum((yi - my) ** 2 for yi in y))
    if den_x == 0 or den_y == 0:
        return 0.0
    return num / (den_x * den_y)


def spearman_corr(x, y):
    """Spearman rank correlation = Pearson correlation of the ranks."""
    if len(x) < 2:
        return 0.0
    return pearson_corr(rank_average(x), rank_average(y))


def theil_sen(xs, ys):
    """Theil-Sen slope: median of all pairwise slopes; intercept: median offset."""
    slopes = []
    n = len(xs)
    for i in range(n):
        for j in range(i + 1, n):
            if xs[j] != xs[i]:
                slopes.append((ys[j] - ys[i]) / (xs[j] - xs[i]))
    if not slopes:
        return 0.0, (stats.mean(ys) if ys else 0.0)
    slope = stats.median(slopes)
    intercept = stats.median([y - slope * x for x, y in zip(xs, ys)])
    return slope, intercept


def mad_residuals(xs, ys, slope, intercept):
    """Median absolute deviation of points from the Theil-Sen trend line."""
    if not xs:
        return 0.0
    residuals = [abs(y - (slope * x + intercept)) for x, y in zip(xs, ys)]
    return stats.median(residuals)


def normalize_triplet(s, r, t):
    total = s + r + t
    if total <= 0:
        return (1 / 3, 1 / 3, 1 / 3)
    return (s / total, r / total, t / total)


def average_instance_triplets(triplets):
    """Average a list of per-instance (S,R,T) triplets into one (S,R,T)."""
    n = len(triplets)
    if n == 0:
        return (None, None, None)
    s = sum(t[0] for t in triplets) / n
    r = sum(t[1] for t in triplets) / n
    t_ = sum(t[2] for t in triplets) / n
    return (s, r, t_)


# ---------------------------------------------------------------------------
# M1: Level of Focus
# ---------------------------------------------------------------------------

def m1_level_of_focus(tasks, tau_completion=0.7, tau_disruption=0.5):
    """
    tasks: list of dicts, one per Task-Active Window event:
        {
          'task_id': str,
          'completion_status': 'complete' | 'incomplete',
          'disruption_count': int,
          'time_on_task': float (seconds),
          't_s': float   # designer-set max disruption rate (per minute) for this task
        }
    """
    qualifying = [t for t in tasks if t['time_on_task'] > 5]
    n = len(qualifying)
    if n == 0:
        return (None, None, None, 0)

    started = len(qualifying)
    completed_tasks = [t for t in qualifying if t['completion_status'] == 'complete']
    completed = len(completed_tasks)
    tcr = completed / started if started else 0.0

    if completed_tasks:
        per_task_normalized = []
        for t in completed_tasks:
            minutes = t['time_on_task'] / 60.0
            tdr_i = t['disruption_count'] / minutes if minutes > 0 else 0.0
            t_s_i = t['t_s']
            tdr_norm_i = tdr_i / (tdr_i + t_s_i) if (tdr_i + t_s_i) > 0 else 0.0
            per_task_normalized.append(tdr_norm_i)
        tdr_normalized = stats.mean(per_task_normalized)
    else:
        tdr_normalized = 0.0

    # deterministic fallback
    if tcr < tau_completion:
        triplet = (0, 0, 1)
    elif tdr_normalized <= tau_disruption:
        triplet = (1, 0, 0)
    else:
        triplet = (0, 1, 0)
    return triplet + (n,)


# ---------------------------------------------------------------------------
# M2: Strategy Adaptation
# ---------------------------------------------------------------------------

def m2_strategy_adaptation(challenges, tau_volatility=0.15, tau_mastery=0.8):
    """
    challenges: dict {challenge_id: [(attempt_number, performance_score), ...]}
    Only challenges with >= 3 attempts qualify.
    """
    triplets = []
    for attempts in challenges.values():
        if len(attempts) < 3:
            continue
        attempts_sorted = sorted(attempts, key=lambda a: a[0])
        xs = [a[0] for a in attempts_sorted]
        ys = [a[1] for a in attempts_sorted]

        ir_l, b_l = theil_sen(xs, ys)
        v_l = mad_residuals(xs, ys, ir_l, b_l)
        ps_l = stats.mean(ys)

        if ir_l < -0.2:
            triplet = (0, 0, 1)
        elif ir_l < 0.2:
            triplet = (0, 0, 1) if ps_l < tau_mastery else (1, 0, 0)
        else:  # ir_l >= 0.2
            triplet = (1, 0, 0) if v_l < tau_volatility else (0, 1, 0)

        triplets.append(triplet)

    n = len(triplets)
    if n == 0:
        return (None, None, None, 0)
    s, r, t = average_instance_triplets(triplets)
    return (s, r, t, n)


# ---------------------------------------------------------------------------
# M3: Decision Deliberation
# ---------------------------------------------------------------------------

def m3_decision_deliberation(decisions, tau_switch_ratio=1.0):
    """
    decisions: list of dicts, one per Decision Event:
        {
          'decision_latency': float,
          'latency_threshold': float,   # designer-set, per complexity tier
          'option_switch_count': int,
          'num_options_available': int  # > 1
        }
    """
    triplets = []
    for d in decisions:
        dl = d['decision_latency']
        tau_dl = d['latency_threshold']
        denom = d['num_options_available'] - 1
        sr = d['option_switch_count'] / denom if denom > 0 else 0.0

        if dl <= tau_dl:
            triplet = (0, 1, 0)  # fast decision -> Rajas (low deliberation)
        elif sr > tau_switch_ratio:
            triplet = (0, 0, 1)  # slow AND high switching -> Tamas (indecisive)
        else:
            triplet = (1, 0, 0)  # slow AND low switching -> Sattva (deliberate)

        triplets.append(triplet)

    n = len(triplets)
    if n == 0:
        return (None, None, None, 0)
    s, r, t = average_instance_triplets(triplets)
    return (s, r, t, n)


# ---------------------------------------------------------------------------
# M4: Information Engagement
# ---------------------------------------------------------------------------

def m4_information_engagement(exposures):
    """
    exposures: list of dicts, one per Information-Exposure Event:
        {'engagement_duration': float, 'content_length': float}
    """
    triplets = []
    for e in exposures:
        er = e['engagement_duration'] / e['content_length'] if e['content_length'] > 0 else 0.0
        if er >= 0.5:
            triplet = (1, 0, 0)
        elif er > 0:
            triplet = (0, 1, 0)
        else:
            triplet = (0, 0, 1)
        triplets.append(triplet)

    n = len(triplets)
    if n == 0:
        return (None, None, None, 0)
    s, r, t = average_instance_triplets(triplets)
    return (s, r, t, n)


# ---------------------------------------------------------------------------
# M5: Effort Distribution
# ---------------------------------------------------------------------------

def m5_effort_distribution(tasks, tau_ep=0.6, tau_cov=0.3):
    """
    tasks: list of dicts, one per Task-Active Window event (ALL activated tasks,
    not just qualifying ones -- the correlation needs the full spread of difficulty):
        {'task_id', 'time_on_task', 'task_difficulty' (0.1-1)}

    n (validity count) only counts windows with time_on_task > 5s, per the spec table.
    """
    qualifying = [t for t in tasks if t['time_on_task'] > 5]
    n = len(qualifying)
    if n <3:
        return (None, None, None, 0)

    times = [t['time_on_task'] for t in tasks]
    difficulties = [t['task_difficulty'] for t in tasks]

    ep = spearman_corr(times, difficulties)
    mean_t = stats.mean(times)
    sd_t = stats.stdev(times) if len(times) > 1 else 0.0
    cov = sd_t / mean_t if mean_t > 0 else 0.0

    if ep > tau_ep:
        triplet = (1, 0, 0)
    elif cov < tau_cov:
        triplet = (0, 0, 1)
    else:
        triplet = (0, 1, 0)

    return triplet + (n,)


# ---------------------------------------------------------------------------
# M6: Post-Trigger Behavioral Consistency
# ---------------------------------------------------------------------------

def compute_session_baselines(total_action_count, session_length_minutes,
                               all_decision_latencies):
    """Session-wide baselines, computed once, from data unrelated to any single trigger."""
    baseline_apm = (total_action_count / session_length_minutes
                     if session_length_minutes > 0 else 0.0)
    baseline_latency = stats.mean(all_decision_latencies) if all_decision_latencies else 0.0
    return baseline_apm, baseline_latency
 
 
def derive_trigger_window_features(triggers, all_action_timestamps, decision_events):
    """
    The Level 1 (raw event) -> Level 2 (derived features) transform for M6. Consumes three raw inputs:
 
    triggers: sorted list of trigger time_stamps (seconds)
    all_action_timestamps: sorted list of every discrete action's timestamp for the
        WHOLE session (this is what APM is counted from -- the engine's general
        action telemetry, not anything trigger-specific)
    decision_events: list of raw Decision Events for the whole session, each:
        {'time_stamp': float, 'decision_latency': float}
 
    Applies the exclusion rule (drop a trigger if the next one fires before 3
    actions or 30 seconds have elapsed) and the window boundary (10 min, OR 5
    actions, OR until the next trigger -- whichever comes first).
 
    Returns a list of {'post_trigger_apm': float, 'post_trigger_decision_latency': float | None}
    -- one per trigger instance that survived the exclusion rule.
    """
    decision_events_sorted = sorted(decision_events, key=lambda d: d['time_stamp'])
    trigger_events = []
 
    for idx, t_time in enumerate(triggers):
        next_t = triggers[idx + 1] if idx + 1 < len(triggers) else None
        window_end = t_time + 600  # 10 minutes, in seconds
        post_actions = [ts for ts in all_action_timestamps if ts > t_time]
 
        if next_t is not None:
            elapsed = next_t - t_time
            actions_before_next = [ts for ts in post_actions if ts < next_t]
            if elapsed < 30 or len(actions_before_next) < 3:
                continue  # excluded: next trigger fired too soon
            window_end = min(window_end, next_t)
 
        window_actions = []
        for ts in post_actions:
            if ts > window_end:
                break
            window_actions.append(ts)
            if len(window_actions) >= 5:
                break
        if not window_actions:
            continue
 
        window_minutes = (window_actions[-1] - t_time) / 60.0
        post_apm = len(window_actions) / window_minutes if window_minutes > 0 else 0.0
 
        actual_window_end = window_actions[-1]
        window_decisions = [d['decision_latency'] for d in decision_events_sorted
                             if t_time < d['time_stamp'] <= actual_window_end]
        post_latency = stats.mean(window_decisions) if window_decisions else None
 
        trigger_events.append({
            'post_trigger_apm': post_apm,
            'post_trigger_decision_latency': post_latency,
        })
 
    return trigger_events
 
 
def m6_post_trigger_consistency(trigger_events, baseline_apm, baseline_latency):
    """
    trigger_events: output of derive_trigger_window_features() -- a list of
        {'post_trigger_apm': float, 'post_trigger_decision_latency': float | None}
    baseline_apm, baseline_latency: from compute_session_baselines().
    """
    triplets = []
    for te in trigger_events:
        post_apm = te['post_trigger_apm']
        pd = (post_apm - baseline_apm) / baseline_apm if baseline_apm > 0 else 0.0
 
        post_latency = te.get('post_trigger_decision_latency')
        if post_latency is not None and baseline_latency > 0:
            ld = (post_latency - baseline_latency) / baseline_latency
        else:
            ld = 0.0
 
        if abs(pd) < 0.05 and abs(ld) < 0.05:
            triplet = (1, 0, 0)               # equanimity
        elif pd >= 0.05 and ld <= -0.05:
            triplet = (0, 1, 0)               # escalation / rushing
        elif pd <= -0.5 and ld >= 0.05:
            triplet = (0, 0, 1)               # withdrawal / slowing
        else:
            triplet = (0, 1, 0)               # (+,+) or (-,-) -> defaults to R per spec
 
        triplets.append(triplet)
 
    n = len(triplets)
    if n == 0:
        return (None, None, None, 0)
    s, r, t = average_instance_triplets(triplets)
    return (s, r, t, n)
 

# ---------------------------------------------------------------------------
# M7: Dharmic Orientation
# ---------------------------------------------------------------------------

def m7_dharmic_orientation(goal_events):
    """
    goal_events: list of dicts, one per Goal-Selection Event, describing the
    choice the player actually made:
        {
          'chosen_is_prosocial': bool,
          'has_cost': bool | None,             # None if no self/other cost dimension applies
          'chosen_is_long_term': bool | None    # None if no time-horizon dimension applies
        }
    """
    costly_total = costly_prosocial = 0
    costless_total = costless_prosocial = 0
    horizon_total = long_term_total = 0

    for g in goal_events:
        if g.get('has_cost') is True:
            costly_total += 1
            if g['chosen_is_prosocial']:
                costly_prosocial += 1
        elif g.get('has_cost') is False:
            costless_total += 1
            if g['chosen_is_prosocial']:
                costless_prosocial += 1

        if g.get('chosen_is_long_term') is not None:
            horizon_total += 1
            if g['chosen_is_long_term']:
                long_term_total += 1

    n = len(goal_events)
    if n == 0:
        return (None, None, None, 0)

    # --- Component 1: cost sensitivity (self/other trade-off) ---
    
    # Needs BOTH a costly and a costless choice to measure sensitivity to
    # cost, since sensitivity is a comparison. If only one kind of choice
    # was observed, cost-sensitivity itself can't be measured, but the
    # plain prosocial rate within whichever kind we do have still can be

    if costly_total > 0 and costless_total > 0:
        or_costly = costly_prosocial / costly_total
        or_costless = costless_prosocial / costless_total
        s_1 = or_costly
        r_1 = max(0.0, or_costless - or_costly)
        t_1 = 1 - or_costless
    elif costly_total > 0 or costless_total > 0:
        rate = (costly_prosocial + costless_prosocial) / (costly_total + costless_total)
        # Without the missing side of the comparison we can't tell whether
        # a non-prosocial choice reflects calculated self-interest (Rajas)
        # or plain indifference (Tamas), so split that mass evenly.
        s_1, r_1, t_1 = rate, (1 - rate) / 2, (1 - rate) / 2
    else:
        s_1 = r_1 = t_1 = None

    # --- Component 2: time-horizon sensitivity (short-term vs long-term tradeoff) 

    if horizon_total > 0:
        it = long_term_total / horizon_total
        s_2, r_2, t_2 = it, (1 - it) / 2, (1 - it) / 2
    else:
        s_2 = r_2 = t_2 = None

   #--- Combine the two components into one triplet, weighting by the number of qualifying instances for each component. If one component is missing, the other dominates.

    components = [c for c in [(s_1, r_1, t_1), (s_2, r_2, t_2)] if c[0] is not None]
    if not components:
        return (None, None, None, 0)
 
    s_raw = sum(c[0] for c in components) / len(components)
    r_raw = sum(c[1] for c in components) / len(components)
    t_raw = sum(c[2] for c in components) / len(components)
 
    s, r, t = normalize_triplet(s_raw, r_raw, t_raw)
    return (s, r, t, n)


# ---------------------------------------------------------------------------
# M8: Activity Patterns
# ---------------------------------------------------------------------------

def m8_activity_patterns(tasks, session_length_minutes, tau_completion=0.7,
                          session_cap_minutes=120):
    """
    tasks: list of dicts, one per Task-Active Window: {'completion_status', 'time_on_task'}
    session_length_minutes: total session duration
    """
    qualifying = [t for t in tasks if t['time_on_task'] > 5]
    n = len(qualifying)
    if n == 0:
        return (None, None, None, 0)

    started = len(qualifying)
    completed = len([t for t in qualifying if t['completion_status'] == 'complete'])
    tcr = completed / started if started else 0.0

    if session_length_minutes <= session_cap_minutes:
        triplet = (1, 0, 0)
    elif tcr >= tau_completion:
        triplet = (0, 1, 0)
    else:
        triplet = (0, 0, 1)

    return triplet + (n,)


# ---------------------------------------------------------------------------
# M9: Resource Management
# ---------------------------------------------------------------------------

def preprocess_resource_state_changes(events, session_end_time):
    """
    events: list of dicts, one per raw Resource State-Change Event, e.g.:
        {
          'resource_type': str,
          'current_level': float (0-1),
          'threshold_level': float,           # designer-set per resource type
          'maintenance_action_taken': bool,
          'time_stamp': float (seconds)
        }
    Must include one closing event per resource_type at session end
    (time_stamp = session_end_time), per the spec, to bound the final interval.
 
    Returns: dict {resource_type: {
        'maintenance_levels': [...],
        'below_threshold_duration': float,
        'session_length': float
    }}
    -- the exact shape m9_resource_management's core logic needs.
    """
    
    by_type = defaultdict(list)
    for e in events:
        by_type[e['resource_type']].append(e)
 
    result = {}
    for rtype, evs in by_type.items():
        evs_sorted = sorted(evs, key=lambda e: e['time_stamp'])
        session_start = evs_sorted[0]['time_stamp']
 
        maintenance_levels = [e['current_level'] for e in evs_sorted
                               if e['maintenance_action_taken']]
 
        # On-change logging: the level held between event i and event i+1 is
        # event i's current_level (it doesn't change again until the next log entry).
        below_duration = 0.0
        for i in range(len(evs_sorted) - 1):
            e, next_e = evs_sorted[i], evs_sorted[i + 1]
            interval = next_e['time_stamp'] - e['time_stamp']
            if e['current_level'] < e['threshold_level']:
                below_duration += interval
 
        result[rtype] = {
            'maintenance_levels': maintenance_levels,
            'below_threshold_duration': below_duration,
            'session_length': session_end_time - session_start,
        }
    return result
 
def m9_resource_management(events, session_end_time, tau_rlm=0.5, tau_tbt=0.2):
    """
    events: RAW list of Resource State-Change events (see preprocess_resource_state_changes
    for the expected shape). n (validity count) = number of raw events passed in,
    including the closing events -- NOT the number of resource types.
    """
    n_events = len(events)
    if n_events == 0:
        return (None, None, None, 0)
 
    resource_types_data = preprocess_resource_state_changes(events, session_end_time)

    rlm_values, tbt_values = [], []
    for data in resource_types_data.values():
        maint = data['maintenance_levels']
        rlm_values.append(stats.mean(maint) if maint else 0.0)

        session_len = data['session_length']
        tbt = data['below_threshold_duration'] / session_len if session_len > 0 else 0.0
        tbt_values.append(tbt)

    mu_rlm = stats.mean(rlm_values)
    mu_tbt = stats.mean(tbt_values)

    if mu_rlm >= tau_rlm and mu_tbt < tau_tbt:
        triplet = (1, 0, 0)
    elif mu_rlm < tau_rlm and mu_tbt >= tau_tbt:
        triplet = (0, 0, 1)
    else:
        triplet = (0, 1, 0)

    return triplet + (n_events,)


# ---------------------------------------------------------------------------
# M10: Duty Fulfillment
# ---------------------------------------------------------------------------

def m10_duty_fulfillment(duties):
    """
    duties: list of dicts, one per Duty Event: {'duty_id', 'fulfilled': bool}
    """
    n = len(duties)
    if n == 0:
        return (None, None, None, 0)

    fulfilled = sum(1 for d in duties if d['fulfilled'])
    dtr = fulfilled / n

    if dtr >= 0.8:
        triplet = (1, 0, 0)
    elif dtr >= 0.3:
        triplet = (0, 1, 0)
    else:
        triplet = (0, 0, 1)

    return triplet + (n,)


# ---------------------------------------------------------------------------
# Level 3: Session Aggregation
# ---------------------------------------------------------------------------

# Validity gates (n_floor) and confidence ceilings (N_full), from the spec table.
METRIC_CONFIG = {
    'M1': {'n_floor': 1, 'N_full': 8},
    'M2': {'n_floor': 1, 'N_full': 5},
    'M3': {'n_floor': 1, 'N_full': 10},
    'M4': {'n_floor': 1, 'N_full': 5},
    'M5': {'n_floor': 3, 'N_full': 8},
    'M6': {'n_floor': 1, 'N_full': 6},
    'M7': {'n_floor': 1, 'N_full': 6},
    'M8': {'n_floor': 1, 'N_full': 1},
    'M9': {'n_floor': 1, 'N_full': 4},
    'M10': {'n_floor': 1, 'N_full': 5},
}


def confidence_weight(n, n_floor, n_full):
    if n < n_floor:
        return 0.0
    return min(1.0, n / n_full)


def aggregate_session_profile(metric_results, config=METRIC_CONFIG):
    """
    metric_results: dict {metric_name: (S, R, T, n)} -- typically the direct
                     output of the ten m1_...-m10_... functions above, keyed
                     'M1'..'M10'.
    Returns: (S, R, T) tuple, or None if every metric was null (insufficient data).
    """
    base_weight = 1.0 / len(metric_results)
    weighted = []
    total_weight = 0.0

    for name, (s, r, t, n) in metric_results.items():
        cfg = config[name]
        c_i = confidence_weight(n, cfg['n_floor'], cfg['N_full'])
        if c_i == 0.0 or s is None:   
            continue  # null metric: excluded, not defaulted to zero
        w_i = base_weight * c_i
        weighted.append((w_i, s, r, t))
        total_weight += w_i

    if total_weight == 0.0:
        return None  # flag session as insufficient data

    final_s = sum(w * s for w, s, r, t in weighted) / total_weight
    final_r = sum(w * r for w, s, r, t in weighted) / total_weight
    final_t = sum(w * t for w, s, r, t in weighted) / total_weight
    return (final_s, final_r, final_t)


# ---------------------------------------------------------------------------
# Example / smoke test
# ---------------------------------------------------------------------------
 
if __name__ == '__main__':
    # A small synthetic session, just to prove the pipeline runs end to end.
    tasks = [
        {'task_id': 't1', 'completion_status': 'complete', 'disruption_count': 1,
         'time_on_task': 300, 't_s': 0.2, 'task_difficulty': 0.5},
        {'task_id': 't2', 'completion_status': 'complete', 'disruption_count': 0,
         'time_on_task': 600, 't_s': 0.2, 'task_difficulty': 0.8},
        {'task_id': 't3', 'completion_status': 'incomplete', 'disruption_count': 3,
         'time_on_task': 120, 't_s': 0.1, 'task_difficulty': 0.3},
    ]
 
    challenges = {
        'c1': [(1, 0.3), (2, 0.4), (3, 0.6), (4, 0.7)],
        'c2': [(1, 0.5), (2, 0.2), (3, 0.6), (4, 0.3)],
    }
 
    decisions = [
        {'decision_latency': 1.2, 'latency_threshold': 2.0,
         'option_switch_count': 0, 'num_options_available': 3},
        {'decision_latency': 4.5, 'latency_threshold': 2.0,
         'option_switch_count': 3, 'num_options_available': 3},
    ]
 
    exposures = [
        {'engagement_duration': 20, 'content_length': 30},
        {'engagement_duration': 0, 'content_length': 15},
    ]
 
    goal_events = [
        {'chosen_is_prosocial': True, 'has_cost': True, 'chosen_is_long_term': True},
        {'chosen_is_prosocial': False, 'has_cost': False, 'chosen_is_long_term': False},
    ]
 
    duties = [
        {'duty_id': 'd1', 'fulfilled': True},
        {'duty_id': 'd2', 'fulfilled': True},
        {'duty_id': 'd3', 'fulfilled': False},
    ]
 
    # M9: raw Resource State-Change events, including a closing event at session end
    resource_events = [
        {'resource_type': 'health', 'current_level': 0.9, 'threshold_level': 0.2,
         'maintenance_action_taken': False, 'time_stamp': 0},
        {'resource_type': 'health', 'current_level': 0.6, 'threshold_level': 0.2,
         'maintenance_action_taken': True, 'time_stamp': 600},
        {'resource_type': 'health', 'current_level': 0.15, 'threshold_level': 0.2,
         'maintenance_action_taken': False, 'time_stamp': 1800},
        {'resource_type': 'health', 'current_level': 0.7, 'threshold_level': 0.2,
         'maintenance_action_taken': True, 'time_stamp': 2000},
        {'resource_type': 'health', 'current_level': 0.7, 'threshold_level': 0.2,
         'maintenance_action_taken': False, 'time_stamp': 3600},  # closing event
    ]
 
    # M6: raw action timeline (whole session) + raw Decision Events (whole session) + trigger times
    all_action_timestamps = sorted(i * 6 for i in range(1, 600))  # ~one action every 6s
    decision_events_raw = [{'time_stamp': i * 60, 'decision_latency': 2.0} for i in range(1, 60)]
    trigger_times = [150, 900]
 
    trigger_events = derive_trigger_window_features(
        trigger_times, all_action_timestamps, decision_events_raw)
    baseline_apm, baseline_latency = compute_session_baselines(
        total_action_count=len(all_action_timestamps),
        session_length_minutes=60,
        all_decision_latencies=[d['decision_latency'] for d in decision_events_raw])
 
    results = {
        'M1': m1_level_of_focus(tasks),
        'M2': m2_strategy_adaptation(challenges),
        'M3': m3_decision_deliberation(decisions),
        'M4': m4_information_engagement(exposures),
        'M5': m5_effort_distribution(tasks),
        'M6': m6_post_trigger_consistency(trigger_events, baseline_apm, baseline_latency),
        'M7': m7_dharmic_orientation(goal_events),
        'M8': m8_activity_patterns(tasks, session_length_minutes=15),
        'M9': m9_resource_management(resource_events, session_end_time=3600),
        'M10': m10_duty_fulfillment(duties),
    }
 
    for name, res in results.items():
        print(name, res)
 
    print('Final profile:', aggregate_session_profile(results))