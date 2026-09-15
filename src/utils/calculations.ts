import type { AppState, CalculationResult, Item, ItemPrice } from '../types';

export function getItemPrice(itemId: string, items: Item[], prices: ItemPrice[]): number {
  const override = prices.find((p) => p.itemId === itemId);
  if (override) return override.price;
  return items.find((i) => i.id === itemId)?.basePrice ?? 0;
}

export function calculateDeviationPercent(actual: number, expected: number): number | null {
  if (expected <= 0) return null;
  return ((actual - expected) / expected) * 100;
}

/**
 * Aggregates expected drops per item across a (possibly multi-chest-type) composition.
 */
export function calculateMainResults(state: AppState): {
  results: CalculationResult[];
  totalChests: number;
} {
  const { items, probabilities, prices, chestComposition, actualDrops } = state;

  const totalChests = chestComposition.reduce((sum, row) => sum + Math.max(0, row.count || 0), 0);
  const chestIdsInUse = new Set(chestComposition.map((r) => r.chestId).filter(Boolean));

  const expectedByItem = new Map<string, number>();
  // chance% is tracked separately from expected drops: it must not be scaled by `quantity`,
  // since "chance to drop" and "how many you get when it drops" are different things.
  const chanceWeightedSumByItem = new Map<string, number>();
  const chestCountSumByItem = new Map<string, number>();
  const relevantItemIds = new Set<string>();

  chestComposition.forEach((row) => {
    if (!row.chestId) return;
    const count = Math.max(0, row.count || 0);
    const rowProbs = probabilities.filter((p) => p.chestId === row.chestId);
    rowProbs.forEach((p) => {
      relevantItemIds.add(p.itemId);
      const perChest = (p.chancePercent / 100) * p.quantity;
      expectedByItem.set(p.itemId, (expectedByItem.get(p.itemId) ?? 0) + perChest * count);
      chanceWeightedSumByItem.set(p.itemId, (chanceWeightedSumByItem.get(p.itemId) ?? 0) + p.chancePercent * count);
      chestCountSumByItem.set(p.itemId, (chestCountSumByItem.get(p.itemId) ?? 0) + count);
    });
  });

  // include items that belong to any in-use chest even at count 0
  if (relevantItemIds.size === 0 && chestIdsInUse.size > 0) {
    probabilities
      .filter((p) => chestIdsInUse.has(p.chestId))
      .forEach((p) => relevantItemIds.add(p.itemId));
  }

  const filteredItems = items.filter((i) => relevantItemIds.has(i.id));

  const results: CalculationResult[] = filteredItems.map((item) => {
    const expectedDrops = expectedByItem.get(item.id) ?? 0;
    // Drops only ever come in whole units, and "actual" defaults to the rounded expected value
    // (what's shown in the "Expected" column) — deviation must compare against that same rounded
    // number, otherwise a user who hasn't touched "actual" sees a nonzero deviation even though
    // both columns display the same integer (the raw fractional expectedDrops just rounds away).
    const roundedExpected = Math.round(expectedDrops);
    const actual = actualDrops[item.id] ?? roundedExpected;
    const price = getItemPrice(item.id, items, prices);
    const deviationPercent = calculateDeviationPercent(actual, roundedExpected);
    const itemChestCount = chestCountSumByItem.get(item.id) ?? 0;
    const probabilityPercent = itemChestCount > 0 ? (chanceWeightedSumByItem.get(item.id) ?? 0) / itemChestCount : 0;

    return {
      itemId: item.id,
      itemName: item.name,
      itemIcon: item.icon,
      probabilityPercent,
      expectedDrops,
      actualDrops: actual,
      deviationPercent,
      itemPrice: price,
      totalValue: price * actual,
    };
  });

  results.sort((a, b) => b.expectedDrops - a.expectedDrops);

  return { results, totalChests };
}

export function calculateGrandTotal(results: CalculationResult[]): number {
  return results.reduce((sum, r) => sum + r.totalValue, 0);
}

function stripTrailingZeros(numStr: string): string {
  const num = parseFloat(numStr);
  if (isNaN(num)) return numStr;
  if (numStr.includes('e')) return numStr;
  return num.toString();
}

export function formatPercent(value: number, decimals = 2): string {
  return `${stripTrailingZeros(value.toFixed(decimals))}%`;
}

export function formatDeviation(value: number | null): string {
  if (value === null) return '—';
  const sign = value >= 0 ? '+' : '-';
  return `${sign}${stripTrailingZeros(Math.abs(value).toFixed(2))}%`;
}

/** CSS class for a deviation value: gray at (effectively) zero, green above, red below —
 * matches the +0.00%/-0.00% threshold `formatDeviation` itself rounds to. */
export function deviationClass(value: number | null): 'deviation-neutral' | 'deviation-positive' | 'deviation-negative' {
  if (value === null || Math.abs(value) < 0.005) return 'deviation-neutral';
  return value > 0 ? 'deviation-positive' : 'deviation-negative';
}

export function formatNumber(value: number, decimals = 0): string {
  const fixed = (Number.isFinite(value) ? value : 0).toFixed(decimals);
  const stripped = stripTrailingZeros(fixed);
  const [intPart, decPart] = stripped.split('.');
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return decPart ? `${withSep}.${decPart}` : withSep;
}

export function formatCurrency(value: number): string {
  return formatNumber(value, 0);
}

/** Picks the correct Russian plural form for a count (1 предмет / 2 предмета / 5 предметов). */
export function pluralizeRu(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
