import { addLog, MAX_TEAM_SIZE } from "../core/game-state.js";
import { createCapturedPokemon } from "../data/pokemon.js";

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

  const capturedSpecies = state.collection[pokemon.id];
  state.collection[pokemon.id] = capturedSpecies
    ? { ...capturedSpecies, count: capturedSpecies.count + 1 }
    : { count: 1, firstCaughtAt: Date.now() };

  const capturedPokemon = createCapturedPokemon(pokemon);
  if (state.team.length < MAX_TEAM_SIZE) {
    state.team.push(capturedPokemon);
    addLog(state, `${pokemon.name} foi capturado e entrou na equipe!`);
  } else {
    state.storage.push(capturedPokemon);
    addLog(state, `${pokemon.name} foi capturado e enviado ao depósito.`);
  }
  return true;
}
