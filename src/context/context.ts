import { createContext, type Dispatch } from 'react';
import type {
  AppState,
  ChestCompositionRow,
  DropProbability,
  Language,
  SimulationHistoryEntry,
  Theme,
} from '../types';

export type Action =
  | { type: 'SET_CHEST_COMPOSITION'; payload: ChestCompositionRow[] }
  | { type: 'ADD_CHEST_ROW' }
  | { type: 'UPDATE_CHEST_ROW'; payload: { index: number; row: ChestCompositionRow } }
  | { type: 'REMOVE_CHEST_ROW'; payload: number }
  | { type: 'SET_ACTUAL_DROP'; payload: { itemId: string; value: number } }
  | { type: 'RESET_ACTUAL_DROPS' }
  | { type: 'UPDATE_ITEM_PRICE'; payload: { itemId: string; price: number } }
  | { type: 'RESET_ITEM_PRICE'; payload: string }
  | { type: 'RESET_ALL_PRICES' }
  | { type: 'ADD_ITEM'; payload: { name: string; basePrice: number } }
  | { type: 'ADD_PROBABILITY'; payload: { chestId: string; itemId: string; chancePercent: number; quantity: number } }
  | { type: 'UPDATE_PROBABILITY'; payload: DropProbability }
  | { type: 'DELETE_PROBABILITY'; payload: string }
  | { type: 'SET_ADVANCED_CALC'; payload: Partial<AppState['advancedCalc']> }
  | { type: 'ADD_SIMULATION_HISTORY'; payload: SimulationHistoryEntry }
  | { type: 'SET_THEME'; payload: Theme }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_LANGUAGE'; payload: Language };

interface AppContextType {
  state: AppState;
  dispatch: Dispatch<Action>;
  dungeons: AppState['dungeons'];
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
