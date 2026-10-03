/**
 * SessionRecorder
 * ================
 * Collects raw gameplay events during play and sends them to the guna
 * metrics backend (see backend/README.md). This is the "middle layer"
 * between your scenario components and the scoring engine -- it does
 * NOT compute anything itself, it just shapes and ships events.
 *
 * Usage (inside a scenario component):
 *
 *   const recorder = useSessionRecorder();
 *   recorder.logGoalSelection({
 *     goal_id: "give_note_1",
 *     chosen_is_prosocial: true,
 *     has_cost: true,
 *     chosen_is_long_term: null,
 *   });
 *
 * You don't call `fetch` yourself anywhere in scenario code -- only
 * through these methods.
 */

import {
  TaskActiveWindowEvent,
  RepeatedAttemptEvent,
  DecisionEvent,
  InformationExposureEvent,
  TriggerEvent,
  GoalSelectionEvent,
  ResourceStateChangeEvent,
  DutyEvent,
  EventType,
} from "./eventTypes";

// Change this if the backend runs somewhere other than localhost:8000
// (e.g. once it's deployed). Kept as a single constant rather than an
// env variable for now, to avoid extra CRA env-file setup -- revisit
// once there's a real deployed backend URL.
const API_BASE_URL = "http://localhost:8000";

// How often queued events get sent to the backend automatically.
const FLUSH_INTERVAL_MS = 5000;

interface QueuedEvent {
  event_type: EventType;
  payload: object;
}

class SessionRecorder {
  private sessionId: string | null = null;
  private sessionStartMs: number | null = null;
  private queue: QueuedEvent[] = [];
  private flushTimer: number | null = null;

  /** True once startSession() has succeeded and endSession() hasn't been called yet. */
  get isActive(): boolean {
    return this.sessionId !== null;
  }

