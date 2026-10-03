// Types
import type { ActionId } from '../data/karma_actions';
import type { TraitId } from '../data/lakshanas_traits';
import type { OutcomeBenefit } from '../data/adhikaari_beneficiaries';

// Values
import { ACTIONS } from '../data/karma_actions';
import { STATES } from '../data/dasha_states';
import { TRAITS } from '../data/lakshanas_traits';
import {
  ACTION_TRAIT_INTENSITIES,
  ACTION_RESULTING_STATE,
  ACTION_OUTCOME_BENEFIT,
} from '../data/sambandhas_mapping';
import { DEFAULT_BENEFICIARY_WEIGHTS } from '../data/adhikaari_beneficiaries';

// ---------------- COMMON HELPERS ----------------

interface DominantTrait {
  id: TraitId;
  value: number;
  prayojana: number;
}

function computeTraitContribution(actionIds: ActionId[]): { total: number; dominant?: DominantTrait } {
  let total = 0;
  let dominant: DominantTrait | undefined;

  actionIds.forEach(id => {
    const intensities = ACTION_TRAIT_INTENSITIES[id];
    if (!intensities) return;
    Object.entries(intensities).forEach(([tid, intensity]) => {
      const trait = TRAITS[tid as TraitId];
      if (!trait) return;
      const value = trait.prayojana * (Number(intensity) / 20);
      total += value;
      if (!dominant || value > dominant.value) {
        dominant = { id: tid as TraitId, value, prayojana: trait.prayojana };
      }
    });
  });

  return { total, dominant };
}


function computeOutcomeContribution(actionIds: ActionId[], scenario: 'GARBAGE' | 'WALLET') {
  const w = DEFAULT_BENEFICIARY_WEIGHTS[scenario];
  let score = 0;
  actionIds.forEach(id => {
    const outcome = ACTION_OUTCOME_BENEFIT[id];
    if (!outcome) return;
    score +=
      (w.SELF ?? 0) * (outcome.SELF ?? 0) +
      (w.SOCIETY ?? 0) * (outcome.SOCIETY ?? 0) +
      (w.ENVIRONMENT ?? 0) * (outcome.ENVIRONMENT ?? 0) +
      (w.BEGGAR ?? 0) * (outcome.BEGGAR ?? 0);
  });
  return score;
}

function computeStateContribution(actionIds: ActionId[]) {
  return actionIds.map(id => STATES[ACTION_RESULTING_STATE[id]].desirability);
}

function computeActionWeight(actionIds: ActionId[]) {
  return actionIds.reduce((sum, id) => sum + ACTIONS[id].weight, 0);
}

// ---------------- WALLET / TEMPLE SCENARIO ----------------

export interface Weights {
  wT: number;
  wA: number;
  wD: number;
  wB: number;
}
export const DEFAULT_WEIGHTS: Weights = { wT: 0.4, wA: 0.3, wD: 0.2, wB: 0.1 };

export interface ScoreBreakdown {
  actionId: string;
  traitScore: number;
  dominantTrait?: { id: TraitId; prayojana: number };
  actionWeight: number;
  stateDesirability: number;
  beneficiaryScore: number;
  total: number;
}

function generosityBonus(actionIds: ActionId[]): number {
  const has500 = actionIds.includes('GIVE_NOTE');
  const pocketCount = actionIds.filter(a => a === 'PAY_FROM_POCKET').length;
  let bonus = 0;
  if (has500) bonus += 0.3;
  bonus += pocketCount * 0.1;
  return bonus;
}

