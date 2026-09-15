import { describe, expect, it } from 'vitest';
import type { DonationChest } from '../types';
import { createSeededRandom } from './prng';
import { runDonationChestSimulation } from './simulation';

const chest: DonationChest = {
  id: 'test-chest',
  name: 'Test chest',
  icon: '/simulator-icons/test.png',
  sourceUrl: 'https://example.com/chest',
  rewards: [
    {
      id: 'certain-reward',
      name: 'Certain reward',
      icon: '/simulator-icons/certain.png',
      quantity: 2,
      chancePercent: 100,
    },
    {
      id: 'never-reward',
      name: 'Never reward',
      icon: '/simulator-icons/never.png',
      quantity: 10,
      chancePercent: 0,
    },
  ],
};

describe('donation chest simulation', () => {
  it('keeps seeded random sequences reproducible', () => {
    const first = createSeededRandom('regression-seed');
    const second = createSeededRandom('regression-seed');

    expect(Array.from({ length: 5 }, () => first.next())).toEqual(
      Array.from({ length: 5 }, () => second.next())
    );
  });

  it('draws exactly one outcome per opening and reports chunk progress', async () => {
    const progress: number[] = [];
    const run = await runDonationChestSimulation(chest, 12, (fraction) => progress.push(fraction), 5);
    const certain = run.results.find((result) => result.rewardId === 'certain-reward');
    const never = run.results.find((result) => result.rewardId === 'never-reward');

    expect(progress).toHaveLength(3);
    expect(progress[0]).toBeCloseTo(5 / 12);
    expect(progress[1]).toBeCloseTo(10 / 12);
    expect(progress[2]).toBe(1);
    expect(run.totalOpenings).toBe(12);
    expect(run.uniqueRewards).toBe(1);
    expect(certain).toMatchObject({
      expectedHits: 12,
      actualHits: 12,
      totalQuantity: 24,
      deviationPercent: 0,
    });
    expect(never).toMatchObject({ expectedHits: 0, actualHits: 0, totalQuantity: 0 });
    expect(never?.deviationPercent).toBeNull();
  });
});
