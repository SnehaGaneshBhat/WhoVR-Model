// src/engine/utils/ScoreLogger.ts

export type ContributionData = {
  id: string;
  adhikaari: number;      // authority/agent value
  dasha: number;          // state/phase value
  karma: number;          // karma contribution
  lakshanas: number;      // trait/lakṣaṇas numeric value
  sambandhanas: number;   // relationships/weights numeric value
  itemScore: number;
};

export function logItemContribution(data: ContributionData) {
  console.group(`Item: ${data.id}`);
  console.log("Adhikāri value:", data.adhikaari);
  console.log("Daśā value:", data.dasha);
  console.log("Karma value:", data.karma);
  console.log("Lakṣaṇas value:", data.lakshanas);
  console.log("Sambandhanas value:", data.sambandhanas);
  console.log("Final item score:", data.itemScore);
  console.groupEnd();
}

export function logScenarioSummary(
  rawScore: number,
  penalty: number,
  unclampedFinal: number,
  maxPossibleRaw: number,
  normalizedFinal: number,
  finalScore: number,
  excessHealthy: number,
  excessUnhealthy: number
) {
  console.group("=== Scenario Summary ===");
  console.log("Raw score (Σ item scores):", rawScore);
  console.log("Penalty formula: (excessHealthy × 1) + (excessUnhealthy × 2)");
  console.log("Excess Healthy:", excessHealthy, "→ penalty part:", excessHealthy * 1);
  console.log("Excess Unhealthy:", excessUnhealthy, "→ penalty part:", excessUnhealthy * 2);
  console.log("Total Penalty:", penalty);

  console.log("Unclamped final = Raw − Penalty:", unclampedFinal);
  console.log("Max possible raw (healthy baseline):", maxPossibleRaw);
  console.log("Normalization formula: (UnclampedFinal / MaxPossibleRaw) × 10");
  console.log("Normalized final score:", normalizedFinal);
  console.log("Clamped final score (0–10):", finalScore);
  console.groupEnd();
}
