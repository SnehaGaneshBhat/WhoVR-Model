export type StateId =
  | 'ENVIRONMENT_CLEAN'
  | 'ENVIRONMENT_DIRTY'
  | 'SOCIETY_BENEFITED'
  | 'SOCIETY_HARMED'
  | 'NOTE_PICKED'
  | 'BEGGAR_HELPED'
  | 'NO_CHANGE'
  | 'UNHEALTHY_MEAL'
  | 'HEALTHY_MEAL';

export interface State {
  id: StateId;
  name: string;
  desirability: number; // −10..+10
}

export const STATES: Record<StateId, State> = {
  // Garbage collection scenario
  ENVIRONMENT_CLEAN: { id: 'ENVIRONMENT_CLEAN', name: 'Environment Clean', desirability: 9 },
  ENVIRONMENT_DIRTY: { id: 'ENVIRONMENT_DIRTY', name: 'Environment Dirty', desirability: -8 },
  SOCIETY_BENEFITED: { id: 'SOCIETY_BENEFITED', name: 'Society Benefited', desirability: 7 },
  SOCIETY_HARMED: { id: 'SOCIETY_HARMED', name: 'Society Harmed', desirability: -6 },

  // Temple beggar scenario
  NOTE_PICKED:  { id: 'NOTE_PICKED',  name: 'Note picked, beggar ignored', desirability: -8 },
  BEGGAR_HELPED: { id: 'BEGGAR_HELPED', name: 'Beggar helped', desirability: +9 },
  NO_CHANGE:     { id: 'NO_CHANGE',     name: 'No change', desirability: -6 },

  // Food scenario
  UNHEALTHY_MEAL: { id: 'UNHEALTHY_MEAL', name: 'Unhealthy Meal', desirability: -5 },
  HEALTHY_MEAL: { id: 'HEALTHY_MEAL', name: 'Healthy Meal', desirability: +8 },

};