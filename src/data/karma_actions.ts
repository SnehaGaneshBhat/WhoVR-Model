export type ActionId =
  // Beggar-wallet scenario
  | 'TAKE_NOTE'
  | 'PAY_FROM_POCKET'
  | 'GIVE_NOTE'
  | 'IGNORE'
  // Garbage collection scenario
  | 'DISPOSE_WET_CORRECT'
  | 'DISPOSE_WET_WRONG'
  | 'DISPOSE_DRY_CORRECT'
  | 'DISPOSE_DRY_WRONG'
  // Food scenario
  | 'ADD_POTATO'
  | 'ADD_TOMATO'
  | 'ADD_CUCUMBER'
  | 'ADD_LETTUCE'
  | 'ADD_ONION'
  | 'ADD_RED_CAPSICUM'
  | 'ADD_YELLOW_CAPSICUM'
  | 'ADD_CANDY'
  | 'ADD_MUFFIN'
  | 'ADD_COOKIES'
  | 'ADD_SPRINKLES'
  | 'ADD_WAFERS'
  | 'ADD_TURMERIC'
  | 'ADD_GHEE'
  | 'ADD_RASAM'
  | 'ADD_RICE'
  | 'ADD_IDLY'
  | 'ADD_VADA'
  | 'ADD_MIRCHI_BAJJI'
  | 'ADD_PICKLE'
  | 'ADD_GAJAR_HALWA'
  | 'ADD_KESARI_BATH';


export interface Action {
  id: ActionId;
  name: string;
  weight: number; // −10..+10
}

// Unified ACTIONS record
export const ACTIONS: Record<ActionId, Action> = {
  // Beggar-wallet scenario
  TAKE_NOTE:       { id: 'TAKE_NOTE',       name: 'Take note',       weight: -6 },
  PAY_FROM_POCKET: { id: 'PAY_FROM_POCKET', name: 'Pay from pocket', weight: +6 },
  GIVE_NOTE:       { id: 'GIVE_NOTE',       name: 'Give note',       weight: +8 },
  IGNORE:          { id: 'IGNORE',          name: 'Ignore',          weight: -4 },

  // Garbage collection scenario
  DISPOSE_WET_CORRECT: { id: 'DISPOSE_WET_CORRECT', name: 'Dispose Wet Trash Correctly', weight: 6 },
  DISPOSE_WET_WRONG:   { id: 'DISPOSE_WET_WRONG',   name: 'Dispose Wet Trash Incorrectly', weight: 0 },
  DISPOSE_DRY_CORRECT: { id: 'DISPOSE_DRY_CORRECT', name: 'Dispose Dry Trash Correctly', weight: 4 },
  DISPOSE_DRY_WRONG:   { id: 'DISPOSE_DRY_WRONG',   name: 'Dispose Dry Trash Incorrectly', weight: 1 },

  // Food scenario
  ADD_POTATO:       { id: 'ADD_POTATO',       name: 'Add Potato',       weight: 3 },
  ADD_TOMATO:       { id: 'ADD_TOMATO',       name: 'Add Tomato',       weight: 4 },
  ADD_CUCUMBER:     { id: 'ADD_CUCUMBER',     name: 'Add Cucumber',     weight: 5 },
  ADD_LETTUCE:      { id: 'ADD_LETTUCE',      name: 'Add Lettuce',      weight: 5 },
  ADD_ONION:        { id: 'ADD_ONION',        name: 'Add Onion',        weight: 3 },
  ADD_RED_CAPSICUM: { id: 'ADD_RED_CAPSICUM', name: 'Add Red Capsicum', weight: 4 },
  ADD_YELLOW_CAPSICUM:{ id: 'ADD_YELLOW_CAPSICUM', name: 'Add Yellow Capsicum', weight: 4 },
  ADD_CANDY:        { id: 'ADD_CANDY',        name: 'Add Candy',        weight: 1 },
  ADD_MUFFIN:       { id: 'ADD_MUFFIN',       name: 'Add Muffin',       weight: 1 },
  ADD_COOKIES:      { id: 'ADD_COOKIES',      name: 'Add Cookies',      weight: 2 },
  ADD_SPRINKLES:    { id: 'ADD_SPRINKLES',    name: 'Add Sprinkles',    weight: 1 },
  ADD_WAFERS:       { id: 'ADD_WAFERS',       name: 'Add Wafers',       weight: 1 },

  ADD_TURMERIC:   { id: 'ADD_TURMERIC',   name: 'Add Turmeric',   weight: 5 },
  ADD_GHEE:       { id: 'ADD_GHEE',       name: 'Add Ghee',       weight: 5 },
  ADD_RASAM:      { id: 'ADD_RASAM',      name: 'Add Rasam',      weight: 4 },
  ADD_RICE:       { id: 'ADD_RICE',       name: 'Add Rice',       weight: 4 },
  ADD_IDLY:       { id: 'ADD_IDLY',       name: 'Add Idly',       weight: 4 },
  ADD_VADA:        { id: 'ADD_VADA',        name: 'Add Vada',        weight: 2 },
  ADD_MIRCHI_BAJJI:{ id: 'ADD_MIRCHI_BAJJI',name: 'Add Mirchi Bajji',weight: 1 },
  ADD_PICKLE:      { id: 'ADD_PICKLE',      name: 'Add Pickle',      weight: 1 },
  ADD_GAJAR_HALWA: { id: 'ADD_GAJAR_HALWA', name: 'Add Gajar Halwa', weight: 1 },
  ADD_KESARI_BATH: { id: 'ADD_KESARI_BATH', name: 'Add Kesari Bath', weight: 1 },

};