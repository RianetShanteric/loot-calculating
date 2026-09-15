#!/usr/bin/env node
import path from 'node:path';
import { applyDraft, parseArguments, projectRoot, readJsonFile, validateDraft } from './lib.mjs';

try {
  const args = parseArguments(process.argv.slice(2));
  if (!args.input) throw new Error('Usage: npm run chest:import -- --input <draft.json> [--apply]');
  const draft = validateDraft(await readJsonFile(args.input));
  const chanceTotal = draft.rewards.reduce((sum, reward) => sum + reward.chancePercent, 0);

  console.log(`Validated: ${draft.name}`);
  console.log(`Rewards: ${draft.rewards.length}; chance total: ${chanceTotal}%`);
  console.log(`Target: src/data/simulator-chests/${draft.id}.json`);

  if (!args.apply) {
    console.log('Dry run only. Review the draft, then repeat with --apply to download icons and add the chest.');
  } else {
    const result = await applyDraft(draft);
    console.log(`Added: ${path.relative(projectRoot, result.chestFile)}`);
    console.log(`Icons: ${path.relative(projectRoot, result.iconDirectory)}`);
  }
} catch (error) {
  console.error(`Chest import failed: ${error.message}`);
  process.exitCode = 1;
}
