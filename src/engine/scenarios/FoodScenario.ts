import { BaseScenario, ActionId } from './BaseScenario';
import { logItemContribution, logScenarioSummary } from '../utils/ScoreLogger';

export class FoodScenario extends BaseScenario {
  name = 'FoodScenario';

  private maxSelections: Record<string, number> = {
    // South Indian feast items
    ADD_TURMERIC: 3,
    ADD_GHEE: 3,
    ADD_RASAM: 3,
    ADD_RICE: 3,
    ADD_IDLY: 3,
    ADD_ONION: 3,
    ADD_VADA: 3,
    ADD_MIRCHI_BAJJI: 3,
    ADD_PICKLE: 3,
    ADD_GAJAR_HALWA: 3,
    ADD_KESARI_BATH: 3,

    // Subway items
    ADD_POTATO: 3,
    ADD_TOMATO: 3,
    ADD_CUCUMBER: 3,
    ADD_LETTUCE: 3,
    ADD_RED_CAPSICUM: 3,
    ADD_YELLOW_CAPSICUM: 3,
    ADD_CANDY: 3,
    ADD_MUFFIN: 3,
    ADD_COOKIES: 3,
    ADD_SPRINKLES: 3,
    ADD_WAFERS: 3,
  };

  score(actionIds: string[]) {
    // Updated healthy/unhealthy lists for Indian feast
    const healthyItems = [
  // Indian feast
  'ADD_TURMERIC','ADD_GHEE','ADD_RASAM','ADD_RICE',
  'ADD_IDLY','ADD_ONION',
  // Subway
  'ADD_POTATO','ADD_TOMATO','ADD_CUCUMBER','ADD_LETTUCE',
  'ADD_RED_CAPSICUM','ADD_YELLOW_CAPSICUM'
];

const unhealthyItems = [
  // Indian feast
  'ADD_VADA','ADD_MIRCHI_BAJJI','ADD_PICKLE',
  'ADD_GAJAR_HALWA','ADD_KESARI_BATH',
  // Subway
  'ADD_CANDY','ADD_MUFFIN','ADD_COOKIES','ADD_SPRINKLES','ADD_WAFERS'
];


    let itemScores: { id: string; score: number }[] = [];
    let excessHealthy = 0;
    let excessUnhealthy = 0;

    const uniqueIds = [...new Set(actionIds)];
    uniqueIds.forEach(id => {
      const count = actionIds.filter(a => a === id).length;
      const max = this.maxSelections[id] ?? Infinity;

      if (count > 0) {
        // Break out each factor explicitly
        const trait = this.computeTraitContribution([id as ActionId]);
        const karma = trait.total;
        const lakshanas = trait.dominant?.value ?? 0;
        const adhikaari = this.getActionWeight(id as ActionId);
        const sambandhanas = this.computeActionWeight([id as ActionId]);
        const dasha = this.computeOutcomeContribution([id as ActionId], 'FOOD');

        let itemScore =
          0.25 * karma +
          0.15 * lakshanas +
          0.25 * adhikaari +
          0.15 * sambandhanas +
          0.20 * dasha;

        if (itemScore < 0) itemScore = Math.abs(itemScore);

        logItemContribution({
          id,
          adhikaari,
          dasha,
          karma,
          lakshanas,
          sambandhanas,
          itemScore
        });

        itemScores.push({ id, score: itemScore });
      }

      // Penalties for excess adds
      if (count > 1) {
        const extraAdds = Math.min(count - 1, 2);
        if (healthyItems.includes(id)) {
          excessHealthy += extraAdds;
        } else if (unhealthyItems.includes(id)) {
          excessUnhealthy += extraAdds;
        }
      }

      if (count > max) {
        excessUnhealthy += (count - max);
      }
    });

    const penalty = (excessHealthy * 1) + (excessUnhealthy * 2);
    const rawScore = itemScores.reduce((sum, i) => sum + i.score, 0);
    const unclampedFinal = rawScore - penalty;

    // Normalization baseline = all healthy items once
    const healthyIds = [
      'ADD_TURMERIC','ADD_GHEE','ADD_RASAM','ADD_RICE',
      'ADD_IDLY','ADD_ONION',
      'ADD_POTATO','ADD_TOMATO','ADD_CUCUMBER','ADD_LETTUCE',
      'ADD_RED_CAPSICUM','ADD_YELLOW_CAPSICUM'
    ];

    let maxPossibleRaw = 0;
    healthyIds.forEach(id => {
      const trait = this.computeTraitContribution([id as ActionId]);
      const karma = trait.total;
      const lakshanas = trait.dominant?.value ?? 0;
      const adhikaari = this.getActionWeight(id as ActionId);
      const sambandhanas = this.computeActionWeight([id as ActionId]);
      const dasha = this.computeOutcomeContribution([id as ActionId], 'FOOD');

      let itemScore =
        0.25 * karma +
        0.15 * lakshanas +
        0.25 * adhikaari +
        0.15 * sambandhanas +
        0.20 * dasha;

      if (itemScore < 0) itemScore = Math.abs(itemScore);
      maxPossibleRaw += itemScore;
    });

    let normalizedFinal = 0;
    if (maxPossibleRaw > 0) {
      normalizedFinal = (unclampedFinal / maxPossibleRaw) * 10;
    }

    const finalScore = Math.max(0, Math.min(10, normalizedFinal));

    logScenarioSummary(
      rawScore, penalty, unclampedFinal,
      maxPossibleRaw, normalizedFinal, finalScore,
      excessHealthy, excessUnhealthy
    );

    return { itemScores, penalty, rawScore, finalScore, excessHealthy, excessUnhealthy };
  }
}
