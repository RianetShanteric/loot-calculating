import dns from 'node:dns/promises';
import fs from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_REWARDS = 500;
const CHANCE_EPSILON = 0.000_001;
const REQUEST_TIMEOUT_MS = 20_000;
const MIME_EXTENSIONS = new Map([
  ['image/png', 'png'],
  ['image/jpeg', 'jpg'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif'],
]);

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(scriptsDirectory, '..', '..');
export const importWorkDirectory = path.join(projectRoot, '.chest-import');
export const chestDataDirectory = path.join(projectRoot, 'src', 'data', 'simulator-chests');
export const iconRootDirectory = path.join(projectRoot, 'public', 'simulator-icons');

function fail(message) {
  throw new Error(message);
}
function cleanString(value, field, maxLength) {
  if (typeof value !== 'string') fail(`${field}: expected a string`);
  const cleaned = value.trim();
  if (!cleaned) fail(`${field}: cannot be empty`);
  if (cleaned.length > maxLength) fail(`${field}: exceeds ${maxLength} characters`);
  return cleaned;
}

function validateHttpsUrl(value, field) {
  const raw = cleanString(value, field, 2048);
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail(`${field}: invalid URL`);
  }
  if (url.protocol !== 'https:') fail(`${field}: only HTTPS URLs are allowed`);
  if (url.username || url.password) fail(`${field}: credentials in URLs are forbidden`);
  if (url.port && url.port !== '443') fail(`${field}: non-standard ports are forbidden`);
  return url.toString();
}

export function validateDraft(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Draft must be a JSON object');

  const allowedKeys = new Set(['id', 'name', 'sourceUrl', 'iconUrl', 'rewards']);
  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) fail(`Unexpected top-level field: ${key}`);
  }

  const id = cleanString(input.id, 'id', 80);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    fail('id: use lowercase Latin letters, digits and single hyphens only');
  }
  const name = cleanString(input.name, 'name', 160);
  const sourceUrl = validateHttpsUrl(input.sourceUrl, 'sourceUrl');
  const iconUrl = validateHttpsUrl(input.iconUrl, 'iconUrl');

  if (!Array.isArray(input.rewards) || input.rewards.length === 0) fail('rewards: at least one row is required');
  if (input.rewards.length > MAX_REWARDS) fail(`rewards: maximum is ${MAX_REWARDS}`);

  const exactRows = new Set();
  let chanceTotal = 0;
  const rewards = input.rewards.map((rawReward, index) => {
    const field = `rewards[${index}]`;
    if (!rawReward || typeof rawReward !== 'object' || Array.isArray(rawReward)) fail(`${field}: expected an object`);
    const allowedRewardKeys = new Set(['name', 'iconUrl', 'quantity', 'chancePercent']);
    for (const key of Object.keys(rawReward)) {
      if (!allowedRewardKeys.has(key)) fail(`${field}: unexpected field ${key}`);
    }

    const reward = {
      name: cleanString(rawReward.name, `${field}.name`, 200),
      iconUrl: validateHttpsUrl(rawReward.iconUrl, `${field}.iconUrl`),
      quantity: rawReward.quantity,
      chancePercent: rawReward.chancePercent,
    };
    if (!Number.isSafeInteger(reward.quantity) || reward.quantity < 1 || reward.quantity > 1_000_000_000) {
      fail(`${field}.quantity: expected an integer from 1 to 1000000000`);
    }
    if (!Number.isFinite(reward.chancePercent) || reward.chancePercent <= 0 || reward.chancePercent > 100) {
      fail(`${field}.chancePercent: expected a number greater than 0 and at most 100`);
    }

    const exactKey = JSON.stringify([reward.name, reward.iconUrl, reward.quantity, reward.chancePercent]);
    if (exactRows.has(exactKey)) fail(`${field}: exact duplicate reward row`);
    exactRows.add(exactKey);
    chanceTotal += reward.chancePercent;
    return reward;
  });

  if (Math.abs(chanceTotal - 100) > CHANCE_EPSILON) {
    fail(`Reward chances sum to ${chanceTotal}, expected exactly 100`);
  }

  return { id, name, sourceUrl, iconUrl, rewards };
}

export async function readJsonFile(filePath) {
  const absolutePath = path.resolve(projectRoot, filePath);
  const stat = await fs.stat(absolutePath);
  if (!stat.isFile()) fail(`Not a file: ${absolutePath}`);
  if (stat.size > MAX_SOURCE_BYTES) fail(`File is larger than ${MAX_SOURCE_BYTES} bytes`);
  const text = await fs.readFile(absolutePath, 'utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`Invalid JSON in ${absolutePath}: ${error.message}`);
  }
}

