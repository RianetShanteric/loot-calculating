import type { DonationChest } from '../types';

const chestModules = import.meta.glob<DonationChest>('./simulator-chests/*.json', {
  eager: true,
  import: 'default',
});

/**
 * Simulator chests are isolated from the dungeon loot dataset. New JSON files are
 * discovered by Vite automatically; no TypeScript registry needs to be edited.
 */
export const donationChests: DonationChest[] = Object.entries(chestModules)
  .map(([path, chest]) => {
    if (!validateDonationChestData(chest)) {
      throw new Error(`Invalid simulator chest data: ${path}`);
    }

    return chest;
  })
  .sort((left, right) => left.name.localeCompare(right.name, 'ru'));

export function validateDonationChestData(chest: DonationChest): boolean {
  if (
    !chest ||
    typeof chest.id !== 'string' ||
    typeof chest.name !== 'string' ||
    typeof chest.icon !== 'string' ||
    typeof chest.sourceUrl !== 'string' ||
    !Array.isArray(chest.rewards) ||
    chest.rewards.length === 0
  ) {
    return false;
  }

  const rewardIds = new Set<string>();
  let chanceTotal = 0;

  for (const reward of chest.rewards) {
    if (
      !reward ||
      typeof reward.id !== 'string' ||
      rewardIds.has(reward.id) ||
      typeof reward.name !== 'string' ||
      typeof reward.icon !== 'string' ||
      !Number.isInteger(reward.quantity) ||
      reward.quantity < 1 ||
      !Number.isFinite(reward.chancePercent) ||
      reward.chancePercent <= 0 ||
      reward.chancePercent > 100
    ) {
      return false;
    }

    rewardIds.add(reward.id);
    chanceTotal += reward.chancePercent;
  }

  return Math.abs(chanceTotal - 100) < 0.000_001;
}
