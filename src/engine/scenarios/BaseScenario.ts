import type { ActionId } from '../../data/karma_actions';
import type { TraitId } from '../../data/lakshanas_traits';
import { ACTIONS } from '../../data/karma_actions';
import { TRAITS } from '../../data/lakshanas_traits';
import { STATES } from '../../data/dasha_states';
import {
  ACTION_TRAIT_INTENSITIES,
  ACTION_RESULTING_STATE,
  ACTION_OUTCOME_BENEFIT,
} from '../../data/sambandhas_mapping';
import { DEFAULT_BENEFICIARY_WEIGHTS } from '../../data/adhikaari_beneficiaries';

// Re-export types so sub-scenarios don’t import /data directly
export type { ActionId, TraitId };

export abstract class BaseScenario {
  abstract name: string;

  protected getAllActionIds(): ActionId[] {
    return Object.keys(ACTIONS) as ActionId[];
  }

  protected getActionWeight(actionId: ActionId): number {
    return ACTIONS[actionId].weight;
  }

  protected computeActionWeight(actionIds: ActionId[]): number {
    return actionIds.reduce((sum, id) => sum + this.getActionWeight(id), 0);
  }

  protected computeTraitContribution(actionIds: ActionId[]) {
    let total = 0;
    let dominant: { id: TraitId; value: number; prayojana: number } | undefined;

    actionIds.forEach((id) => {
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

  protected computeOutcomeContribution(actionIds: ActionId[], scenario: 'GARBAGE' | 'WALLET'|'FOOD') {
    const w = DEFAULT_BENEFICIARY_WEIGHTS[scenario];
    let score = 0;
    actionIds.forEach((id) => {
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

  protected computeStateContribution(actionIds: ActionId[]) {
    return actionIds.map((id) => STATES[ACTION_RESULTING_STATE[id]].desirability);
  }

  protected getStateDesirability(actionId: ActionId) {
    return STATES[ACTION_RESULTING_STATE[actionId]].desirability;
  }

  abstract score(...args: any[]): any;
}