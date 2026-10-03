import React from "react";
import DoneButton from "./DoneButton";
import NewSimulation from "./NewSimulation";

interface ScoreboardProps {
  done: boolean;
  sandwichItems: { id: string; img: string; label: string }[];
  unhealthyItems: { id: string; img: string; label: string; multiplier: number }[];
  result: {
    itemScores: { id: string; score: number }[];
    penalty: number;
    rawScore: number;
    finalScore: number;
    excessHealthy: number;
    excessUnhealthy: number;
  };
  simulationResults: number[];
  onDone: () => void;
  onNewSimulation: () => void;
}

export default function Scoreboard({
  done,
  sandwichItems,
  unhealthyItems,
  result,
  simulationResults,
  onDone,
  onNewSimulation
}: ScoreboardProps) {
  const { itemScores, penalty, rawScore, finalScore, excessHealthy, excessUnhealthy } = result;

  const overallAverage =
    simulationResults.length > 0
      ? simulationResults.reduce((a, b) => a + b, 0) / simulationResults.length
      : null;

  return (
    <div className="score-panel">
      {done ? (
        <>
          <h3>Selected Items & Scores:</h3>
          <ul>
            {sandwichItems.map((i, idx) => (
              <li key={idx}>
                {i.label} → {itemScores.find(s => s.id === i.id)?.score.toFixed(2)}
              </li>
            ))}
            {unhealthyItems.map((i, idx) => (
              <li key={idx}>
                {i.label}{i.multiplier > 1 ? ` x${i.multiplier}` : ""} →
                {itemScores.find(s => s.id === i.id)?.score.toFixed(2)}
              </li>
            ))}
          </ul>

          <h3>Raw Score (before penalties): {rawScore.toFixed(2)}</h3>
          <h3>Penalty Breakdown:</h3>
          <p>Excess Healthy: {excessHealthy} × -1 = -{excessHealthy}</p>
          <p>Excess Unhealthy: {excessUnhealthy} × -2 = -{excessUnhealthy * 2}</p>
          <h3>Total Penalty: {penalty}</h3>
          <h3>Final Score (0–10): {finalScore.toFixed(2)}</h3>

          {overallAverage !== null && (
            <h3>
              Overall Score (average of {simulationResults.length} runs):{" "}
              {overallAverage.toFixed(2)}
            </h3>
          )}

          <NewSimulation onNewSimulation={onNewSimulation} />
        </>
      ) : (
        <DoneButton onDone={onDone} />
      )}
    </div>
  );
}
