import React from "react";
import { historyBoxStyle } from "./styles";
import "./HistoryBox.css";
import AnimatedNumber from "./AnimatedNumber";

interface HistoryBoxProps {
  rounds: { action: string; score: number }[];
  total: number;
  show: boolean;
  simulations: { id: number; rounds: { action: string; score: number }[]; avg: number }[];
}

export default function HistoryBox({ rounds, total, show, simulations }: HistoryBoxProps) {
  // compute grand average across all simulations + current one
  const allAvgs = [...simulations.map(s => s.avg), total];
  const grandAvg =
    allAvgs.length > 0 ? allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length : 0;

  return (
    <div
      style={historyBoxStyle}
      className={`historyBox ${show ? "visible" : ""}`}
    >
      <h3>Karma History</h3>

      {/* Current simulation rounds */}
      <h4>Current Simulation</h4>
      <ul>
        {rounds.map((r, i) => (
          <li key={i}>
            {r.action}: {r.score}
          </li>
        ))}
      </ul>
      <p>Simulation Avg: <AnimatedNumber value={total} /></p>

      {/* Past simulations */}
      {simulations.length > 0 && (
        <>
          <h4>Past Simulations</h4>
          <ul>
            {simulations.map((s) => (
              <li key={s.id}>
                Simulation {s.id}: Avg {s.avg.toFixed(2)}
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Grand average */}
      <p>Grand Average: <AnimatedNumber value={grandAvg} /></p>
    </div>
  );
}