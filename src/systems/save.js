import { createInitialState, GAME_VERSION, SAVE_VERSION } from "../core/game-state.js";

const SAVE_KEY = "idle-jorneymon-save";

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();

    const saved = JSON.parse(raw);
    if (saved.saveVersion !== SAVE_VERSION || !saved.player) return createInitialState();

    return {
      ...createInitialState(),
      ...saved,
      gameVersion: GAME_VERSION,
      player: { ...createInitialState().player, ...saved.player },
      enemy: saved.mode === "battle" ? saved.enemy : null
    };
  } catch {
    return createInitialState();
  }
}

export function saveGame(state) {
  state.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
}