export function scoreActions(actionIds: ActionId[], weights: Weights = DEFAULT_WEIGHTS): ScoreBreakdown {
  const trait = computeTraitContribution(actionIds);
  const outcomeScore = computeOutcomeContribution(actionIds, 'WALLET');
  const actionWeight = computeActionWeight(actionIds);
  const stateDesirability = Math.max(...computeStateContribution(actionIds));

  // Raw weighted sum
  const rawTotal =
    weights.wT * trait.total +
    weights.wA * actionWeight +
    weights.wD * stateDesirability +
    weights.wB * outcomeScore;

  const bonus = generosityBonus(actionIds);
  const rawWithBonus = rawTotal + bonus;

  // Clamp to [-10, 10]
  const clamped = Math.max(-10, Math.min(10, rawWithBonus));

  // Normalize to [0, 10]
  let normalized = ((clamped - (-10)) / (20)) * 10;

  // ✅ Special condition: only if all 6 notes are given directly to beggar
  const allSixGivenToBeggar =
    actionIds.length === 6 &&
    actionIds.every(a => a === 'GIVE_NOTE' || a === 'PAY_FROM_POCKET') &&
    actionIds.includes('GIVE_NOTE');

  if (allSixGivenToBeggar) {
    normalized = 10;
    console.log("Special Condition Triggered: All six notes given to beggar → Final = 10");
  }

  // Debug logs
  console.log("=== Temple Scenario Scoring Debug ===");
  console.log("Actions:", actionIds.join(", "));
  console.log("Lakshanas Contribution:", trait.total.toFixed(2));
  if (trait.dominant) {
    console.log("Dominant Trait:", trait.dominant.id, "Prayojana:", trait.dominant.prayojana);
  }
  console.log("Karma Contribution:", actionWeight.toFixed(2));
  console.log("Dasha Contribution:", stateDesirability.toFixed(2));
  console.log("Adhikaari Contribution:", outcomeScore.toFixed(2));
  console.log("Generosity Bonus:", bonus.toFixed(2));
  console.log("Raw Weighted Sum:", rawTotal.toFixed(2));
  console.log("Raw + Bonus:", rawWithBonus.toFixed(2));
  console.log("Clamped (-10..10):", clamped.toFixed(2));
  console.log("Normalized (0..10):", normalized.toFixed(2));
  console.log("Final Total:", normalized.toFixed(2));
  console.log("=====================================");

  return {
    actionId: actionIds.join('+'),
    traitScore: Number(trait.total.toFixed(2)),
    dominantTrait: trait.dominant ? { id: trait.dominant.id, prayojana: trait.dominant.prayojana } : undefined,
    actionWeight,
    stateDesirability,
    beneficiaryScore: Number(outcomeScore.toFixed(2)),
    total: Number(normalized.toFixed(2)),
  };
}

// Alias for backward compatibility
export const scoreWalletActions = scoreActions;

// Normalization helper
export function normalizeScore(raw: number, min: number = -10, max: number = 10): number {
  const clamped = Math.max(min, Math.min(max, raw));
  return ((clamped - min) / (max - min)) * 10;
}

// ---------------- TRASH / GARBAGE SCENARIO ----------------

function computeMaxRawScore(): number {
  let maxScore = 0;
  (Object.keys(ACTIONS) as ActionId[]).forEach((actionId) => {
    let score = 3; // assume wet bin base
    score += 10 * 0.4; // max disgustingness
    score += ACTIONS[actionId].weight;
    score += computeTraitContribution([actionId]).total;
    score += computeOutcomeContribution([actionId], 'GARBAGE');
    score += STATES[ACTION_RESULTING_STATE[actionId]].desirability / 2;
    if (score > maxScore) maxScore = score;
  });
  return maxScore;
}

export function scoreTrashAction(
  actionId: ActionId,
  disgustingness: number,
  type: 'wet' | 'dry',
  correct: boolean
): number {
  const base = type === 'wet' ? 3 : 2;
  const disgustingnessContribution = disgustingness * 0.4;
  const actionWeight = ACTIONS[actionId].weight;
  const traitContribution = computeTraitContribution([actionId]).total;
  const outcomeContribution = computeOutcomeContribution([actionId], 'GARBAGE');
  const stateContribution = STATES[ACTION_RESULTING_STATE[actionId]].desirability / 2;

  const rawCorrectScore =
    base +
    disgustingnessContribution +
    actionWeight +
    traitContribution +
    outcomeContribution +
    stateContribution;

  const MAX_RAW_SCORE = computeMaxRawScore();
  const normalizedCorrect = (rawCorrectScore / MAX_RAW_SCORE) * 10;

  const finalScore = correct ? normalizedCorrect : Math.abs(normalizedCorrect);

  // Ordered debug output
  console.log("=== Trash Action Scoring Debug ===");
  console.log("Karma ID:", actionId);
  console.log("Type:", type);
  console.log("Correct Bin:", correct);
  console.log("Disgustingness:", disgustingness);
  console.log("Base:", base);
  console.log("Disgustingness Contribution:", disgustingnessContribution);
  console.log("Karma Weight:", actionWeight);
  console.log("Lakshanas Contribution:", traitContribution);
  console.log("Adhikaari Contribution:", outcomeContribution);
  console.log("Dasha Contribution:", stateContribution);
  console.log("Raw Correct Score:", rawCorrectScore);
  console.log("MAX_RAW_SCORE:", MAX_RAW_SCORE);
  console.log("Normalized Correct:", normalizedCorrect.toFixed(2));
    if (correct) {
    console.log("Final Formula: Correct → Final =", normalizedCorrect.toFixed(2));
  } else {
    console.log(
      "Final Formula: Wrong → Final = |" +
        normalizedCorrect.toFixed(2) +
        " | = " +
        Math.abs(normalizedCorrect).toFixed(2)
    );
  }
  console.log("===================================");

  return Number(Math.max(0, Math.min(10, finalScore)).toFixed(2));
}