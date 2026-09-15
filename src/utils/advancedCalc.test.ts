import { describe, expect, it } from 'vitest';
import type { AdvancedCalcState, Dungeon, DropProbability, Item } from '../types';
import {
  buildHandoffComposition,
  computeAdvancedCalcTotals,
  computeDungeonProfit,
  getChestExpectedValue,
  getPeriodInDays,
  validateAdvancedCalc,
} from './advancedCalc';

const items: Item[] = [
  { id: 'daily-item', name: 'Daily item', basePrice: 10 },
  { id: 'bonus-item', name: 'Bonus item', basePrice: 20 },
];

const probabilities: DropProbability[] = [
  { id: '1', chestId: 'daily-chest', itemId: 'daily-item', chancePercent: 100, quantity: 1 },
  { id: '2', chestId: 'bonus-chest', itemId: 'bonus-item', chancePercent: 100, quantity: 1 },
];

const dungeon: Dungeon = {
  id: 'dungeon-1',
  name: 'Test dungeon',
  category: 'armor',
  dailyChestId: 'daily-chest',
  bonusChestId: 'bonus-chest',
  timeMinutes: 10,
};

const calc: AdvancedCalcState = {
  characterCount: 2,
  doubleReward: true,
  selectedDungeonIds: ['dungeon-1'],
  periodUnit: 'week',
  periodAmount: 1,
};

describe('advanced dungeon calculations', () => {
  it('calculates daily, periodic and efficiency values with double reward', () => {
    expect(getChestExpectedValue('daily-chest', probabilities, items, [])).toBe(10);
    expect(getChestExpectedValue('bonus-chest', probabilities, items, [])).toBe(20);

    const row = computeDungeonProfit(dungeon, calc, probabilities, items, []);

    expect(row.dailyValue).toBe(40);
    expect(row.bonusValue).toBe(40);
    expect(row.dayValue).toBeCloseTo(53.3333333333);
    expect(row.weekValue).toBeCloseTo(373.3333333333);
    expect(row.monthValue).toBeCloseTo(1600);
    expect(row.profitPerMinute).toBe(4);
  });

  it('builds the handoff composition using period days and bonus cycles', () => {
    expect(getPeriodInDays(calc)).toBe(7);
    expect(buildHandoffComposition(calc, [dungeon])).toEqual([
      { chestId: 'daily-chest', count: 28 },
      { chestId: 'bonus-chest', count: 4 },
    ]);

    const totals = computeAdvancedCalcTotals(calc, [dungeon], probabilities, items, []);
    expect(totals.totalDayValue).toBeCloseTo(53.3333333333);
    expect(totals.totalWeekValue).toBeCloseTo(373.3333333333);
    expect(totals.byCategory.armor.dayValue).toBeCloseTo(53.3333333333);
  });

  it('rejects incomplete or unsafe calculator input', () => {
    const invalid = validateAdvancedCalc({
      ...calc,
      characterCount: 0,
      selectedDungeonIds: [],
      periodAmount: 10001,
      periodUnit: 'year',
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toEqual(
      expect.arrayContaining([
        'advancedCalc.validation.charactersRange',
        'advancedCalc.validation.noDungeonsSelected',
        'advancedCalc.validation.periodTooLong',
      ])
    );
  });
});