export async function readSourceFile(filePath) {
  const absolutePath = path.resolve(projectRoot, filePath);
  const stat = await fs.stat(absolutePath);
  if (!stat.isFile()) fail(`Not a file: ${absolutePath}`);
  if (stat.size > MAX_SOURCE_BYTES) fail(`Source is larger than ${MAX_SOURCE_BYTES} bytes`);
  return fs.readFile(absolutePath, 'utf8');
}

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

function isPrivateIp(address) {
  if (net.isIPv4(address)) return isPrivateIpv4(address);
  const normalized = address.toLowerCase();
  if (normalized.startsWith('::ffff:')) return isPrivateIpv4(normalized.slice(7));
  return normalized === '::' || normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb');
}

async function assertPublicRemoteUrl(rawUrl, field = 'icon URL') {
  const normalized = validateHttpsUrl(rawUrl, field);
  const url = new URL(normalized);
  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    fail(`${field}: local network hosts are forbidden`);
  }
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) fail(`${field}: private or reserved IP addresses are forbidden`);
    return url;
  }
  const addresses = await dns.lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateIp(address))) {
    fail(`${field}: hostname resolves to a private or reserved address`);
  }
  return url;
}

async function fetchPublicImage(rawUrl) {
  let current = await assertPublicRemoteUrl(rawUrl);
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    const response = await fetch(current, {
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'user-agent': 'LootCalculate-ChestImporter/1.0' },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) fail(`Image redirect from ${current} has no location`);
      current = await assertPublicRemoteUrl(new URL(location, current).toString());
      continue;
    }
    if (!response.ok) fail(`Image download failed (${response.status}) for ${current}`);

    const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() ?? '';
    const extension = MIME_EXTENSIONS.get(contentType);
    if (!extension) fail(`Unsupported image type "${contentType || 'unknown'}" for ${current}`);
    const declaredLength = Number(response.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_IMAGE_BYTES) fail(`Image exceeds ${MAX_IMAGE_BYTES} bytes: ${current}`);

    const chunks = [];
    let total = 0;
    for await (const chunk of response.body) {
      total += chunk.byteLength;
      if (total > MAX_IMAGE_BYTES) fail(`Image exceeds ${MAX_IMAGE_BYTES} bytes: ${current}`);
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    assertImageSignature(buffer, contentType, current.toString());
    return { buffer, extension };
  }
  fail(`Too many image redirects for ${rawUrl}`);
}

function assertImageSignature(buffer, contentType, source) {
  const png = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const jpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const gif = buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'));
  const webp = buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  const matches = { 'image/png': png, 'image/jpeg': jpeg, 'image/gif': gif, 'image/webp': webp }[contentType];
  if (!matches) fail(`Downloaded content does not match ${contentType}: ${source}`);
}

