/**
 * Event type definitions -- the TypeScript mirror of the backend's
 * event_taxonomy.py. Field names must match exactly: each payload gets
 * sent to the backend as JSON and read there as a Python dict with
 * these same keys.
 *
 * Do not edit these shapes without also updating event_taxonomy.py --
 * the two must always agree.
 */

export interface TaskActiveWindowEvent {
  task_id: string;
  completion_status: "complete" | "incomplete";
  disruption_count: number;
  time_on_task: number; // seconds
  t_s: number; // designer-set max disruption rate (per minute), see M1 in the spec
  task_difficulty: number; // 0.1 - 1.0, designer-set
}

export interface RepeatedAttemptEvent {
  challenge_id: string;
  attempt_number: number;
  performance_score: number; // normalized 0-1
}

export interface DecisionEvent {
  decision_id: string;
  decision_latency: number; // seconds
  latency_threshold: number; // designer-set, per complexity tier
  option_switch_count: number;
  num_options_available: number; // > 1
  time_stamp: number; // seconds since session start -- set automatically by the recorder
}

export interface InformationExposureEvent {
  engagement_duration: number;
  content_length: number; // avg. reading/listening time for the content
}

export interface TriggerEvent {
  trigger_id: string;
  trigger_type: "loss" | "failure" | "windfall" | "gain";
  time_stamp: number; // seconds since session start -- set automatically by the recorder
}

export interface GoalSelectionEvent {
  goal_id: string;
  chosen_is_prosocial: boolean;
  has_cost: boolean | null; // null if no self/other cost dimension applies to this choice
  chosen_is_long_term: boolean | null; // null if no time-horizon dimension applies to this choice
}

export interface ResourceStateChangeEvent {
  resource_type: string;
  current_level: number; // 0-1 normalized
  threshold_level: number; // designer-set per resource type
  maintenance_action_taken: boolean;
  time_stamp: number; // seconds since session start -- set automatically by the recorder
}

export interface DutyEvent {
  duty_id: string;
  fulfilled: boolean;
}

/**
 * Not one of the 8 named types in the Triguna spec. M6 needs a
 * whole-session timeline of EVERY discrete player action to compute a
 * baseline actions-per-minute rate. See backend/README.md for the full
 * explanation.
 */
export interface ActionEvent {
  time_stamp: number;
}

export type EventType =
  | "task_active_window"
  | "repeated_attempt"
  | "decision"
  | "information_exposure"
  | "trigger"
  | "goal_selection"
  | "resource_state_change"
  | "duty"
  | "action";
