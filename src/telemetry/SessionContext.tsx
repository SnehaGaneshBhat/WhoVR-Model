/**
 * React wiring for SessionRecorder.
 *
 * Wrap the app (or a scenario) in <SessionProvider scenario="..."> and
 * any component underneath can call useSessionRecorder() to get the
 * shared recorder and log events.
 *
 * Sessions are scoped to a single scenario: switching the `scenario`
 * prop (e.g. the player clicks a different scenario's button) ends the
 * current session and starts a brand new one for the new scenario.
 * Sessions never span multiple scenarios and are never cumulative --
 * each one only ever contains events from the scenario it was started
 * for.
 */

import React, { createContext, useContext, useEffect, useRef } from "react";
import { sessionRecorder } from "./sessionRecorder";

const SessionRecorderContext = createContext(sessionRecorder);

interface SessionProviderProps {
  children: React.ReactNode;
  /** Which scenario is currently active. Changing this ends the old session and starts a new one. */
  scenario?: string;
}

export function SessionProvider({ children, scenario }: SessionProviderProps) {
  // undefined until the first session has been started -- lets us tell
  // "app just loaded" apart from "the player switched scenarios".
  const currentScenarioRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function switchSession() {
      const isFirstRun = currentScenarioRef.current === undefined;
      const previousScenario = currentScenarioRef.current;

      if (!isFirstRun && previousScenario === scenario) {
        return; // scenario prop changed for some other reason, not an actual switch
      }

      currentScenarioRef.current = scenario;

      if (!isFirstRun) {
        // Leaving the previous scenario -- end its session so it never
        // bleeds into the next one.
        try {
          await sessionRecorder.endSession();
        } catch (err) {
          console.error("SessionProvider: failed to end previous session on scenario switch", err);
        }
      }

      if (cancelled) return;

      try {
        await sessionRecorder.startSession(scenario);
      } catch (err) {
        console.error("SessionProvider: failed to start telemetry session", err);
      }
    }

    switchSession();

    return () => {
      cancelled = true;
    };
  }, [scenario]);

  // Separate effect, runs once: best-effort flush if the tab/window
  // closes. Not guaranteed to complete (browsers can cut this off),
  // but better than losing everything silently.
  useEffect(() => {
    const handleUnload = () => {
      void sessionRecorder.flush();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return (
    <SessionRecorderContext.Provider value={sessionRecorder}>
      {children}
    </SessionRecorderContext.Provider>
  );
}

/** Call inside any scenario component to get the shared recorder. */
export function useSessionRecorder() {
  return useContext(SessionRecorderContext);
}
