export interface Item {
  id: string;
  name: string;
  basePrice: number;
  /** Path to a static icon under /public, e.g. "/icons/1.png". Optional for items added via the UI (no icon file). */
  icon?: string;
}

export interface Chest {
  id: string;
  name: string;
}

export interface DropProbability {
  id: string;
  chestId: string;
  itemId: string;
  chancePercent: number; // 0-100, 2 decimals
  quantity: number; // items awarded per successful drop
}

/** A separate simulator-only outcome. It is never used by dungeon calculations. */
export interface DonationChestReward {
  id: string;
  name: string;
  icon: string;
  quantity: number;
  chancePercent: number;
}

/** Simulator chest data is kept apart from the farm calculator and dungeon loot. */
export interface DonationChest {
  id: string;
  name: string;
  icon: string;
  sourceUrl: string;
  rewards: DonationChestReward[];
}

export interface ItemPrice {
  itemId: string;
  price: number;
}

export type DungeonCategory = 'armor' | 'weapon' | 'relic';

export interface Dungeon {
  id: string;
  name: string;
  category: DungeonCategory;
  /** Chest received once per character per day (doubled by the "double reward" toggle). */
  dailyChestId: string;
  /** Bonus/token chest — not affected by "double reward"; its value is amortized (÷3) into a daily rate.
   *  Absent for dungeons that have no bonus chest (contributes 0 to bonus value). */
  bonusChestId?: string;
  timeMinutes: number;
}

export interface ChestCompositionRow {
  chestId: string;
  count: number;
}

export interface CalculationResult {
  itemId: string;
  itemName: string;
  itemIcon?: string;
  probabilityPercent: number; // effective chance representation for display
  expectedDrops: number;
  actualDrops: number;
  deviationPercent: number | null;
  itemPrice: number;
  totalValue: number;
}

export interface DonationSimulationResult {
  rewardId: string;
  itemName: string;
  itemIcon: string;
  quantityPerDrop: number;
  chancePercent: number;
  expectedHits: number;
  actualHits: number;
  totalQuantity: number;
  deviationPercent: number | null;
}

export type PeriodUnit = 'day' | 'week' | 'month' | 'year';

export interface AdvancedCalcState {
  /** Number of characters farming each selected dungeon (one global count, shared by all). */
  characterCount: number;
  /** Global "double reward" toggle — doubles each dungeon's daily-chest value, not the bonus chest. */
  doubleReward: boolean;
  selectedDungeonIds: string[];
  /** Farming period used to calculate accumulated chests on the main loot page. */
  periodUnit: PeriodUnit;
  periodAmount: number;
}

export type Language = 'ru' | 'en';
export type Theme = 'light' | 'dark';

export interface SimulationHistoryEntry {
  id: string;
  kind: 'donation';
  chestId: string;
  chestName: string;
  simulations: number;
  timestamp: string;
}

export interface AppState {
  items: Item[];
  chests: Chest[];
  probabilities: DropProbability[];
  prices: ItemPrice[];
  dungeons: Dungeon[];
  chestComposition: ChestCompositionRow[];
  actualDrops: Record<string, number>;
  advancedCalc: AdvancedCalcState;
  simulationHistory: SimulationHistoryEntry[];
  theme: Theme;
  language: Language;
}
