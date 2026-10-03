
export type BeneficiaryId = 'SELF' | 'BEGGAR' | 'SOCIETY' | 'ENVIRONMENT';

// General interface for weights
export interface BeneficiaryWeights {
  SELF: number;
  BEGGAR?: number;     
  SOCIETY: number;
  ENVIRONMENT?: number; 
}

// Default weights per scenario
export const DEFAULT_BENEFICIARY_WEIGHTS: Record<string, BeneficiaryWeights> = {
  // Garbage collection scenario
  GARBAGE: {
    SELF: 0.2,
    SOCIETY: 0.4,
    ENVIRONMENT: 0.4,
  },

  // Temple beggar-wallet scenario
  WALLET: {
    SELF: 0.3,
    BEGGAR: 0.7,
    SOCIETY: 0.0,
  },

   FOOD: {
    SELF: 1.0,        // all scoring emphasizes personal health
    SOCIETY: 0.0,     // no real social impact
    ENVIRONMENT: 0.0, // no environmental impact here
  },
};

// Outcome benefits per action (0–10 scale)
export interface OutcomeBenefit {
  SELF: number;
  BEGGAR?: number;
  SOCIETY?: number;
  ENVIRONMENT?: number;
}