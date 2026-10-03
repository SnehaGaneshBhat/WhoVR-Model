import type { ActionId } from './karma_actions';
import type { TraitId } from './lakshanas_traits';
import type { StateId } from './dasha_states';
import type { OutcomeBenefit } from './adhikaari_beneficiaries';

// Trait intensities per action
export const ACTION_TRAIT_INTENSITIES: Record<ActionId, Partial<Record<TraitId, number>>> = {
  // Beggar-wallet scenario
  TAKE_NOTE:       { GREED: 8, EMPATHY: 1, LOVE: 0 },
  PAY_FROM_POCKET: { EMPATHY: 8, LOVE: 6, GREED: 1 },
  GIVE_NOTE:       { LOVE: 9, EMPATHY: 7, GREED: 1 },
  IGNORE:          { HATRED: 4, EMPATHY: 1 },

  // Garbage collection scenario
  DISPOSE_WET_CORRECT: { RESPONSIBILITY: 9, CLEANLINESS: 8 },
  DISPOSE_WET_WRONG:   { CARELESSNESS: 8 },
  DISPOSE_DRY_CORRECT: { RESPONSIBILITY: 7, CLEANLINESS: 6 },
  DISPOSE_DRY_WRONG:   { CARELESSNESS: 6 },

  // Food scenario
  ADD_POTATO:       { HEALTH_CONSCIOUSNESS: 4 },
  ADD_TOMATO:       { HEALTH_CONSCIOUSNESS: 6 },
  ADD_CUCUMBER:     { HEALTH_CONSCIOUSNESS: 7 },
  ADD_LETTUCE:      { HEALTH_CONSCIOUSNESS: 8 },
  ADD_ONION:        { HEALTH_CONSCIOUSNESS: 4 },
  ADD_RED_CAPSICUM: { HEALTH_CONSCIOUSNESS: 6 },
  ADD_YELLOW_CAPSICUM:{ HEALTH_CONSCIOUSNESS: 6 },

  ADD_CANDY:        { INDULGENCE: 6 },
  ADD_MUFFIN:       { INDULGENCE: 7 },
  ADD_COOKIES:      { INDULGENCE: 5 },
  ADD_SPRINKLES:    { INDULGENCE: 5 },
  ADD_WAFERS:       { INDULGENCE: 5 },

  ADD_TURMERIC:   { HEALTH_CONSCIOUSNESS: 8 },
  ADD_GHEE:       { HEALTH_CONSCIOUSNESS: 7 },
  ADD_RASAM:      { HEALTH_CONSCIOUSNESS: 6 },
  ADD_RICE:       { HEALTH_CONSCIOUSNESS: 6 },
  ADD_IDLY:       { HEALTH_CONSCIOUSNESS: 6 },


  ADD_VADA:        { INDULGENCE: 5 },
  ADD_MIRCHI_BAJJI:{ INDULGENCE: 6 },
  ADD_PICKLE:      { INDULGENCE: 4 },
  ADD_GAJAR_HALWA: { INDULGENCE: 7 },
  ADD_KESARI_BATH: { INDULGENCE: 7 },
};

