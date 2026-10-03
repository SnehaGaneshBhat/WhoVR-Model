import { BaseScenario, ActionId, TraitId } from './BaseScenario';

export interface ScoreBreakdown {
  actionId: string;
  traitScore: number;
  dominantTrait?: { id: TraitId; prayojana: number };
  actionWeight: number;
  stateDesirability: number;
  beneficiaryScore: number;
  total: number;
}

export class WalletScenario extends BaseScenario {
  name = "Wallet";

  private generosityBonus(actionIds: ActionId[]): number {
    const has500 = actionIds.includes('GIVE_NOTE');
    const pocketCount = actionIds.filter(a => a === 'PAY_FROM_POCKET').length;
    let bonus = 0;
    if (has500) bonus += 0.3;
    bonus += pocketCount * 0.1;
    return bonus;
  }

  private normalize(raw: number, min: number = -10, max: number = 10): number {
    const clamped = Math.max(min, Math.min(max, raw));
    return ((clamped - min) / (max - min)) * 10;
  }

  score(actionIds: ActionId[]): ScoreBreakdown {
    const trait = this.computeTraitContribution(actionIds);
    const outcomeScore = this.computeOutcomeContribution(actionIds, 'WALLET');
    const actionWeight = this.computeActionWeight(actionIds);
    const stateDesirability = Math.max(...this.computeStateContribution(actionIds));

    const rawTotal =
      0.4 * trait.total +
      0.3 * actionWeight +
      0.2 * stateDesirability +
      0.1 * outcomeScore;

    const bonus = this.generosityBonus(actionIds);
    const rawWithBonus = rawTotal + bonus;
    const clamped = Math.max(-10, Math.min(10, rawWithBonus));
    let normalized = this.normalize(clamped);

    const allSixGivenToBeggar =
      actionIds.length === 6 &&
      actionIds.every(a => a === 'GIVE_NOTE' || a === 'PAY_FROM_POCKET') &&
      actionIds.includes('GIVE_NOTE');

    if (allSixGivenToBeggar) {
      normalized = 10;
    }

    return {
      actionId: actionIds.join('+'),
      traitScore: Number(trait.total.toFixed(2)),
      dominantTrait: trait.dominant
        ? { id: trait.dominant.id, prayojana: trait.dominant.prayojana }
        : undefined,
      actionWeight,
      stateDesirability,
      beneficiaryScore: Number(outcomeScore.toFixed(2)),
      total: Number(normalized.toFixed(2)),
    };
  }
}