/**
 * TrigunaProfileBox
 * ==================
 * Small, reusable display for a computed (S, R, T) profile. Meant to be
 * rendered alongside a scenario's own karma score display (HistoryBox,
 * Scoreboard, etc), driven by that scenario's own "Done" handler --
 * there is no separate button here, it's purely presentational.
 */

import React from "react";

export type Profile = { s: number; r: number; t: number };
export type TrigunaStatus = "idle" | "loading" | "done" | "error";

interface TrigunaProfileBoxProps {
  status: TrigunaStatus;
  profile: Profile | null;
  errorMessage?: string;
}

export function TrigunaProfileBox({ status, profile, errorMessage }: TrigunaProfileBoxProps) {
  if (status === "idle") return null;

  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: "0.75rem 1rem",
        margin: "0.5rem 0",
        maxWidth: 420,
      }}
    >
      <strong>Triguna Profile</strong>

      {status === "loading" && <div>Computing...</div>}

      {status === "done" && profile && (
        <div>
          <div>Sattva (S): {(profile.s * 100).toFixed(1)}%</div>
          <div>Rajas (R): {(profile.r * 100).toFixed(1)}%</div>
          <div>Tamas (T): {(profile.t * 100).toFixed(1)}%</div>
        </div>
      )}

      {status === "done" && !profile && (
        <div style={{ color: "#a33" }}>
          Not enough data was collected this round to compute a profile.
        </div>
      )}

      {status === "error" && (
        <div style={{ color: "#a33" }}>
          Failed to compute profile{errorMessage ? `: ${errorMessage}` : "."}
        </div>
      )}
    </div>
  );
}