// Resulting state per action
export const ACTION_RESULTING_STATE: Record<ActionId, StateId> = {
  // Beggar-wallet scenario
  TAKE_NOTE:       'NOTE_PICKED',
  PAY_FROM_POCKET: 'BEGGAR_HELPED',
  GIVE_NOTE:       'BEGGAR_HELPED',
  IGNORE:          'NO_CHANGE',

  // Garbage collection scenario
  DISPOSE_WET_CORRECT: 'ENVIRONMENT_CLEAN',
  DISPOSE_WET_WRONG:   'ENVIRONMENT_DIRTY',
  DISPOSE_DRY_CORRECT: 'SOCIETY_BENEFITED',
  DISPOSE_DRY_WRONG:   'SOCIETY_HARMED',

  // Food scenario
  ADD_POTATO:       'HEALTHY_MEAL',
  ADD_TOMATO:       'HEALTHY_MEAL',
  ADD_CUCUMBER:     'HEALTHY_MEAL',
  ADD_LETTUCE:      'HEALTHY_MEAL',
  ADD_ONION:        'HEALTHY_MEAL',
  ADD_RED_CAPSICUM: 'HEALTHY_MEAL',
  ADD_YELLOW_CAPSICUM:'HEALTHY_MEAL',

  ADD_CANDY:        'UNHEALTHY_MEAL',
  ADD_MUFFIN:       'UNHEALTHY_MEAL',
  ADD_COOKIES:      'UNHEALTHY_MEAL',
  ADD_SPRINKLES:    'UNHEALTHY_MEAL',
  ADD_WAFERS:       'UNHEALTHY_MEAL',

  ADD_TURMERIC:    'HEALTHY_MEAL',
  ADD_GHEE:        'HEALTHY_MEAL',
  ADD_RASAM:       'HEALTHY_MEAL',
  ADD_RICE:        'HEALTHY_MEAL',
  ADD_IDLY:        'HEALTHY_MEAL',
  ADD_VADA:         'UNHEALTHY_MEAL',
  ADD_MIRCHI_BAJJI: 'UNHEALTHY_MEAL',
  ADD_PICKLE:       'UNHEALTHY_MEAL',
  ADD_GAJAR_HALWA:  'UNHEALTHY_MEAL',
  ADD_KESARI_BATH:  'UNHEALTHY_MEAL',


};

// Outcome benefit per action (0–10 scale)
export const ACTION_OUTCOME_BENEFIT: Record<ActionId, OutcomeBenefit> = {
  // Beggar-wallet scenario
  TAKE_NOTE:       { SELF: 10, BEGGAR: 0,  SOCIETY: 2 },
  PAY_FROM_POCKET: { SELF: 3,  BEGGAR: 9,  SOCIETY: 5 },
  GIVE_NOTE:       { SELF: 2,  BEGGAR: 10, SOCIETY: 6 },
  IGNORE:          { SELF: 6,  BEGGAR: 0,  SOCIETY: 3 },

  // Garbage collection scenario
  DISPOSE_WET_CORRECT: { SELF: 2, SOCIETY: 8, ENVIRONMENT: 10 },
  DISPOSE_WET_WRONG:   { SELF: -1, SOCIETY: -6, ENVIRONMENT: -8 },
  DISPOSE_DRY_CORRECT: { SELF: 1, SOCIETY: 6, ENVIRONMENT: 7 },
  DISPOSE_DRY_WRONG:   { SELF: -1, SOCIETY: -4, ENVIRONMENT: -5 },
  
  // Food scenario
  ADD_POTATO:       { SELF: 4 },
  ADD_TOMATO:       { SELF: 6 },
  ADD_CUCUMBER:     { SELF: 7 },
  ADD_LETTUCE:      { SELF: 8 },
  ADD_ONION:        { SELF: 4 },
  ADD_RED_CAPSICUM: { SELF: 6 },
  ADD_YELLOW_CAPSICUM:{ SELF: 6 },

  ADD_CANDY:        { SELF: -3 },
  ADD_MUFFIN:       { SELF: -4 },
  ADD_COOKIES:      { SELF: -2 },
  ADD_SPRINKLES:    { SELF: -2 },
  ADD_WAFERS:       { SELF: -2 },

  ADD_TURMERIC:    { SELF: 8 },
  ADD_GHEE:        { SELF: 7 },
  ADD_RASAM:       { SELF: 6 },
  ADD_RICE:        { SELF: 6 },
  ADD_IDLY:        { SELF: 6 },
  ADD_VADA:         { SELF: -2 },
  ADD_MIRCHI_BAJJI: { SELF: -3 },
  ADD_PICKLE:       { SELF: -2 },
  ADD_GAJAR_HALWA:  { SELF: -4 },
  ADD_KESARI_BATH:  { SELF: -4 },
};