async function mapLimit(values, limit, worker) {
  const output = Array.from({ length: values.length });
  let next = 0;
  async function run() {
    while (next < values.length) {
      const index = next;
      next += 1;
      output[index] = await worker(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, run));
  return output;
}

export async function applyDraft(rawDraft) {
  const draft = validateDraft(rawDraft);
  const chestFile = path.join(chestDataDirectory, `${draft.id}.json`);
  const finalIconDirectory = path.join(iconRootDirectory, draft.id);

  if (await exists(chestFile)) fail(`Chest already exists: ${path.relative(projectRoot, chestFile)}`);
  if (await exists(finalIconDirectory)) fail(`Icon directory already exists: ${path.relative(projectRoot, finalIconDirectory)}`);

  await fs.mkdir(importWorkDirectory, { recursive: true });
  await fs.mkdir(chestDataDirectory, { recursive: true });
  const stagingDirectory = await fs.mkdtemp(path.join(importWorkDirectory, `${draft.id}-`));
  const stagedIcons = path.join(stagingDirectory, 'icons');
  await fs.mkdir(stagedIcons);

  try {
    const uniqueUrls = [...new Set([draft.iconUrl, ...draft.rewards.map((reward) => reward.iconUrl)])];
    const downloaded = new Map();
    await mapLimit(uniqueUrls, 6, async (url) => {
      downloaded.set(url, await fetchPublicImage(url));
    });

    const chestImage = downloaded.get(draft.iconUrl);
    const chestIconName = `chest.${chestImage.extension}`;
    await fs.writeFile(path.join(stagedIcons, chestIconName), chestImage.buffer, { flag: 'wx' });

    const rewards = [];
    for (let index = 0; index < draft.rewards.length; index += 1) {
      const reward = draft.rewards[index];
      const image = downloaded.get(reward.iconUrl);
      const iconName = `${String(index + 1).padStart(3, '0')}.${image.extension}`;
      if (!(await exists(path.join(stagedIcons, iconName)))) {
        await fs.writeFile(path.join(stagedIcons, iconName), image.buffer, { flag: 'wx' });
      }
      rewards.push({
        id: `${draft.id}-${index + 1}`,
        name: reward.name,
        icon: `/simulator-icons/${draft.id}/${iconName}`,
        quantity: reward.quantity,
        chancePercent: reward.chancePercent,
      });
    }

    const installedChest = {
      id: draft.id,
      name: draft.name,
      icon: `/simulator-icons/${draft.id}/${chestIconName}`,
      sourceUrl: draft.sourceUrl,
      rewards,
    };
    const stagedJson = path.join(stagingDirectory, `${draft.id}.json`);
    await fs.writeFile(stagedJson, `${JSON.stringify(installedChest, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });

    await fs.rename(stagedIcons, finalIconDirectory);
    try {
      await fs.rename(stagedJson, chestFile);
    } catch (error) {
      await fs.rm(finalIconDirectory, { recursive: true, force: true });
      throw error;
    }
    return { chest: installedChest, chestFile, iconDirectory: finalIconDirectory };
  } finally {
    await fs.rm(stagingDirectory, { recursive: true, force: true });
  }
}

async function exists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function validateInstalledChests() {
  const files = (await fs.readdir(chestDataDirectory)).filter((name) => name.endsWith('.json')).sort();
  if (files.length === 0) fail('No simulator chest JSON files found');
  const ids = new Set();
  const results = [];
  for (const file of files) {
    const chest = await readJsonFile(path.join(chestDataDirectory, file));
    const source = `${path.relative(projectRoot, chestDataDirectory)}/${file}`;
    const id = cleanString(chest.id, `${source}.id`, 80);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail(`${source}.id: invalid slug`);
    if (ids.has(id)) fail(`${source}: duplicate chest id ${id}`);
    ids.add(id);
    if (file !== `${id}.json`) fail(`${source}: filename must be ${id}.json`);
    cleanString(chest.name, `${source}.name`, 160);
    validateHttpsUrl(chest.sourceUrl, `${source}.sourceUrl`);
    await assertLocalIcon(chest.icon, `${source}.icon`);
    if (!Array.isArray(chest.rewards) || chest.rewards.length === 0 || chest.rewards.length > MAX_REWARDS) {
      fail(`${source}.rewards: invalid row count`);
    }
    let chanceTotal = 0;
    const rewardIds = new Set();
    for (let index = 0; index < chest.rewards.length; index += 1) {
      const reward = chest.rewards[index];
      const field = `${source}.rewards[${index}]`;
      const rewardId = cleanString(reward.id, `${field}.id`, 120);
      if (rewardIds.has(rewardId)) fail(`${field}.id: duplicate ${rewardId}`);
      rewardIds.add(rewardId);
      cleanString(reward.name, `${field}.name`, 200);
      await assertLocalIcon(reward.icon, `${field}.icon`);
      if (!Number.isSafeInteger(reward.quantity) || reward.quantity < 1) fail(`${field}.quantity: invalid integer`);
      if (!Number.isFinite(reward.chancePercent) || reward.chancePercent <= 0 || reward.chancePercent > 100) fail(`${field}.chancePercent: invalid number`);
      chanceTotal += reward.chancePercent;
    }
    if (Math.abs(chanceTotal - 100) > CHANCE_EPSILON) fail(`${source}: chances sum to ${chanceTotal}, expected 100`);
    results.push({ id, name: chest.name, rewards: chest.rewards.length, chanceTotal });
  }
  return results;
}

async function assertLocalIcon(value, field) {
  const icon = cleanString(value, field, 240);
  if (!icon.startsWith('/simulator-icons/') || icon.includes('..') || icon.includes('\\')) {
    fail(`${field}: must be a safe /simulator-icons/ path`);
  }
  const relative = icon.slice(1).split('/');
  const absolute = path.resolve(projectRoot, 'public', ...relative);
  if (!absolute.startsWith(path.resolve(iconRootDirectory) + path.sep)) fail(`${field}: escapes icon directory`);
  const stat = await fs.stat(absolute).catch(() => null);
  if (!stat?.isFile()) fail(`${field}: file does not exist (${icon})`);
}

export function parseArguments(argv) {
  const args = { apply: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--apply') {
      args.apply = true;
      continue;
    }
    if (!token.startsWith('--')) fail(`Unexpected argument: ${token}`);
    const key = token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) fail(`Missing value for ${token}`);
    args[key] = value;
    index += 1;
  }
  return args;
}
