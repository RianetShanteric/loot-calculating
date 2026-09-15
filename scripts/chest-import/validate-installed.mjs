#!/usr/bin/env node
import { validateInstalledChests } from './lib.mjs';

try {
  const chests = await validateInstalledChests();
  for (const chest of chests) {
    console.log(`OK ${chest.id}: ${chest.rewards} rewards, ${chest.chanceTotal}%`);
  }
  console.log(`Validated ${chests.length} simulator chest(s).`);
} catch (error) {
  console.error(`Chest validation failed: ${error.message}`);
  process.exitCode = 1;
}
