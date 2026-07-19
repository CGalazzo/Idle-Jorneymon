import { addLog } from "../core/game-state.js";

const BASE_CAPTURE_CHANCE = 0.38;

export function registerSeen(state, pokemon) {
  const current = state.pokedex[pokemon.id] || { seen: 0, caught: 0 };
  state.pokedex[pokemon.id] = { ...current, seen: current.seen + 1 };
}

export function attemptAutomaticCapture(state, pokemon, random = Math.random) {
  if (random() > BASE_CAPTURE_CHANCE) {
    addLog(state, `${pokemon.name} escapou antes da captura.`);
    return false;
  }

  const entry = state.pokedex[pokemon.id] || { seen: 1, caught: 0 };
  state.pokedex[pokemon.id] = { ...entry, caught: entry.caught + 1 };

  const captured = state.collection[pokemon.id];
  state.collection[pokemon.id] = captured
    ? { ...captured, count: captured.count + 1 }
    : { count: 1, firstCaughtAt: Date.now() };

  addLog(state, `${pokemon.name} foi capturado automaticamente!`);
  return true;
}
