import { BaseScenario, ActionId } from './BaseScenario';
import { logItemContribution, logScenarioSummary } from '../utils/ScoreLogger';

export class GarbageScenario extends BaseScenario {
  name = "Garbage";

  private computeMaxRawScore(): number {
    let maxScore = 0;
    this.getAllActionIds().forEach((actionId) => {
      let score = 3; // assume wet bin base
      score += 10 * 0.4; // max disgustingness
      score += this.getActionWeight(actionId);
      score += this.computeTraitContribution([actionId]).total;
      score += this.computeOutcomeContribution([actionId], 'GARBAGE');
      score += this.getStateDesirability(actionId) / 2;
      if (score > maxScore) maxScore = score;
    });
    return maxScore;
  }

  score(actionId: ActionId, disgustingness: number, type: 'wet' | 'dry', correct: boolean): number {
    const base = type === 'wet' ? 3 : 2;
    const disgustingnessContribution = disgustingness * 0.4;
    const actionWeight = this.getActionWeight(actionId);
    const traitContribution = this.computeTraitContribution([actionId]).total;
    const outcomeContribution = this.computeOutcomeContribution([actionId], 'GARBAGE');
    const stateContribution = this.getStateDesirability(actionId) / 2;

    const rawCorrectScore =
      base +
      disgustingnessContribution +
      actionWeight +
      traitContribution +
      outcomeContribution +
      stateContribution;

    const MAX_RAW_SCORE = this.computeMaxRawScore();
    const normalizedCorrect = (rawCorrectScore / MAX_RAW_SCORE) * 10;

    const finalScore = correct ? normalizedCorrect : Math.abs(normalizedCorrect);
    const clampedFinal = Number(Math.max(0, Math.min(10, finalScore)).toFixed(2));

    // 🔎 Log item-level contributions
    logItemContribution({
      id: actionId,
      adhikaari: actionWeight,
      dasha: outcomeContribution,
      karma: traitContribution,
      lakshanas: traitContribution,      // or trait.lakshanas if available separately
      sambandhanas: actionWeight,        // or a separate sambandhanas value if available
      itemScore: rawCorrectScore
    });

    // 🔎 Log scenario summary
    logScenarioSummary(
      rawCorrectScore,                // rawScore
      0,                              // penalty (not used in GarbageScenario)
      rawCorrectScore,                // unclampedFinal
      MAX_RAW_SCORE,                  // maxPossibleRaw
      normalizedCorrect,              // normalizedFinal
      clampedFinal,                   // finalScore
      0,                              // excessHealthy
      0                               // excessUnhealthy
    );

    return clampedFinal;
  }
}
