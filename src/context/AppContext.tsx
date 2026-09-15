import { useEffect, useReducer, useRef, type ReactNode } from 'react';
import type {
  AppState,
  DropProbability,
  Item,
} from '../types';
import { DATA_VERSION, initialChests, initialDungeons, initialItems, initialProbabilities } from '../data/initialData';
import { getSavedDataVersion, loadState, saveState, setSavedDataVersion } from '../utils/storage';
import { genId } from '../utils/id';
import { AppContext, type Action } from './context';

const defaultState: AppState = {
  items: initialItems,
  chests: initialChests,
  probabilities: initialProbabilities,
  prices: [],
  dungeons: initialDungeons,
  chestComposition: [{ chestId: initialChests[0].id, count: 100 }],
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
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CHEST_COMPOSITION':
      return { ...state, chestComposition: action.payload };

    case 'ADD_CHEST_ROW': {
      const usedIds = new Set(state.chestComposition.map((r) => r.chestId));
      const nextChest = state.chests.find((c) => !usedIds.has(c.id)) ?? state.chests[0];
      return {
        ...state,
        chestComposition: [...state.chestComposition, { chestId: nextChest?.id ?? '', count: 0 }],
      };
    }

    case 'UPDATE_CHEST_ROW': {
      const rows = [...state.chestComposition];
      rows[action.payload.index] = action.payload.row;
      return { ...state, chestComposition: rows };
    }

    case 'REMOVE_CHEST_ROW': {
      const rows = state.chestComposition.filter((_, i) => i !== action.payload);
      return { ...state, chestComposition: rows };
    }

    case 'SET_ACTUAL_DROP': {
      return {
        ...state,
        actualDrops: { ...state.actualDrops, [action.payload.itemId]: action.payload.value },
      };
    }

    case 'RESET_ACTUAL_DROPS':
      return { ...state, actualDrops: {} };

    case 'UPDATE_ITEM_PRICE': {
      const existing = state.prices.findIndex((p) => p.itemId === action.payload.itemId);
      const prices = [...state.prices];
      if (existing >= 0) prices[existing] = action.payload;
      else prices.push(action.payload);
      return { ...state, prices };
    }

    case 'RESET_ITEM_PRICE':
      return { ...state, prices: state.prices.filter((p) => p.itemId !== action.payload) };

    case 'RESET_ALL_PRICES':
      return { ...state, prices: [] };

    case 'ADD_ITEM': {
      const item: Item = { id: genId(), name: action.payload.name, basePrice: action.payload.basePrice };
      return { ...state, items: [...state.items, item] };
    }

    case 'ADD_PROBABILITY': {
      const prob: DropProbability = { id: genId(), ...action.payload };
      return { ...state, probabilities: [...state.probabilities, prob] };
    }

    case 'UPDATE_PROBABILITY':
      return {
        ...state,
        probabilities: state.probabilities.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };

    case 'DELETE_PROBABILITY':
      return { ...state, probabilities: state.probabilities.filter((p) => p.id !== action.payload) };

    case 'SET_ADVANCED_CALC':
      return { ...state, advancedCalc: { ...state.advancedCalc, ...action.payload } };

    case 'ADD_SIMULATION_HISTORY':
      return {
        ...state,
        simulationHistory: [
          action.payload,
          ...state.simulationHistory.filter((entry) => entry.kind === 'donation'),
        ].slice(0, 20),
      };

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };

    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };

    default:
      return state;
  }
}

function init(): AppState {
  const saved = loadState();
  if (!saved) {
    setSavedDataVersion(DATA_VERSION);
    return defaultState;
  }

  if (getSavedDataVersion() !== DATA_VERSION) {
    // Baked-in content (items/chests/probabilities/dungeons) changed shape or content since this
    // browser last saved — ids from the old dataset no longer line up with the new one, so content
    // must come entirely from the new defaults. Only carry over what's still meaningful: prices for
    // items that still exist, and user preferences.
    const validItemIds = new Set(initialItems.map((i) => i.id));
    setSavedDataVersion(DATA_VERSION);
    return {
      ...defaultState,
      prices: (saved.prices ?? []).filter((p) => validItemIds.has(p.itemId)),
      theme: saved.theme ?? defaultState.theme,
      language: saved.language ?? defaultState.language,
    };
  }

  return {
    ...defaultState,
    ...saved,
    advancedCalc: { ...defaultState.advancedCalc, ...saved.advancedCalc },
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');

    document
      .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
      ?.setAttribute('content', state.theme === 'dark' ? '#050817' : '#f8fafc');
  }, [state.theme]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveState(state);
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch, dungeons: state.dungeons }}>{children}</AppContext.Provider>;
}
