import { addLog, MAX_TEAM_SIZE, randomEncounterTarget } from "../core/game-state.js";
import { createCapturedPokemon } from "../data/pokemon.js";

export const CAPTURE_RATES = {
  common: 30,
  uncommon: 25,
  rare: 15,
  epic: 10,
  legendary: 5,
  mythical: 5
};

export function getCaptureChance(pokemon) {
  const baseChance = CAPTURE_RATES[pokemon.rarity] ?? CAPTURE_RATES.common;
  return pokemon.isShiny ? baseChance / 2 : baseChance;
}

export function registerSeen(state, pokemon) {
  const current = state.pokedex[pokemon.id] || { seen: 0, caught: 0, shinyCaught: 0 };
  state.pokedex[pokemon.id] = { ...current, seen: current.seen + 1 };
}

function returnToExploration(state) {
  state.mode = "exploring";
  state.enemy = null;
  state.captureOffer = null;
  state.battleParticipants = [];
  state.exploration = 0;
  state.nextEncounterAt = randomEncounterTarget();
}

export function declineCapture(state) {
  if (state.mode !== "capture" || !state.enemy) return false;
  addLog(state, `Você decidiu não capturar ${state.enemy.name}.`);
  returnToExploration(state);
  return true;
}

export function attemptCapture(state, random = Math.random) {
  if (state.mode !== "capture" || !state.enemy) return false;
  const pokemon = state.enemy;
  const chance = getCaptureChance(pokemon);

  if (random() * 100 >= chance) {
    addLog(state, `${pokemon.name} escapou da captura.`);
    returnToExploration(state);
    return false;
  }

  const entry = state.pokedex[pokemon.id] || { seen: 1, caught: 0, shinyCaught: 0 };
  state.pokedex[pokemon.id] = {
    ...entry,
    caught: (entry.caught || 0) + 1,
    shinyCaught: (entry.shinyCaught || 0) + (pokemon.isShiny ? 1 : 0)
  };

  const capturedSpecies = state.collection[pokemon.id];
  state.collection[pokemon.id] = capturedSpecies
    ? { ...capturedSpecies, count: capturedSpecies.count + 1, shinyCount: (capturedSpecies.shinyCount || 0) + (pokemon.isShiny ? 1 : 0) }
    : { count: 1, shinyCount: pokemon.isShiny ? 1 : 0, firstCaughtAt: Date.now() };

  const capturedPokemon = createCapturedPokemon(pokemon);
  const shinyLabel = pokemon.isShiny ? " shiny" : "";
  if (state.team.length < MAX_TEAM_SIZE) {
    state.team.push(capturedPokemon);
    addLog(state, `${pokemon.name}${shinyLabel} foi capturado e entrou na equipe!`);
  } else {
    state.storage.push(capturedPokemon);
    addLog(state, `${pokemon.name}${shinyLabel} foi capturado e enviado ao depósito.`);
  }
  returnToExploration(state);
  return true;
}