  /**
   * Starts a new session with the backend. Call this once when a play
   * session begins (e.g. when a scenario component mounts).
   */
  async startSession(scenario?: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/sessions/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario: scenario ?? null }),
    });
    if (!res.ok) {
      throw new Error(`SessionRecorder: failed to start session (${res.status})`);
    }
    const data = await res.json();
    this.sessionId = data.session_id;
    this.sessionStartMs = Date.now();
    this.queue = [];
    this.startAutoFlush();
  }

  /**
   * Checks whether a session is actually ready before logging anything.
   * Returns false (and warns instead of throwing) if called too early --
   * e.g. the player clicks something in the brief window before the
   * initial startSession() network request has resolved. Dropping that
   * one event is harmless; crashing the app over it is not.
   */
  private guardActive(eventType: string): boolean {
    if (this.sessionId === null || this.sessionStartMs === null) {
      console.warn(`SessionRecorder: dropped a "${eventType}" event -- session isn't ready yet`);
      return false;
    }
    return true;
  }

  /**
   * Seconds elapsed since session start. Every event that needs a
   * time_stamp gets it from here automatically -- callers never
   * compute this themselves, which keeps every event on one shared
   * clock (see backend/README.md, assumption #1).
   *
   * Only call this after guardActive() has returned true.
   */
  private elapsedSeconds(): number {
    return (Date.now() - (this.sessionStartMs as number)) / 1000;
  }

  private enqueue(event_type: EventType, payload: object): void {
    this.queue.push({ event_type, payload });
  }

  // --- One logging method per named event type -------------------------
  // Each one also logs a bare 'action' event, since M6 needs a timeline
  // of EVERY discrete action, not just the ones that also happen to be
  // one of these 8 named types.

  logTaskActiveWindow(event: TaskActiveWindowEvent): void {
    if (!this.guardActive("task_active_window")) return;
    this.enqueue("task_active_window", event);
    this.logAction();
  }

  logRepeatedAttempt(event: RepeatedAttemptEvent): void {
    if (!this.guardActive("repeated_attempt")) return;
    this.enqueue("repeated_attempt", event);
    this.logAction();
  }

  logDecision(event: Omit<DecisionEvent, "time_stamp">): void {
    if (!this.guardActive("decision")) return;
    this.enqueue("decision", { ...event, time_stamp: this.elapsedSeconds() });
    this.logAction();
  }

  logInformationExposure(event: InformationExposureEvent): void {
    if (!this.guardActive("information_exposure")) return;
    this.enqueue("information_exposure", event);
    this.logAction();
  }

  logTrigger(event: Omit<TriggerEvent, "time_stamp">): void {
    if (!this.guardActive("trigger")) return;
    this.enqueue("trigger", { ...event, time_stamp: this.elapsedSeconds() });
    this.logAction();
  }

  logGoalSelection(event: GoalSelectionEvent): void {
    if (!this.guardActive("goal_selection")) return;
    this.enqueue("goal_selection", event);
    this.logAction();
  }

  logResourceStateChange(event: Omit<ResourceStateChangeEvent, "time_stamp">): void {
    if (!this.guardActive("resource_state_change")) return;
    this.enqueue("resource_state_change", { ...event, time_stamp: this.elapsedSeconds() });
    this.logAction();
  }

  logDuty(event: DutyEvent): void {
    if (!this.guardActive("duty")) return;
    this.enqueue("duty", event);
    this.logAction();
  }

  /**
   * Logs a bare action timestamp. The 8 methods above already call this
   * internally -- only call it directly for interactions that AREN'T
   * one of the named types above (e.g. a menu click, a camera drag).
   */
  logAction(): void {
    if (!this.guardActive("action")) return;
    this.enqueue("action", { time_stamp: this.elapsedSeconds() });
  }

  // --- Sending events to the backend ------------------------------------

  private startAutoFlush(): void {
    if (this.flushTimer !== null) return;
    this.flushTimer = window.setInterval(() => {
      void this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  private stopAutoFlush(): void {
    if (this.flushTimer !== null) {
      window.clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /** Sends everything queued so far. Safe to call manually at any time. */
  async flush(): Promise<void> {
    if (this.sessionId === null || this.queue.length === 0) return;

    const batch = this.queue;
    this.queue = [];

    try {
      const res = await fetch(`${API_BASE_URL}/sessions/${this.sessionId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events: batch }),
      });
      if (!res.ok) {
        throw new Error(`status ${res.status}`);
      }
    } catch (err) {
      // Put the batch back so nothing is silently lost -- it'll retry on the next flush.
      this.queue = [...batch, ...this.queue];
      console.error("SessionRecorder: flush failed, will retry on next interval", err);
    }
  }

  /**
   * Ends the session: flushes anything still queued, tells the backend
   * to compute the final profile, and returns it. Call this when a
   * scenario is finished (e.g. "New Simulation" button, or unmount).
   */
  async endSession(): Promise<{ s: number; r: number; t: number } | null> {
    if (this.sessionId === null) return null;

    await this.flush();
    this.stopAutoFlush();

    const res = await fetch(`${API_BASE_URL}/sessions/${this.sessionId}/complete`, {
      method: "POST",
    });
    if (!res.ok) {
      throw new Error(`SessionRecorder: failed to complete session (${res.status})`);
    }
    const data = await res.json();

    this.sessionId = null;
    this.sessionStartMs = null;

    return data.profile; // null if insufficient_data was true
  }

  /**
   * Debug helper only -- not used anywhere in normal operation.
   * Lets you check the recorder's actual internal state directly from
   * the browser console instead of guessing from Network/Console logs.
   */
  getDebugState() {
    return {
      sessionId: this.sessionId,
      sessionStartMs: this.sessionStartMs,
      hasActiveSession: this.sessionId !== null && this.sessionStartMs !== null,
      queueLength: this.queue.length,
      queuedEventTypes: this.queue.map((e) => e.event_type),
    };
  }
}

// Single shared instance for the whole app -- every component that logs
// events uses this same recorder, so events from any scenario land in
// the same session.
export const sessionRecorder = new SessionRecorder();

// Debug-only: exposes the recorder on window so its live state can be
// checked directly from the browser console, e.g.:
//   __sessionRecorder.getDebugState()
// Safe to leave in -- has no effect on normal app behavior.
(window as unknown as { __sessionRecorder: SessionRecorder }).__sessionRecorder = sessionRecorder;