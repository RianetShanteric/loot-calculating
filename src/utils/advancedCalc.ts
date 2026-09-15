import type { AdvancedCalcState, ChestCompositionRow, Dungeon, DropProbability, Item, ItemPrice, PeriodUnit } from '../types';
import { getItemPrice } from './calculations';

const PERIOD_UNIT_DAYS: Record<PeriodUnit, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};

export function getPeriodInDays(calc: AdvancedCalcState): number {
  return calc.periodAmount * PERIOD_UNIT_DAYS[calc.periodUnit];
}

/** Expected value of opening one instance of a chest, using live (possibly user-edited) prices. */
export function getChestExpectedValue(
  chestId: string,
  probabilities: DropProbability[],
  items: Item[],
  prices: ItemPrice[]
): number {
  return probabilities
    .filter((p) => p.chestId === chestId)
    .reduce((sum, p) => sum + (p.chancePercent / 100) * p.quantity * getItemPrice(p.itemId, items, prices), 0);
}

export interface DungeonProfitRow {
  dungeonId: string;
  dungeon: Dungeon;
  dailyValue: number; // one daily-chest cycle, characters × double-reward already applied
  bonusValue: number; // one bonus-chest cycle, characters applied, NOT double-reward
  dayValue: number; // dailyValue + bonusValue/3 — the real per-day rate
  weekValue: number;
  monthValue: number;
  profitPerMinute: number; // dailyValue / timeMinutes — efficiency ranking (bonus excluded, matches a single run)
}

export function computeDungeonProfit(
  dungeon: Dungeon,
  calc: AdvancedCalcState,
  probabilities: DropProbability[],
  items: Item[],
  prices: ItemPrice[]
): DungeonProfitRow {
  const dailyChestValue = getChestExpectedValue(dungeon.dailyChestId, probabilities, items, prices);
  const bonusChestValue = dungeon.bonusChestId
    ? getChestExpectedValue(dungeon.bonusChestId, probabilities, items, prices)
    : 0;

  const dailyValue = dailyChestValue * (calc.doubleReward ? 2 : 1) * calc.characterCount;
  const bonusValue = bonusChestValue * calc.characterCount;
  const dayValue = dailyValue + bonusValue / 3;

  return {
    dungeonId: dungeon.id,
    dungeon,
    dailyValue,
    bonusValue,
    dayValue,
    weekValue: dayValue * 7,
    monthValue: dayValue * 30,
    profitPerMinute: dungeon.timeMinutes > 0 ? dailyValue / dungeon.timeMinutes : 0,
  };
}

export interface AdvancedCalcTotals {
  rows: DungeonProfitRow[];
  totalDayValue: number;
  totalWeekValue: number;
  totalMonthValue: number;
  byCategory: Record<string, { dayValue: number; weekValue: number; monthValue: number }>;
}

export function computeAdvancedCalcTotals(
  calc: AdvancedCalcState,
  dungeons: Dungeon[],
  probabilities: DropProbability[],
  items: Item[],
  prices: ItemPrice[]
): AdvancedCalcTotals {
  const selected = new Set(calc.selectedDungeonIds);
  const rows = dungeons
    .filter((d) => selected.has(d.id))
    .map((d) => computeDungeonProfit(d, calc, probabilities, items, prices));

  const byCategory: AdvancedCalcTotals['byCategory'] = {};
  for (const row of rows) {
    const cat = row.dungeon.category;
    const bucket = byCategory[cat] ?? { dayValue: 0, weekValue: 0, monthValue: 0 };
    bucket.dayValue += row.dayValue;
    bucket.weekValue += row.weekValue;
    bucket.monthValue += row.monthValue;
    byCategory[cat] = bucket;
  }

  return {
    rows,
    totalDayValue: rows.reduce((s, r) => s + r.dayValue, 0),
    totalWeekValue: rows.reduce((s, r) => s + r.weekValue, 0),
    totalMonthValue: rows.reduce((s, r) => s + r.monthValue, 0),
    byCategory,
  };
}

/** Ranks all dungeons (not just selected ones) by profit/minute, to help decide what's worth farming. */
export function rankDungeonsByEfficiency(
  calc: AdvancedCalcState,
  dungeons: Dungeon[],
  probabilities: DropProbability[],
  items: Item[],
  prices: ItemPrice[]
): DungeonProfitRow[] {
  return dungeons
    .map((d) => computeDungeonProfit(d, calc, probabilities, items, prices))
    .sort((a, b) => b.profitPerMinute - a.profitPerMinute);
}

export interface AdvancedCalcValidation {
  valid: boolean;
  errors: string[];
}

export function validateAdvancedCalc(calc: AdvancedCalcState): AdvancedCalcValidation {
  const errors: string[] = [];

  if (calc.characterCount < 1 || calc.characterCount > 1000) errors.push('advancedCalc.validation.charactersRange');
  if (calc.selectedDungeonIds.length === 0) errors.push('advancedCalc.validation.noDungeonsSelected');
  if (calc.periodAmount < 1) errors.push('advancedCalc.validation.periodAmountMin');
  if (getPeriodInDays(calc) > 10000) errors.push('advancedCalc.validation.periodTooLong');

  return { valid: errors.length === 0, errors };
}

/**
 * Builds the chest composition to hand off to the main calculator: 1 daily chest/character/day
 * (doubled if doubleReward), plus 1 bonus chest/character every 3 days (floor — matches the ÷3
 * amortization used for the daily-rate figures).
 */
export function buildHandoffComposition(calc: AdvancedCalcState, dungeons: Dungeon[]): ChestCompositionRow[] {
  const periodDays = getPeriodInDays(calc);
  const bonusCycles = Math.floor(periodDays / 3);
  const selected = new Set(calc.selectedDungeonIds);
  const counts = new Map<string, number>();

  dungeons
    .filter((d) => selected.has(d.id))
    .forEach((d) => {
      const dailyCount = calc.characterCount * periodDays * (calc.doubleReward ? 2 : 1);
      counts.set(d.dailyChestId, (counts.get(d.dailyChestId) ?? 0) + dailyCount);
      if (d.bonusChestId) {
        const bonusCount = calc.characterCount * bonusCycles;
        counts.set(d.bonusChestId, (counts.get(d.bonusChestId) ?? 0) + bonusCount);
      }
    });

  return Array.from(counts.entries())
    .filter(([, count]) => count > 0)
    .map(([chestId, count]) => ({ chestId, count }));
}
