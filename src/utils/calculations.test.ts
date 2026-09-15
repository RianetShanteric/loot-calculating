import { describe, expect, it } from 'vitest';
import type { AppState } from '../types';
import {
  calculateGrandTotal,
  calculateMainResults,
  getItemPrice,
} from './calculations';

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    items: [
      { id: 'alpha', name: 'Alpha', basePrice: 10 },
      { id: 'beta', name: 'Beta', basePrice: 7 },
    ],
    chests: [
      { id: 'chest-a', name: 'Chest A' },
      { id: 'chest-b', name: 'Chest B' },
    ],
    probabilities: [
      { id: '1', chestId: 'chest-a', itemId: 'alpha', chancePercent: 100, quantity: 2 },
      { id: '2', chestId: 'chest-a', itemId: 'beta', chancePercent: 25, quantity: 4 },
      { id: '3', chestId: 'chest-b', itemId: 'beta', chancePercent: 50, quantity: 1 },
    ],
    prices: [],
    dungeons: [],
    chestComposition: [
      { chestId: 'chest-a', count: 3 },
      { chestId: 'chest-b', count: 2 },
    ],
    actualDrops: {},
    advancedCalc: {
      characterCount: 1,
      doubleReward: false,
      selectedDungeonIds: [],
      periodUnit: 'day',
      periodAmount: 1,
    },
    simulationHistory: [],
    theme: 'dark',
    language: 'ru',
    ...overrides,
  };
}

describe('main loot calculations', () => {
  it('aggregates expected drops and source chances across mixed chest types', () => {
    const { results, totalChests } = calculateMainResults(makeState());
    const alpha = results.find((result) => result.itemId === 'alpha');
    const beta = results.find((result) => result.itemId === 'beta');

    expect(totalChests).toBe(5);
    expect(alpha).toMatchObject({
      expectedDrops: 6,
      actualDrops: 6,
      probabilityPercent: 100,
      itemPrice: 10,
      totalValue: 60,
    });
    expect(alpha?.deviationPercent).toBe(0);
    expect(beta).toMatchObject({
      expectedDrops: 4,
      actualDrops: 4,
      probabilityPercent: 35,
      itemPrice: 7,
      totalValue: 28,
    });
    expect(beta?.deviationPercent).toBe(0);
    expect(calculateGrandTotal(results)).toBe(88);
  });

  it('uses the rounded expected value for actual-drop deviation and applies price overrides', () => {
    const state = makeState({
      actualDrops: { beta: 5 },
      prices: [{ itemId: 'beta', price: 12 }],
    });
    const { results } = calculateMainResults(state);
    const beta = results.find((result) => result.itemId === 'beta');

    expect(beta).toMatchObject({ actualDrops: 5, itemPrice: 12, totalValue: 60 });
    expect(beta?.deviationPercent).toBe(25);
    expect(getItemPrice('missing', state.items, state.prices)).toBe(0);
  });
});
