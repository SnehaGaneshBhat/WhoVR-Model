export type TraitId =
  // Garbage collection scenario
  | 'RESPONSIBILITY'
  | 'CARELESSNESS'
  | 'CLEANLINESS'
  // Beggar-wallet scenario
  | 'GREED'
  | 'LOVE'
  | 'EMPATHY'
  | 'HATRED'
  // Food scenario
  | 'HEALTH_CONSCIOUSNESS'
  | 'INDULGENCE';

export interface Trait {
  id: TraitId;
  name: string;
  prayojana: number; // −10..+10 canonical utility
}

// Unified TRAITS record
export const TRAITS: Record<TraitId, Trait> = {
  // Garbage collection scenario
  RESPONSIBILITY: { id: 'RESPONSIBILITY', name: 'Responsibility', prayojana: 10 },
  CLEANLINESS:   { id: 'CLEANLINESS',   name: 'Cleanliness',   prayojana: 8 },
  CARELESSNESS:  { id: 'CARELESSNESS',  name: 'Carelessness',  prayojana: -6 },

  // Beggar-wallet scenario
  GREED:   { id: 'GREED',   name: 'Greed',   prayojana: 1 },
  LOVE:    { id: 'LOVE',    name: 'Love',    prayojana: 10 },
  EMPATHY: { id: 'EMPATHY', name: 'Empathy', prayojana: 8 },
  HATRED:  { id: 'HATRED',  name: 'Hatred',  prayojana: 2 },

// Food scenario
  HEALTH_CONSCIOUSNESS: { id: 'HEALTH_CONSCIOUSNESS', name: 'Health Consciousness', prayojana: 9 },
  INDULGENCE:           { id: 'INDULGENCE',           name: 'Indulgence',           prayojana: -5 },
};