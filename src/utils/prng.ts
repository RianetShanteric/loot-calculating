/**
 * Deterministic PRNG (mulberry32) seeded from an arbitrary string via xmur3 hashing.
 * Same seed string always produces the same sequence of draws.
 */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeededRandom {
  next(): number; // uniform [0, 1)
  seed: string;
}

export function createSeededRandom(seed?: string): SeededRandom {
  const resolvedSeed = seed && seed.trim().length > 0 ? seed.trim() : generateRandomSeed();
  const hashFn = xmur3(resolvedSeed);
  const rng = mulberry32(hashFn());
  return { next: rng, seed: resolvedSeed };
}

export function generateRandomSeed(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
