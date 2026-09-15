import type { DonationChest, DonationSimulationResult } from '../types';
import { createSeededRandom } from './prng';

export interface DonationSimulationRun {
  results: DonationSimulationResult[];
  totalOpenings: number;
  uniqueRewards: number;
}

const nextFrame = (callback: () => void) =>
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame(callback) : setTimeout(callback, 0);

/**
 * Draws exactly one weighted outcome for each chest opening. Reward quantity is the size of that
 * one outcome's stack, so total item units may exceed the number of opened chests.
 */
export async function runDonationChestSimulation(
  chest: DonationChest,
  openings: number,
  onProgress?: (fraction: number) => void,
  chunkSize = 500
): Promise<DonationSimulationRun> {
  const rng = createSeededRandom();
  const hits = new Map(chest.rewards.map((reward) => [reward.id, 0]));
  const cumulative = chest.rewards.reduce<Array<{ upperBound: number; rewardId: string }>>((rows, reward) => {
    const previous = rows.at(-1)?.upperBound ?? 0;
    rows.push({ upperBound: previous + reward.chancePercent, rewardId: reward.id });
    return rows;
  }, []);

  for (let start = 0; start < openings; start += chunkSize) {
    const end = Math.min(start + chunkSize, openings);
    for (let opening = start; opening < end; opening += 1) {
      const roll = rng.next() * 100;
      const selected = cumulative.find((row) => roll < row.upperBound) ?? cumulative.at(-1);
      if (selected) hits.set(selected.rewardId, (hits.get(selected.rewardId) ?? 0) + 1);
    }
    onProgress?.(end / openings);
    if (end < openings) await new Promise<void>((resolve) => nextFrame(resolve));
  }

  const results = chest.rewards
    .map<DonationSimulationResult>((reward) => {
      const actualHits = hits.get(reward.id) ?? 0;
      const expectedHits = (reward.chancePercent / 100) * openings;
      return {
        rewardId: reward.id,
        itemName: reward.name,
        itemIcon: reward.icon,
        quantityPerDrop: reward.quantity,
        chancePercent: reward.chancePercent,
        expectedHits,
        actualHits,
        totalQuantity: actualHits * reward.quantity,
        deviationPercent: expectedHits > 0 ? ((actualHits - expectedHits) / expectedHits) * 100 : null,
      };
    })
    .sort((a, b) => b.actualHits - a.actualHits || b.chancePercent - a.chancePercent);

  return {
    results,
    totalOpenings: openings,
    uniqueRewards: results.filter((result) => result.actualHits > 0).length,
  };
}
