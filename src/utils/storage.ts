import type { AppState } from '../types';

const STORAGE_KEY = 'loot-calculate-state-v1';
const VERSION_KEY = 'loot-calculate-data-version';

export function loadState(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<AppState>;
  } catch (error) {
    console.error('Failed to load state from localStorage', error);
    return null;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage', error);
  }
}

/** 0 if never stamped (i.e. saved before data versioning existed). */
export function getSavedDataVersion(): number {
  try {
    const raw = localStorage.getItem(VERSION_KEY);
    return raw ? Number(raw) : 0;
  } catch (error) {
    console.error('Failed to read data version from localStorage', error);
    return 0;
  }
}

export function setSavedDataVersion(version: number): void {
  try {
    localStorage.setItem(VERSION_KEY, String(version));
  } catch (error) {
    console.error('Failed to write data version to localStorage', error);
  }
}
