import { createInitialState, GAME_VERSION, SAVE_VERSION } from "../core/game-state.js";

const SAVE_KEY = "idle-jorneymon-save";

export function hasSavedGame() {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

function migrateV1(saved) {
  const starterId = saved.player?.id || 4;
  return {
    ...createInitialState(starterId, true),
    ...saved,
    saveVersion: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    hasStarted: true,
    player: { ...createInitialState(starterId, true).player, ...saved.player },
    pokedex: {
      [starterId]: { seen: 1, caught: 1 },
      ...(saved.enemy ? { [saved.enemy.id]: { seen: 1, caught: 0 } } : {})
    },
    collection: {
      [starterId]: { count: 1, firstCaughtAt: saved.lastSavedAt || Date.now() }
    }
  };
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();

    const saved = JSON.parse(raw);
    if (!saved.player) return createInitialState();
    if (saved.saveVersion === 1) return migrateV1(saved);
    if (saved.saveVersion !== SAVE_VERSION) return createInitialState();

    const base = createInitialState(saved.player.id, true);
    return {
      ...base,
      ...saved,
      gameVersion: GAME_VERSION,
      hasStarted: true,
      player: { ...base.player, ...saved.player },
      pokedex: saved.pokedex || base.pokedex,
      collection: saved.collection || base.collection,
      enemy: saved.mode === "battle" ? saved.enemy : null
    };
  } catch {
    return createInitialState();
  }
}

export function saveGame(state) {
  if (!state.hasStarted) return;
  state.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
}
